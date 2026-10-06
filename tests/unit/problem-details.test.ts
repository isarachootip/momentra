import { describe, it, expect } from 'vitest';
import { createProblemDetails } from '../../src/core/errors/problem-details.js';

describe('ProblemDetails Serializer', () => {
  it('should format RFC 9457 error with default Thai localization', () => {
    const problem = createProblemDetails({
      status: 400,
      code: 'VALIDATION_FAILED',
      instance: '/api/v1/auth/login',
      correlationId: 'test-req-123',
    });

    expect(problem.type).toBe('https://momentra.app/errors/validation-failed');
    expect(problem.title).toBe('Bad Request');
    expect(problem.status).toBe(400);
    expect(problem.instance).toBe('/api/v1/auth/login');
    expect(problem.correlation_id).toBe('test-req-123');
    expect(problem.detail).toBe('ข้อมูลที่ส่งมาไม่ถูกต้องตามเงื่อนไข');
  });

  it('should format RFC 9457 error with English localization when requested', () => {
    const problem = createProblemDetails({
      status: 401,
      code: 'UNAUTHORIZED',
      instance: '/api/v1/me',
      acceptLanguage: 'en-US,en;q=0.9',
    });

    expect(problem.status).toBe(401);
    expect(problem.title).toBe('Unauthorized');
    expect(problem.detail).toBe('Authentication required or invalid credentials');
  });

  it('should include invalid_params array when validation details are provided', () => {
    const invalidParams = [
      { name: 'email', reason: 'Must be a valid email' },
      { name: 'password', reason: 'Must be at least 8 characters' },
    ];

    const problem = createProblemDetails({
      status: 400,
      code: 'VALIDATION_FAILED',
      instance: '/api/v1/items',
      invalidParams,
    });

    expect(problem.invalid_params).toEqual(invalidParams);
  });
});
