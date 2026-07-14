import type { PostRepository } from '../../shared/ports/outbound/post.repository.js'
import type { PostStatus } from '../../../domain/shared/types/index.js'

export interface GetPostsParams {
  limit?: number
  offset?: number
  status?: PostStatus
}

export class GetPostsUseCase {
  constructor(private readonly postRepository: PostRepository) {}

  async execute(params: GetPostsParams = {}) {
    const posts = await this.postRepository.findMany(params)
    const total = await this.postRepository.count({ status: params.status })
    return { posts, total }
  }
}
