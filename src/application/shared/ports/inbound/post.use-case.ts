import type { CreatePostDTO, UpdatePostDTO } from '../../../blog/dto/index.js'
import type { PostStatus } from '../../../../domain/shared/types/index.js'

export interface CreatePostUseCasePort {
  execute(input: CreatePostDTO, authorId: string): Promise<unknown>
}

export interface UpdatePostUseCasePort {
  execute(id: string, input: UpdatePostDTO): Promise<unknown>
}

export interface DeletePostUseCasePort {
  execute(id: string): Promise<void>
}

export interface GetPostsUseCasePort {
  execute(params?: { limit?: number; offset?: number; status?: PostStatus }): Promise<{ posts: unknown[]; total: number }>
}

export interface GetPostBySlugUseCasePort {
  execute(slug: string): Promise<unknown>
}
