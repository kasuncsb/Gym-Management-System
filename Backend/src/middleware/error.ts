import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors.js';
import * as response from '../utils/response.js';

export function notFound(req: Request, res: Response): void {
  res.status(404).json(response.error('NOT_FOUND', `${req.method} ${req.path} not found`));
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
