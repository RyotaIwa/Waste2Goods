
// DUMMY AUTH CREDENTIALS (for demo purposes only!)
export const ADMIN_CREDENTIALS = { email: "admin@waste2goods.ph", password: "AdminCabantian2025" };
export const KIOSK_PIN = "7890";
export const DEMO_RESIDENT_CREDENTIALS = { email: "resident@cabantian.ph", password: "ResidentCabantian2025" };

export const DEMO_ADMIN_USER = {
  id: "A-001",
  name: "Juan Reyes",
  email: "admin@waste2goods.ph",
  role: "admin",
  barangay: "Cabantian",
};

export const DEMO_RESIDENT_USER = {
  id: "U-001",
  name: "Maria Santos",
  email: "resident@cabantian.ph",
  role: "resident",
  barangay: "Cabantian",
  points: 2840,
};

export const DEMO_KIOSK_USER = {
  id: "K-01",
  name: "Kiosk 01 - Cabantian Hall",
  email: "kiosk01@waste2goods.ph",
  role: "kiosk",
  barangay: "Cabantian",
};

// NEW SAMPLE DATA FOR ER DIAGRAM MODELS
export const ROLES = [
  { roleId: 1, roleName: "Admin", description: "System administrator with full access" },
  { roleId: 2, roleName: "Resident", description: "Barangay resident using the platform" },
  { roleId: 3, roleName: "Kiosk", description: "IoT kiosk device account" }
];

export const BARANGAYS = [
  { barangayId: 1, barangayName: "Cabantian", street: "Cabantian Street", province: "Davao del Sur", city: "Davao City", contactNumber: "09123456789" }
];

export const ADMINISTRATORS = [
  {
    adminId: "A-001",
    adminIdentifier: "ADMIN-CABANTIAN-001",
    firstName: "Juan",
    lastName: "Reyes",
    passwordHash: "hashed_admin_password_123",
    createdAt: "2025-01-01T00:00:00Z",
    barangayId: 1
  }
];

export const RECYCLABLE_MATERIALS = [
  { materialId: 1, materialName: "PET Plastic", pointsPerKg: 50, description: "Polyethylene terephthalate plastic bottles and containers" }
];

export const RECYCLING_TASKS = [
  {
    taskId: 1,
    taskName: "Weekly Recycling Challenge",
    description: "Submit at least 5kg of recyclables this week",
    bonusPoints: 150,
    startDate: "2026-06-17T00:00:00Z",
    endDate: "2026-06-24T00:00:00Z",
    status: "active"
  }
];

export const USER_RECYCLING_TASKS = [
  { userTaskId: 1, userId: "U-001", taskId: 1, progress: 70, completedAt: undefined }
];

export const RECYCLING_TRANSACTIONS = [
  {
    transactionId: "RT-001",
    userId: "U-001",
    materialId: 1,
    weightKg: 2.3,
    pointsEarned: 115,
    kioskId: "K-01",
    timestamp: "2026-06-17T09:15:00Z"
  }
];

export const REWARD_REDEMPTIONS = [
  {
    redemptionId: 1,
    userId: "U-001",
    rewardId: 3,
    quantityRedeemed: 1,
    pointsUsed: 350,
    status: "approved",
    approvedBy: "A-001",
    redemptionAt: "2026-06-15T14:30:00Z"
  }
];

// WASTE TYPES (keep for compatibility)
export const WASTE_TYPES = [
  { name: "PET Plastic", value: 38, color: "#16a34a" }
];

// ANALYTICS DATA
export const WEEKLY_DATA = [
  { day: "Mon", kg: 42 },
  { day: "Tue", kg: 67 },
  { day: "Wed", kg: 53 },
  { day: "Thu", kg: 89 },
  { day: "Fri", kg: 74 },
  { day: "Sat", kg: 112 },
  { day: "Sun", kg: 95 }
];

export const MONTHLY_DATA = [
  { month: "Jan", collected: 820, users: 210, redeemed: 65 },
  { month: "Feb", collected: 940, users: 245, redeemed: 80 },
  { month: "Mar", collected: 1100, users: 290, redeemed: 102 },
  { month: "Apr", collected: 980, users: 275, redeemed: 89 },
  { month: "May", collected: 1340, users: 340, redeemed: 134 },
  { month: "Jun", collected: 1450, users: 380, redeemed: 158 }
];

// LEADERBOARD
export const LEADERBOARD = [
  { rank: 1, name: "Ana Reyes", barangay: "Cabantian", points: 4820, avatar: "AR", streak: 14 },
  { rank: 2, name: "Carlo Mendoza", barangay: "Cabantian", points: 3950, avatar: "CM", streak: 9 },
  { rank: 3, name: "Maria Santos", barangay: "Cabantian", points: 2840, avatar: "MS", streak: 7, isMe: true },
  { rank: 4, name: "Jose Dela Cruz", barangay: "Cabantian", points: 2310, avatar: "JD", streak: 5 },
  { rank: 5, name: "Liza Villareal", barangay: "Cabantian", points: 1990, avatar: "LV", streak: 3 },
  { rank: 6, name: "Ben Pascual", barangay: "Cabantian", points: 1640, avatar: "BP", streak: 2 }
];

// REWARDS (updated to use new fields + keep original for compatibility)
export const REWARDS = [
  { rewardId: 1, rewardName: "School Supplies Kit", description: "Complete school supplies kit", pointsCost: 500, stockQuantity: 23, createdAt: "2025-01-01T00:00:00Z", category: "Education", icon: "📚", seasonal: false },
  { rewardId: 2, rewardName: "Grocery Voucher ₱100", description: "₱100 grocery voucher", pointsCost: 800, stockQuantity: 15, createdAt: "2025-01-01T00:00:00Z", category: "Grocery", icon: "🛒", seasonal: false },
  { rewardId: 3, rewardName: "Eco Water Bottle", description: "Reusable eco-friendly water bottle", pointsCost: 350, stockQuantity: 41, createdAt: "2025-01-01T00:00:00Z", category: "Lifestyle", icon: "🍶", seasonal: false },
  { rewardId: 4, rewardName: "Rice (5kg)", description: "5kg sack of rice", pointsCost: 1200, stockQuantity: 8, createdAt: "2025-01-01T00:00:00Z", category: "Grocery", icon: "🌾", seasonal: false },
  { rewardId: 5, rewardName: "Plant Seedling Set", description: "Set of 5 plant seedlings", pointsCost: 250, stockQuantity: 60, createdAt: "2025-01-01T00:00:00Z", category: "Garden", icon: "🌱", seasonal: true },
  { rewardId: 6, rewardName: "Reusable Bag Bundle", description: "Bundle of 3 reusable bags", pointsCost: 180, stockQuantity: 88, createdAt: "2025-01-01T00:00:00Z", category: "Lifestyle", icon: "👜", seasonal: false },
  { rewardId: 7, rewardName: "Back-to-School Bundle", description: "Back-to-school supplies bundle", pointsCost: 650, stockQuantity: 12, createdAt: "2025-01-01T00:00:00Z", category: "Education", icon: "🎒", seasonal: true },
  { rewardId: 8, rewardName: "Herbal Tea Set", description: "Set of herbal tea packs", pointsCost: 300, stockQuantity: 35, createdAt: "2025-01-01T00:00:00Z", category: "Wellness", icon: "🍵", seasonal: true }
];

// TASKS (keep original for compatibility)
export const TASKS = [
  { id: 1, title: "Submit 2kg of PET bottles", reward: 100, progress: 1.4, goal: 2, unit: "kg", type: "daily", done: false },
  { id: 2, title: "Visit kiosk 3 days in a row", reward: 150, progress: 2, goal: 3, unit: "days", type: "weekly", done: false },
  { id: 3, title: "Refer a neighbor", reward: 200, progress: 1, goal: 1, unit: "person", type: "special", done: true },
  { id: 4, title: "Collect 5kg of cardboard", reward: 120, progress: 5, goal: 5, unit: "kg", type: "weekly", done: true },
  { id: 5, title: "Submit any 3 material types", reward: 80, progress: 2, goal: 3, unit: "types", type: "daily", done: false }
];

// TRANSACTIONS (keep original for compatibility)
export const TRANSACTIONS = [
  { id: "T-0041", date: "Jun 17, 2026", type: "earn", desc: "PET Plastic · 2.3 kg · K-01", pts: 115 },
  { id: "T-0040", date: "Jun 16, 2026", type: "earn", desc: "Cardboard · 3.1 kg · K-02", pts: 93 },
  { id: "T-0039", date: "Jun 15, 2026", type: "redeem", desc: "Eco Water Bottle", pts: -350 },
  { id: "T-0038", date: "Jun 14, 2026", type: "earn", desc: "Metal Cans · 1.8 kg · K-01", pts: 144 },
  { id: "T-0037", date: "Jun 13, 2026", type: "bonus", desc: "Weekly Challenge Complete", pts: 150 },
  { id: "T-0036", date: "Jun 12, 2026", type: "earn", desc: "Glass Bottles · 2.0 kg · K-04", pts: 50 }
];

// USERS (updated to use new User interface fields + keep original compatibility)
export const USERS = [
  { userId: "U-001", firstName: "Maria", lastName: "Santos", email: "resident@cabantian.ph", passwordHash: "hashed_user_password_123", barangayId: 1, pointsBalance: 2840, totalSubmissions: 34, createdAt: "2025-03-12T00:00:00Z", status: "active", id: "U-001", name: "Maria Santos", barangay: "Cabantian", points: 2840, joined: "Mar 12, 2025", submissions: 34, redeemed: 2 },
  { userId: "U-002", firstName: "Ana", lastName: "Reyes", email: "ana.reyes@example.com", passwordHash: "hashed_user_password_456", barangayId: 1, pointsBalance: 4820, totalSubmissions: 67, createdAt: "2025-01-05T00:00:00Z", status: "active", id: "U-002", name: "Ana Reyes", barangay: "Cabantian", points: 4820, joined: "Jan 5, 2025", submissions: 67, redeemed: 8 },
  { userId: "U-003", firstName: "Carlo", lastName: "Mendoza", email: "carlo.mendoza@example.com", passwordHash: "hashed_user_password_789", barangayId: 1, pointsBalance: 3950, totalSubmissions: 52, createdAt: "2025-02-18T00:00:00Z", status: "active", id: "U-003", name: "Carlo Mendoza", barangay: "Cabantian", points: 3950, joined: "Feb 18, 2025", submissions: 52, redeemed: 5 },
  { userId: "U-004", firstName: "Ben", lastName: "Pascual", email: "ben.pascual@example.com", passwordHash: "hashed_user_password_012", barangayId: 1, pointsBalance: 890, totalSubmissions: 11, createdAt: "2025-04-02T00:00:00Z", status: "inactive", id: "U-004", name: "Ben Pascual", barangay: "Cabantian", points: 890, joined: "Apr 2, 2025", submissions: 11, redeemed: 1 },
  { userId: "U-005", firstName: "Rosa", lastName: "Guinto", email: "rosa.guinto@example.com", passwordHash: "hashed_user_password_345", barangayId: 1, pointsBalance: 1540, totalSubmissions: 21, createdAt: "2025-03-28T00:00:00Z", status: "active", id: "U-005", name: "Rosa Guinto", barangay: "Cabantian", points: 1540, joined: "Mar 28, 2025", submissions: 21, redeemed: 3 },
  { userId: "U-006", firstName: "Liza", lastName: "Villareal", email: "liza.villareal@example.com", passwordHash: "hashed_user_password_678", barangayId: 1, pointsBalance: 1990, totalSubmissions: 28, createdAt: "2025-02-01T00:00:00Z", status: "active", id: "U-006", name: "Liza Villareal", barangay: "Cabantian", points: 1990, joined: "Feb 1, 2025", submissions: 28, redeemed: 4 }
];

// KIOSKS (updated to use kioskId + keep original id)
export const KIOSKS = [
  { kioskId: "K-01", id: "K-01", location: "Cabantian Hall", status: "online", weight: "2.3 kg", submissions: 12, battery: 94, lastPing: "2 min ago", temp: "28°C" },
  { kioskId: "K-02", id: "K-02", location: "Cabantian Elementary School", status: "online", weight: "0.8 kg", submissions: 7, battery: 78, lastPing: "1 min ago", temp: "27°C" },
  { kioskId: "K-03", id: "K-03", location: "Cabantian Market", status: "offline", weight: "—", submissions: 0, battery: 0, lastPing: "3 hrs ago", temp: "—" },
  { kioskId: "K-04", id: "K-04", location: "Cabantian Covered Court", status: "online", weight: "4.1 kg", submissions: 19, battery: 61, lastPing: "just now", temp: "30°C" },
  { kioskId: "K-05", id: "K-05", location: "Cabantian Gym", status: "maintenance", weight: "—", submissions: 0, battery: 45, lastPing: "45 min ago", temp: "—" }
];

// POINT RATES (keep for compatibility)
export const POINT_RATES = [
  { type: "♻️ PET Plastic", pointsPerKg: 50, color: "bg-green-100 text-green-700" }
];

