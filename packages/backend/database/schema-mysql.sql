-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 27, 2026 at 08:08 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";
SET default_storage_engine = 'InnoDB';

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
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB;

--
-- Dumping data for table `administrators`
--

INSERT INTO `administrators` (`adminId`, `email`, `adminIdentifier`, `firstName`, `lastName`, `passwordHash`, `barangayId`, `roleId`, `createdAt`) VALUES
('A-001', 'admin@waste2goods.ph', 'admin@waste2goods.ph', 'Juan', 'Reyes', 'hashed_AdminCabantian2025', 1, 1, '2026-07-26 19:00:00'),
('A-002', 'jose@waste2goods.ph', 'jose@waste2goods.ph', 'Jose', 'Manaloto', 'hashed_AdminCabantian2025', 1, 2, '2026-07-26 20:02:18');

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
) ENGINE=InnoDB;

--
-- SQL Constants to prevent duplicate string literal warnings (SonarQube plsql:S1192)
--
SET @PROVINCE_DAVAO_SUR := 'Davao del Sur';
SET @CITY_DAVAO := 'Davao City';
SET @BRGY_CABANTIAN := 'Cabantian';
SET @STATUS_ACTIVE := 'active';
SET @STATUS_INACTIVE := 'inactive';
SET @STATUS_PENDING := 'pending';
SET @KIOSK_ONLINE := 'online';
SET @KIOSK_OFFLINE := 'offline';
SET @KIOSK_MAINT := 'maintenance';
SET @MATERIAL_PET := 'PET Plastic';
SET @FREQ_DAILY := 'daily';
SET @FREQ_WEEKLY := 'weekly';
SET @FREQ_MONTHLY := 'monthly';
SET @CAT_ECO_ESSENTIALS := 'Eco Essentials';
SET @CAT_SCHOOL_SUPPLIES := 'School Supplies';
SET @CAT_GROCERIES := 'Groceries';
SET @CAT_HOUSEHOLD := 'Household';
SET @CAT_KIDS := 'Kids';
SET @CAT_COMMUNITY := 'Community';
SET @CAT_SEASONAL := 'Seasonal';
SET @PASSWORD_LEGACY_PREFIX := 'hashed_';
SET @DEFAULT_CREATED_AT := '2026-07-26 19:13:21';
SET @CABANTIAN_HALL := 'Cabantian Hall';
SET @CABANTIAN_ELEM_SCHOOL := 'Cabantian Elementary School';
SET @CABANTIAN_MARKET := 'Cabantian Market';
SET @CABANTIAN_COVERED_COURT := 'Cabantian Covered Court';
SET @CABANTIAN_GYM := 'Cabantian Gym';
SET @TEMP_DASH := '—';

--
-- Dumping data for table `barangays`
--

INSERT INTO `barangays` (`barangayId`, `barangayName`, `contact_number`, `street`, `province`, `city`, `contactInfo`, `barangayCaptain`, `userId`) VALUES
(1, @BRGY_CABANTIAN, '(082) 123-4567 / +63 917 123 4567', 'Cabantian Road, Barangay Hall Compound', @PROVINCE_DAVAO_SUR, @CITY_DAVAO, '(082) 123-4567 / +63 917 123 4567', 'Hon. Juan S. Dela Cruz', 1);

-- --------------------------------------------------------

--
-- Table structure for table `kiosks`
--

CREATE TABLE `kiosks` (
  `kioskId` varchar(50) NOT NULL,
  `location` varchar(255) NOT NULL,
  `status` varchar(50) DEFAULT 'offline', -- NOSONAR: MySQL disallows session vars in column DEFAULT expressions
  `battery` int(11) DEFAULT 0,
  `lastPing` varchar(50) DEFAULT NULL,
  `temp` varchar(20) DEFAULT NULL,
  `barcode` varchar(100) DEFAULT NULL,
  `lastMaintenance` date DEFAULT NULL,
  `barangayId` int(11) DEFAULT NULL
) ENGINE=InnoDB;

--
-- Dumping data for table `kiosks`
--

INSERT INTO `kiosks` (`kioskId`, `location`, `status`, `battery`, `lastPing`, `temp`, `barcode`, `lastMaintenance`, `barangayId`) VALUES
('K-01', @CABANTIAN_HALL, @KIOSK_ONLINE, 94, '2 min ago', '28°C', NULL, NULL, NULL),
('K-02', @CABANTIAN_ELEM_SCHOOL, @KIOSK_ONLINE, 78, '1 min ago', '27°C', NULL, NULL, NULL),
('K-03', @CABANTIAN_MARKET, @KIOSK_OFFLINE, 0, '3 hrs ago', @TEMP_DASH, NULL, NULL, NULL),
('K-04', @CABANTIAN_COVERED_COURT, @KIOSK_ONLINE, 61, 'just now', '30°C', NULL, NULL, NULL),
('K-05', @CABANTIAN_GYM, @KIOSK_MAINT, 45, '45 min ago', @TEMP_DASH, NULL, NULL, NULL);

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
  `status` varchar(50) DEFAULT 'active' -- NOSONAR: MySQL disallows session vars in column DEFAULT expressions
) ENGINE=InnoDB;

--
-- Dumping data for table `recyclable_materials`
--

INSERT INTO `recyclable_materials` (`materialId`, `materialName`, `materialType`, `pointsPerKg`, `kgPerUnit`, `description`, `status`) VALUES
(1, 'PET Plastic Bottle (500ml)', @MATERIAL_PET, 50.00, 0.01, 'Clean 500ml clear PET bottle with cap removed', @STATUS_ACTIVE),
(2, 'PET Plastic Bottle (1L)', @MATERIAL_PET, 50.00, 0.02, 'Clean 1L clear PET beverage bottle', @STATUS_ACTIVE),
(3, 'PET Plastic Bottle (1.5L)', @MATERIAL_PET, 50.00, 0.03, 'Clean 1.5L clear PET soda/water bottle', @STATUS_ACTIVE),
(4, 'PET Plastic Container', @MATERIAL_PET, 50.00, 0.02, 'Clean food-grade PET container (tupperware-style)', @STATUS_ACTIVE),
(5, 'Bulk PET Plastic (by weight)', @MATERIAL_PET, 50.00, 1.00, 'Any clean PET plastic weighed directly on kiosk scale', @STATUS_ACTIVE);

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
  `frequency` varchar(50) DEFAULT 'weekly', -- NOSONAR: MySQL disallows session vars in column DEFAULT expressions
  `barangayId` int(11) DEFAULT NULL,
  `materialId` int(11) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'active' -- NOSONAR: MySQL disallows session vars in column DEFAULT expressions
) ENGINE=InnoDB;

--
-- Dumping data for table `recycling_tasks`
--

INSERT INTO `recycling_tasks` (`taskId`, `taskName`, `description`, `bonusPoints`, `targetKg`, `startDate`, `endDate`, `progress`, `target`, `frequency`, `barangayId`, `materialId`, `status`) VALUES
(1, 'Daily Recycling', 'Submit any amount of PET plastic today', 25, 0.50, NULL, NULL, 0, 1, @FREQ_DAILY, NULL, NULL, @STATUS_ACTIVE),
(2, 'Streak Bonus - 3 Days', '3 days in a row! Keep it up', 100, 1.00, NULL, NULL, 0, 3, @FREQ_DAILY, NULL, NULL, @STATUS_ACTIVE),
(3, '5 kg Weekly Challenge', 'Collect and submit 5 kg total this week', 300, 5.00, NULL, NULL, 0, 1, @FREQ_WEEKLY, NULL, NULL, @STATUS_ACTIVE),
(4, '10 Bottles in a Day', 'Submit 10+ PET bottles in a single day', 150, 0.20, NULL, NULL, 0, 1, @FREQ_DAILY, NULL, NULL, @STATUS_ACTIVE),
(5, 'Pasko Big Cleanup Drive', 'Barangay-wide Christmas cleanup: 20kg target', 1000, 20.00, NULL, NULL, 0, 1, @FREQ_MONTHLY, NULL, NULL, @STATUS_ACTIVE);

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
) ENGINE=InnoDB;

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
  `status` varchar(50) DEFAULT 'active', -- NOSONAR: MySQL disallows session vars in column DEFAULT expressions
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB;

--
-- Dumping data for table `rewards`
--

INSERT INTO `rewards` (`rewardId`, `rewardName`, `points_required`, `pointsCost`, `stock_quantity`, `stockQuantity`, `image_url`, `description`, `category`, `icon`, `isSeasonal`, `status`, `created_at`, `createdAt`) VALUES
(1, 'Eco Water Bottle', 350, 350, 120, 120, NULL, 'Reusable stainless steel 500ml water bottle with Waste2Goods logo', @CAT_ECO_ESSENTIALS, '🥤', 0, @STATUS_ACTIVE, @DEFAULT_CREATED_AT, @DEFAULT_CREATED_AT),
(2, 'Bamboo Utensil Set', 280, 280, 95, 95, NULL, 'Fork, spoon, chopsticks, straw with canvas pouch', @CAT_ECO_ESSENTIALS, '🥢', 0, @STATUS_ACTIVE, @DEFAULT_CREATED_AT, @DEFAULT_CREATED_AT),
(3, 'Raffia Tote Bag', 220, 220, 150, 150, NULL, 'Hand-woven natural raffia shopping bag', @CAT_ECO_ESSENTIALS, '👜', 0, @STATUS_ACTIVE, @DEFAULT_CREATED_AT, @DEFAULT_CREATED_AT),
(4, 'Cotton Tote Bag', 150, 150, 200, 200, NULL, 'Heavy-duty canvas grocery bag with print', @CAT_ECO_ESSENTIALS, '🛍️', 0, @STATUS_ACTIVE, @DEFAULT_CREATED_AT, @DEFAULT_CREATED_AT),
(5, 'Notebook (Set of 3)', 180, 180, 180, 180, NULL, 'Recycled paper notebooks with Barangay Cabantian design', @CAT_SCHOOL_SUPPLIES, '📓', 0, @STATUS_ACTIVE, @DEFAULT_CREATED_AT, @DEFAULT_CREATED_AT),
(6, 'Pencil Case Set', 160, 160, 110, 110, NULL, 'Eco-friendly pencil case with pencils and eraser', @CAT_SCHOOL_SUPPLIES, '✏️', 0, @STATUS_ACTIVE, @DEFAULT_CREATED_AT, @DEFAULT_CREATED_AT),
(7, 'Pencil (Pack of 12)', 90, 90, 250, 250, NULL, '100% recycled newspaper pencils with seeds', @CAT_SCHOOL_SUPPLIES, '🖊️', 0, @STATUS_ACTIVE, @DEFAULT_CREATED_AT, @DEFAULT_CREATED_AT),
(8, 'Rice (2kg)', 550, 550, 75, 75, NULL, 'Premium well-milled rice 2kg pack', @CAT_GROCERIES, '🍚', 0, @STATUS_ACTIVE, @DEFAULT_CREATED_AT, @DEFAULT_CREATED_AT),
(9, 'Pancit Canton (Pack of 6)', 240, 240, 130, 130, NULL, 'Assorted flavor instant pancit canton', @CAT_GROCERIES, '🍜', 0, @STATUS_ACTIVE, @DEFAULT_CREATED_AT, @DEFAULT_CREATED_AT),
(10, 'Canned Sardines (Pack of 3)', 195, 195, 100, 100, NULL, 'Premium sardines in tomato sauce', @CAT_GROCERIES, '🐟', 0, @STATUS_ACTIVE, @DEFAULT_CREATED_AT, @DEFAULT_CREATED_AT),
(11, 'Coffee (10 sachets)', 180, 180, 90, 90, NULL, '3-in-1 coffee mix', @CAT_GROCERIES, '☕', 0, @STATUS_ACTIVE, @DEFAULT_CREATED_AT, @DEFAULT_CREATED_AT),
(12, 'Sugar (1kg)', 150, 150, 60, 60, NULL, 'Washed refined sugar 1kg pack', @CAT_GROCERIES, '🧂', 0, @STATUS_ACTIVE, @DEFAULT_CREATED_AT, @DEFAULT_CREATED_AT),
(13, 'Laundry Detergent (1kg)', 260, 260, 80, 80, NULL, 'Eco-friendly biodegradable detergent powder', @CAT_HOUSEHOLD, '🧺', 0, @STATUS_ACTIVE, @DEFAULT_CREATED_AT, @DEFAULT_CREATED_AT),
(14, 'Dishwashing Liquid (500ml)', 210, 210, 70, 70, NULL, 'Plant-based concentrated dish soap', @CAT_HOUSEHOLD, '🧽', 0, @STATUS_ACTIVE, @DEFAULT_CREATED_AT, @DEFAULT_CREATED_AT),
(15, 'Toilet Soap (Set of 3)', 150, 150, 100, 100, NULL, 'Natural herbal bath soap trio', @CAT_HOUSEHOLD, '🧼', 0, @STATUS_ACTIVE, @DEFAULT_CREATED_AT, @DEFAULT_CREATED_AT),
(16, 'Toothbrush + Toothpaste', 130, 130, 140, 140, NULL, 'Bamboo toothbrush with fluoride toothpaste', @CAT_HOUSEHOLD, '🪥', 0, @STATUS_ACTIVE, @DEFAULT_CREATED_AT, @DEFAULT_CREATED_AT),
(17, 'Plastic Toy Set', 220, 220, 50, 50, NULL, 'Upcycled plastic educational block set (30 pcs)', @CAT_KIDS, '🧸', 0, @STATUS_ACTIVE, @DEFAULT_CREATED_AT, @DEFAULT_CREATED_AT),
(18, 'Sticker Sheet Pack', 65, 65, 300, 300, NULL, 'Recycling-themed eco sticker sheets (5 pcs)', @CAT_KIDS, '🌟', 0, @STATUS_ACTIVE, @DEFAULT_CREATED_AT, @DEFAULT_CREATED_AT),
(19, 'Coloring Book', 120, 120, 180, 180, NULL, '100% recycled paper eco-hero coloring book', @CAT_KIDS, '🎨', 0, @STATUS_ACTIVE, @DEFAULT_CREATED_AT, @DEFAULT_CREATED_AT),
(20, 'Vegetable Seedlings Kit', 290, 290, 60, 60, NULL, 'Pechay, kangkong, tomato seeds + starter pots', @CAT_COMMUNITY, '🌱', 0, @STATUS_ACTIVE, @DEFAULT_CREATED_AT, @DEFAULT_CREATED_AT),
(21, 'Community T-Shirt', 330, 330, 75, 75, NULL, 'Limited Waste2Goods barangay shirt (sizes M/L/XL)', @CAT_COMMUNITY, '👕', 0, @STATUS_ACTIVE, @DEFAULT_CREATED_AT, @DEFAULT_CREATED_AT),
(22, 'Sinulog Gift Pack', 420, 420, 30, 30, NULL, 'Seasonal: Sinulog-themed mug + keychain + tote', @CAT_SEASONAL, '🎊', 1, @STATUS_ACTIVE, @DEFAULT_CREATED_AT, @DEFAULT_CREATED_AT),
(23, 'Kadayawan Durian Treats', 520, 520, 25, 25, NULL, 'Seasonal: Local durian candies, yema, pasalubong box', @CAT_SEASONAL, '🎁', 1, @STATUS_ACTIVE, @DEFAULT_CREATED_AT, @DEFAULT_CREATED_AT),
(24, 'Pasko Ham & Cheese Pack', 750, 750, 40, 40, NULL, 'Seasonal Christmas: Premium ham + cheese loaf', @CAT_SEASONAL, '🎄', 1, @STATUS_ACTIVE, @DEFAULT_CREATED_AT, @DEFAULT_CREATED_AT),
(25, 'Bagsakan Fresh Veggies Box', 450, 450, 50, 50, NULL, 'Farm fresh seasonal veggies from Bagsakan (weekly only)', @CAT_SEASONAL, '🥬', 1, @STATUS_ACTIVE, @DEFAULT_CREATED_AT, @DEFAULT_CREATED_AT);

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
  `status` varchar(50) DEFAULT 'pending', -- NOSONAR: MySQL disallows session vars in column DEFAULT expressions
  `approvedBy` varchar(50) DEFAULT NULL,
  `redemptionDate` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB;

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `roleId` int(11) NOT NULL,
  `roleName` varchar(100) NOT NULL,
  `description` text DEFAULT NULL
) ENGINE=InnoDB;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`roleId`, `roleName`, `description`) VALUES
(1, 'Super Admin', 'Full system access across all barangays'),
(2, 'Barangay Admin', 'Barangay-level administrator and content manager'),
(3, 'Secretary', 'Barangay secretary with write access to records'),
(4, 'Treasurer', 'Handles rewards, points, and redemption approvals');

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
  `tier` varchar(30) DEFAULT 'Bronze', -- NOSONAR: MySQL disallows session vars in column DEFAULT expressions
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` varchar(50) DEFAULT 'active', -- NOSONAR: MySQL disallows session vars in column DEFAULT expressions
  `phone` varchar(50) DEFAULT NULL,
  `province` varchar(100) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `barangayName` varchar(100) DEFAULT NULL,
  `streetAddress` varchar(255) DEFAULT NULL
) ENGINE=InnoDB;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`userId`, `firstName`, `lastName`, `email`, `passwordHash`, `qr_code`, `barangayId`, `total_points`, `pointsBalance`, `totalSubmissions`, `createdAt`, `status`, `phone`, `province`, `city`, `barangayName`, `streetAddress`) VALUES
('U-001', 'jq', 'Lastname', 'jq@gmail.com', 'hashed_congtv', 'U-001-8xJKz', 1, 50, 50, 0, '2026-07-26 19:14:40', @STATUS_ACTIVE, '09943211341', @PROVINCE_DAVAO_SUR, @CITY_DAVAO, @BRGY_CABANTIAN, NULL),
('U-002', 'dm', 'cb', 'dmcb@gmail.com', 'hashed_123333', 'U-002-7cTba', 1, 50, 50, 0, '2026-07-26 19:17:43', @STATUS_ACTIVE, '092222222', @PROVINCE_DAVAO_SUR, @CITY_DAVAO, @BRGY_CABANTIAN, NULL),
('U-003', 'kuya', 'hapon', 'hapon@gmail.com', 'hashed_123456', 'U-003-9pMne', 1, 50, 50, 0, '2026-07-26 20:04:17', @STATUS_ACTIVE, '0909090909', @PROVINCE_DAVAO_SUR, @CITY_DAVAO, @BRGY_CABANTIAN, NULL),
('U-004', 'komi', 'sama', 'komisama@gmail.com', 'hashed_111111', 'U-004-2sWpr', 1, 50, 50, 0, '2026-07-27 16:41:52', @STATUS_ACTIVE, '0912345678', @PROVINCE_DAVAO_SUR, @CITY_DAVAO, @BRGY_CABANTIAN, 'rizal street');

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
) ENGINE=InnoDB;

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
  MODIFY `roleId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

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

