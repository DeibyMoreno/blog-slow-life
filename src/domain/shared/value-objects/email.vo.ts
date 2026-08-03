const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export class Email {
  private constructor(private readonly _value: string) {}

  static create(value: string): Email {
    if (!EMAIL_REGEX.test(value)) {
      throw new InvalidEmailError(value)
    }
    return new Email(value)
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
