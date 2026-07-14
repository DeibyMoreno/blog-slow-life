import { UUID } from '../value-objects/uuid.vo.js'

export abstract class BaseEntity {
  public readonly id: UUID
  public readonly createdAt: Date
  public updatedAt: Date

  constructor(id?: UUID, createdAt?: Date, updatedAt?: Date) {
    this.id = id ?? UUID.create()
    this.createdAt = createdAt ?? new Date()
    this.updatedAt = updatedAt ?? new Date()
  }

  equals(other: BaseEntity): boolean {
    return this.id.equals(other.id)
  }

  touch(): void {
    this.updatedAt = new Date()
  }
}
