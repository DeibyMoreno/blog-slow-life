import type { PostRepository } from '../../shared/ports/outbound/post.repository.js'
import type { EventBus } from '../../shared/ports/outbound/event-bus.port.js'
import { Post } from '../../../domain/blog/entities/index.js'
import { UUID } from '../../../domain/shared/value-objects/uuid.vo.js'
import { Slug } from '../../../domain/shared/value-objects/slug.vo.js'
import { PostStatus } from '../../../domain/shared/types/index.js'
import { PostSlugConflictError } from '../../../domain/blog/errors/index.js'
import { CreatePostSchema, type CreatePostDTO } from '../dto/index.js'
import { ValidationError } from '../../../domain/shared/errors/index.js'

export class CreatePostUseCase {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: CreatePostDTO, authorId: string) {
    const parsed = CreatePostSchema.safeParse(input)
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors.map((e) => e.message).join(', '))
    }

    const data = parsed.data
    const slug = Slug.create(data.title)

    const existing = await this.postRepository.findBySlug(slug.toString())
    if (existing) {
      throw new PostSlugConflictError(slug.toString())
    }

    const post = Post.create({
      title: data.title,
      slug,
      content: data.content ?? null,
      excerpt: data.excerpt ?? null,
      coverImage: data.coverImage ?? null,
      status: data.status ?? PostStatus.DRAFT,
      authorId: UUID.from(authorId),
      categoryId: data.categoryId ? UUID.from(data.categoryId) : null,
    })

    const events = post.clearEvents()
    const saved = await this.postRepository.save(post, data.tagIds)
    this.eventBus.publishAll(events)

    return saved
  }
}
