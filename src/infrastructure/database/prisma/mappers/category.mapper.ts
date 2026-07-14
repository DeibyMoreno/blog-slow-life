import type { Category as PrismaCategory } from '@prisma/client'
import { Category } from '../../../../domain/blog/entities/index.js'
import { UUID } from '../../../../domain/shared/value-objects/uuid.vo.js'
import { Slug } from '../../../../domain/shared/value-objects/slug.vo.js'

export class CategoryMapper {
  static toDomain(prismaCategory: PrismaCategory): Category {
    return new Category(
      UUID.from(prismaCategory.id),
      prismaCategory.createdAt,
      prismaCategory.updatedAt,
      prismaCategory.name,
      Slug.from(prismaCategory.slug),
      prismaCategory.description,
    )
  }
}
