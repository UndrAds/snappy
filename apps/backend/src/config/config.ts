import dotenv from 'dotenv';
import type { Environment } from '@snappy/shared-types';

dotenv.config();

// Helper to get env var with fallback, handling empty strings
const getEnvVar = (key: string, fallback: string): string => {
  const value = process.env[key];
  return value && value.trim() !== '' ? value : fallback;
};

export const config: Environment = {
  NODE_ENV: (process.env['NODE_ENV'] as Environment['NODE_ENV']) || 'development',
  PORT: parseInt(process.env['PORT'] || '3000', 10),
  DATABASE_URL: getEnvVar(
    'DATABASE_URL',
    'postgresql://username:password@localhost:5432/snappy_db'
  ),
  JWT_SECRET: getEnvVar('JWT_SECRET', 'your-super-secret-jwt-key-change-this-in-production'),
  JWT_EXPIRES_IN: getEnvVar('JWT_EXPIRES_IN', '7d'),
  CORS_ORIGIN: getEnvVar('CORS_ORIGIN', 'http://localhost:5173'),
  REDIS_URL: getEnvVar('REDIS_URL', 'redis://localhost:6379'),
} as const;

// Validate critical config in production
if (config.NODE_ENV === 'production') {
  if (!process.env['JWT_SECRET'] || process.env['JWT_SECRET'].trim() === '') {
    console.error('⚠️  WARNING: JWT_SECRET is not set or is empty in production!');
    console.error(
      '⚠️  This will cause authentication to fail. Please set JWT_SECRET environment variable.'
    );
  }
  if (config.JWT_SECRET === 'your-super-secret-jwt-key-change-this-in-production') {
    console.error('⚠️  WARNING: Using default JWT_SECRET in production!');
    console.error('⚠️  This is a security risk. Please set a strong, unique JWT_SECRET.');
  }
}
