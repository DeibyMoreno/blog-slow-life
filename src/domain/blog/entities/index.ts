import { AggregateRoot } from '../../shared/entities/aggregate-root.entity.js'
import type { UUID } from '../../shared/value-objects/uuid.vo.js'
import type { Slug } from '../../shared/value-objects/slug.vo.js'
import { PostStatus } from '../../shared/types/index.js'
import { PostCreatedEvent } from '../../shared/events/post-created.event.js'
import { PostPublishedEvent } from '../../shared/events/post-published.event.js'
import { PostArchivedEvent } from '../../shared/events/post-archived.event.js'

export interface CreatePostProps {
  title: string
  slug: Slug
  content?: string | null
  excerpt?: string | null
  coverImage?: string | null
  status?: PostStatus
  authorId: UUID
  categoryId?: UUID | null
}

export class Post extends AggregateRoot {
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

  static create(props: CreatePostProps): Post {
    const now = props.status === PostStatus.PUBLISHED ? new Date() : null
    const post = new Post(
      undefined, undefined, undefined,
      props.title, props.slug,
      props.content ?? null, props.excerpt ?? null, props.coverImage ?? null,
      props.status ?? PostStatus.DRAFT,
      props.authorId,
      props.categoryId ?? null,
      now,
      null,
    )
    post.addDomainEvent(new PostCreatedEvent(post.id.toString(), post.title, post.authorId.toString()))
    return post
  }

  changeTitle(title: string): void {
    this.title = title
    this.touch()
  }

  changeContent(content: string | null): void {
    this.content = content
    this.touch()
  }

  changeExcerpt(excerpt: string | null): void {
    this.excerpt = excerpt
    this.touch()
  }

  changeCoverImage(coverImage: string | null): void {
    this.coverImage = coverImage
    this.touch()
  }

  changeStatus(status: PostStatus): void {
    const oldStatus = this.status
    this.status = status
    this.touch()
    if (status === PostStatus.PUBLISHED && oldStatus !== PostStatus.PUBLISHED) {
      this.publishedAt = new Date()
      this.addDomainEvent(new PostPublishedEvent(this.id.toString(), this.title, this.publishedAt))
    }
    if (status === PostStatus.ARCHIVED && oldStatus !== PostStatus.ARCHIVED) {
      this.addDomainEvent(new PostArchivedEvent(this.id.toString(), this.title, new Date()))
    }
  }

  changeCategory(categoryId: UUID | null): void {
    this.categoryId = categoryId
    this.touch()
  }

  publish(): void {
    this.status = PostStatus.PUBLISHED
    this.publishedAt = new Date()
    this.touch()
    this.addDomainEvent(new PostPublishedEvent(this.id.toString(), this.title, this.publishedAt))
  }

  archive(): void {
    this.status = PostStatus.ARCHIVED
    this.touch()
    this.addDomainEvent(new PostArchivedEvent(this.id.toString(), this.title, new Date()))
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

export interface CreateCategoryProps {
  name: string
  slug: Slug
  description?: string | null
}

export class Category extends AggregateRoot {
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

  static create(props: CreateCategoryProps): Category {
    return new Category(
      undefined, undefined, undefined,
      props.name, props.slug,
      props.description ?? null,
    )
  }

  rename(name: string, slug: Slug): void {
    this.name = name
    this.slug = slug
    this.touch()
  }

  changeDescription(description: string | null): void {
    this.description = description
    this.touch()
  }
}

export interface CreateTagProps {
  name: string
  slug: Slug
}

export class Tag extends AggregateRoot {
  constructor(
    id: UUID | undefined,
    createdAt: Date | undefined,
    updatedAt: Date | undefined,
    public name: string,
    public slug: Slug | string,
  ) {
    super(id, createdAt, updatedAt)
  }

  static create(props: CreateTagProps): Tag {
    return new Tag(undefined, undefined, undefined, props.name, props.slug)
  }
}
