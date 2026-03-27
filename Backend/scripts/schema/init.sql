-- ============================================================================
-- Power World Gyms — Kiribathgoda Branch
-- Schema v3  |  MySQL 8.0+  |  3NF
--
-- v1 (original) : 44 tables
-- v2 (last pass): 27 tables
-- v3 (this)     : 21 tables
--
-- New reductions vs v2 and why
-- ─────────────────────────────
-- SINGLE BRANCH
--   `branches` table dropped. This system serves exactly one branch.
--   A branch is just config — move open/close times, capacity, timezone
--   into a single-row `config` table. Every `branch_id` FK column in v2
--   was pure noise. Removed everywhere.
--
-- ONE DOOR
--   `gates` table dropped. One entrance/exit means there is no "which
--   gate" question. A visit row IS the access event. No gate FK needed.
--
-- SHIFTS + OVERRIDES  →  `schedules`
--   `staff_shifts` (recurring) and `shift_overrides` (one-off) describe
--   the same thing: "when does this person work on a given day?"
--   One `schedules` table with a `kind` column handles both.
--
-- PT SESSION NOTES + TRAINER REVIEWS  →  columns on `pt_sessions`
--   A session has exactly ONE set of notes (1:1) and ONE review (1:1).
--   Two separate tables for 1:1 relationships is not 3NF — it is
--   just over-engineering. Fold them into `pt_sessions` directly.
--
-- WHAT CANNOT BE MERGED (true 3NF boundaries)
--   • people          — auth identity, cannot mix with time-series rows
--   • member_profiles — static 1:1 health/onboarding data per member
--   • member_metrics  — time-series (1:many on people) — must be separate
--   • member_documents— multiple docs per member (1:many) — separate
--   • trainer_certifications — multiple certs per trainer — separate
--   • workout_plans / workout_exercises — plan catalogue; exercises are
--     a child of plans (1:many), not mergeable without repeating plan cols
--   • workout_logs    — what was *actually done*, not what was planned
--   • inventory_items / inventory_transactions — catalogue vs. movements
--   • subscriptions / subscription_freezes — freeze periods are 1:many
--   • payments / promotions — payments are 1:many per subscription;
--     promotions are a reusable catalogue referenced by many payments
-- ============================================================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- ============================================================================
-- 1. CONFIG  (replaces the entire `branches` table)
-- ============================================================================
-- Single-row table. The branch IS the system. No branch_id FKs anywhere.
-- To extend to a multi-branch network later, promote this to a `branches`
-- table and add branch_id FKs back — a clean migration path.

CREATE TABLE IF NOT EXISTS `config` (
  `key`         VARCHAR(50)   NOT NULL,
  `value`       VARCHAR(500)  NOT NULL,
  -- Examples of keys:
  --   branch_name, branch_code, address, phone, email
  --   open_time, close_time, capacity, grace_days
  --   timezone, facility_type

  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed the single branch
INSERT INTO `config` (`key`, `value`) VALUES
  ('branch_capacity', '120'),
  ('grace_days',      '3'),
  ('timezone',        'Asia/Colombo'),
  ('checkin_qr_ttl_seconds', '120'),
  ('checkin_scan_max_retries', '5'),
  ('subscription_freeze_max_days', '90'),
  ('payment_failure_max_retries', '3'),
  ('login_failure_lock_threshold', '5'),
  ('login_failure_lock_minutes', '15'),
  ('db_backup_retention_days', '14'),
  ('db_backup_frequency', 'daily'),
  ('ai_chat_rate_limit_per_minute', '20'),
  ('pt_booking_advance_days_max', '60'),
  ('session_idle_timeout_minutes', '30'),
  ('email_queue_max_attempts', '5'),
  ('maintenance_mode', 'false'),
  ('notify_email', 'true'),
  ('notify_sms', 'false'),
  ('auto_backup', 'true');


-- ============================================================================
-- 2. USERS
-- ============================================================================
-- One row for every human: members, trainers, manager, admin.
-- Trainers and managers are operational roles; there is no separate `staff` login role.

CREATE TABLE IF NOT EXISTS `users` (
  `id`               VARCHAR(36)   NOT NULL,

  -- Identity (all roles)
  `full_name`        VARCHAR(100)  NOT NULL,
  `email`            VARCHAR(255)  NOT NULL,
  `phone`            VARCHAR(20)   DEFAULT NULL,
  `dob`              DATE          DEFAULT NULL,
  `gender`           ENUM('male','female','other') DEFAULT NULL,
  `nic_number`       VARCHAR(20)   DEFAULT NULL,

  -- Role & status
  `role`             ENUM('admin','manager','trainer','member') NOT NULL DEFAULT 'member',
  `is_active`        TINYINT(1)    NOT NULL DEFAULT 1,

  -- Auth (all roles log in)
  `password_hash`    VARCHAR(255)  NOT NULL,
  `email_verified`   TINYINT(1)    NOT NULL DEFAULT 0,
  `email_verify_token` VARCHAR(255) DEFAULT NULL,
  `qr_secret`        VARCHAR(64)   DEFAULT NULL,  -- QR code for door scan
  `avatar_key`       VARCHAR(500)  DEFAULT NULL,  -- OCI object key or local path (profile avatar)
  `cover_key`        VARCHAR(500)  DEFAULT NULL,  -- OCI object key or local path (profile cover)
  `id_document_type` ENUM('nic','driving_license','passport') DEFAULT NULL,
  `id_nic_front`     VARCHAR(500)  DEFAULT NULL,
  `id_nic_back`      VARCHAR(500)  DEFAULT NULL,
  `id_verification_status` ENUM('pending','approved','rejected') DEFAULT NULL,
  `id_verification_note` TEXT       DEFAULT NULL,
  `id_submitted_at`  TIMESTAMP     NULL DEFAULT NULL,
  `last_login_at`    TIMESTAMP     NULL DEFAULT NULL,
  `failed_attempts`  TINYINT       NOT NULL DEFAULT 0,
  `locked_until`     TIMESTAMP     NULL DEFAULT NULL,
  `reset_token`      VARCHAR(255)  DEFAULT NULL,
  `reset_expires`    TIMESTAMP     NULL DEFAULT NULL,

  -- Staff / trainer columns (NULL for members)
  `employee_code`    VARCHAR(20)   DEFAULT NULL,
  `hire_date`        DATE          DEFAULT NULL,
  `designation`      VARCHAR(100)  DEFAULT NULL,  -- "Head Trainer", "Front Desk"
  `base_salary`      DECIMAL(10,2) DEFAULT NULL,
  `is_key_holder`    TINYINT(1)    NOT NULL DEFAULT 0,
  `specialization`   VARCHAR(100)  DEFAULT NULL,  -- trainers only
  `pt_hourly_rate`   DECIMAL(8,2)  DEFAULT NULL,  -- trainers only
  `pt_rating`        DECIMAL(3,2)  DEFAULT NULL,  -- trainers only, updated from reviews
  `years_experience` TINYINT       DEFAULT NULL,  -- trainers only

  -- Member columns (NULL for non-members)
  `member_code`      VARCHAR(20)   DEFAULT NULL,
  `join_date`        DATE          DEFAULT NULL,
  `member_status`    ENUM('active','inactive','suspended') DEFAULT NULL,
  `assigned_trainer` VARCHAR(36)   DEFAULT NULL,  -- FK to users.id (trainer)

  -- Audit
  `created_at`       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       TIMESTAMP     NULL ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at`       TIMESTAMP     NULL DEFAULT NULL,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_email`         (`email`),
  UNIQUE KEY `uq_member_code`   (`member_code`),
  UNIQUE KEY `uq_employee_code` (`employee_code`),
  INDEX `idx_role`              (`role`),
  INDEX `idx_active`            (`is_active`, `role`),

  CONSTRAINT `chk_pt_rating`  CHECK (`pt_rating`       IS NULL OR (`pt_rating` BETWEEN 0 AND 5)),
  CONSTRAINT `chk_years_exp`  CHECK (`years_experience` IS NULL OR `years_experience` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Self-referencing FK added after table exists
ALTER TABLE `users`
  ADD CONSTRAINT `fk_people_trainer`
    FOREIGN KEY (`assigned_trainer`) REFERENCES `users`(`id`) ON DELETE SET NULL;


-- ============================================================================
-- 3. MEMBER_PROFILES  (1:1 with people where role='member')
-- ============================================================================
-- Static health, emergency, and onboarding data.
-- Kept separate from `users` so auth queries stay fast.

CREATE TABLE IF NOT EXISTS `member_profiles` (
  `person_id`           VARCHAR(36)  NOT NULL,

  -- Health
  `blood_type`          ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-') DEFAULT NULL,
  `medical_conditions`  TEXT         DEFAULT NULL,
  `allergies`           TEXT         DEFAULT NULL,
  `fitness_goals`       VARCHAR(500) DEFAULT NULL,  -- "weight_loss,muscle_gain"
  `experience_level`    ENUM('beginner','intermediate','advanced') DEFAULT NULL,

  -- Emergency contact
  `emergency_name`      VARCHAR(100) DEFAULT NULL,
  `emergency_phone`     VARCHAR(20)  DEFAULT NULL,
  `emergency_relation`  VARCHAR(50)  DEFAULT NULL,

  -- Onboarding
  `is_onboarded`        TINYINT(1)   NOT NULL DEFAULT 0,
  `onboarded_at`        TIMESTAMP    NULL DEFAULT NULL,

  PRIMARY KEY (`person_id`),
  CONSTRAINT `fk_mp_person`   FOREIGN KEY (`person_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- 4. MEMBER_METRICS  (time-series body measurements)
-- ============================================================================

CREATE TABLE IF NOT EXISTS `member_metrics` (
  `id`            VARCHAR(36)   NOT NULL,
  `person_id`     VARCHAR(36)   NOT NULL,
  `recorded_at`   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `source`        ENUM('manual','trainer','device') NOT NULL DEFAULT 'manual',
  `weight_kg`     DECIMAL(5,2)  DEFAULT NULL,
  `height_cm`     DECIMAL(5,2)  DEFAULT NULL,
  `bmi`           DECIMAL(4,1)  DEFAULT NULL,
  `resting_hr`    TINYINT       DEFAULT NULL,
  `notes`         TEXT          DEFAULT NULL,

  PRIMARY KEY (`id`),
  INDEX `idx_metrics_person` (`person_id`),
  INDEX `idx_metrics_date`   (`recorded_at`),
  CONSTRAINT `fk_metrics_person`   FOREIGN KEY (`person_id`)  REFERENCES `users`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_weight`    CHECK (`weight_kg`   IS NULL OR `weight_kg`   BETWEEN 1   AND 500),
  CONSTRAINT `chk_height`    CHECK (`height_cm`   IS NULL OR `height_cm`   BETWEEN 50  AND 250),
  CONSTRAINT `chk_bmi`       CHECK (`bmi`          IS NULL OR `bmi`          BETWEEN 5  AND 80)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- 6. TRAINER_CERTIFICATIONS  (1:many on people where role='trainer')
-- ============================================================================

CREATE TABLE IF NOT EXISTS `trainer_certifications` (
  `id`           VARCHAR(36)  NOT NULL,
  `trainer_id`   VARCHAR(36)  NOT NULL,
  `name`         VARCHAR(150) NOT NULL,
  `issuing_body` VARCHAR(150) DEFAULT NULL,
  `issued_year`  YEAR         DEFAULT NULL,
  `expiry_date`  DATE         DEFAULT NULL,

  PRIMARY KEY (`id`),
  INDEX `idx_cert_trainer` (`trainer_id`),
  CONSTRAINT `fk_cert_trainer` FOREIGN KEY (`trainer_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- 8. VISITS  (check-in / check-out at the single entrance)
-- ============================================================================
-- No gate_id — one door, nothing to disambiguate.
-- A denied scan is status='denied' with a deny_reason.

CREATE TABLE IF NOT EXISTS `visits` (
  `id`           VARCHAR(36)  NOT NULL,
  `person_id`    VARCHAR(36)  NOT NULL,
  `check_in_at`  TIMESTAMP    NOT NULL,
  `check_out_at` TIMESTAMP    NULL DEFAULT NULL,
  `duration_min` SMALLINT     DEFAULT NULL,
  `status`       ENUM('active','completed','auto_closed','denied') NOT NULL DEFAULT 'active',
  `deny_reason`  VARCHAR(100) DEFAULT NULL,
  `created_at`   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  INDEX `idx_visit_person`  (`person_id`),
  INDEX `idx_visit_checkin` (`check_in_at`),
  INDEX `idx_visit_status`  (`status`, `check_in_at`),
  CONSTRAINT `fk_visit_person` FOREIGN KEY (`person_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- 9. SUBSCRIPTION_PLANS
-- ============================================================================

CREATE TABLE IF NOT EXISTS `subscription_plans` (
  `id`                    VARCHAR(36)   NOT NULL,
  `plan_code`             VARCHAR(30)   NOT NULL,
  `name`                  VARCHAR(100)  NOT NULL,
  `description`           TEXT          DEFAULT NULL,
  `plan_type`             ENUM('individual','couple','student','corporate','daily_pass') NOT NULL,
  `price`                 DECIMAL(10,2) NOT NULL,
  `duration_days`         SMALLINT      NOT NULL,
  `included_pt_sessions`  TINYINT       NOT NULL DEFAULT 0,
  `is_active`             TINYINT(1)    NOT NULL DEFAULT 1,
  `sort_order`            TINYINT       NOT NULL DEFAULT 0,
  `created_at`            TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at`            TIMESTAMP     NULL DEFAULT NULL,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_plan_code` (`plan_code`),
  CONSTRAINT `chk_plan_price`    CHECK (`price`         > 0),
  CONSTRAINT `chk_plan_duration` CHECK (`duration_days` > 0 AND `duration_days` <= 3650)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- 10. SUBSCRIPTIONS
-- ============================================================================
-- partner_id covers couple / corporate plans (secondary member).
-- renewed_from_id is the self-referencing renewal chain.

CREATE TABLE IF NOT EXISTS `subscriptions` (
  `id`               VARCHAR(36)   NOT NULL,
  `member_id`        VARCHAR(36)   NOT NULL,
  `plan_id`          VARCHAR(36)   NOT NULL,
  `start_date`       DATE          NOT NULL,
  `end_date`         DATE          NOT NULL,
  `status`           ENUM('pending_payment','active','frozen','grace_period','expired','cancelled') NOT NULL DEFAULT 'pending_payment',
  `price_paid`       DECIMAL(10,2) DEFAULT NULL,
  `discount_amount`  DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `promotion_id`     VARCHAR(36)   DEFAULT NULL,
  `pt_sessions_left` TINYINT       NOT NULL DEFAULT 0,
  `notes`            TEXT          DEFAULT NULL,
  `created_at`       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  INDEX `idx_sub_member`        (`member_id`),
  INDEX `idx_sub_status`        (`status`),
  INDEX `idx_sub_end`           (`end_date`),
  INDEX `idx_sub_member_status` (`member_id`, `status`),
  CONSTRAINT `fk_sub_member`   FOREIGN KEY (`member_id`)       REFERENCES `users`(`id`)             ON DELETE RESTRICT,
  CONSTRAINT `fk_sub_plan`     FOREIGN KEY (`plan_id`)         REFERENCES `subscription_plans`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_sub_promo`    FOREIGN KEY (`promotion_id`)    REFERENCES `promotions`(`id`)          ON DELETE SET NULL,
  CONSTRAINT `chk_sub_dates`   CHECK (`end_date` >= `start_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- 11. SUBSCRIPTION_FREEZES
-- ============================================================================

CREATE TABLE IF NOT EXISTS `subscription_freezes` (
  `id`              VARCHAR(36)  NOT NULL,
  `subscription_id` VARCHAR(36)  NOT NULL,
  `freeze_start`    DATE         NOT NULL,
  `freeze_end`      DATE         NOT NULL,
  `reason`          VARCHAR(255) DEFAULT NULL,
  `requested_by`    VARCHAR(36)  DEFAULT NULL,
  `created_at`      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  INDEX `idx_freeze_sub` (`subscription_id`),
  CONSTRAINT `fk_freeze_sub` FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_freeze_by`  FOREIGN KEY (`requested_by`)    REFERENCES `users`(`id`)         ON DELETE SET NULL,
  CONSTRAINT `chk_freeze_dates` CHECK (`freeze_end` >= `freeze_start`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- 12. PROMOTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS `promotions` (
  `id`             VARCHAR(36)   NOT NULL,
  `code`           VARCHAR(50)   NOT NULL,
  `name`           VARCHAR(100)  NOT NULL,
  `discount_type`  ENUM('percentage','fixed') NOT NULL,
  `discount_value` DECIMAL(10,2) NOT NULL,
  `used_count`     SMALLINT      NOT NULL DEFAULT 0,
  `valid_from`     DATE          NOT NULL,
  `valid_until`    DATE          DEFAULT NULL,
  `is_active`      TINYINT(1)    NOT NULL DEFAULT 1,
  `created_at`     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_promo_code` (`code`),
  CONSTRAINT `chk_promo_value`  CHECK (`discount_value` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- 13. PAYMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS `payments` (
  `id`                  VARCHAR(36)   NOT NULL,
  `subscription_id`     VARCHAR(36)   NOT NULL,
  `amount`              DECIMAL(10,2) NOT NULL,
  `payment_method`      ENUM('cash','card','bank_transfer','online') NOT NULL,
  `payment_date`        DATE          NOT NULL,
  `status`              ENUM('completed','partially_refunded','refunded','disputed') NOT NULL DEFAULT 'completed',
  `receipt_number`      VARCHAR(50)   DEFAULT NULL,
  `reference_number`    VARCHAR(100)  DEFAULT NULL,
  `instrument_hash`     VARCHAR(64)   DEFAULT NULL,
  `promotion_id`        VARCHAR(36)   DEFAULT NULL,
  `discount_amount`     DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `recorded_by`         VARCHAR(36)   DEFAULT NULL,
  `created_at`          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_receipt` (`receipt_number`),
  INDEX `idx_pay_sub`  (`subscription_id`),
  INDEX `idx_pay_date` (`payment_date`),
  CONSTRAINT `fk_pay_sub`     FOREIGN KEY (`subscription_id`)    REFERENCES `subscriptions`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_pay_promo`   FOREIGN KEY (`promotion_id`)        REFERENCES `promotions`(`id`)    ON DELETE SET NULL,
  CONSTRAINT `fk_pay_by`      FOREIGN KEY (`recorded_by`)         REFERENCES `users`(`id`)        ON DELETE SET NULL,
  CONSTRAINT `chk_pay_amount` CHECK (`amount` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- PAYMENT_SESSIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS `payment_sessions` (
  `id`                       VARCHAR(36)   NOT NULL,
  `member_id`                VARCHAR(36)   NOT NULL,
  `plan_id`                  VARCHAR(36)   NOT NULL,
  `promotion_code`           VARCHAR(50)   DEFAULT NULL,
  `amount`                   DECIMAL(10,2) NOT NULL,
  `status`                   ENUM('pending','processing','approved','declined','expired') NOT NULL DEFAULT 'pending',
  `provider_ref`             VARCHAR(100)  DEFAULT NULL,
  `request_payload`          TEXT          DEFAULT NULL,
  `decision_payload`         TEXT          DEFAULT NULL,
  `expires_at`               TIMESTAMP     NOT NULL,
  `approved_subscription_id` VARCHAR(36)   DEFAULT NULL,
  `approved_payment_id`      VARCHAR(36)   DEFAULT NULL,
  `created_at`               TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`               TIMESTAMP     NULL ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  INDEX `idx_ps_member_status` (`member_id`, `status`),
  INDEX `idx_ps_status_created` (`status`, `created_at`),
  CONSTRAINT `fk_ps_member` FOREIGN KEY (`member_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_ps_plan`   FOREIGN KEY (`plan_id`) REFERENCES `subscription_plans`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_ps_sub`    FOREIGN KEY (`approved_subscription_id`) REFERENCES `subscriptions`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_ps_pay`    FOREIGN KEY (`approved_payment_id`) REFERENCES `payments`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- INVOICE_RECORDS
-- ============================================================================
CREATE TABLE IF NOT EXISTS `invoice_records` (
  `id`             VARCHAR(36)   NOT NULL,
  `payment_id`     VARCHAR(36)   NOT NULL,
  `member_id`      VARCHAR(36)   NOT NULL,
  `invoice_number` VARCHAR(50)   NOT NULL,
  `status`         ENUM('issued','emailed') NOT NULL DEFAULT 'issued',
  `email_to`       VARCHAR(255)  DEFAULT NULL,
  `html_content`   LONGTEXT      NOT NULL,
  `created_at`     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_invoice_payment` (`payment_id`),
  UNIQUE KEY `uq_invoice_number` (`invoice_number`),
  INDEX `idx_invoice_member` (`member_id`, `created_at`),
  CONSTRAINT `fk_invoice_payment` FOREIGN KEY (`payment_id`) REFERENCES `payments`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_invoice_member`  FOREIGN KEY (`member_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- 14. WORKOUT_PLANS + WORKOUT_EXERCISES
-- ============================================================================
-- A plan is the template. Exercises are its children (1:many → must be separate).

CREATE TABLE IF NOT EXISTS `workout_plans` (
  `id`           VARCHAR(36)  NOT NULL,
  `member_id`    VARCHAR(36)  DEFAULT NULL,  -- NULL = shared library template
  `trainer_id`   VARCHAR(36)  DEFAULT NULL,
  `name`         VARCHAR(150) NOT NULL,
  `description`  TEXT         DEFAULT NULL,
  `source`       ENUM('trainer_created','ai_generated','library') NOT NULL,
  `difficulty`   ENUM('beginner','intermediate','advanced') DEFAULT NULL,
  `duration_weeks` TINYINT   NOT NULL,
  `days_per_week`  TINYINT   NOT NULL,
  `is_active`    TINYINT(1)   NOT NULL DEFAULT 1,
  `created_at`   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  INDEX `idx_wp_member`  (`member_id`),
  INDEX `idx_wp_trainer` (`trainer_id`),
  CONSTRAINT `fk_wp_member`  FOREIGN KEY (`member_id`)  REFERENCES `users`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_wp_trainer` FOREIGN KEY (`trainer_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_wp_weeks` CHECK (`duration_weeks` BETWEEN 1 AND 52),
  CONSTRAINT `chk_wp_days`  CHECK (`days_per_week`  BETWEEN 1 AND 7)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- 15. WORKOUT_LOGS  (what the member actually did in a session)
-- ============================================================================

CREATE TABLE IF NOT EXISTS `workout_logs` (
  `id`             VARCHAR(36)  NOT NULL,
  `person_id`      VARCHAR(36)  NOT NULL,
  `plan_id`        VARCHAR(36)  DEFAULT NULL,
  `workout_date`   DATE         NOT NULL,
  `duration_min`   SMALLINT     DEFAULT NULL,
  `mood`           ENUM('great','good','okay','tired','poor') DEFAULT NULL,
  `calories_burned` SMALLINT    DEFAULT NULL,
  `notes`          TEXT         DEFAULT NULL,
  `created_at`     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  INDEX `idx_wl_person` (`person_id`),
  INDEX `idx_wl_date`   (`workout_date`),
  CONSTRAINT `fk_wl_person` FOREIGN KEY (`person_id`) REFERENCES `users`(`id`)        ON DELETE RESTRICT,
  CONSTRAINT `fk_wl_plan`   FOREIGN KEY (`plan_id`)   REFERENCES `workout_plans`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- 16. PT_SESSIONS
-- ============================================================================
-- Replaces: pt_sessions + pt_session_notes + trainer_reviews
-- Notes (1:1 per session) and review (1:1 per session) are columns here.
-- There is NO valid 3NF reason to put a 1:1 relationship in a separate table.

CREATE TABLE IF NOT EXISTS `pt_sessions` (
  `id`             VARCHAR(36)  NOT NULL,
  `member_id`      VARCHAR(36)  NOT NULL,
  `trainer_id`     VARCHAR(36)  NOT NULL,
  `session_date`   DATE         NOT NULL,
  `start_time`     TIME         NOT NULL,
  `end_time`       TIME         NOT NULL,
  `status`         ENUM('booked','confirmed','completed','cancelled','no_show') NOT NULL DEFAULT 'booked',
  `cancel_reason`  VARCHAR(255) DEFAULT NULL,
  `review_rating`  TINYINT      DEFAULT NULL,  -- 1-5, NULL until reviewed
  `review_comment` TEXT         DEFAULT NULL,
  `created_at`     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_trainer_slot` (`trainer_id`, `session_date`, `start_time`),
  INDEX `idx_pts_member`  (`member_id`),
  INDEX `idx_pts_trainer` (`trainer_id`),
  INDEX `idx_pts_date`    (`session_date`),
  CONSTRAINT `fk_pts_member`   FOREIGN KEY (`member_id`)  REFERENCES `users`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_pts_trainer`  FOREIGN KEY (`trainer_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_review_rate` CHECK (`review_rating` IS NULL OR `review_rating` BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- 17. EQUIPMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS `equipment` (
  `id`               VARCHAR(36)  NOT NULL,
  `name`             VARCHAR(100) NOT NULL,
  `category`         ENUM('cardio','strength_machine','free_weight','bench','accessory','other') NOT NULL,
  `quantity`         TINYINT      NOT NULL DEFAULT 1,
  `status`           ENUM('operational','needs_maintenance','under_maintenance','retired') NOT NULL DEFAULT 'operational',
  `zone_label`       VARCHAR(50)  DEFAULT NULL,
  `created_at`       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  INDEX `idx_equip_status` (`status`),
  CONSTRAINT `chk_equip_qty` CHECK (`quantity` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- 18. EQUIPMENT_EVENTS  (issue reports + maintenance logs in one table)
-- ============================================================================

CREATE TABLE IF NOT EXISTS `equipment_events` (
  `id`           VARCHAR(36)  NOT NULL,
  `equipment_id` VARCHAR(36)  NOT NULL,
  `event_type`   ENUM('issue_reported','maintenance_done') NOT NULL,
  `severity`     ENUM('low','medium','high','critical') DEFAULT NULL,
  `description`  TEXT         NOT NULL,
  `status`       ENUM('open','in_progress','resolved') DEFAULT NULL,
  `logged_by`    VARCHAR(36)  DEFAULT NULL,
  `resolved_by`  VARCHAR(36)  DEFAULT NULL,
  `resolved_at`  TIMESTAMP    NULL DEFAULT NULL,
  `created_at`   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  INDEX `idx_ee_equipment` (`equipment_id`),
  INDEX `idx_ee_status`    (`status`),
  CONSTRAINT `fk_ee_equipment` FOREIGN KEY (`equipment_id`) REFERENCES `equipment`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_ee_logger`    FOREIGN KEY (`logged_by`)     REFERENCES `users`(`id`)   ON DELETE SET NULL,
  CONSTRAINT `fk_ee_resolver`  FOREIGN KEY (`resolved_by`)   REFERENCES `users`(`id`)   ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- 19. INVENTORY_ITEMS + INVENTORY_TRANSACTIONS
-- ============================================================================
-- Catalogue and movements cannot be merged: items are facts about a product,
-- transactions are events over time. Merging would repeat item data per row.

CREATE TABLE IF NOT EXISTS `inventory_items` (
  `id`               VARCHAR(36)   NOT NULL,
  `name`             VARCHAR(100)  NOT NULL,
  `category`         VARCHAR(50)   NOT NULL,
  `qty_in_stock`     SMALLINT      NOT NULL DEFAULT 0,
  `reorder_threshold` SMALLINT     NOT NULL DEFAULT 5,
  `is_active`        TINYINT(1)    NOT NULL DEFAULT 1,
  `created_at`       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  CONSTRAINT `chk_inv_stock` CHECK (`qty_in_stock`     >= 0),
  CONSTRAINT `chk_reorder`   CHECK (`reorder_threshold` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `inventory_transactions` (
  `id`          VARCHAR(36)   NOT NULL,
  `item_id`     VARCHAR(36)   NOT NULL,
  `txn_type`    ENUM('restock','sale','adjustment','waste') NOT NULL,
  `qty_change`  SMALLINT      NOT NULL,
  `reference`   VARCHAR(100)  DEFAULT NULL,
  `recorded_by` VARCHAR(36)   DEFAULT NULL,
  `created_at`  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  INDEX `idx_itxn_item` (`item_id`),
  CONSTRAINT `fk_itxn_item` FOREIGN KEY (`item_id`)     REFERENCES `inventory_items`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_itxn_by`   FOREIGN KEY (`recorded_by`) REFERENCES `users`(`id`)          ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- 20. MESSAGES  (notifications, announcements, email queue — one table)
-- ============================================================================

CREATE TABLE IF NOT EXISTS `messages` (
  `id`           VARCHAR(36)  NOT NULL,
  `type`         ENUM('notification','announcement','email') NOT NULL,
  `channel`      ENUM('in_app','email','sms') NOT NULL DEFAULT 'in_app',
  `to_person_id` VARCHAR(36)  DEFAULT NULL,   -- NULL for announcements
  `target_role`  ENUM('admin','manager','trainer','member') DEFAULT NULL,
  `subject`      VARCHAR(255) DEFAULT NULL,
  `body`         TEXT         NOT NULL,
  `priority`     ENUM('low','normal','high','critical') NOT NULL DEFAULT 'normal',
  `status`       ENUM('pending','sent','read','failed') NOT NULL DEFAULT 'pending',
  `sent_by`      VARCHAR(36)  DEFAULT NULL,
  `created_at`   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  INDEX `idx_msg_person`    (`to_person_id`),
  INDEX `idx_msg_status`    (`status`),
  CONSTRAINT `fk_msg_person`  FOREIGN KEY (`to_person_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_msg_sender`  FOREIGN KEY (`sent_by`)      REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- 21. AUDIT_LOGS (admin activity / security trail)
-- ============================================================================
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id`           VARCHAR(36)   NOT NULL,
  `actor_id`     VARCHAR(36)   DEFAULT NULL,
  `actor_label`  VARCHAR(200)  DEFAULT NULL,
  `action`       VARCHAR(120)  NOT NULL,
  `category`     ENUM('member','payment','system','security','trainer','access','config') NOT NULL DEFAULT 'system',
  `entity_type`  VARCHAR(60)   DEFAULT NULL,
  `entity_id`    VARCHAR(36)   DEFAULT NULL,
  `detail`       VARCHAR(500)  DEFAULT NULL,
  `created_at`   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_audit_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- 22. AI_INTERACTIONS (chat/workout/insight audit)
-- ============================================================================
CREATE TABLE IF NOT EXISTS `ai_interactions` (
  `id`               VARCHAR(36)  NOT NULL,
  `user_id`          VARCHAR(36)  NOT NULL,
  `user_role`        ENUM('admin','manager','trainer','member') NOT NULL,
  `interaction_type` ENUM('chat','workout_plan','insight') NOT NULL,
  `prompt_text`      TEXT         DEFAULT NULL,
  `response_text`    TEXT         DEFAULT NULL,
  `source`           ENUM('rag','gemini','fallback') NOT NULL DEFAULT 'fallback',
  `metadata_json`    TEXT         DEFAULT NULL,
  `created_at`       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  INDEX `idx_ai_user` (`user_id`, `created_at`),
  INDEX `idx_ai_type` (`interaction_type`, `created_at`),
  CONSTRAINT `fk_ai_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- AI_CHAT_SESSIONS / AI_CHAT_MESSAGES
-- ============================================================================
CREATE TABLE IF NOT EXISTS `ai_chat_sessions` (
  `id`              VARCHAR(36)   NOT NULL,
  `user_id`         VARCHAR(36)   NOT NULL,
  `role`            ENUM('member','manager') NOT NULL,
  `title`           VARCHAR(140)  DEFAULT NULL,
  `last_message_at` TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at`      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      TIMESTAMP     NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_ai_chat_sessions_user_role` (`user_id`, `role`),
  INDEX `idx_ai_chat_sessions_last_message` (`last_message_at`),
  CONSTRAINT `fk_ai_chat_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ai_chat_messages` (
  `id`          VARCHAR(36)   NOT NULL,
  `session_id`  VARCHAR(36)   NOT NULL,
  `user_id`     VARCHAR(36)   NOT NULL,
  `role`        ENUM('user','assistant') NOT NULL,
  `source`      ENUM('rag','gemini','fallback','system') NOT NULL DEFAULT 'system',
  `content`     TEXT          NOT NULL,
  `created_at`  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_ai_chat_messages_session_created` (`session_id`, `created_at`),
  INDEX `idx_ai_chat_messages_user_created` (`user_id`, `created_at`),
  CONSTRAINT `fk_ai_chat_messages_session` FOREIGN KEY (`session_id`) REFERENCES `ai_chat_sessions`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ai_chat_messages_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- WORKOUT_SESSIONS / WORKOUT_SESSION_EVENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS `workout_sessions` (
  `id`             VARCHAR(36)  NOT NULL,
  `person_id`      VARCHAR(36)  NOT NULL,
  `plan_id`        VARCHAR(36)  DEFAULT NULL,
  `status`         ENUM('active','paused','completed','stopped') NOT NULL DEFAULT 'active',
  `started_at`     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ended_at`       TIMESTAMP    NULL DEFAULT NULL,
  `duration_min`   SMALLINT     DEFAULT NULL,
  `calories_burned` SMALLINT    DEFAULT NULL,
  `mood`           ENUM('great','good','okay','tired','poor') DEFAULT NULL,
  `notes`          TEXT         DEFAULT NULL,
  `created_at`     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     TIMESTAMP    NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_workout_sessions_person_status` (`person_id`, `status`),
  INDEX `idx_workout_sessions_started` (`started_at`),
  CONSTRAINT `fk_workout_sessions_person` FOREIGN KEY (`person_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_workout_sessions_plan` FOREIGN KEY (`plan_id`) REFERENCES `workout_plans`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `workout_session_events` (
  `id`           VARCHAR(36)  NOT NULL,
  `session_id`   VARCHAR(36)  NOT NULL,
  `person_id`    VARCHAR(36)  NOT NULL,
  `event_type`   ENUM('started','paused','resumed','exercise_started','set_completed','exercise_completed','stopped','completed','simulated') NOT NULL,
  `payload_json` TEXT         DEFAULT NULL,
  `created_at`   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_workout_session_events_session` (`session_id`, `created_at`),
  INDEX `idx_workout_session_events_person` (`person_id`, `created_at`),
  CONSTRAINT `fk_workout_session_events_session` FOREIGN KEY (`session_id`) REFERENCES `workout_sessions`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_workout_session_events_person` FOREIGN KEY (`person_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- 22. BRANCH_CLOSURES  (public holidays / emergency closure dates)
-- ============================================================================
-- Kept as its own table — it is a 1:many set of dates (cannot be a column).
-- When this system expands to multi-branch, add branch_id FK here first.

CREATE TABLE IF NOT EXISTS `branch_closures` (
  `id`           VARCHAR(36)  NOT NULL,
  `closure_date` DATE         NOT NULL,
  `reason`       VARCHAR(255) DEFAULT NULL,
  `is_emergency` TINYINT(1)   NOT NULL DEFAULT 0,
  `closed_by`    VARCHAR(36)  DEFAULT NULL,
  `created_at`   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_closure_date` (`closure_date`),
  CONSTRAINT `fk_closure_by` FOREIGN KEY (`closed_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- 22. EXERCISES  (exercise library)
-- ============================================================================
CREATE TABLE IF NOT EXISTS `exercises` (
  `id`                VARCHAR(36)   NOT NULL,
  `name`              VARCHAR(120)  NOT NULL,
  `muscle_group`      VARCHAR(60)   DEFAULT NULL,
  `equipment_needed`  VARCHAR(100)  DEFAULT NULL,
  `instructions`      TEXT          DEFAULT NULL,
  `difficulty`        ENUM('beginner','intermediate','advanced') DEFAULT NULL,
  `video_url`         VARCHAR(255)  DEFAULT NULL,
  `created_at`        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  INDEX `idx_ex_difficulty` (`difficulty`),
  INDEX `idx_ex_muscle`     (`muscle_group`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- 23. WORKOUT_PLAN_EXERCISES  (plan → exercise join with sets/reps per day)
-- ============================================================================
CREATE TABLE IF NOT EXISTS `workout_plan_exercises` (
  `id`           VARCHAR(36) NOT NULL,
  `plan_id`      VARCHAR(36) NOT NULL,
  `exercise_id`  VARCHAR(36) NOT NULL,
  `day_number`   TINYINT     NOT NULL,
  `sets`         TINYINT     DEFAULT NULL,
  `reps`         TINYINT     DEFAULT NULL,
  `duration_sec` SMALLINT    DEFAULT NULL,
  `rest_sec`     SMALLINT    DEFAULT NULL,
  `notes`        TEXT        DEFAULT NULL,
  `sort_order`   TINYINT     NOT NULL DEFAULT 0,

  PRIMARY KEY (`id`),
  INDEX `idx_wpe_plan`     (`plan_id`),
  INDEX `idx_wpe_exercise` (`exercise_id`),
  CONSTRAINT `fk_wpe_plan`     FOREIGN KEY (`plan_id`)     REFERENCES `workout_plans`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_wpe_exercise` FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`)     ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- 24. SHIFTS  (staff roster — separate from visits check-in/out log)
-- ============================================================================
CREATE TABLE IF NOT EXISTS `shifts` (
  `id`          VARCHAR(36)  NOT NULL,
  `staff_id`    VARCHAR(36)  NOT NULL,
  `shift_type`  ENUM('morning','afternoon','evening','full_day') NOT NULL,
  `shift_date`  DATE         NOT NULL,
  `start_time`  VARCHAR(8)   NOT NULL,
  `end_time`    VARCHAR(8)   NOT NULL,
  `status`      ENUM('scheduled','active','completed','missed','swapped') NOT NULL DEFAULT 'scheduled',
  `notes`       VARCHAR(255) DEFAULT NULL,
  `created_by`  VARCHAR(36)  DEFAULT NULL,
  `created_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  INDEX `idx_shift_staff` (`staff_id`),
  INDEX `idx_shift_date`  (`shift_date`),
  CONSTRAINT `fk_shift_staff`   FOREIGN KEY (`staff_id`)   REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_shift_creator` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- SCHEMA SUMMARY  —  24 tables
-- ============================================================================
--
-- Domain              Table(s)
-- ──────────────────  ─────────────────────────────────────────────────────
-- System config       config  (single branch — replaces branches table)
-- Identity & auth     users
-- Member extras       member_profiles, member_metrics, member_documents
-- Trainer extras      trainer_certifications
-- Staff scheduling    schedules  (recurring + overrides in one table)
-- Access              visits  (no gate table — one door)
-- Subscriptions       subscription_plans, subscriptions,
--                     subscription_freezes, promotions, payments
-- Fitness             workout_plans, workout_exercises, workout_logs
-- Personal training   pt_sessions  (notes + review as columns — 1:1)
-- Equipment           equipment, equipment_events
-- Inventory           inventory_items, inventory_transactions
-- Messaging           messages
-- Branch ops          branch_closures
--
-- Removed vs v2 (and why)
-- ────────────────────────
--  ✕ branches          → single branch; replaced by config key-value table
--  ✕ gates             → one entrance/exit; no gate FK needed on visits
--  ✕ staff_shifts      → merged into schedules (kind='recurring')
--  ✕ shift_overrides   → merged into schedules (kind='override')
--  ✕ pt_session_notes  → 1:1 with session; promoted to columns on pt_sessions
--  ✕ trainer_reviews   → 1:1 with session; promoted to columns on pt_sessions
--
-- Multi-branch migration path (when needed)
-- ──────────────────────────────────────────
--  1. Promote `config` to a `branches` table
--  2. Add branch_id FK to: people, visits, subscription_plans,
--     equipment, inventory_items, messages, branch_closures
--  That's it — no other schema changes required.
-- ============================================================================
