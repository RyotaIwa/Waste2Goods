-- ============================================================
-- Migration 001: Add OAuth provider tracking to users table
-- Run on: waste2goods DB  |  MySQL 8.0
-- NOTE: MySQL 8.0 does NOT support ADD COLUMN IF NOT EXISTS.
--       This script uses a stored procedure to guard each ALTER safely.
-- ============================================================

DROP PROCEDURE IF EXISTS migrate_oauth_fields;

DELIMITER $$
CREATE PROCEDURE migrate_oauth_fields()
BEGIN

  -- 1. Allow passwordHash to be NULL (OAuth users have no password)
  ALTER TABLE users
    MODIFY COLUMN passwordHash VARCHAR(255) NULL DEFAULT NULL;

  -- 2. Add `provider` column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'users'
      AND COLUMN_NAME  = 'provider'
  ) THEN
    ALTER TABLE users
      ADD COLUMN provider VARCHAR(30) NOT NULL DEFAULT 'local'
        COMMENT 'Auth provider: local | google | github | ...';
  END IF;

  -- 3. Add `google_id` column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'users'
      AND COLUMN_NAME  = 'google_id'
  ) THEN
    ALTER TABLE users
      ADD COLUMN google_id VARCHAR(128) NULL DEFAULT NULL
        COMMENT 'Provider-side user ID (e.g. GOOGLE-<hash>)'
      AFTER provider;
  END IF;

  -- 4. Add index on google_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'users'
      AND INDEX_NAME   = 'idx_users_google_id'
  ) THEN
    ALTER TABLE users
      ADD INDEX idx_users_google_id (google_id);
  END IF;

  -- 5. Best-effort back-fill: mark existing Gmail/OAuth rows as provider='google'
  --    Only rows with a real bcrypt hash AND no phone (OAuth never collected it)
  UPDATE users
    SET provider = 'google'
  WHERE provider = 'local'
    AND google_id IS NULL
    AND email REGEXP '@gmail\\.com$'
    AND passwordHash REGEXP '^\\$2[aby]\\$'
    AND (phone IS NULL OR phone = '');

END$$
DELIMITER ;

CALL migrate_oauth_fields();
DROP PROCEDURE IF EXISTS migrate_oauth_fields;

-- Verify the result
SELECT
  provider,
  COUNT(*) AS total_users,
  SUM(CASE WHEN google_id IS NULL THEN 1 ELSE 0 END) AS no_google_id_yet
FROM users
GROUP BY provider;

DESCRIBE users;
