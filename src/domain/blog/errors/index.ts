import { EntityNotFoundError, BusinessRuleViolationError } from '../../shared/errors/index.js'

export class PostNotFoundError extends EntityNotFoundError {
  constructor(id: string) {
    super('Post', id)
    this.code = 'POST_NOT_FOUND'
  }
}

export class PostSlugConflictError extends BusinessRuleViolationError {
  constructor(slug: string) {
    super(`A post with slug "${slug}" already exists`)
    this.code = 'POST_SLUG_CONFLICT'
  }
}

export class CategoryNotFoundError extends EntityNotFoundError {
  constructor(id: string) {
    super('Category', id)
    this.code = 'CATEGORY_NOT_FOUND'
  }
}

export class TagNotFoundError extends EntityNotFoundError {
  constructor(id: string) {
    super('Tag', id)
    this.code = 'TAG_NOT_FOUND'
  }
}

export class TagSlugConflictError extends BusinessRuleViolationError {
  constructor(slug: string) {
    super(`A tag with slug "${slug}" already exists`)
    this.code = 'TAG_SLUG_CONFLICT'
  }
}

export class CategorySlugConflictError extends BusinessRuleViolationError {
  constructor(slug: string) {
    super(`A category with slug "${slug}" already exists`)
    this.code = 'CATEGORY_SLUG_CONFLICT'
  }
}

export class CategoryHasPostsError extends BusinessRuleViolationError {
  constructor(name: string) {
    super(`Cannot delete category "${name}" because it has associated posts`)
    this.code = 'CATEGORY_HAS_POSTS'
  }
}
