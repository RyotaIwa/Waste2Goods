-- ============================================================
-- Migration 005: bottle-count column on recycling_transactions
-- Run on: waste2goods DB  |  MySQL 8.0
--
-- The physical setup no longer has a load cell — points and recycling
-- progress are now based on the bottle count the ESP32-CAM reports, not a
-- measured weight. `weightKg` stays (NOT NULL, still used for backward-
-- compatible display math) but is now a derived estimate
-- (bottles x material.kgPerUnit), never a real measurement. `quantity` is
-- the real, honest number going forward — quests and "recycled" stats
-- should read from it instead of weightKg.
--
-- NOTE: MySQL 8.0 does NOT support ADD COLUMN IF NOT EXISTS.
--       This script uses a stored procedure to guard the ALTER safely.
-- ============================================================

DROP PROCEDURE IF EXISTS migrate_transaction_quantity;

DELIMITER $$
CREATE PROCEDURE migrate_transaction_quantity()
BEGIN

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'recycling_transactions'
      AND COLUMN_NAME  = 'quantity'
  ) THEN
    ALTER TABLE recycling_transactions
      ADD COLUMN quantity INT NOT NULL DEFAULT 1
        COMMENT 'Bottle count from the ESP32-CAM machine (or admin manual entry). The real metric now — weightKg is a derived estimate.';
  END IF;

END$$
DELIMITER ;

CALL migrate_transaction_quantity();
DROP PROCEDURE IF EXISTS migrate_transaction_quantity;

DESCRIBE recycling_transactions;
