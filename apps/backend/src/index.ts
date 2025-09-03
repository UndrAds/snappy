import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';

import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { config } from './config/config';
import { connectDB } from './config/database';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import storyRoutes from './routes/stories';
import uploadRoutes from './routes/uploads';
import contentRoutes from './routes/content';

const app = express();
const PORT = config.PORT;

// Security middleware
app.use(helmet());

// CORS configuration for API routes
app.use(
  cors({
    origin: [config.CORS_ORIGIN, 'http://localhost:3001', 'http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Special CORS for embed script - allow all origins for public story access
app.use(
  '/api/stories/public',
  cors({
    origin: '*',
    credentials: false,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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

// 404 handler
app.use(notFound);

// Error handling middleware
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} in ${config.NODE_ENV} mode`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
