import { Response } from 'express';
import { AuthRequest } from '../types';
import { DocumentService } from '../services/document.service';

export const DocumentController = {

    // POST /api/documents/upload
    async upload(req: AuthRequest, res: Response): Promise<void> {
        try {
            if (!req.file) {
                res.status(400).json({ error: 'No file provided.' });
                return;
            }

            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated.' });
                return;
            }

            const clientHash = req.body.clientHash as string;
            if (!clientHash || !/^[a-f0-9]{64}$/.test(clientHash)) {
                res.status(400).json({ error: 'Invalid or missing client hash.' });
                return;
            }

            const result = await DocumentService.uploadDocument(
                req.user.userId,
                req.file,
                clientHash
            );

            res.status(201).json({
                message: 'Document uploaded successfully.',
                document: result,
            });

        } catch (err) {
            const error = err as Error;
            if (error.message === 'HASH_MISMATCH') {
                res.status(400).json({
                    error: 'Hash mismatch. File may have been tampered with during upload.',
                });
                return;
            }
            console.error('Upload error:', error);
            res.status(500).json({ error: 'Upload failed. Please try again.' });
        }
    },

    // GET /api/documents
    async getMyDocuments(req: AuthRequest, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated.' });
                return;
            }

            const documents = await DocumentService.getUserDocuments(req.user.userId);
            res.status(200).json({ documents });

        } catch (err) {
            console.error('Get documents error:', err);
            res.status(500).json({ error: 'Could not retrieve documents.' });
        }
    },

    // POST /api/documents/verify
    async verify(req: AuthRequest, res: Response): Promise<void> {
        try {
            if (!req.file) {
                res.status(400).json({ error: 'No file provided for verification.' });
                return;
            }

            const result = await DocumentService.verifyDocument(req.file);

            const statusCode = result.verified ? 200 : 404;
            res.status(statusCode).json(result);

        } catch (err) {
            console.error('Verify error:', err);
            res.status(500).json({ error: 'Verification failed. Please try again.' });
        }
    },

    // DELETE /api/documents/:id
    async deleteDocument(req: AuthRequest, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated.' });
                return;
            }

            const { id } = req.params;
            if (typeof id !== 'string') {
                res.status(400).json({ error: 'Invalid Document ID.' });
                return;
            }
            const isAdmin = req.user.role === 'admin';

            const result = await DocumentService.deleteDocument(
                id,
                req.user.userId,
                isAdmin
            );

            res.status(200).json(result);

        } catch (err) {
            const error = err as Error;
            if (error.message === 'DOCUMENT_NOT_FOUND') {
                res.status(404).json({ error: 'Document not found.' });
                return;
            }
            if (error.message === 'FORBIDDEN') {
                res.status(403).json({ error: 'You can only delete your own documents.' });
                return;
            }
            console.error('Delete error:', err);
            res.status(500).json({ error: 'Delete failed. Please try again.' });
        }
    },

};