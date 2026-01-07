import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AuthRequest } from './auth';

export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      const error = new Error('User not authenticated') as any;
      error.statusCode = 401;
      next(error);
      return;
    }

    // Get user from database to check role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      const error = new Error('User not found') as any;
      error.statusCode = 404;
      next(error);
      return;
    }

    if (user.role !== 'admin') {
      const error = new Error('Admin access required') as any;
      error.statusCode = 403;
      next(error);
      return;
    }

    // Attach admin flag to request for convenience
    (req as any).isAdmin = true;
    next();
  } catch (error) {
    next(error);
  }
};
