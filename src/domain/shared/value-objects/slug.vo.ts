import { z } from 'zod'

const slugSchema = z
  .string()
  .min(1)
  .max(200)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be kebab-case')

export class Slug {
  private constructor(private readonly _value: string) {}

  static create(value: string): Slug {
    const slug = value
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-+/g, '-')

    const result = slugSchema.safeParse(slug)
    if (!result.success) {
      throw new InvalidSlugError(value)
    }
    return new Slug(result.data)
  }

  static from(value: string): Slug {
    const result = slugSchema.safeParse(value)
    if (!result.success) {
      throw new InvalidSlugError(value)
    }
    return new Slug(result.data)
  }

  get value(): string {
    return this._value
  }

  equals(other: Slug): boolean {
    return this._value === other._value
  }

  toString(): string {
    return this._value
  }
}

export class InvalidSlugError extends Error {
  constructor(value: string) {
    super(`Invalid slug: ${value}`)
    this.name = 'InvalidSlugError'
  }
}
