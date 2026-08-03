const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export class Slug {
  private constructor(private readonly _value: string) { }

  static create(value: string): Slug {
    const slug = value
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-+/g, '-')

    if (slug.length < 1 || slug.length > 200) {
      throw new InvalidSlugError(value)
    }

    if (!SLUG_REGEX.test(slug)) {
      throw new InvalidSlugError(value)
    }

    return new Slug(slug)
  }

  static from(value: string): Slug {
    if (value.length < 1 || value.length > 200) {
      throw new InvalidSlugError(value)
    }

    if (!SLUG_REGEX.test(value)) {
      throw new InvalidSlugError(value)
    }

    return new Slug(value)
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
