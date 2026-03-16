import { Request, Response, NextFunction } from 'express';

// Recursively sanitize all string values in an object
const sanitizeValue = (value: unknown): unknown => {
  if (typeof value === 'string') {
    return value
      .replace(/(\$where|\$gt|\$lt|\$ne|\$in|\$or|\$and)/gi, '') // NoSQL injection
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // XSS scripts
      .replace(/javascript:/gi, '')                                          // JS protocol
      .trim();
  }
  if (typeof value === 'object' && value !== null) {
    if (Array.isArray(value)) {
      return value.map(sanitizeValue);
    }
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, sanitizeValue(v)])
    );
  }
  return value;
};

export const sanitizeBody = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (req.body && typeof req.body === 'object') {
    const sanitized = sanitizeValue(req.body);
    // Instead of req.body = sanitized, we do:
    Object.assign(req.body, sanitized);
  }
  next();
};

// Sanitize query params too
export const sanitizeQuery = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (req.query && typeof req.query === 'object') {
    const sanitized = sanitizeValue(req.query) as any;
    
    // 1. Clear existing properties to ensure un-sanitized data isn't left behind
    for (const key in req.query) {
      delete req.query[key];
    }
    
    // 2. Inject the sanitized values into the existing object
    Object.assign(req.query, sanitized);
  }
  next();
};