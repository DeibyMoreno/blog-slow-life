import type { TagRepository } from '../../shared/ports/outbound/tag.repository.js'
import { Tag } from '../../../domain/blog/entities/index.js'
import { Slug } from '../../../domain/shared/value-objects/slug.vo.js'
import { TagSlugConflictError } from '../../../domain/blog/errors/index.js'
import { CreateTagSchema, type CreateTagDTO } from '../dto/index.js'
import { ValidationError } from '../../../domain/shared/errors/index.js'

export class CreateTagUseCase {
  constructor(private readonly tagRepository: TagRepository) {}

  async execute(input: CreateTagDTO) {
    const parsed = CreateTagSchema.safeParse(input)
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors.map((e) => e.message).join(', '))
    }

    const data = parsed.data
    const slug = Slug.create(data.name)

    const existing = await this.tagRepository.findBySlug(slug.toString())
    if (existing) {
      throw new TagSlugConflictError(slug.toString())
    }

    const tag = new Tag(undefined, undefined, undefined, data.name, slug)

    return this.tagRepository.save(tag)
  }
}
