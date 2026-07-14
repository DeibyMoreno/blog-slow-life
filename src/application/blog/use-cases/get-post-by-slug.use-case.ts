import type { PostRepository } from '../../shared/ports/outbound/post.repository.js'
import { PostNotFoundError } from '../../../domain/blog/errors/index.js'

export class GetPostBySlugUseCase {
  constructor(private readonly postRepository: PostRepository) {}

  async execute(slug: string) {
    const post = await this.postRepository.findBySlug(slug)
    if (!post) {
      throw new PostNotFoundError(slug)
    }
    return post
  }
}
