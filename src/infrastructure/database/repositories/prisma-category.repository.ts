import type { CategoryRepository } from '../../../application/shared/ports/outbound/category.repository.js'
import type { Category } from '../../../domain/blog/entities/index.js'
import { CategoryMapper } from '../prisma/mappers/category.mapper.js'
import { prismaClient } from '../prisma/client.js'

export class PrismaCategoryRepository implements CategoryRepository {
  async findMany(): Promise<Category[]> {
    const categories = await prismaClient.category.findMany({
      orderBy: { name: 'asc' },
    })
    return categories.map(CategoryMapper.toDomain)
  }

  async findById(id: string): Promise<Category | null> {
    const category = await prismaClient.category.findUnique({ where: { id } })
    return category ? CategoryMapper.toDomain(category) : null
  }

  async findBySlug(slug: string): Promise<Category | null> {
    const category = await prismaClient.category.findUnique({ where: { slug } })
    return category ? CategoryMapper.toDomain(category) : null
  }

  async save(category: Category): Promise<Category> {
    const created = await prismaClient.category.create({
      data: {
        id: category.id.toString(),
        ...CategoryMapper.toPrismaData(category),
      },
    })
    return CategoryMapper.toDomain(created)
  }

  async update(category: Category): Promise<Category> {
    const updated = await prismaClient.category.update({
      where: { id: category.id.toString() },
      data: CategoryMapper.toPrismaData(category),
    })
    return CategoryMapper.toDomain(updated)
  }

  async countPosts(id: string): Promise<number> {
    return prismaClient.post.count({ where: { categoryId: id, deletedAt: null } })
  }

  async delete(id: string): Promise<void> {
    await prismaClient.category.delete({ where: { id } })
  }
}
