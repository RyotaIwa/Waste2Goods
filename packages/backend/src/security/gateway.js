import crypto from 'node:crypto';
import { sanitizeLog } from './escape-html.js';

export function gatewayLogger(req, res, next) {
  const requestId = crypto.randomBytes(8).toString('hex');
  const startedAt = process.hrtime.bigint();
  req.id = requestId;
  res.setHeader('X-Request-ID', requestId);
  res.setHeader('X-Content-Type-Options', 'nosniff');

  res.on('finish', () => {
    const elapsedNs = process.hrtime.bigint() - startedAt;
    const elapsedMs = Number(elapsedNs / 1_000_000n);
    const userTag = req.user ? `${req.user.role}:${req.user.sub || '?'}` : 'anon';
    const safeMethod = sanitizeLog(req.method);
    const safeUrl = sanitizeLog(req.originalUrl || req.url);
    const safeIp = sanitizeLog(req.ip);
    const safeUserTag = sanitizeLog(userTag);
    console.log(`[GW] ${new Date().toISOString()} | ${safeMethod} ${safeUrl} | ${res.statusCode} | ${elapsedMs}ms | ${safeIp} | ${safeUserTag} | ${requestId}`);
  });
  next();
}

export function apiNotFound(req, res) {
  res.status(404).json({ error: `Endpoint ${sanitizeLog(req.method)} ${sanitizeLog(req.originalUrl || req.url)} not found` });
}

export function errorHandler(err, req, res, next) {
  const safeMsg = sanitizeLog(err?.message || err);
  console.error(`[ERR:${req.id || '?'}]`, safeMsg);
  if (res.headersSent) return next(err);
  res.status(err?.statusCode || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : (err?.message || 'Internal server error'),
    requestId: req.id || null,
  });
}

export default { gatewayLogger, apiNotFound, errorHandler };

