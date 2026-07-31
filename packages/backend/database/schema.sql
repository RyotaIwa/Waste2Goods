-- Waste2Goods Database Schema

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    userId TEXT PRIMARY KEY,
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    passwordHash TEXT NOT NULL,
    barangayId INTEGER NOT NULL,
    pointsBalance INTEGER DEFAULT 0,
    totalSubmissions INTEGER DEFAULT 0,
    tier TEXT DEFAULT 'Bronze',
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'active',
    phone TEXT,
    province TEXT,
    city TEXT,
    barangayName TEXT
);

-- Roles Table
CREATE TABLE IF NOT EXISTS roles (
    roleId INTEGER PRIMARY KEY AUTOINCREMENT,
    roleName TEXT NOT NULL,
    description TEXT
);

-- Barangays Table
CREATE TABLE IF NOT EXISTS barangays (
    barangayId INTEGER PRIMARY KEY AUTOINCREMENT,
    barangayName TEXT NOT NULL,
    street TEXT,
    province TEXT,
    city TEXT,
    contactNumber TEXT
);

-- Administrators Table
CREATE TABLE IF NOT EXISTS administrators (
    adminId TEXT PRIMARY KEY,
    adminIdentifier TEXT UNIQUE NOT NULL,
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    passwordHash TEXT NOT NULL,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    barangayId INTEGER NOT NULL,
    FOREIGN KEY (barangayId) REFERENCES barangays(barangayId)
);

-- Kiosks Table
CREATE TABLE IF NOT EXISTS kiosks (
    kioskId TEXT PRIMARY KEY,
    location TEXT NOT NULL,
    status TEXT DEFAULT 'online',
    battery INTEGER,
    lastPing TEXT,
    temp TEXT
);

-- Recyclable Materials Table
CREATE TABLE IF NOT EXISTS recyclable_materials (
    materialId INTEGER PRIMARY KEY AUTOINCREMENT,
    materialName TEXT NOT NULL,
    pointsPerKg INTEGER NOT NULL,
    description TEXT
);

-- Rewards Table
CREATE TABLE IF NOT EXISTS rewards (
    rewardId INTEGER PRIMARY KEY AUTOINCREMENT,
    rewardName TEXT NOT NULL,
    description TEXT,
    pointsCost INTEGER NOT NULL,
    stockQuantity INTEGER DEFAULT 0,
    category TEXT,
    icon TEXT,
    seasonal BOOLEAN DEFAULT 0,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Recycling Tasks Table
CREATE TABLE IF NOT EXISTS recycling_tasks (
    taskId INTEGER PRIMARY KEY AUTOINCREMENT,
    taskName TEXT NOT NULL,
    description TEXT,
    bonusPoints INTEGER DEFAULT 0,
    startDate TEXT,
    endDate TEXT,
    status TEXT DEFAULT 'active'
);

-- User Recycling Tasks (Many-to-Many)
CREATE TABLE IF NOT EXISTS user_recycling_tasks (
    userTaskId INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT NOT NULL,
    taskId INTEGER NOT NULL,
    progress INTEGER DEFAULT 0,
    completedAt TEXT,
    FOREIGN KEY (userId) REFERENCES users(userId),
    FOREIGN KEY (taskId) REFERENCES recycling_tasks(taskId)
);

-- Recycling Transactions Table
CREATE TABLE IF NOT EXISTS recycling_transactions (
    transactionId TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    materialId INTEGER NOT NULL,
    weightKg REAL NOT NULL,
    pointsEarned INTEGER NOT NULL,
    kioskId TEXT NOT NULL,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(userId),
    FOREIGN KEY (materialId) REFERENCES recyclable_materials(materialId),
    FOREIGN KEY (kioskId) REFERENCES kiosks(kioskId)
);

-- Reward Redemptions Table
CREATE TABLE IF NOT EXISTS reward_redemptions (
    redemptionId INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT NOT NULL,
    rewardId INTEGER NOT NULL,
    quantityRedeemed INTEGER DEFAULT 1,
    pointsUsed INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    approvedBy TEXT,
    redemptionAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(userId),
    FOREIGN KEY (rewardId) REFERENCES rewards(rewardId)
);

-- Insert Initial Data

-- Insert Roles
INSERT INTO roles (roleName, description) VALUES
('Admin', 'System administrator with full access'),
('Resident', 'Barangay resident using the platform'),
('Kiosk', 'IoT kiosk device account');

-- Insert Barangay
INSERT INTO barangays (barangayName, street, province, city, contactNumber) VALUES
('Cabantian', 'Cabantian Street', 'Davao del Sur', 'Davao City', '09123456789');

-- Insert Recyclable Materials
INSERT INTO recyclable_materials (materialName, pointsPerKg, description) VALUES
('PET Plastic', 50, 'Polyethylene terephthalate plastic bottles and containers');

-- Insert Rewards
INSERT INTO rewards (rewardName, description, pointsCost, stockQuantity, category, icon, seasonal) VALUES
('School Supplies Kit', 'Complete school supplies kit', 500, 23, 'Education', '📚', 0),
('Grocery Voucher ₱100', '₱100 grocery voucher', 800, 15, 'Grocery', '🛒', 0),
('Eco Water Bottle', 'Reusable eco-friendly water bottle', 350, 41, 'Lifestyle', '🍶', 0),
('Rice (5kg)', '5kg sack of rice', 1200, 8, 'Grocery', '🌾', 0),
('Plant Seedling Set', 'Set of 5 plant seedlings', 250, 60, 'Garden', '🌱', 1),
('Reusable Bag Bundle', 'Bundle of 3 reusable bags', 180, 88, 'Lifestyle', '👜', 0),
('Back-to-School Bundle', 'Back-to-school supplies bundle', 650, 12, 'Education', '🎒', 1),
('Herbal Tea Set', 'Set of herbal tea packs', 300, 35, 'Wellness', '🍵', 1);

-- Insert Recycling Task
INSERT INTO recycling_tasks (taskName, description, bonusPoints, startDate, endDate, status) VALUES
('Weekly Recycling Challenge', 'Submit at least 5kg of recyclables this week', 150, '2026-06-17T00:00:00Z', '2026-06-24T00:00:00Z', 'active');
