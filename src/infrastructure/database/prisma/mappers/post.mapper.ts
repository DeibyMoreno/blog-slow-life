import type { Post as PrismaPost } from '@prisma/client'
import { Post } from '../../../../domain/blog/entities/index.js'
import { UUID } from '../../../../domain/shared/value-objects/uuid.vo.js'
import { Slug } from '../../../../domain/shared/value-objects/slug.vo.js'
import type { PostStatus } from '../../../../domain/shared/types/index.js'

export class PostMapper {
  static toDomain(prismaPost: PrismaPost): Post {
    return new Post(
      UUID.from(prismaPost.id),
      prismaPost.createdAt,
      prismaPost.updatedAt,
      prismaPost.title,
      Slug.from(prismaPost.slug),
      prismaPost.content,
      prismaPost.excerpt,
      prismaPost.coverImage,
      prismaPost.status as PostStatus,
      UUID.from(prismaPost.authorId),
      prismaPost.categoryId ? UUID.from(prismaPost.categoryId) : null,
      prismaPost.publishedAt,
      prismaPost.deletedAt,
    )
  }

  static toPrisma(domainPost: Post): PrismaPost {
    return {
      id: domainPost.id.toString(),
      title: domainPost.title,
      slug: domainPost.slug.toString(),
      content: domainPost.content,
      excerpt: domainPost.excerpt,
      coverImage: domainPost.coverImage,
      status: domainPost.status,
      authorId: domainPost.authorId.toString(),
      categoryId: domainPost.categoryId?.toString() ?? null,
      publishedAt: domainPost.publishedAt,
      createdAt: domainPost.createdAt,
      updatedAt: domainPost.updatedAt,
      deletedAt: domainPost.deletedAt,
    } as PrismaPost
  }
}
