import { query } from '../config/db';
import { Document } from '../types';

export const DocumentModel = {

  async create(data: {
    userId: string;
    fileName: string;
    fileHash: string;
    storagePath: string;
    fileSize: number;
    mimeType: string;
  }): Promise<Document> {
    const res = await query(
      `INSERT INTO documents (user_id, file_name, file_hash, storage_path, file_size, mime_type)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [data.userId, data.fileName, data.fileHash, data.storagePath, data.fileSize, data.mimeType]
    );
    return res.rows[0];
  },

  async findByHash(hash: string): Promise<Document | null> {
    const res = await query(
      'SELECT * FROM documents WHERE file_hash = $1',
      [hash]
    );
    return res.rows[0] || null;
  },

  async findByUserId(userId: string): Promise<Document[]> {
    const res = await query(
      `SELECT d.*, u.email as uploader_email
       FROM documents d
       JOIN users u ON d.user_id = u.id
       WHERE d.user_id = $1
       ORDER BY d.created_at DESC`,
      [userId]
    );
    return res.rows;
  },

  async findAll(): Promise<(Document & { uploader_email: string })[]> {
    const res = await query(
      `SELECT d.*, u.email as uploader_email
       FROM documents d
       JOIN users u ON d.user_id = u.id
       ORDER BY d.created_at DESC`
    );
    return res.rows;
  },

  async findById(id: string): Promise<Document | null> {
    const res = await query(
      'SELECT * FROM documents WHERE id = $1',
      [id]
    );
    return res.rows[0] || null;
  },

  async deleteById(id: string): Promise<boolean> {
    const res = await query(
      'DELETE FROM documents WHERE id = $1',
      [id]
    );
    return (res.rowCount ?? 0) > 0;
  },

  async searchByHashOrEmail(term: string): Promise<(Document & { uploader_email: string })[]> {
    const res = await query(
      `SELECT d.*, u.email as uploader_email
       FROM documents d
       JOIN users u ON d.user_id = u.id
       WHERE d.file_hash ILIKE $1
          OR u.email ILIKE $1
          OR d.file_name ILIKE $1
       ORDER BY d.created_at DESC`,
      [`%${term}%`]
    );
    return res.rows;
  },

};