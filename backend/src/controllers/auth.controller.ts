import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthRequest } from '../types';

export const AuthController = {

    async register(req: Request, res: Response): Promise<void> {
        try {
            const { email, password } = req.body;
            const result = await AuthService.register(email, password);

            res.status(201).json({
                message: 'Registration successful',
                token: result.token,
                user: result.user,
            });
        } catch (err) {
            const error = err as Error;
            if (error.message === 'EMAIL_TAKEN') {
                res.status(409).json({ error: 'Email is already registered.' });
                return;
            }
            console.error('Register error:', error);
            res.status(500).json({ error: 'Registration failed. Please try again.' });
        }
    },

    async login(req: Request, res: Response): Promise<void> {
        try {
            const { email, password } = req.body;
            const result = await AuthService.login(email, password);

            res.status(200).json({
                message: 'Login successful',
                token: result.token,
                user: result.user,
            });
        } catch (err) {
            const error = err as Error;
            if (error.message === 'INVALID_CREDENTIALS') {
                // Same message for both wrong email and wrong password (security best practice)
                res.status(401).json({ error: 'Invalid email or password.' });
                return;
            }
            console.error('Login error:', error);
            res.status(500).json({ error: 'Login failed. Please try again.' });
        }
    },

    async me(req: AuthRequest, res: Response): Promise<void> {
        try {
            res.status(200).json({
                user: req.user,
            });
        } catch (err) {
            res.status(500).json({ error: 'Could not retrieve user.' });
        }
    },

};