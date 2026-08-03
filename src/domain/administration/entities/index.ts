import { AggregateRoot } from '../../shared/entities/aggregate-root.entity.js'
import type { UUID } from '../../shared/value-objects/uuid.vo.js'
import type { Email } from '../../shared/value-objects/email.vo.js'
import { UserCreatedEvent } from '../../shared/events/user-created.event.js'

export interface CreateUserProps {
  email: Email
  passwordHash: string
  firstName: string
  lastName: string
  avatarUrl?: string | null
  isActive?: boolean
  roleId: UUID
}

export class User extends AggregateRoot {
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

  static create(props: CreateUserProps): User {
    const user = new User(
      undefined, undefined, undefined,
      props.email, props.passwordHash,
      props.firstName, props.lastName,
      props.avatarUrl ?? null,
      props.isActive ?? true,
      props.roleId,
      null,
    )
    user.addDomainEvent(new UserCreatedEvent(user.id.toString(), user.email.toString(), ''))
    return user
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

export interface CreateRoleProps {
  name: string
  description?: string | null
  permissions?: Permission[]
}

export class Role extends AggregateRoot {
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

  static create(props: CreateRoleProps): Role {
    return new Role(
      undefined, undefined, undefined,
      props.name, props.description ?? null,
      props.permissions ?? [],
    )
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

export interface CreateSessionProps {
  userId: UUID
  refreshToken: string
  ipAddress?: string | null
  userAgent?: string | null
  expiresAt: Date
}

export class Session extends AggregateRoot {
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

  static create(props: CreateSessionProps): Session {
    return new Session(
      undefined, undefined, undefined,
      props.userId, props.refreshToken,
      props.ipAddress ?? null, props.userAgent ?? null,
      props.expiresAt,
    )
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt
  }
}
