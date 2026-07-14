import { describe, it, expect } from 'vitest'
import { Slug, InvalidSlugError } from '../../../../src/domain/shared/value-objects/slug.vo.js'

describe('Slug Value Object', () => {
  it('should create a slug from a title', () => {
    const slug = Slug.create('Hello World')
    expect(slug.value).toBe('hello-world')
  })

  it('should handle special characters', () => {
    const slug = Slug.create('Hello! World? #2024')
    expect(slug.value).toBe('hello-world-2024')
  })

  it('should handle multiple spaces', () => {
    const slug = Slug.create('Hello   World')
    expect(slug.value).toBe('hello-world')
  })

  it('should throw on empty string', () => {
    expect(() => Slug.create('')).toThrow()
  })

  it('should throw on invalid slug format', () => {
    expect(() => Slug.from('INVALID SLUG')).toThrow(InvalidSlugError)
  })

  it('should compare equality', () => {
    const slug1 = Slug.from('hello-world')
    const slug2 = Slug.from('hello-world')
    expect(slug1.equals(slug2)).toBe(true)
  })
})
