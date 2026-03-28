-- Add PT session duration when upgrading an existing database (idempotent guard via procedure-free ALTER; run once).
-- If the column already exists, MySQL will error — ignore or comment out after applied.

ALTER TABLE `pt_sessions`
  ADD COLUMN `duration_minutes` SMALLINT NOT NULL DEFAULT 60 AFTER `end_time`;
