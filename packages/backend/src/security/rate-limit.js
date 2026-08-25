import rateLimit from 'express-rate-limit';

export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests — try again in 1 minute' },
  keyGenerator: (req) => req.ip,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login/register attempts — try again in 15 minutes' },
  keyGenerator: (req) => req.ip,
  skipSuccessfulRequests: true,
});

export const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many writes per minute — slow down' },
  keyGenerator: (req) => req.user?.sub || req.ip,
});
