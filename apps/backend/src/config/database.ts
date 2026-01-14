import { PrismaClient } from '@prisma/client';
import { config } from './config';

// Enhance DATABASE_URL with connection pool settings if not already present
function enhanceDatabaseUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    
    // Set connection pool parameters if not already present
    if (!urlObj.searchParams.has('connection_limit')) {
      urlObj.searchParams.set('connection_limit', '20'); // Increased from default 5
    }
    if (!urlObj.searchParams.has('pool_timeout')) {
      urlObj.searchParams.set('pool_timeout', '20'); // Increased from default 10 seconds
    }
    
    return urlObj.toString();
  } catch (error) {
    // If URL parsing fails, return original URL
    console.warn('Failed to parse DATABASE_URL, using as-is:', error);
    return url;
  }
}

const enhancedDatabaseUrl = enhanceDatabaseUrl(config.DATABASE_URL);

const prisma = new PrismaClient({
  log: config.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: enhancedDatabaseUrl,
    },
  },
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
