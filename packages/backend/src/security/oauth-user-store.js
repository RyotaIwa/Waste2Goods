import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import db from '../db-mysql.js';

async function hashPasswordSafe(plain) {
  return bcrypt.hash(plain, 10);
}

function secureRandomAlnum(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

async function nextUserId() {
  try {
    const [[maxRow]] = await db.query(
      "SELECT COALESCE(MAX(CAST(SUBSTRING(userId, 3) AS UNSIGNED)), 0) AS maxNum FROM users"
    );
    const num = Number(maxRow?.maxNum || 0) + 1;
    return `U-${String(num).padStart(3, '0')}`;
  } catch {
    return `U-${String(Date.now()).slice(-6)}`;
  }
}

function extractProfileDetails(profile, opts = {}) {
  const provider = String(opts.provider || 'oauth').toLowerCase();
  const providerId = String(profile.id || profile.sub || profile.providerId || `${provider}-${Date.now()}`);
  const emailRaw = String(profile.email || '').toLowerCase().trim();
  const email = emailRaw || `${providerId.replace(/[^a-z0-9]/gi, '')}@${provider}.waste2goods.ph`;
  const nameRaw = String(profile.name || profile.displayName || profile.login || 'OAuth User').trim();
  const spaceIdx = nameRaw.lastIndexOf(' ');
  const firstName = spaceIdx > 0 ? nameRaw.slice(0, spaceIdx).trim() : nameRaw;
  const lastName = spaceIdx > 0 ? nameRaw.slice(spaceIdx + 1).trim() : (provider || 'User');
  const barangayId = Number(opts.barangayId || 1);
  const barangayName = String(opts.barangayName || profile.barangayName || 'Cabantian');
  const province = String(opts.province || profile.province || 'Davao del Sur');
  const city = String(opts.city || profile.city || 'Davao City');
  const phone = String(profile.phone || opts.phone || '');
  const streetAddress = String(opts.streetAddress || profile.streetAddress || '');

  return {
    provider, providerId, email, firstName, lastName,
    barangayId, barangayName, province, city, phone, streetAddress,
  };
}

async function findExistingUser(email, fallbackBarangayId) {
  try {
    const [existing] = await db.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
    if (existing && existing.length > 0) {
      const u = existing[0];
      return {
        userId: u.userId,
        role: 'resident',
        name: `${u.firstName} ${u.lastName}`.trim(),
        email: u.email,
        barangayId: u.barangayId || fallbackBarangayId,
        created: false,
        userRow: u,
      };
    }
  } catch (err) {
    console.warn('[oauth-user-store] find user failed, proceeding to create:', err.message);
  }
  return null;
}

async function findRaceUser(email, fallbackBarangayId) {
  try {
    const [race] = await db.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
    if (race && race.length > 0) {
      const u = race[0];
      return {
        userId: u.userId, role: 'resident',
        name: `${u.firstName} ${u.lastName}`.trim(),
        email: u.email, barangayId: u.barangayId || fallbackBarangayId,
        created: false, userRow: u,
      };
    }
  } catch {}
  return null;
}

export async function findOrCreateOAuthUser(profile, opts = {}) {
  const p = extractProfileDetails(profile, opts);
  const existing = await findExistingUser(p.email, p.barangayId);
  if (existing) return existing;

  const userId = await nextUserId();
  const qrCode = `${userId}-${secureRandomAlnum(5)}`;
  const passwordHash = await hashPasswordSafe(`${p.providerId}-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`);

  try {
    await db.query(
      `INSERT INTO users
         (userId, firstName, lastName, email, passwordHash, qr_code, barangayId,
          total_points, pointsBalance, totalSubmissions, status, phone, province, city, barangayName, streetAddress, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, 50, 50, 0, 'active', ?, ?, ?, ?, ?, NOW())`,
      [userId, p.firstName, p.lastName, p.email, passwordHash, qrCode, p.barangayId,
       p.phone, p.province, p.city, p.barangayName, p.streetAddress]
    );
  } catch (insertErr) {
    if (/Duplicate entry/.test(insertErr.message || '') && /email/.test(insertErr.message || '')) {
      const raced = await findRaceUser(p.email, p.barangayId);
      if (raced) return raced;
    }
    throw insertErr;
  }

  const [rows] = await db.query('SELECT * FROM users WHERE userId = ? LIMIT 1', [userId]);
  const userRow = rows?.[0] || null;

  return {
    userId,
    role: 'resident',
    name: `${p.firstName} ${p.lastName}`.trim(),
    email: p.email,
    barangayId: p.barangayId,
    created: true,
    userRow,
  };
}

export async function lookupKioskUser(kioskIdOrPin, opts = {}) {
  try {
    const [rows] = await db.query(
      "SELECT * FROM administrators WHERE adminIdentifier = 'kiosk@waste2goods.ph' OR adminId LIKE 'K-%' LIMIT 1"
    );
    if (rows && rows.length > 0) {
      const a = rows[0];
      return {
        kioskId: a.adminId || 'KIOSK-01',
        role: 'kiosk',
        name: `${a.firstName || 'Kiosk'} ${a.lastName || 'Terminal'}`.trim(),
        email: a.adminIdentifier || a.email || 'kiosk@waste2goods.ph',
      };
    }
  } catch {}
  return {
    kioskId: opts.kioskId || 'KIOSK-01',
    role: 'kiosk',
    name: opts.name || 'Kiosk Terminal',
    email: 'kiosk@waste2goods.ph',
  };
}

export default { findOrCreateOAuthUser, lookupKioskUser };
