import type { Tag } from '../../../../domain/blog/entities/index.js'

export interface TagRepository {
  findMany(): Promise<Tag[]>
  findById(id: string): Promise<Tag | null>
  findBySlug(slug: string): Promise<Tag | null>
  save(tag: Tag): Promise<Tag>
  delete(id: string): Promise<void>
}
