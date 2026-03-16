import fs from 'fs';
import { DocumentModel } from '../models/document.model';
import { UserModel } from '../models/user.model';

export const AdminService = {

  async getAllDocuments() {
    const docs = await DocumentModel.findAll();
    return docs.map((d) => ({
      id:            d.id,
      fileName:      d.file_name,
      fileHash:      d.file_hash,
      fileSize:      d.file_size,
      mimeType:      d.mime_type,
      storagePath:   d.storage_path,
      uploadedAt:    d.created_at,
      uploaderEmail: d.uploader_email,
      userId:        d.user_id,
    }));
  },

  async getAllUsers() {
    const users = await UserModel.findAll();
    return users.map((u) => ({
      id:        u.id,
      email:     u.email,
      role:      u.role,
      createdAt: u.created_at,
    }));
  },

  async searchDocuments(term: string) {
    if (!term || term.trim().length < 2) {
      throw new Error('SEARCH_TERM_TOO_SHORT');
    }
    const docs = await DocumentModel.searchByHashOrEmail(term.trim());
    return docs.map((d) => ({
      id:            d.id,
      fileName:      d.file_name,
      fileHash:      d.file_hash,
      fileSize:      d.file_size,
      mimeType:      d.mime_type,
      uploadedAt:    d.created_at,
      uploaderEmail: d.uploader_email,
      userId:        d.user_id,
    }));
  },

  async deleteDocument(documentId: string) {
    const document = await DocumentModel.findById(documentId);

    if (!document) {
      throw new Error('DOCUMENT_NOT_FOUND');
    }

    // Remove file from disk
    if (fs.existsSync(document.storage_path)) {
      fs.unlinkSync(document.storage_path);
    }

    await DocumentModel.deleteById(documentId);

    return {
      message:  'Document deleted by admin.',
      deleted:  documentId,
    };
  },

  async getDashboardStats() {
    const [docs, users] = await Promise.all([
      DocumentModel.findAll(),
      UserModel.findAll(),
    ]);

    const totalSize = docs.reduce((sum, d) => sum + d.file_size, 0);

    const byMimeType = docs.reduce<Record<string, number>>((acc, d) => {
      acc[d.mime_type] = (acc[d.mime_type] || 0) + 1;
      return acc;
    }, {});

    // Documents uploaded in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentUploads = docs.filter(
      (d) => new Date(d.created_at) > sevenDaysAgo
    ).length;

    return {
      totalDocuments:  docs.length,
      totalUsers:      users.length,
      totalSize,
      recentUploads,
      byMimeType,
    };
  },

};