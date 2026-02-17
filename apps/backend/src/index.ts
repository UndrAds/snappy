import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { config } from './config/config';
import { connectDB } from './config/database';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import storyRoutes from './routes/stories';
import uploadRoutes from './routes/uploads';
import contentRoutes from './routes/content';
import rssRoutes from './routes/rss';
import analyticsRoutes from './routes/analytics';
import adminRoutes from './routes/admin';
import { SchedulerService } from './services/schedulerService';

const app = express();
const PORT = config.PORT;

// Trust proxy (for accurate IP addresses behind nginx)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS configuration - allow all origins for now
app.use(
  '/api',
  cors({
    origin: '*',
    credentials: false,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Rate limiting removed per user request

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving removed - now using S3 for file storage

// Logging middleware
if (config.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/health', (_, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/rss', rssRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use(notFound);

// Error handling middleware
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Initialize RSS scheduler
    const schedulerService = new SchedulerService();
    await schedulerService.initializeScheduler();

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} in ${config.NODE_ENV} mode`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`📡 RSS scheduler initialized`);
    });

    // Graceful shutdown for zero-downtime deploys (finish in-flight requests before exit)
    const shutdown = (signal: string) => {
      console.log(`${signal} received, closing server gracefully...`);
      server.close(() => {
        console.log('Server closed, exiting');
        process.exit(0);
      });
      setTimeout(() => {
        console.error('Forced shutdown after 30s timeout');
        process.exit(1);
      }, 30000);
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
