import type { CategoryRepository } from '../../shared/ports/outbound/category.repository.js'
import { Category } from '../../../domain/blog/entities/index.js'
import { Slug } from '../../../domain/shared/value-objects/slug.vo.js'
import { CategorySlugConflictError } from '../../../domain/blog/errors/index.js'
import { CreateCategorySchema, type CreateCategoryDTO } from '../dto/index.js'
import { ValidationError } from '../../../domain/shared/errors/index.js'

export class CreateCategoryUseCase {
  constructor(private readonly categoryRepository: CategoryRepository) { }

  async execute(input: CreateCategoryDTO) {
    const parsed = CreateCategorySchema.safeParse(input)

    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors.map((e) => e.message).join(', '))
    }

    const data = parsed.data
    const slug = Slug.create(data.name)

    const existing = await this.categoryRepository.findBySlug(slug.toString())
    if (existing) {
      throw new CategorySlugConflictError(slug.toString())
    }

    const category = new Category(
      undefined,
      undefined,
      undefined,
      data.name,
      slug,
      data.description ?? null,
    )

    return this.categoryRepository.save(category)
  }
}
