-- ==========================================================
-- WASTE2GOODS: Full MySQL/XAMPP Database Schema (v2 UPDATED)
-- ==========================================================
-- This file matches the backend EXACTLY.
-- Use this file for a FRESH import into phpMyAdmin/XAMPP.
-- (DROP the old waste2goods DB first, then re-import this one.)
-- ==========================================================

-- ──────────────────────────────────────────────────────────
-- 1. USERS TABLE (UPDATED: phone + province + city + barangayName)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    userId VARCHAR(50) PRIMARY KEY,
    firstName VARCHAR(100) NOT NULL,
    lastName VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    passwordHash VARCHAR(255) NOT NULL,
    barangayId INT NOT NULL DEFAULT 1,
    pointsBalance INT DEFAULT 0,
    totalSubmissions INT DEFAULT 0,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active',
    phone VARCHAR(50),
    province VARCHAR(100),
    city VARCHAR(100),
    barangayName VARCHAR(100),
    streetAddress VARCHAR(255)
);

-- ──────────────────────────────────────────────────────────
-- 2. ROLES TABLE
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roles (
    roleId INT AUTO_INCREMENT PRIMARY KEY,
    roleName VARCHAR(100) NOT NULL,
    description TEXT
);

-- ──────────────────────────────────────────────────────────
-- 3. BARANGAYS TABLE (UPDATED: fixed column names!)
--    OLD FILE had contactNumber -> backend INSERT uses
--    contactInfo + barangayCaptain + userId  (3 new cols)
-- ──────────────────────────────────────────────────────────-- Barangays Table (UPDATED: fixed column names! contactInfo, barangayCaptain, userId)
CREATE TABLE IF NOT EXISTS barangays (
    barangayId INT AUTO_INCREMENT PRIMARY KEY,
    barangayName VARCHAR(100) NOT NULL,
    street VARCHAR(255),
    province VARCHAR(100),
    city VARCHAR(100),
    contactInfo VARCHAR(100),
    barangayCaptain VARCHAR(100),
    userId INT
);
    barangayCaptain VARCHAR(100),
    userId INT
);

-- ──────────────────────────────────────────────────────────
-- 4. ADMINISTRATORS TABLE (UPDATED: added roleId FK)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS administrators (
    adminId VARCHAR(50) PRIMARY KEY,
    adminIdentifier VARCHAR(100) NOT NULL UNIQUE,
    firstName VARCHAR(100) NOT NULL,
    lastName VARCHAR(100) NOT NULL,
    passwordHash VARCHAR(255) NOT NULL,
    barangayId INT NOT NULL,
    roleId INT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (barangayId) REFERENCES barangays(barangayId),
    FOREIGN KEY (roleId) REFERENCES roles(roleId)
);

-- ──────────────────────────────────────────────────────────
-- 5. KIOSKS TABLE (UPDATED: added barangayId, barcode,
--    lastMaintenance columns used by backend)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kiosks (
    kioskId VARCHAR(50) PRIMARY KEY,
    location VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'offline',
    battery INT DEFAULT 0,
    lastPing VARCHAR(50),
    temp VARCHAR(20),
    barcode VARCHAR(100),
    lastMaintenance DATE,
    barangayId INT,
    FOREIGN KEY (barangayId) REFERENCES barangays(barangayId)
);

-- ──────────────────────────────────────────────────────────
-- 6. RECYCLABLE MATERIALS TABLE (UPDATED: PET-only subset)
--    Added materialType, kgPerUnit, status columns
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recyclable_materials (
    materialId INT AUTO_INCREMENT PRIMARY KEY,
    materialName VARCHAR(100) NOT NULL,
    materialType VARCHAR(100),
    pointsPerKg DECIMAL(10,2) NOT NULL DEFAULT 50.00,
    kgPerUnit DECIMAL(10,2),
    description TEXT,
    status VARCHAR(50) DEFAULT 'active'
);

-- ──────────────────────────────────────────────────────────
-- 7. REWARDS TABLE (UPDATED: isSeasonal instead of seasonal,
--    added status column)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rewards (
    rewardId INT AUTO_INCREMENT PRIMARY KEY,
    rewardName VARCHAR(100) NOT NULL,
    pointsCost INT NOT NULL,
    stockQuantity INT DEFAULT 0,
    description TEXT,
    category VARCHAR(100),
    icon VARCHAR(255),
    isSeasonal BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'active',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ──────────────────────────────────────────────────────────
-- 8. RECYCLING TASKS / CHALLENGES TABLE (UPDATED)
--    Added targetKg, frequency, progress, target, barangayId,
--    materialId columns
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recycling_tasks (
    taskId INT AUTO_INCREMENT PRIMARY KEY,
    taskName VARCHAR(100) NOT NULL,
    description TEXT,
    bonusPoints INT NOT NULL,
    targetKg DECIMAL(10,2),
    startDate DATE,
    endDate DATE,
    progress INT DEFAULT 0,
    target INT DEFAULT 1,
    frequency VARCHAR(50) DEFAULT 'weekly',
    barangayId INT,
    materialId INT,
    status VARCHAR(50) DEFAULT 'active',
    FOREIGN KEY (barangayId) REFERENCES barangays(barangayId),
    FOREIGN KEY (materialId) REFERENCES recyclable_materials(materialId)
);

-- ──────────────────────────────────────────────────────────
-- 9. RECYCLING TRANSACTIONS TABLE
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recycling_transactions (
    transactionId VARCHAR(50) PRIMARY KEY,
    userId VARCHAR(50) NOT NULL,
    materialId INT NOT NULL,
    weightKg DECIMAL(10,2) NOT NULL,
    pointsEarned INT NOT NULL,
    kioskId VARCHAR(50) NOT NULL,
    `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(userId),
    FOREIGN KEY (materialId) REFERENCES recyclable_materials(materialId),
    FOREIGN KEY (kioskId) REFERENCES kiosks(kioskId)
);

-- ──────────────────────────────────────────────────────────
-- 10. REWARD REDEMPTIONS TABLE (UPDATED)
--     redemptionId VARCHAR (matches backend RT-xxxx pattern),
--     added totalPoints, redemptionDate columns
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reward_redemptions (
    redemptionId VARCHAR(50) PRIMARY KEY,
    userId VARCHAR(50) NOT NULL,
    rewardId INT NOT NULL,
    pointsUsed INT NOT NULL,
    quantity INT DEFAULT 1,
    totalPoints INT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    approvedBy VARCHAR(50),
    redemptionDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(userId),
    FOREIGN KEY (rewardId) REFERENCES rewards(rewardId)
);

-- ──────────────────────────────────────────────────────────
-- 11. USER TASK PROGRESS TABLE (NEW! tracks challenge progress)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_task_progress (
    progressId INT AUTO_INCREMENT PRIMARY KEY,
    userId VARCHAR(50) NOT NULL,
    taskId INT NOT NULL,
    progressKg DECIMAL(10,2) DEFAULT 0.00,
    completed BOOLEAN DEFAULT FALSE,
    completedAt TIMESTAMP NULL,
    claimed BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (userId) REFERENCES users(userId),
    FOREIGN KEY (taskId) REFERENCES recycling_tasks(taskId)
);


-- ==========================================================
-- ═══════════════════════════════════════════════════════════
--          SEED / LOOKUP DATA (Fully Updated — v2)
-- ═══════════════════════════════════════════════════════════
-- ==========================================================

-- ═══════════════════════════════════════════════════════════
-- ROLES SEED (4 roles)
-- ═══════════════════════════════════════════════════════════
INSERT INTO roles (roleId, roleName, description) VALUES
(1, 'Super Admin',     'Full system access across all barangays'),
(2, 'Barangay Admin',  'Barangay-level administrator and content manager'),
(3, 'Secretary',       'Barangay secretary with write access to records'),
(4, 'Treasurer',       'Handles rewards, points, and redemption approvals');

-- ═══════════════════════════════════════════════════════════
-- BARANGAYS SEED (1 barangay: Cabantian, Davao City)
-- Column names MATCH the backend seed INSERT!
-- ═══════════════════════════════════════════════════════════
INSERT INTO barangays (barangayId, barangayName, street, province, city, contactInfo, barangayCaptain, userId) VALUES
(1, 'Cabantian',
   'Cabantian Road, Barangay Hall Compound',
   'Davao del Sur',
   'Davao City',
   '(082) 123-4567 / +63 917 123 4567',
   'Hon. Juan S. Dela Cruz',
   1);

-- Reset barangays auto-increment so any future rows start at ID=2
ALTER TABLE barangays AUTO_INCREMENT = 2;

-- ═══════════════════════════════════════════════════════════
-- RECYCLABLE MATERIALS SEED (PET PLASTIC ONLY — 5 items)
-- ═══════════════════════════════════════════════════════════
INSERT INTO recyclable_materials
  (materialId, materialName, materialType, pointsPerKg, kgPerUnit, description, status)
VALUES
(1, 'PET Plastic Bottle (500ml)', 'PET Plastic', 50, 0.009,
   'Clean 500ml clear PET bottle with cap removed', 'active'),
(2, 'PET Plastic Bottle (1L)',     'PET Plastic', 50, 0.018,
   'Clean 1L clear PET beverage bottle', 'active'),
(3, 'PET Plastic Bottle (1.5L)',   'PET Plastic', 50, 0.028,
   'Clean 1.5L clear PET soda/water bottle', 'active'),
(4, 'PET Plastic Container',       'PET Plastic', 50, 0.015,
   'Clean food-grade PET container (tupperware-style)', 'active'),
(5, 'Bulk PET Plastic (by weight)','PET Plastic', 50, 1.000,
   'Any clean PET plastic weighed directly on kiosk scale', 'active');

ALTER TABLE recyclable_materials AUTO_INCREMENT = 6;

-- ═══════════════════════════════════════════════════════════
-- REWARDS SEED (25 rewards — 7 categories incl. Seasonal)
-- ═══════════════════════════════════════════════════════════
INSERT INTO rewards
  (rewardId, rewardName, pointsCost, stockQuantity, description, category, icon, isSeasonal, status)
VALUES
-- 🥤 Eco Essentials
(1,  'Eco Water Bottle',            350, 120, 'Reusable stainless steel 500ml water bottle with Waste2Goods logo', 'Eco Essentials', '🥤', FALSE, 'active'),
(2,  'Bamboo Utensil Set',          280,  95, 'Fork, spoon, chopsticks, straw with canvas pouch',                 'Eco Essentials', '🥢', FALSE, 'active'),
(3,  'Raffia Tote Bag',             220, 150, 'Hand-woven natural raffia shopping bag',                         'Eco Essentials', '👜', FALSE, 'active'),
(4,  'Cotton Tote Bag',             150, 200, 'Heavy-duty canvas grocery bag with print',                      'Eco Essentials', '🛍️', FALSE, 'active'),
-- 📓 School Supplies
(5,  'Notebook (Set of 3)',         180, 180, 'Recycled paper notebooks with Barangay Cabantian design',       'School Supplies', '📓', FALSE, 'active'),
(6,  'Pencil Case Set',             160, 110, 'Eco-friendly pencil case with pencils and eraser',               'School Supplies', '✏️', FALSE, 'active'),
(7,  'Pencil (Pack of 12)',          90, 250, '100% recycled newspaper pencils with seeds',                    'School Supplies', '🖊️', FALSE, 'active'),
-- 🍚 Groceries
(8,  'Rice (2kg)',                  550,  75, 'Premium well-milled rice 2kg pack',                            'Groceries',       '🍚', FALSE, 'active'),
(9,  'Pancit Canton (Pack of 6)',   240, 130, 'Assorted flavor instant pancit canton',                        'Groceries',       '🍜', FALSE, 'active'),
(10, 'Canned Sardines (Pack of 3)', 195, 100, 'Premium sardines in tomato sauce',                              'Groceries',       '🐟', FALSE, 'active'),
(11, 'Coffee (10 sachets)',         180,  90, '3-in-1 coffee mix',                                            'Groceries',       '☕', FALSE, 'active'),
(12, 'Sugar (1kg)',                 150,  60, 'Washed refined sugar 1kg pack',                                'Groceries',       '🧂', FALSE, 'active'),
-- 🧺 Household
(13, 'Laundry Detergent (1kg)',     260,  80, 'Eco-friendly biodegradable detergent powder',                   'Household',       '🧺', FALSE, 'active'),
(14, 'Dishwashing Liquid (500ml)',  210,  70, 'Plant-based concentrated dish soap',                          'Household',       '🧽', FALSE, 'active'),
(15, 'Toilet Soap (Set of 3)',      150, 100, 'Natural herbal bath soap trio',                                'Household',       '🧼', FALSE, 'active'),
(16, 'Toothbrush + Toothpaste',     130, 140, 'Bamboo toothbrush with fluoride toothpaste',                   'Household',       '🪥', FALSE, 'active'),
-- 🧸 Kids
(17, 'Plastic Toy Set',             220,  50, 'Upcycled plastic educational block set (30 pcs)',               'Kids',            '🧸', FALSE, 'active'),
(18, 'Sticker Sheet Pack',           65, 300, 'Recycling-themed eco sticker sheets (5 pcs)',                   'Kids',            '🌟', FALSE, 'active'),
(19, 'Coloring Book',               120, 180, '100% recycled paper eco-hero coloring book',                   'Kids',            '🎨', FALSE, 'active'),
-- 🌱 Community
(20, 'Vegetable Seedlings Kit',     290,  60, 'Pechay, kangkong, tomato seeds + starter pots',                'Community',       '🌱', FALSE, 'active'),
(21, 'Community T-Shirt',           330,  75, 'Limited Waste2Goods barangay shirt (sizes M/L/XL)',           'Community',       '👕', FALSE, 'active'),
-- 🎊 Seasonal
(22, 'Sinulog Gift Pack',           420,  30, 'Seasonal: Sinulog-themed mug + keychain + tote',              'Seasonal',        '🎊', TRUE,  'active'),
(23, 'Kadayawan Durian Treats',     520,  25, 'Seasonal: Local durian candies, yema, pasalubong box',        'Seasonal',        '🎁', TRUE,  'active'),
(24, 'Pasko Ham & Cheese Pack',     750,  40, 'Seasonal Christmas: Premium ham + cheese loaf',                'Seasonal',        '🎄', TRUE,  'active'),
(25, 'Bagsakan Fresh Veggies Box',  450,  50, 'Farm fresh seasonal veggies from Bagsakan (weekly only)',     'Seasonal',        '🥬', TRUE,  'active');

ALTER TABLE rewards AUTO_INCREMENT = 26;

-- ═══════════════════════════════════════════════════════════
-- RECYCLING TASKS / CHALLENGES SEED (5 rows)
-- ═══════════════════════════════════════════════════════════
INSERT INTO recycling_tasks
  (taskId, taskName, description, bonusPoints, targetKg, frequency, progress, target, status)
VALUES
(1, 'Daily Recycling',             'Submit any amount of PET plastic today',                       25,   0.5, 'daily',   0, 1, 'active'),
(2, 'Streak Bonus - 3 Days',       '3 days in a row! Keep it up',                                  100,  1.0, 'daily',   0, 3, 'active'),
(3, '5 kg Weekly Challenge',       'Collect and submit 5 kg total this week',                      300,  5.0, 'weekly',  0, 1, 'active'),
(4, '10 Bottles in a Day',         'Submit 10+ PET bottles in a single day',                      150,  0.2, 'daily',   0, 1, 'active'),
(5, 'Pasko Big Cleanup Drive',     'Barangay-wide Christmas cleanup: 20kg target',                1000, 20.0, 'monthly', 0, 1, 'active');

ALTER TABLE recycling_tasks AUTO_INCREMENT = 6;

-- ═══════════════════════════════════════════════════════════
-- ADMINISTRATOR SEED (1 admin: Juan Reyes, A-001)
-- Match demo credential: admin@waste2goods.ph / AdminCabantian2025
-- ═══════════════════════════════════════════════════════════
INSERT INTO administrators
  (adminId, adminIdentifier, firstName, lastName, passwordHash, barangayId, roleId, createdAt)
VALUES
  ('A-001',
   'admin@waste2goods.ph',
   'Juan',
   'Reyes',
   'hashed_AdminCabantian2025',
   1,
   1,          -- roleId 1 = "Super Admin"
   NOW());

-- ==========================================================
--                     END OF SCHEMA
-- ==========================================================
-- Notes:
--  • This file is ONLY for FRESH databases where the tables
--    DO NOT exist yet. If you already have a database with
--    OLD columns missing, do NOT re-import!
--    → Just restart the backend: db-mysql.js will auto-run
--      ALTER TABLE migrations to fix users + barangays cols
--      AND auto-insert Juan Reyes (A-001) if missing.
--  • Kiosk rows (K-01 to K-05) are auto-inserted by the
--    backend via db-mysql.js on startup.
--  • Administrator A-001 (Juan Reyes) is also auto-inserted
--    by the backend on startup if not present.
-- ==========================================================
