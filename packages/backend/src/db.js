import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database file path
const dbPath = join(__dirname, '../database/waste2goods.db');
const schemaPath = join(__dirname, '../database/schema.sql');

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to SQLite database');
        initializeDatabase();
    }
});

// Initialize database with schema
function initializeDatabase() {
    // Read schema file
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute schema
    db.exec(schema, (err) => {
        if (err) {
            console.error('Error initializing database:', err);
        } else {
            console.log('Database initialized successfully');
            insertSampleData();
        }
    });
}

// Insert sample data
function insertSampleData() {
    // Insert sample users
    const users = [
        {
            userId: 'U-001',
            firstName: 'Maria',
            lastName: 'Santos',
            email: 'resident@cabantian.ph',
            passwordHash: 'hashed_user_password_123',
            barangayId: 1,
            pointsBalance: 2840,
            totalSubmissions: 34,
            status: 'active'
        },
        {
            userId: 'U-002',
            firstName: 'Ana',
            lastName: 'Reyes',
            email: 'ana.reyes@example.com',
            passwordHash: 'hashed_user_password_456',
            barangayId: 1,
            pointsBalance: 4820,
            totalSubmissions: 67,
            status: 'active'
        },
        {
            userId: 'U-003',
            firstName: 'Carlo',
            lastName: 'Mendoza',
            email: 'carlo.mendoza@example.com',
            passwordHash: 'hashed_user_password_789',
            barangayId: 1,
            pointsBalance: 3950,
            totalSubmissions: 52,
            status: 'active'
        }
    ];

    const userStmt = db.prepare(`
        INSERT OR IGNORE INTO users 
        (userId, firstName, lastName, email, passwordHash, barangayId, pointsBalance, totalSubmissions, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    users.forEach(user => {
        userStmt.run(
            user.userId,
            user.firstName,
            user.lastName,
            user.email,
            user.passwordHash,
            user.barangayId,
            user.pointsBalance,
            user.totalSubmissions,
            user.status
        );
    });
    userStmt.finalize();

    // Insert sample kiosks
    const kiosks = [
        { kioskId: 'K-01', location: 'Cabantian Hall', status: 'online', battery: 94, lastPing: '2 min ago', temp: '28°C' },
        { kioskId: 'K-02', location: 'Cabantian Elementary School', status: 'online', battery: 78, lastPing: '1 min ago', temp: '27°C' },
        { kioskId: 'K-03', location: 'Cabantian Market', status: 'offline', battery: 0, lastPing: '3 hrs ago', temp: '—' },
        { kioskId: 'K-04', location: 'Cabantian Covered Court', status: 'online', battery: 61, lastPing: 'just now', temp: '30°C' }
    ];

    const kioskStmt = db.prepare(`
        INSERT OR IGNORE INTO kiosks 
        (kioskId, location, status, battery, lastPing, temp)
        VALUES (?, ?, ?, ?, ?, ?)
    `);

    kiosks.forEach(kiosk => {
        kioskStmt.run(
            kiosk.kioskId,
            kiosk.location,
            kiosk.status,
            kiosk.battery,
            kiosk.lastPing,
            kiosk.temp
        );
    });
    kioskStmt.finalize();

    // Insert sample administrator
    const adminStmt = db.prepare(`
        INSERT OR IGNORE INTO administrators 
        (adminId, adminIdentifier, firstName, lastName, passwordHash, barangayId)
        VALUES (?, ?, ?, ?, ?, ?)
    `);
    adminStmt.run(
        'A-001',
        'ADMIN-CABANTIAN-001',
        'Juan',
        'Reyes',
        'hashed_admin_password_123',
        1
    );
    adminStmt.finalize();

    // Insert sample recycling transaction
    const txStmt = db.prepare(`
        INSERT OR IGNORE INTO recycling_transactions 
        (transactionId, userId, materialId, weightKg, pointsEarned, kioskId, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    txStmt.run(
        'RT-001',
        'U-001',
        1,
        2.3,
        115,
        'K-01',
        '2026-06-17T09:15:00Z'
    );
    txStmt.finalize();

    // Insert sample user recycling task
    const userTaskStmt = db.prepare(`
        INSERT OR IGNORE INTO user_recycling_tasks 
        (userId, taskId, progress)
        VALUES (?, ?, ?)
    `);
    userTaskStmt.run('U-001', 1, 70);
    userTaskStmt.finalize();

    // Insert sample reward redemption
    const redemptionStmt = db.prepare(`
        INSERT OR IGNORE INTO reward_redemptions 
        (userId, rewardId, quantityRedeemed, pointsUsed, status, approvedBy, redemptionAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    redemptionStmt.run(
        'U-001',
        3,
        1,
        350,
        'approved',
        'A-001',
        '2026-06-15T14:30:00Z'
    );
    redemptionStmt.finalize();

    console.log('Sample data inserted successfully');
}

export default db;
