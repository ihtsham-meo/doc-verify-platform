import { Router } from 'express';
import { DocumentController } from '../controllers/document.controller';
import { authenticate } from '../middleware/auth.middleware';
import { upload, handleUploadError } from '../middleware/upload.middleware';
import { uploadLimiter } from '../middleware/rateLimiter.middleware';
import { param } from 'express-validator';
import { validate } from '../middleware/validate.middleware';

const router = Router();

// All document routes require authentication
router.use(authenticate);

// POST /api/documents/upload
// Auth + upload rate limiter + multer + error handler
router.post(
  '/upload',
  uploadLimiter,
  upload.single('file'),
  handleUploadError,
  DocumentController.upload
);

// POST /api/documents/verify
// No upload limiter on verify — users should be able to verify freely
router.post(
  '/verify',
  upload.single('file'),
  handleUploadError,
  DocumentController.verify
);

// GET /api/documents
// Returns documents belonging to the logged-in user
router.get('/', DocumentController.getMyDocuments);

// DELETE /api/documents/:id
router.delete(
  '/:id',
  [
    param('id')
      .isUUID().withMessage('Invalid document ID.'),
  ],
  validate,
  DocumentController.deleteDocument
);

export default router;