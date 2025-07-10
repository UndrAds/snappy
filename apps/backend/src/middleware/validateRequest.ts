import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

export const validateRequest = (req: Request, _res: Response, next: NextFunction): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error) => error.msg);
    const error = new Error(errorMessages.join(', ')) as any;
    error.statusCode = 400;
    error.details = errorMessages;
    next(error);
    return;
  }

  next();
};
