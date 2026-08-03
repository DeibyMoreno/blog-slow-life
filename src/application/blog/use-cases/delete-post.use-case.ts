import type { PostRepository } from '../../shared/ports/outbound/post.repository.js'
import type { EventBus } from '../../shared/ports/outbound/event-bus.port.js'
import { PostNotFoundError } from '../../../domain/blog/errors/index.js'

export class DeletePostUseCase {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(id: string): Promise<void> {
    const post = await this.postRepository.findById(id)
    if (!post) {
      throw new PostNotFoundError(id)
    }
    post.markAsDeleted()
    const events = post.clearEvents()
    await this.postRepository.delete(id)
    this.eventBus.publishAll(events)
  }
}
