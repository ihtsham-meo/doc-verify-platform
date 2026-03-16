import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/user.model';
import { env } from '../config/env';
import { JwtPayload } from '../types';

const SALT_ROUNDS = 12;

export const AuthService = {

  async register(email: string, password: string) {
    // Check if email already taken
    const exists = await UserModel.emailExists(email);
    if (exists) {
      throw new Error('EMAIL_TAKEN');
    }

    // Hash password — never store plain text
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const user = await UserModel.create(email, hashedPassword, 'user');

    // Generate token
    const token = AuthService.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  },

  async login(email: string, password: string) {
    // Find user by email
    const user = await UserModel.findByEmail(email);
    if (!user) {
      throw new Error('INVALID_CREDENTIALS');
    }

    // Compare password with hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('INVALID_CREDENTIALS');
    }

    // Generate token
    const token = AuthService.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  },

  generateToken(payload: JwtPayload): string {
    return jwt.sign(payload, env.jwt.secret, {
      expiresIn: env.jwt.expiresIn as string,
    } as jwt.SignOptions);
  },

  verifyToken(token: string): JwtPayload {
    return jwt.verify(token, env.jwt.secret) as JwtPayload;
  },

};