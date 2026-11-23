-- ============================================================
-- Migration 006: per-resident "read" state for notifications
-- Run on: waste2goods DB  |  MySQL 8.0
--
-- Resident notifications are built on the fly from transactions, redemptions
-- and quests (GET /api/users/:id/notifications), so there was nowhere to
-- remember that a resident had opened one — the unread badge never cleared.
-- This table records which notification ids a resident has read
-- (POST /api/users/:id/notifications/read). Redemption notification ids
-- include the redemption status, so a status change (e.g. approved) shows up
-- as unread again.
-- ============================================================

CREATE TABLE IF NOT EXISTS `notification_reads` (
  `userId` varchar(50) NOT NULL,
  `notifId` varchar(120) NOT NULL,
  `readAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`userId`, `notifId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DESCRIBE notification_reads;
