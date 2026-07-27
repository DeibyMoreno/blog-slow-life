import type { CategoryRepository } from '../../shared/ports/outbound/category.repository.js'

export class GetCategoriesUseCase {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async execute() {
    return this.categoryRepository.findMany()
  }
}
