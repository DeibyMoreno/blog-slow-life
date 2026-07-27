import type { Category } from '../../../../domain/blog/entities/index.js'

export interface CategoryRepository {
  findMany(): Promise<Category[]>
  findById(id: string): Promise<Category | null>
  findBySlug(slug: string): Promise<Category | null>
  save(category: Category): Promise<Category>
  update(category: Category): Promise<Category>
  countPosts(id: string): Promise<number>
  delete(id: string): Promise<void>
}
