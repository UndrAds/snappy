import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import type { User } from '@snappy/shared-types';

export const getProfile = async (
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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      const error = new Error('User not found') as any;
      error.statusCode = 404;
      next(error);
      return;
    }

    const userResponse: User = {
      id: user.id,
      email: user.email,
      name: user.name || undefined,
      role: (user.role || 'publisher') as any,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    } as any;

    res.status(200).json({
      success: true,
      data: { user: userResponse },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { name, email } = req.body;

    if (!userId) {
      const error = new Error('User not authenticated') as any;
      error.statusCode = 401;
      next(error);
      return;
    }

    // Check if email is being updated and if it's already taken
    if (email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== userId) {
        const error = new Error('Email already in use') as any;
        error.statusCode = 409;
        next(error);
        return;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(email && { email }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const userResponse: User = {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name || undefined,
      role: (updatedUser.role || 'publisher') as any,
      createdAt: updatedUser.createdAt.toISOString(),
      updatedAt: updatedUser.updatedAt.toISOString(),
    } as any;

    res.status(200).json({
      success: true,
      data: { user: userResponse },
    });
  } catch (error) {
    next(error);
  }
};
