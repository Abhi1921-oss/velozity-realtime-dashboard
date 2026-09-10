import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error occurred';
  const code = err.code || 'INTERNAL_SERVER_ERROR';

  if (config.nodeEnv === 'development' && statusCode === 500) {
    console.error(`[Error] ${req.method} ${req.url}:`, err.stack || err);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      code,
      details: err.details || undefined,
    },
  });
};
