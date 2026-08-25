import crypto from 'node:crypto';

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
    console.log(`[GW] ${new Date().toISOString()} | ${req.method} ${req.originalUrl} | ${res.statusCode} | ${elapsedMs}ms | ${req.ip} | ${userTag} | ${requestId}`);
  });
  next();
}

export function apiNotFound(req, res) {
  res.status(404).json({ error: `Endpoint ${req.method} ${req.originalUrl} not found` });
}

export function errorHandler(err, req, res, next) {
  console.error(`[ERR:${req.id || '?'}]`, err.message || err);
  if (res.headersSent) return next(err);
  res.status(err.statusCode || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : (err.message || 'Internal server error'),
    requestId: req.id || null,
  });
}
