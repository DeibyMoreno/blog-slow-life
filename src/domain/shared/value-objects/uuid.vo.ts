import { v4 as uuidv4, validate as isUUID } from 'uuid'

export class UUID {
  private constructor(private readonly _value: string) {}

  static create(): UUID {
    return new UUID(uuidv4())
  }

  static from(value: string): UUID {
    if (!isUUID(value)) {
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
