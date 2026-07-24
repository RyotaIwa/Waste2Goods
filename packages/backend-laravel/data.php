
<?php
// Constants Data for Waste2Goods Platform

// WASTE TYPES
$WASTE_TYPES = [
    ["name" => "PET Plastic", "value" => 38, "color" => "#16a34a"],
];

// ANALYTICS DATA
$WEEKLY_DATA = [
    ["day" => "Mon", "kg" => 42],
    ["day" => "Tue", "kg" => 67],
    ["day" => "Wed", "kg" => 53],
    ["day" => "Thu", "kg" => 89],
    ["day" => "Fri", "kg" => 74],
    ["day" => "Sat", "kg" => 112],
    ["day" => "Sun", "kg" => 95]
];

$MONTHLY_DATA = [
    ["month" => "Jan", "collected" => 820, "users" => 210, "redeemed" => 65],
    ["month" => "Feb", "collected" => 940, "users" => 245, "redeemed" => 80],
    ["month" => "Mar", "collected" => 1100, "users" => 290, "redeemed" => 102],
    ["month" => "Apr", "collected" => 980, "users" => 275, "redeemed" => 89],
    ["month" => "May", "collected" => 1340, "users" => 340, "redeemed" => 134],
    ["month" => "Jun", "collected" => 1450, "users" => 380, "redeemed" => 158]
];

// LEADERBOARD
$LEADERBOARD = [
    ["rank" => 1, "name" => "Ana Reyes", "barangay" => "Cabantian", "points" => 4820, "avatar" => "AR", "streak" => 14],
    ["rank" => 2, "name" => "Carlo Mendoza", "barangay" => "Cabantian", "points" => 3950, "avatar" => "CM", "streak" => 9],
    ["rank" => 3, "name" => "Maria Santos", "barangay" => "Cabantian", "points" => 2840, "avatar" => "MS", "streak" => 7, "isMe" => true],
    ["rank" => 4, "name" => "Jose Dela Cruz", "barangay" => "Cabantian", "points" => 2310, "avatar" => "JD", "streak" => 5],
    ["rank" => 5, "name" => "Liza Villareal", "barangay" => "Cabantian", "points" => 1990, "avatar" => "LV", "streak" => 3],
    ["rank" => 6, "name" => "Ben Pascual", "barangay" => "Cabantian", "points" => 1640, "avatar" => "BP", "streak" => 2]
];

// REWARDS
$REWARDS = [
    ["id" => 1, "name" => "School Supplies Kit", "points" => 500, "category" => "Education", "stock" => 23, "icon" => "📚", "seasonal" => false],
    ["id" => 2, "name" => "Grocery Voucher ₱100", "points" => 800, "category" => "Grocery", "stock" => 15, "icon" => "🛒", "seasonal" => false],
    ["id" => 3, "name" => "Eco Water Bottle", "points" => 350, "category" => "Lifestyle", "stock" => 41, "icon" => "🍶", "seasonal" => false],
    ["id" => 4, "name" => "Rice (5kg)", "points" => 1200, "category" => "Grocery", "stock" => 8, "icon" => "🌾", "seasonal" => false],
    ["id" => 5, "name" => "Plant Seedling Set", "points" => 250, "category" => "Garden", "stock" => 60, "icon" => "🌱", "seasonal" => true],
    ["id" => 6, "name" => "Reusable Bag Bundle", "points" => 180, "category" => "Lifestyle", "stock" => 88, "icon" => "👜", "seasonal" => false],
    ["id" => 7, "name" => "Back-to-School Bundle", "points" => 650, "category" => "Education", "stock" => 12, "icon" => "🎒", "seasonal" => true],
    ["id" => 8, "name" => "Herbal Tea Set", "points" => 300, "category" => "Wellness", "stock" => 35, "icon" => "🍵", "seasonal" => true]
];

// TASKS
$TASKS = [
    ["id" => 1, "title" => "Submit 2kg of PET bottles", "reward" => 100, "progress" => 1.4, "goal" => 2, "unit" => "kg", "type" => "daily", "done" => false],
    ["id" => 2, "title" => "Visit kiosk 3 days in a row", "reward" => 150, "progress" => 2, "goal" => 3, "unit" => "days", "type" => "weekly", "done" => false],
    ["id" => 3, "title" => "Refer a neighbor", "reward" => 200, "progress" => 1, "goal" => 1, "unit" => "person", "type" => "special", "done" => true],
    ["id" => 4, "title" => "Collect 5kg of cardboard", "reward" => 120, "progress" => 5, "goal" => 5, "unit" => "kg", "type" => "weekly", "done" => true],
    ["id" => 5, "title" => "Submit any 3 material types", "reward" => 80, "progress" => 2, "goal" => 3, "unit" => "types", "type" => "daily", "done" => false]
];

// TRANSACTIONS
$TRANSACTIONS = [
    ["id" => "T-0041", "date" => "Jun 17, 2026", "type" => "earn", "desc" => "PET Plastic · 2.3 kg · K-01", "pts" => 115],
    ["id" => "T-0040", "date" => "Jun 16, 2026", "type" => "earn", "desc" => "Cardboard · 3.1 kg · K-02", "pts" => 93],
    ["id" => "T-0039", "date" => "Jun 15, 2026", "type" => "redeem", "desc" => "Eco Water Bottle", "pts" => -350],
    ["id" => "T-0038", "date" => "Jun 14, 2026", "type" => "earn", "desc" => "Metal Cans · 1.8 kg · K-01", "pts" => 144],
    ["id" => "T-0037", "date" => "Jun 13, 2026", "type" => "bonus", "desc" => "Weekly Challenge Complete", "pts" => 150],
    ["id" => "T-0036", "date" => "Jun 12, 2026", "type" => "earn", "desc" => "Glass Bottles · 2.0 kg · K-04", "pts" => 50]
];

// USERS
$USERS = [
    ["id" => "U-001", "name" => "Maria Santos", "barangay" => "Cabantian", "points" => 2840, "status" => "active", "joined" => "Mar 12, 2025", "submissions" => 34, "redeemed" => 2],
    ["id" => "U-002", "name" => "Ana Reyes", "barangay" => "Cabantian", "points" => 4820, "status" => "active", "joined" => "Jan 5, 2025", "submissions" => 67, "redeemed" => 8],
    ["id" => "U-003", "name" => "Carlo Mendoza", "barangay" => "Cabantian", "points" => 3950, "status" => "active", "joined" => "Feb 18, 2025", "submissions" => 52, "redeemed" => 5],
    ["id" => "U-004", "name" => "Ben Pascual", "barangay" => "Cabantian", "points" => 890, "status" => "inactive", "joined" => "Apr 2, 2025", "submissions" => 11, "redeemed" => 1],
    ["id" => "U-005", "name" => "Rosa Guinto", "barangay" => "Cabantian", "points" => 1540, "status" => "active", "joined" => "Mar 28, 2025", "submissions" => 21, "redeemed" => 3],
    ["id" => "U-006", "name" => "Liza Villareal", "barangay" => "Cabantian", "points" => 1990, "status" => "active", "joined" => "Feb 1, 2025", "submissions" => 28, "redeemed" => 4]
];

// KIOSKS
$KIOSKS = [
    ["id" => "K-01", "location" => "Cabantian Hall", "status" => "online", "weight" => "2.3 kg", "submissions" => 12, "battery" => 94, "lastPing" => "2 min ago", "temp" => "28°C"],
    ["id" => "K-02", "location" => "Cabantian Elementary School", "status" => "online", "weight" => "0.8 kg", "submissions" => 7, "battery" => 78, "lastPing" => "1 min ago", "temp" => "27°C"],
    ["id" => "K-03", "location" => "Cabantian Market", "status" => "offline", "weight" => "—", "submissions" => 0, "battery" => 0, "lastPing" => "3 hrs ago", "temp" => "—"],
    ["id" => "K-04", "location" => "Cabantian Covered Court", "status" => "online", "weight" => "4.1 kg", "submissions" => 19, "battery" => 61, "lastPing" => "just now", "temp" => "30°C"],
    ["id" => "K-05", "location" => "Cabantian Gym", "status" => "maintenance", "weight" => "—", "submissions" => 0, "battery" => 45, "lastPing" => "45 min ago", "temp" => "—"]
];

// POINT RATES
$POINT_RATES = [
    ["type" => "♻️ PET Plastic", "pointsPerKg" => 50, "color" => "bg-green-100 text-green-700"],
];
?>
