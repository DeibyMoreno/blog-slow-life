import { z } from 'zod'

const emailSchema = z.string().email()

export class Email {
  private constructor(private readonly _value: string) {}

  static create(value: string): Email {
    const result = emailSchema.safeParse(value)
    if (!result.success) {
      throw new InvalidEmailError(value)
    }
    return new Email(result.data)
  }

  get value(): string {
    return this._value
  }

  equals(other: Email): boolean {
    return this._value === other._value
  }

  toString(): string {
    return this._value
  }
}

export class InvalidEmailError extends Error {
  constructor(value: string) {
    super(`Invalid email: ${value}`)
    this.name = 'InvalidEmailError'
  }
}
