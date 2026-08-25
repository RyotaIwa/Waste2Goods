import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export const JWT_SECRET = process.env.JWT_SECRET || 'w2g_d2_secret_f9a8c7e6b5d4c3b2a1091a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e';
export const JWT_EXPIRES_IN = '24h';

export function signToken(payload) {
  const claims = {
    sub: payload.userId || payload.adminId || payload.kioskId || 'anon',
    role: payload.role || 'resident',
    userId: payload.userId || null,
    adminId: payload.adminId || null,
    name: payload.name || '',
    iat: Math.floor(Date.now() / 1000),
  };
  return jwt.sign(claims, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized — missing Bearer token' });
  }
  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      error: err.name === 'TokenExpiredError' ? 'Session expired — please log in again' : 'Invalid token',
    });
  }
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: `Forbidden — requires one of: ${allowedRoles.join(', ')}` });
    }
    next();
  };
}

export async function hashPassword(plain) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
}

export async function comparePassword(candidatePlain, storedHash) {
  if (!storedHash) return false;
  const isLegacy = typeof storedHash === 'string' && storedHash.startsWith('hashed_');
  if (isLegacy) {
    const legacyExpected = `hashed_${candidatePlain}`;
    return storedHash === candidatePlain || storedHash === legacyExpected;
  }
  try {
    return bcrypt.compare(candidatePlain, storedHash);
  } catch {
    return false;
  }
}

export function decodePayload(token) {
  try { return jwt.decode(token) || null; } catch { return null; }
}
