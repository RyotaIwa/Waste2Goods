// Bottle-machine integration for Waste2Goods.
//
// Put this file in packages/backend/src/ (next to index-mysql.js).
//
//   POST /api/machine/transactions   the machine reports a finished transaction (API key)
//   POST /api/machine/claim          a logged-in resident claims a receipt code (JWT)
//   GET  /api/machine/deposits       admin list of machine deposits (JWT, admin)
//
// Needs the machine_deposits table from migrations/002_add_machine_deposits.sql.
//
// Environment variables (server side)
//   MACHINE_API_KEY            required. Same value as MACHINE_API_KEY in the machine's .env
//   MACHINE_POINTS_PER_BOTTLE  optional. A fixed number of points per bottle (for example 5).
//                              If not set, points follow your materials table:
//                              bottles x kgPerUnit x pointsPerKg
//   MACHINE_MATERIAL_ID        optional. materialId used for bottles. Default 1
//   MACHINE_CODE_TTL_DAYS      optional. Days a receipt code stays valid. Default 30, 0 = never expires

import crypto from 'node:crypto';
import db from './db-mysql.js';
import { authenticateJWT, requireRole } from './security/auth-jwt.js';
import { writeLimiter } from './security/rate-limit.js';
import { CacheBust } from './security/cache.js';
import { sanitizeLog } from './security/escape-html.js';

const ID_RE = /^[A-Za-z0-9_-]{1,50}$/;
const CODE_RE = /^[A-Z0-9]{8}$/;

// ── helpers ──────────────────────────────────────────────────────────────

// Constant-time key check. Hashing first makes both sides the same length.
function keyMatches(provided, expected) {
    if (!expected || typeof provided !== 'string' || provided === '') return false;
    const a = crypto.createHash('sha256').update(provided).digest();
    const b = crypto.createHash('sha256').update(expected).digest();
    return crypto.timingSafeEqual(a, b);
}

function isWholeNumber(n, min, max) {
    return Number.isInteger(n) && n >= min && n <= max;
}

function parseTransaction(body) {
    const b = body || {};
    const transactionId = String(b.transaction_id ?? '');
    const machineId = String(b.machine_id ?? '');
    const code = String(b.code ?? '').trim().toUpperCase();
    const bottles = Number(b.bottles);
    const points = Number(b.points);

    if (!ID_RE.test(transactionId)) return { error: 'transaction_id is invalid' };
    if (!ID_RE.test(machineId)) return { error: 'machine_id is invalid' };
    if (!CODE_RE.test(code)) return { error: 'code must be 8 letters or digits' };
    if (!isWholeNumber(bottles, 1, 500)) return { error: 'bottles must be a whole number from 1 to 500' };
    if (!isWholeNumber(points, 0, 1000000)) return { error: 'points must be a whole number' };

    // Machine clock is only informational. Ignore anything that is not a sensible date.
    let machineTime = null;
    if (b.created_at) {
        const d = new Date(b.created_at);
        const yearMs = 365 * 24 * 3600 * 1000;
        if (!Number.isNaN(d.getTime()) && Math.abs(Date.now() - d.getTime()) < yearMs) machineTime = d;
    }
    return { value: { transactionId, machineId, code, bottles, points, machineTime } };
}

async function loadMaterial() {
    const id = Number(process.env.MACHINE_MATERIAL_ID || 1);
    const [rows] = await db.query(
        "SELECT materialId, kgPerUnit, pointsPerKg FROM recyclable_materials WHERE materialId = ? AND status = 'active' LIMIT 1",
        [id]
    );
    return rows[0] || null;
}

// The server decides the points. The machine's own number is only stored for reference.
function computePoints(bottles, material) {
    const raw = process.env.MACHINE_POINTS_PER_BOTTLE;
    if (raw !== undefined && raw !== '' && Number.isFinite(Number(raw)) && Number(raw) >= 0) {
        return Math.round(bottles * Number(raw));
    }
    if (!material) return null;
    return Math.round(bottles * Number(material.kgPerUnit || 0) * Number(material.pointsPerKg || 0));
}

function newTransactionId() {
    return `RT-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`;
}

// ── POST /api/machine/transactions (called by count_bottles.py) ──────────

async function recordDeposit(req, res) {
    const expected = process.env.MACHINE_API_KEY || '';
    if (!expected) return res.status(503).json({ error: 'Machine API is not configured' });
    if (!keyMatches(req.get('x-machine-key'), expected)) {
        return res.status(401).json({ error: 'Invalid machine key' });
    }

    const parsed = parseTransaction(req.body);
    if (parsed.error) return res.status(400).json({ error: parsed.error });
    const t = parsed.value;

    try {
        const [kiosks] = await db.query('SELECT kioskId FROM kiosks WHERE kioskId = ? LIMIT 1', [t.machineId]);
        if (!kiosks.length) {
            return res.status(400).json({ error: 'Unknown machine_id: it must exist in the kiosks table' });
        }

        const material = await loadMaterial();
        const pointsAwarded = computePoints(t.bottles, material);
        if (pointsAwarded === null) {
            return res.status(500).json({ error: 'Bottle material is not configured on the server' });
        }

        try {
            await db.query(
                `INSERT INTO machine_deposits
           (depositId, kioskId, redeemCode, bottles, pointsReported, pointsAwarded, status, machineTime)
         VALUES (?, ?, ?, ?, ?, ?, 'unclaimed', ?)`,
                [t.transactionId, t.machineId, t.code, t.bottles, t.points, pointsAwarded, t.machineTime]
            );
        } catch (err) {
            if (err?.code !== 'ER_DUP_ENTRY') throw err;
            // Same transaction sent again (a retry): that is fine. A different transaction with the same code is not.
            const [same] = await db.query(
                'SELECT depositId FROM machine_deposits WHERE depositId = ? AND redeemCode = ? LIMIT 1',
                [t.transactionId, t.code]
            );
            if (same.length) return res.status(409).json({ status: 'duplicate' });
            return res.status(422).json({ error: 'Receipt code is already used by another deposit' });
        }

        // Show the machine as online in the admin panel. Not critical, so never fail the request.
        try {
            await db.query("UPDATE kiosks SET status = 'online', lastPing = 'just now' WHERE kioskId = ?", [t.machineId]);
            CacheBust.kiosks();
        } catch { /* ignore */ }

        console.log(`♻️ Machine deposit saved: ${sanitizeLog(t.machineId)} ${t.bottles} bottles, code ${sanitizeLog(t.code)}`);
        return res.status(201).json({ ok: true, depositId: t.transactionId, pointsAwarded });
    } catch (err) {
        console.error(`[machine] record error: ${sanitizeLog(err?.message || 'unknown')}`);
        return res.status(500).json({ error: 'Could not save the transaction' });
    }
}

// ── POST /api/machine/claim (resident enters the receipt code) ───────────

async function claimDeposit(req, res) {
    const role = req.user?.role;
    const userId = req.user?.userId;
    if (role !== 'resident' || !userId) {
        return res.status(403).json({ error: 'Only a logged-in resident can claim a receipt code' });
    }

    const code = String(req.body?.code ?? '').trim().toUpperCase();
    if (!CODE_RE.test(code)) return res.status(400).json({ error: 'Invalid code' });

    try {
        const [rows] = await db.query('SELECT * FROM machine_deposits WHERE redeemCode = ? LIMIT 1', [code]);
        if (!rows.length) return res.status(404).json({ error: 'Invalid code' });
        const dep = rows[0];

        if (dep.status === 'claimed') return res.status(409).json({ error: 'This code was already used' });
        if (dep.status !== 'unclaimed') return res.status(410).json({ error: 'This code is no longer valid' });

        const ttlDays = Number(process.env.MACHINE_CODE_TTL_DAYS ?? 30);
        if (ttlDays > 0 && Date.now() - new Date(dep.createdAt).getTime() > ttlDays * 24 * 3600 * 1000) {
            return res.status(410).json({ error: 'This code has expired' });
        }

        // Claim it in ONE atomic statement. If two people try at once, only one gets affectedRows = 1.
        const [claim] = await db.query(
            "UPDATE machine_deposits SET status = 'claimed', claimedBy = ?, claimedAt = NOW() WHERE depositId = ? AND status = 'unclaimed'",
            [userId, dep.depositId]
        );
        if (!claim || claim.affectedRows !== 1) {
            return res.status(409).json({ error: 'This code was already used' });
        }

        const pointsAwarded = Number(dep.pointsAwarded);
        try {
            const material = await loadMaterial();
            const weightKg = Math.round(Number(dep.bottles) * Number(material?.kgPerUnit || 0) * 100) / 100;
            const materialId = Number(material?.materialId || process.env.MACHINE_MATERIAL_ID || 1);

            await db.query(
                'INSERT INTO recycling_transactions (transactionId, userId, materialId, weightKg, pointsEarned, kioskId, timestamp) VALUES (?, ?, ?, ?, ?, ?, NOW())',
                [newTransactionId(), userId, materialId, weightKg, pointsAwarded, dep.kioskId]
            );
            await db.query(
                'UPDATE users SET pointsBalance = pointsBalance + ?, totalSubmissions = totalSubmissions + 1 WHERE userId = ?',
                [pointsAwarded, userId]
            );
        } catch (err) {
            // Crediting failed: give the code back so the resident can try again.
            await db.query(
                "UPDATE machine_deposits SET status = 'unclaimed', claimedBy = NULL, claimedAt = NULL WHERE depositId = ?",
                [dep.depositId]
            );
            throw err;
        }

        try {
            await CacheBust.transactions();
            await CacheBust.users();
        } catch { /* ignore */ }

        const [bal] = await db.query('SELECT pointsBalance FROM users WHERE userId = ? LIMIT 1', [userId]);
        return res.json({
            ok: true,
            bottles: Number(dep.bottles),
            pointsAwarded,
            newBalance: Number(bal?.[0]?.pointsBalance || 0),
            message: `+${pointsAwarded} points added to your account`,
        });
    } catch (err) {
        console.error(`[machine] claim error: ${sanitizeLog(err?.message || 'unknown')}`);
        return res.status(500).json({ error: 'Could not claim the code' });
    }
}

// ── GET /api/machine/deposits (admin) ────────────────────────────────────

async function listDeposits(req, res) {
    try {
        const [rows] = await db.query(`
      SELECT d.depositId, d.kioskId, d.redeemCode, d.bottles, d.pointsReported, d.pointsAwarded,
             d.status, d.claimedBy, d.claimedAt, d.createdAt, u.firstName, u.lastName
      FROM machine_deposits d
      LEFT JOIN users u ON u.userId = d.claimedBy
      ORDER BY d.createdAt DESC
      LIMIT 50
    `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

export function attachMachineRoutes(app) {
    app.post('/api/machine/transactions', writeLimiter, recordDeposit);
    app.post('/api/machine/claim', authenticateJWT, writeLimiter, claimDeposit);
    app.get('/api/machine/deposits', authenticateJWT, requireRole('admin'), listDeposits);
}

// exported for tests only
export const machineHandlers = { recordDeposit, claimDeposit, listDeposits, parseTransaction, computePoints };