import express from 'express';
import path from 'path';
import { env } from './config/env';

// Security middleware
import { helmetConfig }              from './middleware/helmet.middleware';
import { corsConfig }                from './middleware/cors.middleware';
import { globalLimiter, authLimiter } from './middleware/rateLimiter.middleware';
import { sanitizeBody, sanitizeQuery } from './middleware/sanitize.middleware';

// Routes
import authRoutes     from './routes/auth.routes';
import documentRoutes from './routes/document.routes';
import adminRoutes    from './routes/admin.routes';

const app = express();

// ── Security headers ──────────────────────────────────────────
app.use(helmetConfig);
app.use(corsConfig);

// ── Global rate limiter ───────────────────────────────────────
app.use(globalLimiter);

// ── Body parsing ──────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Sanitization ──────────────────────────────────────────────
app.use(sanitizeBody);
app.use(sanitizeQuery);

// ── Static files ──────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Health check ──────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', env: env.nodeEnv });
});

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth',      authLimiter, authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/admin',     adminRoutes);

// ── 404 handler ───────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global error handler ──────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err.message.startsWith('CORS:')) {
    res.status(403).json({ error: err.message });
    return;
  }
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(env.port, () => {
  console.log(`Server running on http://localhost:${env.port}`);
  console.log(`Environment: ${env.nodeEnv}`);
});

export default app;