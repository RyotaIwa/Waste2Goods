-- ============================================================
-- Migration 003: Pickup codes for reward redemptions
-- Run on: waste2goods DB  |  MySQL 8.0
--
-- A resident requests a reward (POST /api/rewards/redeem) same as before — an
-- admin still has to approve it. What's new is that the request also gets an
-- 8-character pickup code. Once admin approval flips the row to
-- 'approved'/'ready', that code can be typed into the kiosk terminal
-- (POST /api/redemptions/claim) to mark it 'claimed'. Admin approval is NOT
-- bypassed by this — the code is simply how the physical handoff gets
-- verified instead of staff manually clicking through the dashboard.
--
-- NOTE: MySQL 8.0 does NOT support ADD COLUMN IF NOT EXISTS.
--       This script uses a stored procedure to guard each ALTER safely.
-- ============================================================

DROP PROCEDURE IF EXISTS migrate_redemption_codes;

DELIMITER $$
CREATE PROCEDURE migrate_redemption_codes()
BEGIN

  -- 1. Add `redeemCode` column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'reward_redemptions'
      AND COLUMN_NAME  = 'redeemCode'
  ) THEN
    ALTER TABLE reward_redemptions
      ADD COLUMN redeemCode VARCHAR(8) NULL DEFAULT NULL
        COMMENT '8-char pickup code, shown to the resident and typed into the kiosk terminal to claim';
  END IF;

  -- 2. Add `claimedAt` column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'reward_redemptions'
      AND COLUMN_NAME  = 'claimedAt'
  ) THEN
    ALTER TABLE reward_redemptions
      ADD COLUMN claimedAt TIMESTAMP NULL DEFAULT NULL
      AFTER redeemCode;
  END IF;

  -- 3. Add a UNIQUE index on redeemCode if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'reward_redemptions'
      AND INDEX_NAME   = 'redeemCode'
  ) THEN
    ALTER TABLE reward_redemptions
      ADD UNIQUE KEY redeemCode (redeemCode);
  END IF;

END$$
DELIMITER ;

CALL migrate_redemption_codes();
DROP PROCEDURE IF EXISTS migrate_redemption_codes;

DESCRIBE reward_redemptions;
