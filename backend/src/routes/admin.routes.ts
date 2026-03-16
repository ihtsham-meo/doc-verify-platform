import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/admin.middleware';
import { param, query } from 'express-validator';
import { validate } from '../middleware/validate.middleware';

const router = Router();

// All admin routes: must be logged in AND be an admin
router.use(authenticate, requireAdmin);

// GET /api/admin/stats
router.get('/stats', AdminController.getStats);

// GET /api/admin/documents
router.get('/documents', AdminController.getAllDocuments);

// GET /api/admin/documents/search?q=term
router.get(
  '/documents/search',
  [
    query('q')
      .notEmpty().withMessage('Search term is required.')
      .isLength({ min: 2 }).withMessage('Search term must be at least 2 characters.')
      .trim()
      .escape(),
  ],
  validate,
  AdminController.searchDocuments
);

// DELETE /api/admin/documents/:id
router.delete(
  '/documents/:id',
  [
    param('id')
      .isUUID().withMessage('Invalid document ID format.'),
  ],
  validate,
  AdminController.deleteDocument
);

// GET /api/admin/users
router.get('/users', AdminController.getAllUsers);

export default router;