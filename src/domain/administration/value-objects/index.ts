const VALID_ROLES = ['ADMIN', 'EDITOR', 'VIEWER'] as const

export class RoleName {
  private constructor(public readonly value: string) {}

  static create(value: string): RoleName {
    if (!VALID_ROLES.includes(value as typeof VALID_ROLES[number])) {
      throw new InvalidRoleNameError(value)
    }
    return new RoleName(value)
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
