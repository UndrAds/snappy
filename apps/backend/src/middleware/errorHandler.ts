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

  // Log error details
  const errorDetails = {
    message: err.message,
    statusCode,
    url: req.url,
    method: req.method,
    ...(config.NODE_ENV === 'development' && {
      stack: err.stack,
      body: req.body,
      params: req.params,
      query: req.query,
    }),
  };

  // Always log errors in production (but without sensitive data)
  if (config.NODE_ENV === 'production') {
    console.error('❌ Error:', errorDetails);
  } else {
    console.error('Error:', errorDetails);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(config.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};
