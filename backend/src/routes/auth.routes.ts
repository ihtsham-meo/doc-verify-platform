import { Router } from 'express';
import { body } from 'express-validator';
import { AuthController } from '../controllers/auth.controller';
import { validate } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// POST /api/auth/register
router.post(
  '/register',
  [
    body('email')
      .isEmail().withMessage('Please provide a valid email.')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
      .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
      .matches(/[0-9]/).withMessage('Password must contain at least one number.')
      .matches(/[^A-Za-z0-9]/).withMessage('Password must contain at least one special character.'),
  ],
  validate,
  AuthController.register
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email')
      .isEmail().withMessage('Please provide a valid email.')
      .normalizeEmail(),
    body('password')
      .notEmpty().withMessage('Password is required.'),
  ],
  validate,
  AuthController.login
);

// GET /api/auth/me  (protected)
router.get('/me', authenticate, AuthController.me);

export default router;