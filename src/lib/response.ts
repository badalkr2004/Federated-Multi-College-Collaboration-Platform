import type { Response } from 'express';

// ── Core response helpers (v2 spec names) ────────────────────────────────────

export function success<T>(res: Response, data: T, statusCode = 200, message?: string): void {
  const body: { success: true; data: T; message?: string } = { success: true, data };
  if (message) body.message = message;
  res.status(statusCode).json(body);
}

export function paginated<T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number,
): void {
  res.status(200).json({
    success: true,
    data,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

// ── Aliases (v1 compat) ──────────────────────────────────────────────────────
export const sendSuccess = success;

export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: unknown,
): void {
  const body: { success: false; error: { code: string; message: string; details?: unknown } } = {
    success: false,
    error: { code, message },
  };
  if (details !== undefined) body.error.details = details;
  res.status(statusCode).json(body);
}

export function sendPaginated<T>(res: Response, data: T[], page: number, limit: number, total: number): void {
  paginated(res, data, total, page, limit);
}
