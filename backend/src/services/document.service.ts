import fs from 'fs';
import path from 'path';
import { DocumentModel } from '../models/document.model';
import { HashService } from './hash.service';

export const DocumentService = {

  async uploadDocument(
    userId: string,
    file: Express.Multer.File,
    clientHash: string
  ) {
    // 1. Recalculate hash server-side — never trust client
    const serverHash = await HashService.hashFile(file.path);

    // 2. Verify client hash matches server hash
    const hashesMatch = HashService.compareHashes(serverHash, clientHash);
    if (!hashesMatch) {
      // Delete the uploaded file — it may have been tampered in transit
      fs.unlinkSync(file.path);
      throw new Error('HASH_MISMATCH');
    }

    // 3. Store metadata in database
    const document = await DocumentModel.create({
      userId,
      fileName:    file.originalname,
      fileHash:    serverHash,
      storagePath: file.path,
      fileSize:    file.size,
      mimeType:    file.mimetype,
    });

    return {
      id:          document.id,
      fileName:    document.file_name,
      fileHash:    document.file_hash,
      fileSize:    document.file_size,
      mimeType:    document.mime_type,
      uploadedAt:  document.created_at,
    };
  },

  async getUserDocuments(userId: string) {
    const docs = await DocumentModel.findByUserId(userId);
    return docs.map((d) => ({
      id:           d.id,
      fileName:     d.file_name,
      fileHash:     d.file_hash,
      fileSize:     d.file_size,
      mimeType:     d.mime_type,
      uploadedAt:   d.created_at,
    }));
  },

  async verifyDocument(file: Express.Multer.File) {
    try {
      // 1. Hash the uploaded file
      const fileHash = await HashService.hashFile(file.path);

      // 2. Look up the hash in the database
      const document = await DocumentModel.findByHash(fileHash);

      // 3. Clean up — delete the temp verification file
      fs.unlinkSync(file.path);

      if (!document) {
        return {
          status:   'NOT_FOUND' as const,
          verified: false,
          hash:     fileHash,
          message:  'No record of this document. It may be modified or never uploaded.',
        };
      }

      return {
        status:         'VERIFIED' as const,
        verified:       true,
        hash:           fileHash,
        message:        'Document is authentic. Hash matches original upload.',
        originalName:   document.file_name,
        uploadedAt:     document.created_at,
        uploadedBy:     document.user_id,
      };

    } catch (err) {
      // Clean up on error
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      throw err;
    }
  },

  async deleteDocument(documentId: string, requestingUserId: string, isAdmin: boolean) {
    const document = await DocumentModel.findById(documentId);

    if (!document) {
      throw new Error('DOCUMENT_NOT_FOUND');
    }

    // Only owner or admin can delete
    if (!isAdmin && document.user_id !== requestingUserId) {
      throw new Error('FORBIDDEN');
    }

    // Delete physical file from disk
    if (fs.existsSync(document.storage_path)) {
      fs.unlinkSync(document.storage_path);
    }

    // Delete database record
    await DocumentModel.deleteById(documentId);

    return { message: 'Document deleted successfully.' };
  },

  formatFileSize(bytes: number): string {
    if (bytes < 1024)        return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  },

};