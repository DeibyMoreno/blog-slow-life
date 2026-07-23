import { BaseEntity } from '../../shared/entities/base.entity.js'
import type { UUID } from '../../shared/value-objects/uuid.vo.js'
import type { Email } from '../../shared/value-objects/email.vo.js'

export class User extends BaseEntity {
  constructor(
    id: UUID | undefined,
    createdAt: Date | undefined,
    updatedAt: Date | undefined,
    public readonly email: Email,
    public passwordHash: string,
    public firstName: string,
    public lastName: string,
    public avatarUrl: string | null,
    public isActive: boolean,
    public roleId: UUID,
    public deletedAt: Date | null,
    public role: Role | null = null,
  ) {
    super(id, createdAt, updatedAt)
  }

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`
  }

  isDeleted(): boolean {
    return this.deletedAt !== null
  }

  markAsDeleted(): void {
    this.deletedAt = new Date()
    this.touch()
  }

  activate(): void {
    this.isActive = true
    this.touch()
  }

  deactivate(): void {
    this.isActive = false
    this.touch()
  }
}

export class Role extends BaseEntity {
  constructor(
    id: UUID | undefined,
    createdAt: Date | undefined,
    updatedAt: Date | undefined,
    public name: string,
    public description: string | null,
    public permissions: Permission[] = [],
  ) {
    super(id, createdAt, updatedAt)
  }
}

export class Permission {
  constructor(
    public readonly id: UUID,
    public readonly resource: string,
    public readonly action: string,
    public readonly description: string | null,
    public readonly createdAt: Date,
  ) {}
}

export class Session extends BaseEntity {
  constructor(
    id: UUID | undefined,
    createdAt: Date | undefined,
    _updatedAt: Date | undefined,
    public readonly userId: UUID,
    public refreshToken: string,
    public ipAddress: string | null,
    public userAgent: string | null,
    public expiresAt: Date,
  ) {
    super(id, createdAt)
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt
  }
}
