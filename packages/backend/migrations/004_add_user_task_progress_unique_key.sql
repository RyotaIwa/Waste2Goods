-- ============================================================
-- Migration 004: one progress row per resident per quest
-- Run on: waste2goods DB  |  MySQL 8.0
--
-- `updateTaskProgressForUser()` (index-mysql.js) does
--   INSERT INTO user_task_progress (...) VALUES (...)
--   ON DUPLICATE KEY UPDATE progressKg = progressKg + ?
-- which needs a UNIQUE key on (userId, taskId) to actually mean "the existing
-- row for this resident+quest" instead of just inserting a duplicate every time.
--
-- NOTE: MySQL 8.0 does NOT support ADD INDEX IF NOT EXISTS.
--       This script uses a stored procedure to guard the ALTER safely.
-- ============================================================

DROP PROCEDURE IF EXISTS migrate_user_task_progress_unique;

DELIMITER $$
CREATE PROCEDURE migrate_user_task_progress_unique()
BEGIN

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'user_task_progress'
      AND INDEX_NAME   = 'uniq_user_task'
  ) THEN
    ALTER TABLE user_task_progress
      ADD UNIQUE KEY uniq_user_task (userId, taskId);
  END IF;

END$$
DELIMITER ;

CALL migrate_user_task_progress_unique();
DROP PROCEDURE IF EXISTS migrate_user_task_progress_unique;

DESCRIBE user_task_progress;
