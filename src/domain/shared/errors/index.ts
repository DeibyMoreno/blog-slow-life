export abstract class SlowLifeError extends Error {
  public abstract readonly code: string
  public abstract readonly statusCode: number

  constructor(message: string) {
    super(message)
    this.name = this.constructor.name
  }
}

export abstract class DomainError extends SlowLifeError {
  code = 'DOMAIN_ERROR'
  statusCode = 400
}

export abstract class ApplicationError extends SlowLifeError {
  code = 'APPLICATION_ERROR'
  statusCode = 500
}

export abstract class InfrastructureError extends SlowLifeError {
  code = 'INFRASTRUCTURE_ERROR'
  statusCode = 500
}

export class EntityNotFoundError extends DomainError {
  code = 'ENTITY_NOT_FOUND'
  statusCode = 404

  constructor(entityName: string, id: string) {
    super(`${entityName} with id ${id} not found`)
  }
}

export class BusinessRuleViolationError extends DomainError {
  code = 'BUSINESS_RULE_VIOLATION'

  constructor(message: string) {
    super(message)
  }
}

export class UnauthorizedError extends ApplicationError {
  code = 'UNAUTHORIZED'
  statusCode = 401

  constructor(message = 'Authentication required') {
    super(message)
  }
}

export class ForbiddenError extends ApplicationError {
  code = 'FORBIDDEN'
  statusCode = 403

  constructor(message = 'Insufficient permissions') {
    super(message)
  }
}

export class ValidationError extends ApplicationError {
  code = 'VALIDATION_ERROR'
  statusCode = 400

  constructor(message: string) {
    super(message)
  }
}
