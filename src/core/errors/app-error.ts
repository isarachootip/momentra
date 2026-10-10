export interface InvalidParamDetail {
  name: string;
  reason: string;
}

export abstract class AppError extends Error {
  public abstract readonly statusCode: number;
  public abstract readonly errorCode: string;
  public readonly invalidParams?: InvalidParamDetail[] | undefined;

  constructor(message: string, invalidParams?: InvalidParamDetail[] | undefined) {
    super(message);
    this.name = this.constructor.name;
    if (invalidParams !== undefined) {
      this.invalidParams = invalidParams;
    }
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  public readonly statusCode = 400;
  public readonly errorCode = 'VALIDATION_FAILED';

  constructor(message = 'Validation failed', invalidParams?: InvalidParamDetail[]) {
    super(message, invalidParams);
  }
}

export class BadRequestError extends AppError {
  public readonly statusCode = 400;
  public readonly errorCode = 'BAD_REQUEST';

  constructor(message = 'Bad request') {
    super(message);
  }
}

export class UnauthorizedError extends AppError {
  public readonly statusCode = 401;
  public readonly errorCode = 'UNAUTHORIZED';

  constructor(message = 'Authentication required or invalid credentials') {
    super(message);
  }
}

export class ForbiddenError extends AppError {
  public readonly statusCode = 403;
  public readonly errorCode = 'FORBIDDEN';

  constructor(message = 'Insufficient permissions to perform this action') {
    super(message);
  }
}

export class NotFoundError extends AppError {
  public readonly statusCode = 404;
  public readonly errorCode = 'NOT_FOUND';

  constructor(message = 'The requested resource was not found') {
    super(message);
  }
}

export class ConflictError extends AppError {
  public readonly statusCode = 409;
  public readonly errorCode = 'CONFLICT';

  constructor(message = 'Resource conflict detected') {
    super(message);
  }
}

export class GoneError extends AppError {
  public readonly statusCode = 410;
  public readonly errorCode = 'RESOURCE_GONE';

  constructor(message = 'The requested resource is no longer available') {
    super(message);
  }
}

export class InternalServerError extends AppError {
  public readonly statusCode = 500;
  public readonly errorCode = 'INTERNAL_SERVER_ERROR';

  constructor(message = 'An unexpected server error occurred') {
    super(message);
  }
}
