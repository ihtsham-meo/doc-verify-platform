import helmet from 'helmet';

export const helmetConfig = helmet({
  // Prevent browsers from sniffing MIME types
  xContentTypeOptions: true,

  // Clickjacking protection
  frameguard: { action: 'deny' },

  // Force HTTPS in production
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },

  // Disable X-Powered-By (hides Express)
  hidePoweredBy: true,

  // XSS filter for older browsers
  xssFilter: true,

  // Restrict referrer info
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },

  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
});