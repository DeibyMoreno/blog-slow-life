import type { Category } from '../../../../domain/blog/entities/index.js'

export interface CategoryRepository {
  findMany(): Promise<Category[]>
  findById(id: string): Promise<Category | null>
  save(category: Category): Promise<Category>
  delete(id: string): Promise<void>
}
