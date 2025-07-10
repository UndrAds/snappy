import { PrismaClient } from '@prisma/client';
import { config } from './config';

const prisma = new PrismaClient({
  log: config.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

export const connectDB = async (): Promise<void> => {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
};

export const disconnectDB = async (): Promise<void> => {
  await prisma.$disconnect();
  console.log('🔌 Database disconnected');
};

export default prisma;
