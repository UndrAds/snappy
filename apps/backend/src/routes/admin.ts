import { Router } from 'express';
import { AdminController } from '../controllers/adminController';
import { authenticateToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// Admin dashboard stats
router.get('/stats', AdminController.getStats);

// User management
router.get('/advertisers', AdminController.getAdvertisers);
router.get('/users/:userId/analytics', AdminController.getUserAnalytics);
router.get('/users/:userId', AdminController.getUserById);
router.get('/users', AdminController.getUsers);

// Story management
router.get('/stories', AdminController.getAllStories);
router.get('/stories/analytics', AdminController.getAllStoriesAnalytics);
router.put('/stories/:id', AdminController.updateStory);
router.delete('/stories/:id', AdminController.deleteStory);

export default router;
