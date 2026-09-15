import mysql from 'mysql2/promise';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import bcrypt from 'bcryptjs';
import { ADMIN_CREDENTIALS, DEMO_RESIDENT_CREDENTIALS } from '@waste2goods/core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const KIOSK_PIN = process.env.KIOSK_PIN || '7890';

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
  try {
    return await bcrypt.hash(plain, 10);
  } catch (err) {
    console.warn('Warning precomputing hash:', err.message);
    return `hashed_${plain}`;
  }
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

async function migrateTableColumns(tableName, migrations) {
  let applied = 0;
  try {
    const [cols] = await db.query(`SHOW COLUMNS FROM ${tableName}`);
    const existing = new Set(cols.map(c => c.Field));
    for (const m of migrations) {
      if (!existing.has(m.column)) {
        if (m.renameFrom && existing.has(m.renameFrom)) {
          await db.query(`ALTER TABLE ${tableName} CHANGE COLUMN ${m.renameFrom} ${m.column} ${m.definition}`);
          console.log(`🔧 Migration applied: Renamed ${tableName}.${m.renameFrom} → ${m.column}`);
        } else {
          await db.query(`ALTER TABLE ${tableName} ADD COLUMN ${m.column} ${m.definition}`);
          console.log(`🔧 Migration applied: Added column ${tableName}.${m.column}`);
        }
        applied++;
      }
    }
  } catch (err) {
    console.debug(`Column migration check skipped for table ${tableName}:`, err.message);
  }
  return applied;
}

async function ensureTasksView() {
  try {
    const [[existsRow]] = await db.query(
      "SELECT COUNT(*) AS cnt FROM information_schema.VIEWS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tasks'"
    );
    if (Number(existsRow?.cnt || 0) > 0) return 0;
    await db.query(
      "CREATE VIEW tasks AS SELECT taskId, taskName, description, bonus_points, bonusPoints, targetKg, startDate, endDate, progress, target, frequency, barangayId, materialId, status FROM recycling_tasks"
    );
    console.log('🔧 Migration applied: Created VIEW `tasks` AS SELECT * FROM recycling_tasks');
    return 1;
  } catch (err) {
    console.debug('Tasks VIEW migration skipped:', err.message);
    return 0;
  }
}

async function ensureRewardsSeed() {
  try {
    const [[cnt]] = await db.query('SELECT COUNT(*) AS cnt FROM rewards');
    if (Number(cnt?.cnt || 0) > 0) return 0;
    await db.query(`
      INSERT INTO rewards (rewardId, rewardName, points_required, pointsCost, stock_quantity, stockQuantity, description, category, icon, isSeasonal, status, created_at, createdAt) VALUES
      (1, 'Eco Water Bottle', 350, 350, 120, 120, 'Reusable stainless steel 500ml water bottle with Waste2Goods logo', 'Eco Essentials', '🥤', 0, 'active', NOW(), NOW()),
      (2, 'Bamboo Utensil Set', 280, 280, 95, 95, 'Fork, spoon, chopsticks, straw with canvas pouch', 'Eco Essentials', '🥢', 0, 'active', NOW(), NOW()),
      (3, 'Raffia Tote Bag', 220, 220, 150, 150, 'Hand-woven natural raffia shopping bag', 'Eco Essentials', '👜', 0, 'active', NOW(), NOW()),
      (4, 'Cotton Tote Bag', 150, 150, 200, 200, 'Heavy-duty canvas grocery bag with print', 'Eco Essentials', '🛍️', 0, 'active', NOW(), NOW()),
      (5, 'Notebook (Set of 3)', 180, 180, 180, 180, 'Recycled paper notebooks with Barangay Cabantian design', 'School Supplies', '📓', 0, 'active', NOW(), NOW()),
      (6, 'Pencil Case Set', 160, 160, 110, 110, 'Eco-friendly pencil case with pencils and eraser', 'School Supplies', '✏️', 0, 'active', NOW(), NOW()),
      (7, 'Pencil (Pack of 12)', 90, 90, 250, 250, '100% recycled newspaper pencils with seeds', 'School Supplies', '🖊️', 0, 'active', NOW(), NOW()),
      (8, 'Rice (2kg)', 550, 550, 75, 75, 'Premium well-milled rice 2kg pack', 'Groceries', '🍚', 0, 'active', NOW(), NOW()),
      (9, 'Pancit Canton (Pack of 6)', 240, 240, 130, 130, 'Assorted flavor instant pancit canton', 'Groceries', '🍜', 0, 'active', NOW(), NOW()),
      (10, 'Canned Sardines (Pack of 3)', 195, 195, 100, 100, 'Premium sardines in tomato sauce', 'Groceries', '🐟', 0, 'active', NOW(), NOW()),
      (11, 'Coffee (10 sachets)', 180, 180, 90, 90, '3-in-1 coffee mix', 'Groceries', '☕', 0, 'active', NOW(), NOW()),
      (12, 'Laundry Detergent (1kg)', 260, 260, 80, 80, 'Eco-friendly biodegradable detergent powder', 'Household', '🧺', 0, 'active', NOW(), NOW()),
      (13, 'Dishwashing Liquid (500ml)', 210, 210, 70, 70, 'Plant-based concentrated dish soap', 'Household', '🧽', 0, 'active', NOW(), NOW()),
      (14, 'Toilet Soap (Set of 3)', 150, 150, 100, 100, 'Natural herbal bath soap trio', 'Household', '🧼', 0, 'active', NOW(), NOW()),
      (15, 'Toothbrush + Toothpaste', 130, 130, 140, 140, 'Bamboo toothbrush with fluoride toothpaste', 'Household', '🪥', 0, 'active', NOW(), NOW()),
      (16, 'Vegetable Seedlings Kit', 290, 290, 60, 60, 'Pechay, kangkong, tomato seeds + starter pots', 'Community', '🌱', 0, 'active', NOW(), NOW()),
      (17, 'Community T-Shirt', 330, 330, 75, 75, 'Limited Waste2Goods barangay shirt (sizes M/L/XL)', 'Community', '👕', 0, 'active', NOW(), NOW()),
      (18, 'Sinulog Gift Pack', 420, 420, 30, 30, 'Seasonal: Sinulog-themed mug + keychain + tote', 'Seasonal', '🎊', 1, 'active', NOW(), NOW()),
      (19, 'Kadayawan Durian Treats', 520, 520, 25, 25, 'Seasonal: Local durian candies, yema, pasalubong box', 'Seasonal', '🎁', 1, 'active', NOW(), NOW()),
      (20, 'Pasko Ham & Cheese Pack', 750, 750, 40, 40, 'Seasonal Christmas: Premium ham + cheese loaf', 'Seasonal', '🎄', 1, 'active', NOW(), NOW())
    `);
    console.log('✅ Rewards seed data inserted successfully');
    return 1;
  } catch (err) {
    console.debug('Rewards seed skipped:', err.message);
    return 0;
  }
}

async function ensureRecyclingTasksSeed() {
  try {
    const [[cnt]] = await db.query('SELECT COUNT(*) AS cnt FROM recycling_tasks');
    if (Number(cnt?.cnt || 0) > 0) return 0;
    await db.query(`
      INSERT INTO recycling_tasks (taskId, taskName, description, bonus_points, bonusPoints, targetKg, startDate, endDate, progress, target, frequency, barangayId, materialId, status) VALUES
      (1, 'Daily Recycling', 'Submit any amount of PET plastic today', 25, 25, 0.50, NULL, NULL, 0, 1, 'daily', NULL, NULL, 'active'),
      (2, 'Streak Bonus - 3 Days', '3 days in a row! Keep it up', 100, 100, 1.00, NULL, NULL, 0, 3, 'daily', NULL, NULL, 'active'),
      (3, '5 kg Weekly Challenge', 'Collect and submit 5 kg total this week', 300, 300, 5.00, NULL, NULL, 0, 1, 'weekly', NULL, NULL, 'active'),
      (4, '10 Bottles in a Day', 'Submit 10+ PET bottles in a single day', 150, 150, 0.20, NULL, NULL, 0, 1, 'daily', NULL, NULL, 'active'),
      (5, 'Pasko Big Cleanup Drive', 'Barangay-wide Christmas cleanup: 20kg target', 1000, 1000, 20.00, NULL, NULL, 0, 1, 'monthly', NULL, NULL, 'active')
    `);
    console.log('✅ Recycling tasks seed data inserted successfully');
    return 1;
  } catch (err) {
    console.debug('Recycling tasks seed skipped:', err.message);
    return 0;
  }
}

async function ensureRecyclableMaterialsSeed() {
  try {
    const [[cnt]] = await db.query('SELECT COUNT(*) AS cnt FROM recyclable_materials');
    if (Number(cnt?.cnt || 0) > 0) return 0;
    await db.query(`
      INSERT INTO recyclable_materials (materialId, materialName, materialType, pointsPerKg, kgPerUnit, description, status) VALUES
      (1, 'PET Plastic Bottle (500ml)', 'PET Plastic', 50.00, 0.01, 'Clean 500ml clear PET bottle with cap removed', 'active'),
      (2, 'PET Plastic Bottle (1L)', 'PET Plastic', 50.00, 0.02, 'Clean 1L clear PET beverage bottle', 'active'),
      (3, 'PET Plastic Bottle (1.5L)', 'PET Plastic', 50.00, 0.03, 'Clean 1.5L clear PET soda/water bottle', 'active'),
      (4, 'PET Plastic Container', 'PET Plastic', 50.00, 0.02, 'Clean food-grade PET container (tupperware-style)', 'active'),
      (5, 'Bulk PET Plastic (by weight)', 'PET Plastic', 50.00, 1.00, 'Any clean PET plastic weighed directly on kiosk scale', 'active')
    `);
    console.log('✅ Recyclable materials seed data inserted successfully');
    return 1;
  } catch (err) {
    console.debug('Recyclable materials seed skipped:', err.message);
    return 0;
  }
}

async function ensureRolesSeed() {
  try {
    const needRoles = [
      { id: 1, name: 'SUPER_ADMIN',     description: 'System super administrator (immutable A-001)' },
      { id: 2, name: 'ADMIN',           description: 'Barangay admin panel dashboard access' },
      { id: 3, name: 'BARANGAY_ADMIN',  description: 'Per-barangay operations admin' },
      { id: 4, name: 'RESIDENT',        description: 'Standard registered resident user' },
      { id: 5, name: 'KIOSK',           description: 'Kiosk terminal on-site role' },
      { id: 6, name: 'ANON',            description: 'Unauthenticated public browser role' },
    ];
    for (const r of needRoles) {
      const [[exists]] = await db.query('SELECT COUNT(*) AS cnt FROM roles WHERE roleId = ?', [r.id]);
      if (Number(exists?.cnt || 0) > 0) continue;
      try {
        await db.query(
          'INSERT INTO roles (roleId, roleName, description, createdAt) VALUES (?, ?, ?, NOW())',
          [r.id, r.name, r.description]
        );
      } catch (_colErr) {
        try {
          await db.query(
            'INSERT INTO roles (roleId, roleName, description, created_at) VALUES (?, ?, ?, NOW())',
            [r.id, r.name, r.description]
          );
        } catch (_noTimeCol) {
          await db.query(
            'INSERT INTO roles (roleId, roleName, description) VALUES (?, ?, ?)',
            [r.id, r.name, r.description]
          );
        }
      }
      console.log(`✅ Role seed inserted: roleId=${r.id} name=${r.name}`);
    }
    return 1;
  } catch (err) {
    console.debug('Roles seed skipped:', err.message);
    return 0;
  }
}

async function ensureKioskAdminSeed() {
  try {
    const pwPlain = KIOSK_PIN || '7890';
    const [rows] = await db.query(
      "SELECT adminId, passwordHash FROM administrators WHERE adminIdentifier = 'kiosk@waste2goods.ph' OR adminId = 'K-001' LIMIT 1"
    );
    if (rows && rows.length > 0) {
      const match = await bcrypt.compare(pwPlain, String(rows[0].passwordHash || '')).catch(() => false);
      if (!match) {
        const newHash = await precomputeHash(pwPlain);
        await db.query("UPDATE administrators SET passwordHash = ? WHERE adminId = ?", [newHash, rows[0].adminId]);
        console.log('🔄 Synced password hash for kiosk administrator K-001 in administrators table');
      }
      return 0;
    }
    const pw = await precomputeHash(pwPlain);
    try {
      await db.query(
        "INSERT INTO administrators (adminId, email, adminIdentifier, firstName, lastName, passwordHash, barangayId, roleId, status, createdAt) VALUES ('K-001', 'kiosk@waste2goods.ph', 'kiosk@waste2goods.ph', 'Kiosk', 'Terminal', ?, 1, 5, 'active', NOW())",
        [pw]
      );
    } catch (fkErr) {
      if (/foreign key|roleId/i.test(fkErr.message || '')) {
        await db.query(
          "INSERT INTO administrators (adminId, email, adminIdentifier, firstName, lastName, passwordHash, barangayId, roleId, status, createdAt) VALUES ('K-001', 'kiosk@waste2goods.ph', 'kiosk@waste2goods.ph', 'Kiosk', 'Terminal', ?, 1, NULL, 'active', NOW())",
          [pw]
        );
        console.log('✅ Kiosk administrator (K-001) inserted with roleId=NULL FK-safe fallback');
        return 1;
      }
      throw fkErr;
    }
    console.log('✅ Kiosk administrator (K-001) inserted successfully');
    return 1;
  } catch (err) {
    console.debug('Kiosk admin seed skipped:', err.message);
    return 0;
  }
}

async function applySchemaMigrations() {
  try {
    let totalApplied = 0;
    
    totalApplied += await migrateTableColumns('users', [
      { column: 'phone',         definition: 'VARCHAR(50)' },
      { column: 'province',      definition: 'VARCHAR(100)' },
      { column: 'city',          definition: 'VARCHAR(100)' },
      { column: 'barangayName',  definition: 'VARCHAR(100)' },
      { column: 'streetAddress', definition: 'VARCHAR(255)' },
      { column: 'tier',          definition: "VARCHAR(30) DEFAULT 'Bronze'" },
    ]);

    totalApplied += await migrateTableColumns('barangays', [
      { column: 'contactInfo',     definition: 'VARCHAR(100)', renameFrom: 'contactNumber' },
      { column: 'barangayCaptain', definition: 'VARCHAR(100)' },
      { column: 'userId',          definition: 'INT' },
    ]);

    totalApplied += await migrateTableColumns('administrators', [
      { column: 'roleId',    definition: 'INT' },
      { column: 'status',    definition: "VARCHAR(20) DEFAULT 'active'" },
      { column: 'createdAt', definition: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' },
    ]);

    try {
      await db.query("UPDATE administrators SET email = adminIdentifier WHERE email IS NULL OR email = ''");
    } catch (err) {
      console.debug('Email migration sync skipped:', err.message);
    }

    totalApplied += await ensureTasksView();
    totalApplied += await ensureRewardsSeed();
    totalApplied += await ensureRecyclingTasksSeed();
    totalApplied += await ensureRecyclableMaterialsSeed();
    totalApplied += await ensureRolesSeed();
    totalApplied += await ensureKioskAdminSeed();

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
    const pw = ADMIN_CREDENTIALS?.password ?? 'AdminCabantian2025';
    const [rows] = await db.query(
      "SELECT adminId, passwordHash FROM administrators WHERE adminId = 'A-001' OR adminIdentifier = 'admin@waste2goods.ph' OR email = 'admin@waste2goods.ph' LIMIT 1"
    );
    if (rows && rows.length > 0) {
      const match = await bcrypt.compare(pw, String(rows[0].passwordHash || '')).catch(() => false);
      if (!match) {
        const newHash = await precomputeHash(pw);
        await db.query("UPDATE administrators SET passwordHash = ? WHERE adminId = ?", [newHash, rows[0].adminId]);
        console.log('🔄 Synced password hash for admin user (A-001 Juan Reyes) in administrators table');
      } else {
        console.log('✅ Admin user (A-001 Juan Reyes) already present in administrators table');
      }
      return;
    }
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
    const pw = DEMO_RESIDENT_CREDENTIALS?.password ?? 'ResidentCabantian2025';
    const email = (DEMO_RESIDENT_CREDENTIALS?.email ?? 'resident@cabantian.ph').toLowerCase().trim();
    const [rows] = await db.query(
      "SELECT userId, passwordHash FROM users WHERE email = ? LIMIT 1",
      [email]
    );
    if (rows && rows.length > 0) {
      const match = await bcrypt.compare(pw, String(rows[0].passwordHash || '')).catch(() => false);
      if (!match) {
        const newHash = await precomputeHash(pw);
        await db.query("UPDATE users SET passwordHash = ? WHERE userId = ?", [newHash, rows[0].userId]);
        console.log('🔄 Synced password hash for demo resident (' + email + ') in users table');
      } else {
        console.log('✅ Demo resident (' + email + ') already present in users table');
      }
      return;
    }
    const passwordHash = await precomputeHash(pw);
    const [[maxRow]] = await db.query(
      "SELECT COALESCE(MAX(CAST(SUBSTRING(userId, 3) AS UNSIGNED)), 0) AS maxNum FROM users"
    );
    const nextId = `U-${String(Number(maxRow?.maxNum || 0) + 1).padStart(3, '0')}`;
    await db.query(`
      INSERT INTO users (
        userId, firstName, lastName, email, passwordHash, qr_code, barangayId,
        total_points, pointsBalance, totalSubmissions, createdAt, status,
        phone, province, city, barangayName, streetAddress
      ) VALUES (
        ?,
        'Maria',
        'Santos',
        ?,
        ?,
        ?,
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
    `, [nextId, email, passwordHash, `${nextId}-QRSA1`]);
    console.log(`✅ Demo resident (Maria Santos ${email}) inserted into users table as ${nextId}`);
    console.log('   → Email: ' + email + '  |  Password: ' + pw);
  } catch (err) {
    console.error('Warning inserting demo resident user:', err.message);
  }
}

// Initialize
await init();

export default db;
