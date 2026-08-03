import type { PostRepository } from '../../shared/ports/outbound/post.repository.js'
import type { EventBus } from '../../shared/ports/outbound/event-bus.port.js'
import { PostNotFoundError } from '../../../domain/blog/errors/index.js'
import { UpdatePostSchema, type UpdatePostDTO } from '../dto/index.js'
import { ValidationError } from '../../../domain/shared/errors/index.js'
import { UUID } from '../../../domain/shared/value-objects/uuid.vo.js'

export class UpdatePostUseCase {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(id: string, input: UpdatePostDTO) {
    const parsed = UpdatePostSchema.safeParse(input)
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors.map((e) => e.message).join(', '))
    }

    const post = await this.postRepository.findById(id)
    if (!post) {
      throw new PostNotFoundError(id)
    }

    const data = parsed.data
    if (data.title !== undefined) post.changeTitle(data.title)
    if (data.content !== undefined) post.changeContent(data.content)
    if (data.excerpt !== undefined) post.changeExcerpt(data.excerpt)
    if (data.coverImage !== undefined) post.changeCoverImage(data.coverImage)
    if (data.status !== undefined) post.changeStatus(data.status)
    if (data.categoryId !== undefined) {
      post.changeCategory(data.categoryId ? UUID.from(data.categoryId) : null)
    }

    const events = post.clearEvents()
    const saved = await this.postRepository.update(post, data.tagIds)
    this.eventBus.publishAll(events)

    return saved
  }
}
