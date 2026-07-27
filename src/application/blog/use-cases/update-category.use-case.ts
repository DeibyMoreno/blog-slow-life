import type { CategoryRepository } from '../../shared/ports/outbound/category.repository.js'
import { CategoryNotFoundError, CategorySlugConflictError } from '../../../domain/blog/errors/index.js'
import { Slug } from '../../../domain/shared/value-objects/slug.vo.js'
import { UpdateCategorySchema, type UpdateCategoryDTO } from '../dto/index.js'
import { ValidationError } from '../../../domain/shared/errors/index.js'

export class UpdateCategoryUseCase {
  constructor(private readonly categoryRepository: CategoryRepository) { }

  async execute(id: string, input: UpdateCategoryDTO) {
    const parsed = UpdateCategorySchema.safeParse(input)
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors.map((e) => e.message).join(', '))
    }

    const category = await this.categoryRepository.findById(id)
    if (!category) {
      throw new CategoryNotFoundError(id)
    }

    const data = parsed.data

    if (data.name !== undefined) {
      const slug = Slug.create(data.name)

      const existing = await this.categoryRepository.findBySlug(slug.toString())
      if (existing && existing.id.toString() !== id) {
        throw new CategorySlugConflictError(slug.toString())
      }

      category.name = data.name
      category.slug = slug
    }

    if (data.description !== undefined) {
      category.description = data.description
    }

    return this.categoryRepository.update(category)
  }
}
