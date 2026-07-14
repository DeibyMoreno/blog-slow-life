import type { PostRepository } from '../../shared/ports/outbound/post.repository.js'
import { PostNotFoundError } from '../../../domain/blog/errors/index.js'

export class DeletePostUseCase {
  constructor(private readonly postRepository: PostRepository) {}

  async execute(id: string): Promise<void> {
    const post = await this.postRepository.findById(id)
    if (!post) {
      throw new PostNotFoundError(id)
    }
    await this.postRepository.delete(id)
  }
}
