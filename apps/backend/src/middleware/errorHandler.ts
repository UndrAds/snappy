import { Request, Response, NextFunction } from 'express';
import { config } from '../config/config';
import type { AppError } from '@snappy/shared-types';

export const errorHandler = (
  err: AppError & { stack?: string },
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Log error in development
  if (config.NODE_ENV === 'development') {
    console.error('Error:', {
      message: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      body: req.body,
      params: req.params,
      query: req.query,
    });
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(config.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};
