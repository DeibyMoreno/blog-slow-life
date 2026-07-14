import { z } from 'zod'

const roleNameSchema = z.enum(['ADMIN', 'EDITOR', 'VIEWER'])

export class RoleName {
  private constructor(public readonly value: string) {}

  static create(value: string): RoleName {
    const result = roleNameSchema.safeParse(value)
    if (!result.success) {
      throw new InvalidRoleNameError(value)
    }
    return new RoleName(result.data)
  }

  equals(other: RoleName): boolean {
    return this.value === other.value
  }
}

export class InvalidRoleNameError extends Error {
  constructor(value: string) {
    super(`Invalid role name: ${value}. Must be one of: ADMIN, EDITOR, VIEWER`)
    this.name = 'InvalidRoleNameError'
  }
}
