import { BaseEntity } from '../../shared/entities/base.entity.js'
import type { UUID } from '../../shared/value-objects/uuid.vo.js'
import type { Slug } from '../../shared/value-objects/slug.vo.js'
import { PostStatus } from '../../shared/types/index.js'

export class Post extends BaseEntity {
  constructor(
    id: UUID | undefined,
    createdAt: Date | undefined,
    updatedAt: Date | undefined,
    public title: string,
    public slug: Slug | string,
    public content: string | null,
    public excerpt: string | null,
    public coverImage: string | null,
    public status: PostStatus,
    public authorId: UUID,
    public categoryId: UUID | null,
    public publishedAt: Date | null,
    public deletedAt: Date | null,
  ) {
    super(id, createdAt, updatedAt)
  }

  publish(): void {
    this.status = PostStatus.PUBLISHED
    this.publishedAt = new Date()
    this.touch()
  }

  archive(): void {
    this.status = PostStatus.ARCHIVED
    this.touch()
  }

  draft(): void {
    this.status = PostStatus.DRAFT
    this.publishedAt = null
    this.touch()
  }

  isDeleted(): boolean {
    return this.deletedAt !== null
  }

  markAsDeleted(): void {
    this.deletedAt = new Date()
    this.touch()
  }
}

export class Category extends BaseEntity {
  constructor(
    id: UUID | undefined,
    createdAt: Date | undefined,
    updatedAt: Date | undefined,
    public name: string,
    public slug: Slug | string,
    public description: string | null,
  ) {
    super(id, createdAt, updatedAt)
  }
}

export class Tag extends BaseEntity {
  constructor(
    id: UUID | undefined,
    createdAt: Date | undefined,
    updatedAt: Date | undefined,
    public name: string,
    public slug: Slug | string,
  ) {
    super(id, createdAt, updatedAt)
  }
}
