import type { Post } from '../../../../domain/blog/entities/index.js'
import type { PostStatus } from '../../../../domain/shared/types/index.js'

export interface PostRepository {
  findMany(params?: { limit?: number; offset?: number; status?: PostStatus }): Promise<Post[]>
  findById(id: string): Promise<Post | null>
  findBySlug(slug: string): Promise<Post | null>
  save(post: Post, tagIds?: string[]): Promise<Post>
  update(post: Post, tagIds?: string[]): Promise<Post>
  delete(id: string): Promise<void>
  count(params?: { status?: PostStatus }): Promise<number>
}
