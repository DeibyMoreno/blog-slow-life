import type { PostRepository } from '../../shared/ports/outbound/post.repository.js'
import { Post } from '../../../domain/blog/entities/index.js'
import { UUID } from '../../../domain/shared/value-objects/uuid.vo.js'
import { Slug } from '../../../domain/shared/value-objects/slug.vo.js'
import { PostStatus } from '../../../domain/shared/types/index.js'
import { PostSlugConflictError } from '../../../domain/blog/errors/index.js'
import { CreatePostSchema, type CreatePostDTO } from '../dto/index.js'
import { ValidationError } from '../../../domain/shared/errors/index.js'

export class CreatePostUseCase {
  constructor(private readonly postRepository: PostRepository) {}

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

    const post = new Post(
      undefined,
      undefined,
      undefined,
      data.title,
      slug,
      data.content ?? null,
      data.excerpt ?? null,
      data.coverImage ?? null,
      data.status ?? PostStatus.DRAFT,
      UUID.from(authorId),
      data.categoryId ? UUID.from(data.categoryId) : null,
      data.status === PostStatus.PUBLISHED ? new Date() : null,
      null,
    )

    return this.postRepository.save(post, data.tagIds)
  }
}
