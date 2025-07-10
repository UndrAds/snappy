import { Router } from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest';
import { register, login } from '../controllers/authController';

const router = Router();

// Validation schemas
const registerSchema = [
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters long'),
];

const loginSchema = [
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email address'),
  body('password').notEmpty().withMessage('Password is required'),
];

// Routes
router.post('/register', registerSchema, validateRequest, register);
router.post('/login', loginSchema, validateRequest, login);

export default router;
