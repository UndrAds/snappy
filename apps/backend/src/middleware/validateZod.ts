import { Request, Response, NextFunction } from 'express';
import { AnyZodObject } from 'zod';

export const validateZod = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body);
      return next();
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        details: error,
      });
    }
  };
};
