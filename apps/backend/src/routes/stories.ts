import { Router } from 'express';
import { StoryController } from '../controllers/storyController';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';
import { body, param } from 'express-validator';

const router = Router();

// Apply authentication middleware to all story routes
router.use(authenticateToken);

// Story CRUD routes
router.post(
  '/',
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('publisherName').notEmpty().withMessage('Publisher name is required'),
    validateRequest,
  ],
  StoryController.createStory
);

router.get('/', StoryController.getUserStories);

router.get(
  '/:id',
  [param('id').notEmpty().withMessage('Story ID is required'), validateRequest],
  StoryController.getStoryById
);

router.put(
  '/:id',
  [param('id').notEmpty().withMessage('Story ID is required'), validateRequest],
  StoryController.updateStory
);

router.delete(
  '/:id',
  [param('id').notEmpty().withMessage('Story ID is required'), validateRequest],
  StoryController.deleteStory
);

// Save complete story from editor
router.post('/save-complete', StoryController.saveCompleteStory);

// Public story access (no authentication required)
router.get(
  '/public/:uniqueId',
  [param('uniqueId').notEmpty().withMessage('Unique ID is required'), validateRequest],
  StoryController.getStoryByUniqueId
);

// Story frame routes
router.post(
  '/:storyId/frames',
  [
    param('storyId').notEmpty().withMessage('Story ID is required'),
    body('order').isInt({ min: 1 }).withMessage('Order must be a positive integer'),
    validateRequest,
  ],
  StoryController.createStoryFrame
);

router.put(
  '/frames/:frameId',
  [param('frameId').notEmpty().withMessage('Frame ID is required'), validateRequest],
  StoryController.updateStoryFrame
);

router.delete(
  '/frames/:frameId',
  [param('frameId').notEmpty().withMessage('Frame ID is required'), validateRequest],
  StoryController.deleteStoryFrame
);

// Story element routes
router.post(
  '/frames/:frameId/elements',
  [
    param('frameId').notEmpty().withMessage('Frame ID is required'),
    body('type').isIn(['text', 'image', 'shape']).withMessage('Type must be text, image, or shape'),
    body('x').isFloat().withMessage('X must be a number'),
    body('y').isFloat().withMessage('Y must be a number'),
    body('width').isFloat({ min: 0 }).withMessage('Width must be a positive number'),
    body('height').isFloat({ min: 0 }).withMessage('Height must be a positive number'),
    validateRequest,
  ],
  StoryController.createStoryElement
);

router.put(
  '/elements/:elementId',
  [param('elementId').notEmpty().withMessage('Element ID is required'), validateRequest],
  StoryController.updateStoryElement
);

router.delete(
  '/elements/:elementId',
  [param('elementId').notEmpty().withMessage('Element ID is required'), validateRequest],
  StoryController.deleteStoryElement
);

// Story background routes
router.post(
  '/frames/:frameId/background',
  [
    param('frameId').notEmpty().withMessage('Frame ID is required'),
    body('type')
      .isIn(['color', 'image', 'video'])
      .withMessage('Type must be color, image, or video'),
    body('value').notEmpty().withMessage('Value is required'),
    validateRequest,
  ],
  StoryController.upsertStoryBackground
);

router.delete(
  '/frames/:frameId/background',
  [param('frameId').notEmpty().withMessage('Frame ID is required'), validateRequest],
  StoryController.deleteStoryBackground
);

export default router;
