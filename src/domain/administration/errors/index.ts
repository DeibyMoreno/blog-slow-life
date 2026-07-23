import { EntityNotFoundError, BusinessRuleViolationError } from '../../shared/errors/index.js'

export class UserNotFoundError extends EntityNotFoundError {
  constructor(id: string) {
    super('User', id)
    this.code = 'USER_NOT_FOUND'
  }
}

export class EmailAlreadyExistsError extends BusinessRuleViolationError {
  constructor(email: string) {
    super(`User with email ${email} already exists`)
    this.code = 'EMAIL_ALREADY_EXISTS'
  }
}

export class InvalidCredentialsError extends BusinessRuleViolationError {
  constructor() {
    super('Invalid email or password')
    this.code = 'INVALID_CREDENTIALS'
  }
}

export class RoleNotFoundError extends EntityNotFoundError {
  constructor(id: string) {
    super('Role', id)
    this.code = 'ROLE_NOT_FOUND'
  }
}

export class SessionExpiredError extends BusinessRuleViolationError {
  constructor() {
    super('Session has expired')
    this.code = 'SESSION_EXPIRED'
  }
}

export class RoleAlreadyExistsError extends BusinessRuleViolationError {
  constructor(name: string) {
    super(`Role with name ${name} already exists`)
    this.code = 'ROLE_ALREADY_EXISTS'
  }
}