import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { config } from '../config/config';
import type { CreateUserRequest, LoginRequest, AuthResponse } from '@snappy/shared-types';

export const register = async (
  req: Request<{}, {}, CreateUserRequest>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      const error = new Error('User already exists') as any;
      error.statusCode = 409;
      next(error);
      return;
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
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

    // Generate JWT token with role
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role || 'publisher' },
      config.JWT_SECRET as string,
      { expiresIn: config.JWT_EXPIRES_IN } as jwt.SignOptions
    );

    const response: AuthResponse = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name || undefined,
        role: (user.role || 'publisher') as any,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      } as any,
      token,
    };

    res.status(201).json({
      success: true,
      data: response,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request<{}, {}, LoginRequest>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user with role
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      // User not found
      res.status(404).json({
        success: false,
        error: { message: 'User not found. Please sign up first.' },
      });
      return;
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      // Invalid password
      res.status(401).json({
        success: false,
        error: { message: 'Invalid credentials' },
      });
      return;
    }

    // Generate JWT token with role
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role || 'publisher' },
      config.JWT_SECRET as string,
      { expiresIn: config.JWT_EXPIRES_IN } as jwt.SignOptions
    );

    const response: AuthResponse = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name || undefined,
        role: (user.role || 'publisher') as any,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      } as any,
      token,
    };

    res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error: any) {
    // Handle Prisma error for missing table
    if (
      error.code === 'P2021' || // Table does not exist
      (error.message && error.message.includes('does not exist'))
    ) {
      res.status(500).json({
        success: false,
        error: { message: 'Internal server error. Please contact support.' },
      });
      return;
    }
    next(error);
  }
};
