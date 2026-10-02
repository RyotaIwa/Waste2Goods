-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 02, 2026 at 06:56 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `waste2goods`
--

-- --------------------------------------------------------

--
-- Table structure for table `administrators`
--

CREATE TABLE `administrators` (
  `adminId` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `adminIdentifier` varchar(100) NOT NULL,
  `firstName` varchar(100) NOT NULL,
  `lastName` varchar(100) NOT NULL,
  `passwordHash` varchar(255) NOT NULL,
  `barangayId` int(11) NOT NULL,
  `roleId` int(11) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` varchar(20) DEFAULT 'active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `administrators`
--

INSERT INTO `administrators` (`adminId`, `email`, `adminIdentifier`, `firstName`, `lastName`, `passwordHash`, `barangayId`, `roleId`, `createdAt`, `status`) VALUES
('A-001', 'admin@waste2goods.ph', 'admin@waste2goods.ph', 'Juan', 'Reyes', '$2b$10$qnruxAhxIyuYN.m3AG6w7OmgqaayY3OIanhtQ2ZYVTcJ4LKWOufYy', 1, 1, '2026-07-26 19:00:00', 'active'),
('A-002', 'jose@waste2goods.ph', 'jose@waste2goods.ph', 'Jose', 'Manaloto', 'hashed_AdminCabantian2025', 1, 2, '2026-07-26 20:02:18', 'active'),
('A-003', 'jakecy@gmail.com', 'jakecy@gmail.com', 'jake', 'cyrus', 'hashed_123456', 1, 1, '2026-07-27 19:42:31', 'active'),
('A-004', 'pedro@gmail.com', 'pedro@gmail.com', 'pedro', 'siga', 'hashed_123456', 1, 1, '2026-07-27 19:47:07', 'active'),
('K-001', 'kiosk@waste2goods.ph', 'kiosk@waste2goods.ph', 'Kiosk', 'Terminal', '$2b$10$mkHi8L5Nd3Qp2HwqDkDJWOuv4iTtq84KXISwpDOcWxJkyShgzaqBS', 1, 5, '2026-09-15 02:30:24', 'active');

-- --------------------------------------------------------

--
-- Table structure for table `barangays`
--

CREATE TABLE `barangays` (
  `barangayId` int(11) NOT NULL,
  `barangayName` varchar(100) NOT NULL,
  `contact_number` varchar(100) DEFAULT NULL,
  `street` varchar(255) DEFAULT NULL,
  `province` varchar(100) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `contactInfo` varchar(100) DEFAULT NULL,
  `barangayCaptain` varchar(100) DEFAULT NULL,
  `userId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `barangays`
--

INSERT INTO `barangays` (`barangayId`, `barangayName`, `contact_number`, `street`, `province`, `city`, `contactInfo`, `barangayCaptain`, `userId`) VALUES
(1, 'Cabantian', '(082) 123-4567 / +63 917 123 4567', 'Cabantian Road, Barangay Hall Compound', 'Davao del Sur', 'Davao City', '(082) 123-4567 / +63 917 123 4567', 'Hon. Juan S. Dela Cruz', 1);

-- --------------------------------------------------------

--
-- Table structure for table `kiosks`
--

CREATE TABLE `kiosks` (
  `kioskId` varchar(50) NOT NULL,
  `location` varchar(255) NOT NULL,
  `status` varchar(50) DEFAULT 'offline',
  `battery` int(11) DEFAULT 0,
  `lastPing` varchar(50) DEFAULT NULL,
  `temp` varchar(20) DEFAULT NULL,
  `barcode` varchar(100) DEFAULT NULL,
  `lastMaintenance` date DEFAULT NULL,
  `barangayId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `kiosks`
--

INSERT INTO `kiosks` (`kioskId`, `location`, `status`, `battery`, `lastPing`, `temp`, `barcode`, `lastMaintenance`, `barangayId`) VALUES
('K-01', 'Cabantian Hall', 'online', 94, '2 min ago', '28°C', NULL, NULL, NULL),
('K-02', 'Cabantian Elementary School', 'online', 78, '1 min ago', '27°C', NULL, NULL, NULL),
('K-03', 'Cabantian Market', 'offline', 0, '3 hrs ago', '—', NULL, NULL, NULL),
('K-04', 'Cabantian Covered Court', 'online', 61, 'just now', '30°C', NULL, NULL, NULL),
('K-05', 'Cabantian Gym', 'maintenance', 45, '45 min ago', '—', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `recyclable_materials`
--

CREATE TABLE `recyclable_materials` (
  `materialId` int(11) NOT NULL,
  `materialName` varchar(100) NOT NULL,
  `materialType` varchar(100) DEFAULT NULL,
  `pointsPerKg` decimal(10,2) NOT NULL DEFAULT 50.00,
  `kgPerUnit` decimal(10,2) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `status` varchar(50) DEFAULT 'active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `recyclable_materials`
--

INSERT INTO `recyclable_materials` (`materialId`, `materialName`, `materialType`, `pointsPerKg`, `kgPerUnit`, `description`, `status`) VALUES
(1, 'PET Plastic Bottle (500ml)', 'PET Plastic', 50.00, 0.01, 'Clean 500ml clear PET bottle with cap removed', 'active'),
(2, 'PET Plastic Bottle (1L)', 'PET Plastic', 50.00, 0.02, 'Clean 1L clear PET beverage bottle', 'active'),
(3, 'PET Plastic Bottle (1.5L)', 'PET Plastic', 50.00, 0.03, 'Clean 1.5L clear PET soda/water bottle', 'active'),
(4, 'PET Plastic Container', 'PET Plastic', 50.00, 0.02, 'Clean food-grade PET container (tupperware-style)', 'active'),
(5, 'Bulk PET Plastic (by weight)', 'PET Plastic', 50.00, 1.00, 'Any clean PET plastic weighed directly on kiosk scale', 'active');

-- --------------------------------------------------------

--
-- Table structure for table `recycling_tasks`
--

CREATE TABLE `recycling_tasks` (
  `taskId` int(11) NOT NULL,
  `taskName` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `bonus_points` int(11) NOT NULL,
  `bonusPoints` int(11) NOT NULL,
  `targetKg` decimal(10,2) DEFAULT NULL,
  `startDate` date DEFAULT NULL,
  `endDate` date DEFAULT NULL,
  `progress` int(11) DEFAULT 0,
  `target` int(11) DEFAULT 1,
  `frequency` varchar(50) DEFAULT 'weekly',
  `barangayId` int(11) DEFAULT NULL,
  `materialId` int(11) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `recycling_tasks`
--

INSERT INTO `recycling_tasks` (`taskId`, `taskName`, `description`, `bonus_points`, `bonusPoints`, `targetKg`, `startDate`, `endDate`, `progress`, `target`, `frequency`, `barangayId`, `materialId`, `status`) VALUES
(1, 'Daily Recycling', 'Submit any amount of PET plastic today', 0, 25, 0.50, NULL, NULL, 0, 1, 'daily', NULL, NULL, 'active'),
(2, 'Streak Bonus - 3 Days', '3 days in a row! Keep it up', 0, 100, 1.00, NULL, NULL, 0, 3, 'daily', NULL, NULL, 'active'),
(3, '5 kg Weekly Challenge', 'Collect and submit 5 kg total this week', 0, 300, 5.00, NULL, NULL, 0, 1, 'weekly', NULL, NULL, 'active'),
(4, '10 Bottles in a Day', 'Submit 10+ PET bottles in a single day', 0, 150, 0.20, NULL, NULL, 0, 1, 'daily', NULL, NULL, 'active'),
(5, 'Pasko Big Cleanup Drive', 'Barangay-wide Christmas cleanup: 20kg target', 0, 1000, 20.00, NULL, NULL, 0, 1, 'monthly', NULL, NULL, 'active');

-- --------------------------------------------------------

--
-- Table structure for table `recycling_transactions`
--

CREATE TABLE `recycling_transactions` (
  `transactionId` varchar(50) NOT NULL,
  `userId` varchar(50) NOT NULL,
  `materialId` int(11) NOT NULL,
  `weightKg` decimal(10,2) NOT NULL,
  `pointsEarned` int(11) NOT NULL,
  `kioskId` varchar(50) NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `rewards`
--

CREATE TABLE `rewards` (
  `rewardId` int(11) NOT NULL,
  `rewardName` varchar(100) NOT NULL,
  `points_required` int(11) NOT NULL,
  `pointsCost` int(11) NOT NULL,
  `stock_quantity` int(11) DEFAULT 0,
  `stockQuantity` int(11) DEFAULT 0,
  `image_url` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `icon` varchar(255) DEFAULT NULL,
  `isSeasonal` tinyint(1) DEFAULT 0,
  `status` varchar(50) DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `rewards`
--

INSERT INTO `rewards` (`rewardId`, `rewardName`, `points_required`, `pointsCost`, `stock_quantity`, `stockQuantity`, `image_url`, `description`, `category`, `icon`, `isSeasonal`, `status`, `created_at`, `createdAt`) VALUES
(1, 'Eco Water Bottle', 350, 350, 120, 120, NULL, 'Reusable stainless steel 500ml water bottle with Waste2Goods logo', 'Eco Essentials', '🥤', 0, 'active', '2026-07-26 19:13:21', '2026-07-26 19:13:21'),
(2, 'Bamboo Utensil Set', 280, 280, 95, 95, NULL, 'Fork, spoon, chopsticks, straw with canvas pouch', 'Eco Essentials', '🥢', 0, 'active', '2026-07-26 19:13:21', '2026-07-26 19:13:21'),
(3, 'Raffia Tote Bag', 220, 220, 150, 150, NULL, 'Hand-woven natural raffia shopping bag', 'Eco Essentials', '👜', 0, 'active', '2026-07-26 19:13:21', '2026-07-26 19:13:21'),
(4, 'Cotton Tote Bag', 150, 150, 200, 200, NULL, 'Heavy-duty canvas grocery bag with print', 'Eco Essentials', '🛍️', 0, 'active', '2026-07-26 19:13:21', '2026-07-26 19:13:21'),
(5, 'Notebook (Set of 3)', 180, 180, 180, 180, NULL, 'Recycled paper notebooks with Barangay Cabantian design', 'School Supplies', '📓', 0, 'active', '2026-07-26 19:13:21', '2026-07-26 19:13:21'),
(6, 'Pencil Case Set', 160, 160, 110, 110, NULL, 'Eco-friendly pencil case with pencils and eraser', 'School Supplies', '✏️', 0, 'active', '2026-07-26 19:13:21', '2026-07-26 19:13:21'),
(7, 'Pencil (Pack of 12)', 90, 90, 250, 250, NULL, '100% recycled newspaper pencils with seeds', 'School Supplies', '🖊️', 0, 'active', '2026-07-26 19:13:21', '2026-07-26 19:13:21'),
(8, 'Rice (2kg)', 550, 550, 75, 75, NULL, 'Premium well-milled rice 2kg pack', 'Groceries', '🍚', 0, 'active', '2026-07-26 19:13:21', '2026-07-26 19:13:21'),
(9, 'Pancit Canton (Pack of 6)', 240, 240, 130, 130, NULL, 'Assorted flavor instant pancit canton', 'Groceries', '🍜', 0, 'active', '2026-07-26 19:13:21', '2026-07-26 19:13:21'),
(10, 'Canned Sardines (Pack of 3)', 195, 195, 100, 100, NULL, 'Premium sardines in tomato sauce', 'Groceries', '🐟', 0, 'active', '2026-07-26 19:13:21', '2026-07-26 19:13:21'),
(11, 'Coffee (10 sachets)', 180, 180, 90, 90, NULL, '3-in-1 coffee mix', 'Groceries', '☕', 0, 'active', '2026-07-26 19:13:21', '2026-07-26 19:13:21'),
(12, 'Sugar (1kg)', 150, 150, 60, 60, NULL, 'Washed refined sugar 1kg pack', 'Groceries', '🧂', 0, 'active', '2026-07-26 19:13:21', '2026-07-26 19:13:21'),
(13, 'Laundry Detergent (1kg)', 260, 260, 80, 80, NULL, 'Eco-friendly biodegradable detergent powder', 'Household', '🧺', 0, 'active', '2026-07-26 19:13:21', '2026-07-26 19:13:21'),
(14, 'Dishwashing Liquid (500ml)', 210, 210, 70, 70, NULL, 'Plant-based concentrated dish soap', 'Household', '🧽', 0, 'active', '2026-07-26 19:13:21', '2026-07-26 19:13:21'),
(15, 'Toilet Soap (Set of 3)', 150, 150, 100, 100, NULL, 'Natural herbal bath soap trio', 'Household', '🧼', 0, 'active', '2026-07-26 19:13:21', '2026-07-26 19:13:21'),
(16, 'Toothbrush + Toothpaste', 130, 130, 140, 140, NULL, 'Bamboo toothbrush with fluoride toothpaste', 'Household', '🪥', 0, 'active', '2026-07-26 19:13:21', '2026-07-26 19:13:21'),
(17, 'Plastic Toy Set', 220, 220, 50, 50, NULL, 'Upcycled plastic educational block set (30 pcs)', 'Kids', '🧸', 0, 'active', '2026-07-26 19:13:21', '2026-07-26 19:13:21'),
(18, 'Sticker Sheet Pack', 65, 65, 300, 300, NULL, 'Recycling-themed eco sticker sheets (5 pcs)', 'Kids', '🌟', 0, 'active', '2026-07-26 19:13:21', '2026-07-26 19:13:21'),
(19, 'Coloring Book', 120, 120, 180, 180, NULL, '100% recycled paper eco-hero coloring book', 'Kids', '🎨', 0, 'active', '2026-07-26 19:13:21', '2026-07-26 19:13:21'),
(20, 'Vegetable Seedlings Kit', 290, 290, 60, 60, NULL, 'Pechay, kangkong, tomato seeds + starter pots', 'Community', '🌱', 0, 'active', '2026-07-26 19:13:21', '2026-07-26 19:13:21'),
(21, 'Community T-Shirt', 330, 330, 75, 75, NULL, 'Limited Waste2Goods barangay shirt (sizes M/L/XL)', 'Community', '👕', 0, 'active', '2026-07-26 19:13:21', '2026-07-26 19:13:21'),
(22, 'Sinulog Gift Pack', 420, 420, 30, 30, NULL, 'Seasonal: Sinulog-themed mug + keychain + tote', 'Seasonal', '🎊', 1, 'active', '2026-07-26 19:13:21', '2026-07-26 19:13:21'),
(23, 'Kadayawan Durian Treats', 520, 520, 25, 25, NULL, 'Seasonal: Local durian candies, yema, pasalubong box', 'Seasonal', '🎁', 1, 'active', '2026-07-26 19:13:21', '2026-07-26 19:13:21'),
(24, 'Pasko Ham & Cheese Pack', 750, 750, 40, 40, NULL, 'Seasonal Christmas: Premium ham + cheese loaf', 'Seasonal', '🎄', 1, 'active', '2026-07-26 19:13:21', '2026-07-26 19:13:21'),
(25, 'Bagsakan Fresh Veggies Box', 450, 450, 50, 50, NULL, 'Farm fresh seasonal veggies from Bagsakan (weekly only)', 'Seasonal', '🥬', 1, 'active', '2026-07-26 19:13:21', '2026-07-26 19:13:21');

-- --------------------------------------------------------

--
-- Table structure for table `reward_redemptions`
--

CREATE TABLE `reward_redemptions` (
  `redemptionId` varchar(50) NOT NULL,
  `userId` varchar(50) NOT NULL,
  `rewardId` int(11) NOT NULL,
  `pointsUsed` int(11) NOT NULL,
  `quantity` int(11) DEFAULT 1,
  `totalPoints` int(11) NOT NULL,
  `status` varchar(50) DEFAULT 'pending',
  `approvedBy` varchar(50) DEFAULT NULL,
  `redemptionDate` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `roleId` int(11) NOT NULL,
  `roleName` varchar(100) NOT NULL,
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`roleId`, `roleName`, `description`) VALUES
(1, 'Super Admin', 'Full system access across all barangays'),
(2, 'Barangay Admin', 'Barangay-level administrator and content manager'),
(3, 'Secretary', 'Barangay secretary with write access to records'),
(4, 'Treasurer', 'Handles rewards, points, and redemption approvals'),
(5, 'KIOSK', 'Kiosk terminal on-site role'),
(6, 'ANON', 'Unauthenticated public browser role');

-- --------------------------------------------------------

--
-- Stand-in structure for view `tasks`
-- (See below for the actual view)
--
CREATE TABLE `tasks` (
`taskId` int(11)
,`taskName` varchar(100)
,`description` text
,`bonus_points` int(11)
,`bonusPoints` int(11)
,`targetKg` decimal(10,2)
,`startDate` date
,`endDate` date
,`progress` int(11)
,`target` int(11)
,`frequency` varchar(50)
,`barangayId` int(11)
,`materialId` int(11)
,`status` varchar(50)
);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `userId` varchar(50) NOT NULL,
  `firstName` varchar(100) NOT NULL,
  `lastName` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `passwordHash` varchar(255) NOT NULL,
  `qr_code` varchar(255) NOT NULL,
  `barangayId` int(11) NOT NULL DEFAULT 1,
  `total_points` int(11) DEFAULT 0,
  `pointsBalance` int(11) DEFAULT 0,
  `totalSubmissions` int(11) DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` varchar(50) DEFAULT 'active',
  `phone` varchar(50) DEFAULT NULL,
  `province` varchar(100) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `barangayName` varchar(100) DEFAULT NULL,
  `streetAddress` varchar(255) DEFAULT NULL,
  `tier` varchar(30) DEFAULT 'Bronze'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`userId`, `firstName`, `lastName`, `email`, `passwordHash`, `qr_code`, `barangayId`, `total_points`, `pointsBalance`, `totalSubmissions`, `createdAt`, `status`, `phone`, `province`, `city`, `barangayName`, `streetAddress`, `tier`) VALUES
('U-001', 'jq', 'lag', 'jq@gmail.com', '$2b$10$8RDf4L0Uqxj1ViNCEESrTuO4Zz2YB.G4/IC/8BrJFIWguBuAi5nQ2', 'U-001-8xJKz', 1, 50, 1050, 0, '2026-07-26 19:14:40', 'active', '09943211341', 'Davao del Sur', 'Davao City', 'Cabantian', NULL, 'Bronze'),
('U-002', 'dm', 'cb', 'dmcb@gmail.com', 'hashed_123333', 'U-002-7cTba', 1, 50, 50, 0, '2026-07-26 19:17:43', 'active', '092222222', 'Davao del Sur', 'Davao City', 'Cabantian', NULL, 'Bronze'),
('U-003', 'kuya', 'hapon', 'hapon@gmail.com', 'hashed_123456', 'U-003-9pMne', 1, 50, 50, 0, '2026-07-26 20:04:17', 'active', '0909090909', 'Davao del Sur', 'Davao City', 'Cabantian', NULL, 'Bronze'),
('U-004', 'komi', 'sama', 'komisama@gmail.com', 'hashed_111111', 'U-004-2sWpr', 1, 50, 50, 0, '2026-07-27 16:41:52', 'active', '0912345678', 'Davao del Sur', 'Davao City', 'Cabantian', 'rizal street', 'Bronze'),
('U-005', 'tide', 'hunter', 'tide@gmail.com', 'hashed_123456', '', 1, 0, 50, 0, '2026-07-27 19:49:20', 'active', '0909090909', 'Davao del Sur', 'Davao City', 'Cabantian', 'street', 'Bronze'),
('U-007', 'Daniella', 'Marie C. Bello', 'dvo.dmcb.smiling@gmail.com', 'hashed_esmiringhoy23', 'U-007-40okq', 1, 50, 50, 0, '2026-07-31 02:59:18', 'active', '09364575307', 'Davao del Sur', 'Davao City', 'Cabantian', 'Country homes village ', 'Bronze'),
('U-008', 'Ryota', 'J. Iwamoto', 'ryota.iwamoto@jmc.edu.ph', 'hashed_rsyiwamoto', 'U-008-gbl34', 1, 50, 50, 0, '2026-07-31 03:02:56', 'active', '9762656880', 'Davao del Sur', 'Davao City', 'Cabantian', '', 'Bronze'),
('U-009', 'Sheandrew', 'Otomawi', 'ryota.ajinomoto@jmc.edu.ph', 'hashed_rsyiwamoto', 'U-009-y9vxt', 1, 50, 50, 0, '2026-08-07 09:35:24', 'active', '9762656880', 'Davao del Sur', 'Davao City', 'Buhangin', '', 'Bronze'),
('U-010', 'Maria', 'Santos', 'resident@cabantian.ph', '$2b$10$lYb.yHVwNP8YO/5FhHYpEeEo/UT/PqZUQhWOyXlW1XavvQfnRZHk2', 'U-010-QRSA1', 1, 50, 50, 0, '2026-09-15 02:58:53', 'active', '+63 917 123 4567', 'Davao del Sur', 'Davao City', 'Cabantian', 'Cabantian Road', 'Bronze'),
('U-011', 'Lagrama', 'Koikois', 'lagramakoikois@gmail.com', '$2b$10$rkSUoolnz1EXChfRBmWcvu.i/.CyMDJpaTdn0xTwrt0OkSPIfxP3y', 'U-011-wt3ij', 1, 50, 50, 0, '2026-09-15 04:42:07', 'active', '', 'Davao del Sur', 'Davao City', 'Cabantian', '', 'Bronze'),
('U-012', 'Alice', 'Google', 'alice.google@gmail.com', '$2b$10$cmaLzvJPazsMNa8dCBM7Xud26yA7K0q5ePWQX5YyX12p9doZH73kq', 'U-012-hol0j', 1, 50, 50, 0, '2026-09-15 04:46:08', 'active', '', 'Davao del Sur', 'Davao City', 'Cabantian', '', 'Bronze'),
('U-013', 'jaya', 'Lastname', 'harubochi004@gmail.com', '$2b$10$EP7b2ZwPJXcwmRhYsTJkleQ7oNyZH267g8GXkTs3YtXAwv8Fc7Rny', 'U-013-qe1yb', 1, 50, 50, 0, '2026-09-15 04:52:36', 'active', '09943211341', 'Davao de Oro', 'Compostela', 'Poblacion', 'block 15', 'Bronze'),
('U-014', 'eren', 'yeager', 'harubochi2@gmail.com', '$2b$10$FZemVO1/ZkI9p7H9pADT3eSFBvaLghoTaJ92ElszfmNq2dGo782Lq', 'U-014-d8osb', 1, 50, 50, 0, '2026-09-15 05:10:30', 'active', '0909090909', 'Davao del Sur', 'Davao City', 'Cabantian', '', 'Bronze'),
('U-015', 'lily', 'cruz', 'lily@gmail.com', '$2b$10$u5KaxXMxoT3t3cUtYyNfQ.Q.hnH3xozfBER3XuTHQAwa2ChPfOLI2', 'U-015-9u3o1', 1, 50, 50, 0, '2026-09-15 06:36:22', 'active', '09945678901', 'Davao de Oro', 'Compostela', 'Moncado', 'block 16', 'Bronze'),
('U-016', 'daniella', 'bello', 'daniella.bello@jmc.edu.ph', '$2b$10$st0rOc3reXBdAn2XFDsjTu9AzG5BFLRfVaUcx1XOU1z3xi./Cy03e', 'U-016-nut7s', 1, 50, 50, 0, '2026-09-15 06:43:24', 'active', '', 'Davao del Sur', 'Davao City', 'Cabantian', '', 'Bronze'),
('U-017', 'Juan', 'Dela Cruz', 'juan.test.1789454802690@cabantian.ph', '$2b$10$BrQowJcTVMQnRVrGHLUzpeA56zuhGGqe19ATAtgoZ2qQIoGowZHb.', 'U-017-9imok', 1, 50, 50, 0, '2026-09-15 06:46:43', 'active', '09123456789', 'Davao del Sur', 'Davao City', 'Cabantian', 'Purok 5', 'Bronze'),
('U-018', 'juan', 'tamad', 'juan@gmail.com', '$2b$10$gtASU7gEP.yK18S0ugXrNuWAN6DOp1XaHzik9ZuWhg48T8N/2mzLC', 'U-018-xcje9', 1, 50, 50, 0, '2026-09-15 06:54:17', 'active', '09943211341', 'Davao del Sur', 'Davao City', 'Tugbok', 'block 16', 'Bronze'),
('U-019', 'Jayquio', 'Lagrama', 'jayquio.lagrama@jmc.edu.ph', '$2b$10$9qC0Yee1HuL8i8oR7EMOc.zETdQmCMdp3fUd/3zS0wU8LtMmA5f.K', 'U-019-u3qqg', 1, 50, 50, 0, '2026-09-17 16:42:34', 'active', '', 'Davao del Sur', 'Davao City', 'Cabantian', '', 'Bronze'),
('U-020', 'haru', 'bochi1', 'harubochi1@gmail.com', '$2b$10$QLeSqdmmb1f6MCumL5ltveH0eN4wKrXs0Lvo0qX7hJrb8HX6sUTvu', 'U-020-kj3yp', 1, 50, 50, 0, '2026-09-27 18:22:20', 'active', '', 'Davao del Sur', 'Davao City', 'Cabantian', '', 'Bronze');

-- --------------------------------------------------------

--
-- Table structure for table `user_task_progress`
--

CREATE TABLE `user_task_progress` (
  `progressId` int(11) NOT NULL,
  `userId` varchar(50) NOT NULL,
  `taskId` int(11) NOT NULL,
  `progressKg` decimal(10,2) DEFAULT 0.00,
  `completed` tinyint(1) DEFAULT 0,
  `completedAt` timestamp NULL DEFAULT NULL,
  `claimed` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure for view `tasks`
--
DROP TABLE IF EXISTS `tasks`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `tasks`  AS SELECT `recycling_tasks`.`taskId` AS `taskId`, `recycling_tasks`.`taskName` AS `taskName`, `recycling_tasks`.`description` AS `description`, `recycling_tasks`.`bonus_points` AS `bonus_points`, `recycling_tasks`.`bonusPoints` AS `bonusPoints`, `recycling_tasks`.`targetKg` AS `targetKg`, `recycling_tasks`.`startDate` AS `startDate`, `recycling_tasks`.`endDate` AS `endDate`, `recycling_tasks`.`progress` AS `progress`, `recycling_tasks`.`target` AS `target`, `recycling_tasks`.`frequency` AS `frequency`, `recycling_tasks`.`barangayId` AS `barangayId`, `recycling_tasks`.`materialId` AS `materialId`, `recycling_tasks`.`status` AS `status` FROM `recycling_tasks` ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `administrators`
--
ALTER TABLE `administrators`
  ADD PRIMARY KEY (`adminId`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `adminIdentifier` (`adminIdentifier`),
  ADD KEY `barangayId` (`barangayId`),
  ADD KEY `roleId` (`roleId`);

--
-- Indexes for table `barangays`
--
ALTER TABLE `barangays`
  ADD PRIMARY KEY (`barangayId`);

--
-- Indexes for table `kiosks`
--
ALTER TABLE `kiosks`
  ADD PRIMARY KEY (`kioskId`),
  ADD KEY `barangayId` (`barangayId`);

--
-- Indexes for table `recyclable_materials`
--
ALTER TABLE `recyclable_materials`
  ADD PRIMARY KEY (`materialId`);

--
-- Indexes for table `recycling_tasks`
--
ALTER TABLE `recycling_tasks`
  ADD PRIMARY KEY (`taskId`),
  ADD KEY `barangayId` (`barangayId`),
  ADD KEY `materialId` (`materialId`);

--
-- Indexes for table `recycling_transactions`
--
ALTER TABLE `recycling_transactions`
  ADD PRIMARY KEY (`transactionId`),
  ADD KEY `userId` (`userId`),
  ADD KEY `materialId` (`materialId`),
  ADD KEY `kioskId` (`kioskId`);

--
-- Indexes for table `rewards`
--
ALTER TABLE `rewards`
  ADD PRIMARY KEY (`rewardId`);

--
-- Indexes for table `reward_redemptions`
--
ALTER TABLE `reward_redemptions`
  ADD PRIMARY KEY (`redemptionId`),
  ADD KEY `userId` (`userId`),
  ADD KEY `rewardId` (`rewardId`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`roleId`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`userId`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `qr_code` (`qr_code`);

--
-- Indexes for table `user_task_progress`
--
ALTER TABLE `user_task_progress`
  ADD PRIMARY KEY (`progressId`),
  ADD KEY `userId` (`userId`),
  ADD KEY `taskId` (`taskId`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `barangays`
--
ALTER TABLE `barangays`
  MODIFY `barangayId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `recyclable_materials`
--
ALTER TABLE `recyclable_materials`
  MODIFY `materialId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `recycling_tasks`
--
ALTER TABLE `recycling_tasks`
  MODIFY `taskId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `rewards`
--
ALTER TABLE `rewards`
  MODIFY `rewardId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `roleId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `user_task_progress`
--
ALTER TABLE `user_task_progress`
  MODIFY `progressId` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `administrators`
--
ALTER TABLE `administrators`
  ADD CONSTRAINT `administrators_ibfk_1` FOREIGN KEY (`barangayId`) REFERENCES `barangays` (`barangayId`),
  ADD CONSTRAINT `administrators_ibfk_2` FOREIGN KEY (`roleId`) REFERENCES `roles` (`roleId`);

--
-- Constraints for table `kiosks`
--
ALTER TABLE `kiosks`
  ADD CONSTRAINT `kiosks_ibfk_1` FOREIGN KEY (`barangayId`) REFERENCES `barangays` (`barangayId`);

--
-- Constraints for table `recycling_tasks`
--
ALTER TABLE `recycling_tasks`
  ADD CONSTRAINT `recycling_tasks_ibfk_1` FOREIGN KEY (`barangayId`) REFERENCES `barangays` (`barangayId`),
  ADD CONSTRAINT `recycling_tasks_ibfk_2` FOREIGN KEY (`materialId`) REFERENCES `recyclable_materials` (`materialId`);

--
-- Constraints for table `recycling_transactions`
--
ALTER TABLE `recycling_transactions`
  ADD CONSTRAINT `recycling_transactions_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`),
  ADD CONSTRAINT `recycling_transactions_ibfk_2` FOREIGN KEY (`materialId`) REFERENCES `recyclable_materials` (`materialId`),
  ADD CONSTRAINT `recycling_transactions_ibfk_3` FOREIGN KEY (`kioskId`) REFERENCES `kiosks` (`kioskId`);

--
-- Constraints for table `reward_redemptions`
--
ALTER TABLE `reward_redemptions`
  ADD CONSTRAINT `reward_redemptions_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`),
  ADD CONSTRAINT `reward_redemptions_ibfk_2` FOREIGN KEY (`rewardId`) REFERENCES `rewards` (`rewardId`);

--
-- Constraints for table `user_task_progress`
--
ALTER TABLE `user_task_progress`
  ADD CONSTRAINT `user_task_progress_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`),
  ADD CONSTRAINT `user_task_progress_ibfk_2` FOREIGN KEY (`taskId`) REFERENCES `recycling_tasks` (`taskId`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
