export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export abstract class DomainError extends AppError {
  code = 'DOMAIN_ERROR'
  statusCode = 400
}

export abstract class ApplicationError extends AppError {
  code = 'APPLICATION_ERROR'
  statusCode = 500
}

export abstract class InfrastructureError extends AppError {
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

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
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
