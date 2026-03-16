import { Request } from 'express';

export interface User {
  id: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  created_at: Date;
}

export interface Document {
  id: string;
  user_id: string;
  file_name: string;
  file_hash: string;
  storage_path: string;
  file_size: number;
  mime_type: string;
  created_at: Date;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: 'user' | 'admin';
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}