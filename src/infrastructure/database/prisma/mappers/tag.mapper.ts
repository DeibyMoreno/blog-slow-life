import type { Tag as PrismaTag } from '@prisma/client'
import { Tag } from '../../../../domain/blog/entities/index.js'
import { UUID } from '../../../../domain/shared/value-objects/uuid.vo.js'
import { Slug } from '../../../../domain/shared/value-objects/slug.vo.js'

export class TagMapper {
  static toDomain(prismaTag: PrismaTag): Tag {
    return new Tag(
      UUID.from(prismaTag.id),
      prismaTag.createdAt,
      prismaTag.updatedAt,
      prismaTag.name,
      Slug.from(prismaTag.slug).toString(),
    )
  }
}
