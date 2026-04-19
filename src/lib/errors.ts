export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errors = {
  unauthorized: (msg = 'Authentication required'): AppError =>
    new AppError(401, 'UNAUTHORIZED', msg),
  forbidden: (msg = 'Insufficient permissions'): AppError =>
    new AppError(403, 'FORBIDDEN', msg),
  notFound: (resource: string): AppError =>
    new AppError(404, 'NOT_FOUND', `${resource} not found`),
  conflict: (msg: string): AppError =>
    new AppError(409, 'CONFLICT', msg),
  badRequest: (msg: string, details?: unknown): AppError =>
    new AppError(400, 'BAD_REQUEST', msg, details),
  tenantMismatch: (): AppError =>
    new AppError(403, 'TENANT_MISMATCH', 'Token not valid for this domain'),
  unknownTenant: (): AppError =>
    new AppError(403, 'UNKNOWN_TENANT', 'Domain not registered'),
  internal: (msg = 'Internal server error'): AppError =>
    new AppError(500, 'INTERNAL_ERROR', msg),
};
