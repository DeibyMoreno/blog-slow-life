import type { TagRepository } from '../../../application/shared/ports/outbound/tag.repository.js'
import { Tag } from '../../../domain/blog/entities/index.js'
import { UUID } from '../../../domain/shared/value-objects/uuid.vo.js'
import { Slug } from '../../../domain/shared/value-objects/slug.vo.js'
import { prismaClient } from '../prisma/client.js'

export class PrismaTagRepository implements TagRepository {
  async findMany(): Promise<Tag[]> {
    const tags = await prismaClient.tag.findMany({ orderBy: { name: 'asc' } })
    return tags.map(this.toDomain)
  }

  async findById(id: string): Promise<Tag | null> {
    const tag = await prismaClient.tag.findUnique({ where: { id } })
    return tag ? this.toDomain(tag) : null
  }

  async save(tag: Tag): Promise<Tag> {
    const created = await prismaClient.tag.create({
      data: {
        id: tag.id.toString(),
        name: tag.name,
        slug: tag.slug.toString(),
      },
    })
    return this.toDomain(created)
  }

  async delete(id: string): Promise<void> {
    await prismaClient.tag.delete({ where: { id } })
  }

  private toDomain(prismaTag: { id: string; name: string; slug: string; createdAt: Date }): Tag {
    return new Tag(
      UUID.from(prismaTag.id),
      prismaTag.name,
      Slug.from(prismaTag.slug),
      prismaTag.createdAt,
    )
  }
}
