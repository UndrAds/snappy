import { Router } from 'express';
import { body, param } from 'express-validator';
import { RSSController } from '../controllers/rssController';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

// RSS feed validation (no authentication required)
router.post(
  '/validate-feed',
  [body('feedUrl').isURL().withMessage('Valid feed URL is required'), validateRequest],
  RSSController.validateFeedUrl
);

// Apply authentication middleware to all other RSS routes
router.use(authenticateToken);

// Get RSS processing status
router.get(
  '/processing-status/:storyId',
  [param('storyId').notEmpty().withMessage('Story ID is required'), validateRequest],
  RSSController.getProcessingStatus
);

// Update RSS configuration
router.put(
  '/config/:storyId',
  [
    param('storyId').notEmpty().withMessage('Story ID is required'),
    body('rssConfig.feedUrl').isURL().withMessage('Valid RSS feed URL is required'),
    body('rssConfig.updateIntervalMinutes')
      .isInt({ min: 5, max: 1440 })
      .withMessage('Update interval must be between 5 and 1440 minutes'),
    body('rssConfig.maxPosts')
      .isInt({ min: 1, max: 50 })
      .withMessage('Max posts must be between 1 and 50'),
    body('rssConfig.allowRepetition').isBoolean().withMessage('Allow repetition must be a boolean'),
    validateRequest,
  ],
  RSSController.updateRSSConfig
);

// Toggle RSS updates on/off
router.put(
  '/toggle/:storyId',
  [
    param('storyId').notEmpty().withMessage('Story ID is required'),
    body('isActive').isBoolean().withMessage('isActive must be a boolean'),
    validateRequest,
  ],
  RSSController.toggleRSSUpdates
);

// Manually trigger RSS update
router.post(
  '/trigger-update/:storyId',
  [param('storyId').notEmpty().withMessage('Story ID is required'), validateRequest],
  RSSController.triggerRSSUpdate
);

// Get queue statistics (admin only)
router.get('/queue-stats', RSSController.getQueueStats);

export default router;
