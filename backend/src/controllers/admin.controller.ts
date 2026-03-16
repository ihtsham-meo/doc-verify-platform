import { Response } from 'express';
import { AuthRequest } from '../types';
import { AdminService } from '../services/admin.service';

export const AdminController = {

    // GET /api/admin/documents
    async getAllDocuments(_req: AuthRequest, res: Response): Promise<void> {
        try {
            const documents = await AdminService.getAllDocuments();
            res.status(200).json({ documents });
        } catch (err) {
            console.error('Admin get documents error:', err);
            res.status(500).json({ error: 'Could not retrieve documents.' });
        }
    },

    // GET /api/admin/users
    async getAllUsers(_req: AuthRequest, res: Response): Promise<void> {
        try {
            const users = await AdminService.getAllUsers();
            res.status(200).json({ users });
        } catch (err) {
            console.error('Admin get users error:', err);
            res.status(500).json({ error: 'Could not retrieve users.' });
        }
    },

    // GET /api/admin/documents/search?q=term
    async searchDocuments(req: AuthRequest, res: Response): Promise<void> {
        try {
            const term = req.query.q as string;

            if (!term) {
                res.status(400).json({ error: 'Search query is required. Use ?q=term' });
                return;
            }

            const documents = await AdminService.searchDocuments(term);
            res.status(200).json({ documents, count: documents.length });

        } catch (err) {
            const error = err as Error;
            if (error.message === 'SEARCH_TERM_TOO_SHORT') {
                res.status(400).json({ error: 'Search term must be at least 2 characters.' });
                return;
            }
            console.error('Admin search error:', err);
            res.status(500).json({ error: 'Search failed.' });
        }
    },

    // DELETE /api/admin/documents/:id
    async deleteDocument(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            if (typeof id !== 'string') {
                res.status(400).json({ error: 'Invalid Document ID.' });
                return;
            }
            const result = await AdminService.deleteDocument(id);
            res.status(200).json(result);
        } catch (err) {
            const error = err as Error;
            if (error.message === 'DOCUMENT_NOT_FOUND') {
                res.status(404).json({ error: 'Document not found.' });
                return;
            }
            console.error('Admin delete error:', err);
            res.status(500).json({ error: 'Delete failed.' });
        }
    },

    // GET /api/admin/stats
    async getStats(_req: AuthRequest, res: Response): Promise<void> {
        try {
            const stats = await AdminService.getDashboardStats();
            res.status(200).json({ stats });
        } catch (err) {
            console.error('Admin stats error:', err);
            res.status(500).json({ error: 'Could not retrieve stats.' });
        }
    },

};