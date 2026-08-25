import mysql from 'mysql2/promise';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import bcrypt from 'bcryptjs';
import { ADMIN_CREDENTIALS, DEMO_RESIDENT_CREDENTIALS } from '@waste2goods/core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = Number(process.env.DB_PORT || 3306);
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'waste2goods';
const DB_SSL = process.env.DB_SSL === '1' || process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined;

const poolConfig = {
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONN_LIMIT || 10),
  queueLimit: 0,
};
if (DB_SSL) poolConfig.ssl = DB_SSL;

const db = mysql.createPool(poolConfig);

async function precomputeHash(plain) {
  try { return await bcrypt.hash(plain, 10); } catch { return `hashed_${plain}`; }
}

async function init() {
  try {
    const connection = await db.getConnection();
    const tag = process.env.NODE_ENV === 'production' ? 'DigitalOcean' : 'XAMPP';
    console.log(`✅ Connected to MySQL database (${tag}) ${DB_HOST}:${DB_PORT}/${DB_NAME} as ${DB_USER}`);
    connection.release();
    
    await applySchemaMigrations();
    await insertInfrastructureData();
    await insertAdminData();
    await insertResidentData();
  } catch (err) {
    console.error('❌ Error connecting to MySQL:', err);
    console.log('💡 Make sure XAMPP is running and you created the "waste2goods" database in phpMyAdmin!');
    console.log('💡 Also ensure you imported schema-mysql.sql to create the required tables.');
  }
}

async function applySchemaMigrations() {
  let totalApplied = 0;
  try {
    // ── 1. users table migrations ──────────────────────────
    const userMigrations = [
      { column: 'phone',         definition: 'VARCHAR(50)' },
      { column: 'province',      definition: 'VARCHAR(100)' },
      { column: 'city',          definition: 'VARCHAR(100)' },
      { column: 'barangayName',  definition: 'VARCHAR(100)' },
      { column: 'streetAddress', definition: 'VARCHAR(255)' },
      { column: 'tier',          definition: "VARCHAR(30) DEFAULT 'Bronze'" },
    ];
    const [userCols] = await db.query('SHOW COLUMNS FROM users');
    const userExisting = new Set(userCols.map(c => c.Field));
    let userApplied = 0;
    for (const m of userMigrations) {
      if (!userExisting.has(m.column)) {
        await db.query(`ALTER TABLE users ADD COLUMN ${m.column} ${m.definition}`);
        console.log(`🔧 Migration applied: Added column users.${m.column}`);
        userApplied++;
      }
    }
    totalApplied += userApplied;

    // ── 2. barangays table migrations (contactInfo vs old contactNumber) ──
    const barangayMigrations = [
      { column: 'contactInfo',     definition: 'VARCHAR(100)',
        renameFrom: 'contactNumber' },
      { column: 'barangayCaptain', definition: 'VARCHAR(100)' },
      { column: 'userId',          definition: 'INT' },
    ];
    const [brgyCols] = await db.query('SHOW COLUMNS FROM barangays');
    const brgyExisting = new Set(brgyCols.map(c => c.Field));
    let brgyApplied = 0;
    for (const m of barangayMigrations) {
      if (!brgyExisting.has(m.column)) {
        // If an old column name exists, rename it instead of adding new
        if (m.renameFrom && brgyExisting.has(m.renameFrom)) {
          await db.query(`ALTER TABLE barangays CHANGE COLUMN ${m.renameFrom} ${m.column} ${m.definition}`);
          console.log(`🔧 Migration applied: Renamed barangays.${m.renameFrom} → ${m.column}`);
        } else {
          await db.query(`ALTER TABLE barangays ADD COLUMN ${m.column} ${m.definition}`);
          console.log(`🔧 Migration applied: Added column barangays.${m.column}`);
        }
        brgyApplied++;
      }
    }
    totalApplied += brgyApplied;

    // ── 3. administrators table: ensure roleId + createdAt exist ──
    try {
      const adminMigrations = [
        { column: 'roleId',    definition: 'INT' },
        { column: 'createdAt', definition: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' },
      ];
      const [adminCols] = await db.query('SHOW COLUMNS FROM administrators');
      const adminExisting = new Set(adminCols.map(c => c.Field));
      let adminApplied = 0;
      for (const m of adminMigrations) {
        if (!adminExisting.has(m.column)) {
          await db.query(`ALTER TABLE administrators ADD COLUMN ${m.column} ${m.definition}`);
          console.log(`🔧 Migration applied: Added column administrators.${m.column}`);
          adminApplied++;
        }
      }
      totalApplied += adminApplied;
      // Auto-fix: Ensure any admin row with empty email is synced with adminIdentifier
      await db.query("UPDATE administrators SET email = adminIdentifier WHERE email IS NULL OR email = ''");
    } catch (_) {
      // administrators table might not exist yet (fresh DB); ignore
    }

    if (totalApplied === 0) {
      console.log('✅ All table schemas are up to date');
    } else {
      console.log(`🔧 Done: ${totalApplied} migration(s) applied total`);
    }
  } catch (err) {
    console.error('Migration warning (non-fatal):', err.message);
  }
}

async function insertInfrastructureData() {
  try {
    const [kiosks] = await db.query('SELECT COUNT(*) as count FROM kiosks');
    if (kiosks[0].count > 0) {
      console.log('✅ Kiosk infrastructure data already present');
    } else {
      await db.query(`
        INSERT INTO kiosks (kioskId, location, status, battery, lastPing, temp)
        VALUES 
        ('K-01', 'Cabantian Hall', 'online', 94, '2 min ago', '28°C'),
        ('K-02', 'Cabantian Elementary School', 'online', 78, '1 min ago', '27°C'),
        ('K-03', 'Cabantian Market', 'offline', 0, '3 hrs ago', '—'),
        ('K-04', 'Cabantian Covered Court', 'online', 61, 'just now', '30°C'),
        ('K-05', 'Cabantian Gym', 'maintenance', 45, '45 min ago', '—')
      `);
      console.log('✅ Kiosk infrastructure data inserted successfully');
    }
  } catch (err) {
    console.error('Error inserting kiosk infrastructure data:', err.message);
  }
}

async function insertAdminData() {
  try {
    const [rows] = await db.query(
      "SELECT COUNT(*) as count FROM administrators WHERE adminId = 'A-001' OR adminIdentifier = 'admin@waste2goods.ph'"
    );
    if (rows[0].count > 0) {
      console.log('✅ Admin user (A-001 Juan Reyes) already present in administrators table');
      return;
    }
    const pw = (ADMIN_CREDENTIALS && ADMIN_CREDENTIALS.password) ? ADMIN_CREDENTIALS.password : 'AdminCabantian2025';
    const passwordHash = await precomputeHash(pw);
    await db.query(`
      INSERT INTO administrators (adminId, adminIdentifier, firstName, lastName, passwordHash, barangayId, roleId, createdAt)
      VALUES (
        'A-001',
        'admin@waste2goods.ph',
        'Juan',
        'Reyes',
        ?,
        1,
        1,
        NOW()
      )
    `, [passwordHash]);
    console.log('✅ Admin user (A-001 Juan Reyes) inserted into administrators table');
    console.log('   → Email: admin@waste2goods.ph  |  Password: ' + pw);
  } catch (err) {
    console.error('Warning inserting admin user:', err.message);
  }
}

async function insertResidentData() {
  try {
    const [rows] = await db.query(
      "SELECT COUNT(*) as count FROM users WHERE userId = 'U-001' OR email = 'resident@cabantian.ph'"
    );
    if (rows[0].count > 0) {
      console.log('✅ Demo resident (U-001 Maria Santos) already present in users table');
      return;
    }
    const pw = (DEMO_RESIDENT_CREDENTIALS && DEMO_RESIDENT_CREDENTIALS.password) ? DEMO_RESIDENT_CREDENTIALS.password : 'ResidentCabantian2025';
    const passwordHash = await precomputeHash(pw);
    await db.query(`
      INSERT INTO users (
        userId, firstName, lastName, email, passwordHash, qr_code, barangayId,
        total_points, pointsBalance, totalSubmissions, createdAt, status,
        phone, province, city, barangayName, streetAddress
      ) VALUES (
        'U-001',
        'Maria',
        'Santos',
        'resident@cabantian.ph',
        ?,
        'U-001-QRSA1',
        1,
        50,
        50,
        0,
        NOW(),
        'active',
        '+63 917 123 4567',
        'Davao del Sur',
        'Davao City',
        'Cabantian',
        'Cabantian Road'
      )
    `, [passwordHash]);
    console.log('✅ Demo resident (U-001 Maria Santos) inserted into users table');
    console.log('   → Email: resident@cabantian.ph  |  Password: ' + pw);
  } catch (err) {
    console.error('Warning inserting demo resident user:', err.message);
  }
}

// Initialize
init();

export default db;
