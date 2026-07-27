import type { TagRepository } from '../../../application/shared/ports/outbound/tag.repository.js'
import type { Tag } from '../../../domain/blog/entities/index.js'
import { TagMapper } from '../prisma/mappers/tag.mapper.js'
import { prismaClient } from '../prisma/client.js'

export class PrismaTagRepository implements TagRepository {
  async findMany(): Promise<Tag[]> {
    const tags = await prismaClient.tag.findMany({ orderBy: { name: 'asc' } })
    return tags.map(TagMapper.toDomain)
  }

  async findById(id: string): Promise<Tag | null> {
    const tag = await prismaClient.tag.findUnique({ where: { id } })
    return tag ? TagMapper.toDomain(tag) : null
  }

  async findBySlug(slug: string): Promise<Tag | null> {
    const tag = await prismaClient.tag.findUnique({ where: { slug } })
    return tag ? TagMapper.toDomain(tag) : null
  }

  async save(tag: Tag): Promise<Tag> {
    const created = await prismaClient.tag.create({
      data: {
        id: tag.id.toString(),
        name: tag.name,
        slug: tag.slug.toString(),
      },
    })
    return TagMapper.toDomain(created)
  }

  async delete(id: string): Promise<void> {
    await prismaClient.tag.delete({ where: { id } })
  }
}
