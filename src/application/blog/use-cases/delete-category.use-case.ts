import type { CategoryRepository } from '../../shared/ports/outbound/category.repository.js'
import { CategoryNotFoundError, CategoryHasPostsError } from '../../../domain/blog/errors/index.js'

export class DeleteCategoryUseCase {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async execute(id: string): Promise<void> {
    const category = await this.categoryRepository.findById(id)
    if (!category) {
      throw new CategoryNotFoundError(id)
    }

    const postCount = await this.categoryRepository.countPosts(id)
    if (postCount > 0) {
      throw new CategoryHasPostsError(category.name)
    }

    await this.categoryRepository.delete(id)
  }
}
