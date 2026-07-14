import type { PostRepository } from '../../../application/shared/ports/outbound/post.repository.js'
import type { Post } from '../../../domain/blog/entities/index.js'
import type { PostStatus } from '../../../domain/shared/types/index.js'
import { PostMapper } from '../prisma/mappers/post.mapper.js'
import { prismaClient } from '../prisma/client.js'
import { PostNotFoundError } from '../../../domain/blog/errors/index.js'

export class PrismaPostRepository implements PostRepository {
  async findMany(params?: { limit?: number; offset?: number; status?: PostStatus }): Promise<Post[]> {
    const posts = await prismaClient.post.findMany({
      where: {
        deletedAt: null,
        ...(params?.status ? { status: params.status } : {}),
      },
      take: params?.limit ?? 10,
      skip: params?.offset ?? 0,
      orderBy: { createdAt: 'desc' },
    })
    return posts.map(PostMapper.toDomain)
  }

  async findById(id: string): Promise<Post | null> {
    const post = await prismaClient.post.findFirst({
      where: { id, deletedAt: null },
    })
    return post ? PostMapper.toDomain(post) : null
  }

  async findBySlug(slug: string): Promise<Post | null> {
    const post = await prismaClient.post.findFirst({
      where: { slug, deletedAt: null },
    })
    return post ? PostMapper.toDomain(post) : null
  }

  async save(post: Post): Promise<Post> {
    const data = PostMapper.toPrisma(post)
    const created = await prismaClient.post.create({ data })
    return PostMapper.toDomain(created)
  }

  async update(post: Post): Promise<Post> {
    const data = PostMapper.toPrisma(post)
    const updated = await prismaClient.post.update({
      where: { id: post.id.toString() },
      data,
    })
    return PostMapper.toDomain(updated)
  }

  async delete(id: string): Promise<void> {
    const existing = await this.findById(id)
    if (!existing) throw new PostNotFoundError(id)
    await prismaClient.post.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }

  async count(params?: { status?: PostStatus }): Promise<number> {
    return prismaClient.post.count({
      where: {
        deletedAt: null,
        ...(params?.status ? { status: params.status } : {}),
      },
    })
  }
}
