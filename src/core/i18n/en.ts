export const enMessages = {
  errors: {
    VALIDATION_FAILED: 'Validation failed on the provided payload',
    UNAUTHORIZED: 'Authentication required or invalid credentials',
    INVALID_CREDENTIALS: 'Invalid email or password',
    USER_NOT_FOUND: 'User account not found',
    USER_INACTIVE: 'User account is temporarily inactive',
    TOKEN_EXPIRED: 'Authentication token has expired. Please log in again',
    TOKEN_INVALID: 'Authentication token is invalid or malformed',
    REFRESH_TOKEN_REVOKED: 'Refresh token has been revoked for security',
    FORBIDDEN: 'You do not have permission to perform this action in this workspace',
    NOT_FOUND: 'The requested resource was not found',
    CONFLICT: 'Resource conflict detected',
    RESOURCE_GONE: 'The requested resource or link has expired',
    INTERNAL_SERVER_ERROR: 'An unexpected server error occurred. Please try again later',
    TOO_MANY_REQUESTS: 'Too many requests. Please slow down and try again',
  },
  system: {
    HEALTH_OK: 'System is operating normally',
    DB_CONNECTED: 'Database connection healthy',
    DB_DISCONNECTED: 'Database connection failed',
  },
};
