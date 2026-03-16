import { query } from '../config/db';
import { User } from '../types';

export const UserModel = {

  async findByEmail(email: string): Promise<User | null> {
    const res = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return res.rows[0] || null;
  },

  async findById(id: string): Promise<User | null> {
    const res = await query(
      'SELECT id, email, role, created_at FROM users WHERE id = $1',
      [id]
    );
    return res.rows[0] || null;
  },

  async create(email: string, hashedPassword: string, role: 'user' | 'admin' = 'user'): Promise<User> {
    const res = await query(
      `INSERT INTO users (email, password, role)
       VALUES ($1, $2, $3)
       RETURNING id, email, role, created_at`,
      [email, hashedPassword, role]
    );
    return res.rows[0];
  },

  async emailExists(email: string): Promise<boolean> {
    const res = await query(
      'SELECT 1 FROM users WHERE email = $1',
      [email]
    );
    return (res.rowCount ?? 0) > 0;
  },

  async findAll(): Promise<Omit<User, 'password'>[]> {
    const res = await query(
      'SELECT id, email, role, created_at FROM users ORDER BY created_at DESC'
    );
    return res.rows;
  },

};