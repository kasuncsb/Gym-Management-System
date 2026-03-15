import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors.js';
import * as response from '../utils/response.js';

export function notFound(req: Request, res: Response): void {
  res.status(404).json(response.error('NOT_FOUND', `${req.method} ${req.path} not found`));
}

/** Multer errors (file size, etc.) — check by code to avoid importing multer here */
function isMulterError(err: unknown): err is { code: string; message?: string } {
  return typeof err === 'object' && err !== null && 'code' in err && typeof (err as { code: unknown }).code === 'string';
}

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      console.error('Error:', err);
    }
    res.status(err.statusCode).json(response.error(err.code, err.message, err.details));
    return;
  }

  if (err instanceof ZodError) {
    const details = err.errors.map(e => ({ field: e.path.join('.'), message: e.message }));
    res.status(422).json(response.error('VALIDATION_ERROR', 'Validation failed', details));
    return;
  }

  if (isMulterError(err)) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json(response.error('PAYLOAD_TOO_LARGE', 'File size exceeds the allowed limit (max 5MB per file).'));
      return;
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      res.status(400).json(response.error('BAD_REQUEST', err.message ?? 'Unexpected file field'));
      return;
    }
    res.status(400).json(response.error('BAD_REQUEST', err.message ?? 'File upload error'));
    return;
  }

  console.error('Error:', err);
  res.status(500).json(response.error('INTERNAL_ERROR', 'An unexpected error occurred'));
};

export function asyncHandler<T>(fn: (req: Request, res: Response, next: NextFunction) => Promise<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function validate(schema: any, location: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[location]);
    if (!result.success) return next(result.error);
    req[location] = result.data;
    next();
  };
}
