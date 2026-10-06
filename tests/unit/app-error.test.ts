import { describe, it, expect } from 'vitest';
import {
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  GoneError,
  InternalServerError,
} from '../../src/core/errors/app-error.js';

describe('AppError Hierarchy', () => {
  it('should instantiate all error subclasses with correct status and codes', () => {
    const valErr = new ValidationError('Invalid input', [{ name: 'field', reason: 'required' }]);
    expect(valErr.statusCode).toBe(400);
    expect(valErr.errorCode).toBe('VALIDATION_FAILED');
    expect(valErr.invalidParams).toHaveLength(1);

    const unauthErr = new UnauthorizedError();
    expect(unauthErr.statusCode).toBe(401);
    expect(unauthErr.errorCode).toBe('UNAUTHORIZED');

    const forbErr = new ForbiddenError();
    expect(forbErr.statusCode).toBe(403);
    expect(forbErr.errorCode).toBe('FORBIDDEN');

    const notFoundErr = new NotFoundError();
    expect(notFoundErr.statusCode).toBe(404);
    expect(notFoundErr.errorCode).toBe('NOT_FOUND');

    const confErr = new ConflictError();
    expect(confErr.statusCode).toBe(409);
    expect(confErr.errorCode).toBe('CONFLICT');

    const goneErr = new GoneError();
    expect(goneErr.statusCode).toBe(410);
    expect(goneErr.errorCode).toBe('RESOURCE_GONE');

    const intErr = new InternalServerError();
    expect(intErr.statusCode).toBe(500);
    expect(intErr.errorCode).toBe('INTERNAL_SERVER_ERROR');
  });
});
