import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AuthRequest } from './auth';

export const requireAdmin = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const userRole = (req.user as any)?.role;

    if (!userId) {
      const error = new Error('User not authenticated') as any;
      error.statusCode = 401;
      next(error);
      return;
    }

    // First check role from JWT token (faster)
    if (userRole === 'admin') {
      (req as any).isAdmin = true;
      next();
      return;
    }

    // If role not in token or not admin, check database
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
