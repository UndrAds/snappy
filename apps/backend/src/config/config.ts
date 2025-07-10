import dotenv from 'dotenv';
import type { Environment } from '@snappy/shared-types';

dotenv.config();

export const config: Environment = {
  NODE_ENV: (process.env['NODE_ENV'] as Environment['NODE_ENV']) || 'development',
  PORT: parseInt(process.env['PORT'] || '3000', 10),
  DATABASE_URL:
    process.env['DATABASE_URL'] || 'postgresql://username:password@localhost:5432/snappy_db',
  JWT_SECRET: process.env['JWT_SECRET'] || 'your-super-secret-jwt-key-change-this-in-production',
  JWT_EXPIRES_IN: process.env['JWT_EXPIRES_IN'] || '7d',
  CORS_ORIGIN: process.env['CORS_ORIGIN'] || 'http://localhost:5173',
} as const;
