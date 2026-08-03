import { randomUUID } from 'node:crypto'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export class UUID {
  private constructor(private readonly _value: string) {}

  static create(): UUID {
    return new UUID(randomUUID())
  }

  static from(value: string): UUID {
    if (!UUID_REGEX.test(value)) {
      throw new InvalidUUIDError(value)
    }
    return new UUID(value)
  }

  get value(): string {
    return this._value
  }

  equals(other: UUID): boolean {
    return this._value === other._value
  }

  toString(): string {
    return this._value
  }
}

export class InvalidUUIDError extends Error {
  constructor(value: string) {
    super(`Invalid UUID: ${value}`)
    this.name = 'InvalidUUIDError'
  }
}
