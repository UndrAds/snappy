import { Router } from 'express';
import { AnalyticsController } from '../controllers/analyticsController';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';
import { body, param, query } from 'express-validator';

const router = Router();

// Public endpoint - track analytics events (no authentication required)
router.post(
  '/track',
  [
    body('storyId').notEmpty().withMessage('storyId is required'),
    body('eventType')
      .isIn(['story_view', 'frame_view', 'time_spent', 'story_complete', 'navigation_click', 'cta_click'])
      .withMessage('Invalid eventType'),
    body('frameIndex').optional().isInt().withMessage('frameIndex must be an integer'),
    body('value').optional().isNumeric().withMessage('value must be a number'),
    body('sessionId').optional().isString().withMessage('sessionId must be a string'),
    validateRequest,
  ],
  AnalyticsController.trackEvent
);

// Protected routes - require authentication
router.use(authenticateToken);

// Get analytics for all user's stories
router.get('/', AnalyticsController.getUserStoriesAnalytics);

// Get day-wise analytics for a story (must be before /:storyId to avoid route conflicts)
router.get(
  '/:storyId/daywise',
  [
    param('storyId').notEmpty().withMessage('Story ID is required'),
    query('days').optional().isInt({ min: 1, max: 365 }).withMessage('days must be between 1 and 365'),
    validateRequest,
  ],
  AnalyticsController.getStoryDayWiseAnalytics
);

// Get detailed analytics events for a story
router.get(
  '/:storyId/events',
  [
    param('storyId').notEmpty().withMessage('Story ID is required'),
    query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('limit must be between 1 and 1000'),
    query('offset').optional().isInt({ min: 0 }).withMessage('offset must be a non-negative integer'),
    validateRequest,
  ],
  AnalyticsController.getStoryAnalyticsEvents
);

// Get analytics for a specific story
router.get(
  '/:storyId',
  [param('storyId').notEmpty().withMessage('Story ID is required'), validateRequest],
  AnalyticsController.getStoryAnalytics
);

export default router;
