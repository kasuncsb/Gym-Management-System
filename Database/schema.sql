-- ============================================================================
-- Power World Gyms — Kiribathgoda Branch
-- Database Schema — Third Normal Form (3NF)
-- MySQL 8.0+
--
-- Aligned 1:1 with Backend/src/db/schema.ts (Drizzle ORM)
-- Tables: 44 | UUIDv4 PKs | Soft deletes | Audit columns | CHECK constraints
-- ============================================================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- ============================================================================
-- 1. CORE IDENTITY & AUTH (4 tables)
-- ============================================================================

CREATE TABLE IF NOT EXISTS `users` (
  `id`                          VARCHAR(36)     NOT NULL,
  `email`                       VARCHAR(255)    NOT NULL,
  `password_hash`               VARCHAR(255)    NOT NULL,
  `role`                        ENUM('admin','manager','staff','trainer','member') NOT NULL DEFAULT 'member',
  `full_name`                   VARCHAR(100)    NOT NULL,
  `phone`                       VARCHAR(20)     DEFAULT NULL,
  `date_of_birth`               DATE            DEFAULT NULL,
  `gender`                      ENUM('male','female','prefer_not_to_say') DEFAULT NULL,
  `avatar_url`                  VARCHAR(255)    DEFAULT NULL,
  `is_active`                   TINYINT(1)      NOT NULL DEFAULT 1,
  `is_email_verified`           TINYINT(1)      NOT NULL DEFAULT 0,
  `email_verification_token`    VARCHAR(255)    DEFAULT NULL,
  `email_verification_expires`  TIMESTAMP       NULL DEFAULT NULL,
  `password_reset_token`        VARCHAR(255)    DEFAULT NULL,
  `password_reset_expires`      TIMESTAMP       NULL DEFAULT NULL,
  `qr_code_secret`              VARCHAR(64)     DEFAULT NULL,
  `last_qr_generated_at`        TIMESTAMP       NULL DEFAULT NULL,
  `last_login_at`               TIMESTAMP       NULL DEFAULT NULL,
  `failed_login_attempts`       INT             NOT NULL DEFAULT 0,
  `locked_until`                TIMESTAMP       NULL DEFAULT NULL,
  `last_password_changed_at`    TIMESTAMP       NULL DEFAULT NULL,
  `preferred_language`          ENUM('en','si','ta') NOT NULL DEFAULT 'en',
  `two_factor_enabled`          TINYINT(1)      NOT NULL DEFAULT 0,
  `created_at`                  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`                  TIMESTAMP       NULL ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at`                  TIMESTAMP       NULL DEFAULT NULL,

  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`),
  INDEX `users_email_idx` (`email`),
  INDEX `users_role_idx` (`role`),
  INDEX `users_phone_idx` (`phone`),
  INDEX `idx_users_active` (`is_active`, `role`, `deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `refresh_tokens` (
  `id`          VARCHAR(36)     NOT NULL,
  `user_id`     VARCHAR(36)     NOT NULL,
  `token_hash`  VARCHAR(64)     NOT NULL,
  `device_info` VARCHAR(255)    DEFAULT NULL,
  `ip_address`  VARCHAR(45)     DEFAULT NULL,
  `expires_at`  TIMESTAMP       NOT NULL,
  `is_revoked`  TINYINT(1)      NOT NULL DEFAULT 0,
  `created_at`  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  INDEX `refresh_tokens_user_idx` (`user_id`),
  INDEX `refresh_tokens_token_idx` (`token_hash`),
  CONSTRAINT `fk_refresh_tokens_user`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `permissions` (
  `id`          VARCHAR(36)     NOT NULL,
  `code`        VARCHAR(50)     NOT NULL,
  `description` VARCHAR(255)    DEFAULT NULL,

  PRIMARY KEY (`id`),
  UNIQUE KEY `permissions_code_unique` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `role_permissions` (
  `role`            ENUM('admin','manager','staff','trainer','member') NOT NULL,
  `permission_code` VARCHAR(50) NOT NULL,

  UNIQUE KEY `role_perm_idx` (`role`, `permission_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 2. BRANCH CONFIGURATION (3 tables)
-- ============================================================================

CREATE TABLE IF NOT EXISTS `branches` (
  `id`                  VARCHAR(36)     NOT NULL,
  `name`                VARCHAR(100)    NOT NULL,
  `code`                VARCHAR(20)     NOT NULL,
  `address`             TEXT            NOT NULL,
  `phone`               VARCHAR(20)     DEFAULT NULL,
  `email`               VARCHAR(100)    DEFAULT NULL,
  `open_time`           TIME            NOT NULL DEFAULT '05:00:00',
  `close_time`          TIME            NOT NULL DEFAULT '22:00:00',
  `operating_days`      JSON            NOT NULL COMMENT 'Array of day strings, e.g. ["mon","tue","wed","thu","fri","sat"]',
  `capacity`            INT             DEFAULT 100,
  `grace_period_days`   INT             NOT NULL DEFAULT 3,
  `timezone`            VARCHAR(50)     NOT NULL DEFAULT 'Asia/Colombo',
  `facility_type`       ENUM('ac','non_ac','mixed') NOT NULL DEFAULT 'non_ac',
  `emergency_contact_phone` VARCHAR(20) DEFAULT NULL,
  `auto_close_time`     TIME            NOT NULL DEFAULT '23:00:00',
  `is_active`           TINYINT(1)      NOT NULL DEFAULT 1,
  `created_at`          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          TIMESTAMP       NULL ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `branches_code_unique` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `branch_closures` (
  `id`            VARCHAR(36)     NOT NULL,
  `branch_id`     VARCHAR(36)     NOT NULL,
  `closure_date`  DATE            NOT NULL,
  `reason`        VARCHAR(255)    DEFAULT NULL,
  `closed_by`     VARCHAR(36)     DEFAULT NULL,
  `is_emergency`  TINYINT(1)      NOT NULL DEFAULT 0,
  `created_at`    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `branch_closures_date_idx` (`branch_id`, `closure_date`),
  CONSTRAINT `fk_branch_closures_branch`
    FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_branch_closures_user`
    FOREIGN KEY (`closed_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `announcement_banners` (
  `id`            VARCHAR(36)     NOT NULL,
  `branch_id`     VARCHAR(36)     NOT NULL,
  `title`         VARCHAR(200)    NOT NULL,
  `message`       TEXT            NOT NULL,
  `target_roles`  JSON            DEFAULT NULL COMMENT 'Array of roles to show banner to',
  `priority`      ENUM('low','normal','high','critical') NOT NULL DEFAULT 'normal',
  `starts_at`     TIMESTAMP       NOT NULL,
  `ends_at`       TIMESTAMP       NULL DEFAULT NULL,
  `is_active`     TINYINT(1)      NOT NULL DEFAULT 1,
  `created_by`    VARCHAR(36)     DEFAULT NULL,
  `created_at`    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  CONSTRAINT `fk_announcement_banners_branch`
    FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_announcement_banners_user`
    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 3. MEMBER PROFILES (3 tables)
-- ============================================================================

CREATE TABLE IF NOT EXISTS `members` (
  `id`                      VARCHAR(36)     NOT NULL,
  `user_id`                 VARCHAR(36)     NOT NULL,
  `member_code`             VARCHAR(20)     NOT NULL,
  `nic_number`              VARCHAR(20)     DEFAULT NULL,
  `emergency_contact_name`  VARCHAR(100)    DEFAULT NULL,
  `emergency_contact_phone` VARCHAR(20)     DEFAULT NULL,
  `medical_conditions`      TEXT            DEFAULT NULL,
  `current_medications`     TEXT            DEFAULT NULL,
  `recent_surgeries`        TEXT            DEFAULT NULL,
  `allergies`               TEXT            DEFAULT NULL,
  `home_branch_id`          VARCHAR(36)     DEFAULT NULL,
  `join_date`               DATE            NOT NULL,
  `experience_level`        ENUM('beginner','intermediate','advanced','returning') DEFAULT NULL,
  `fitness_goals`           JSON            DEFAULT NULL COMMENT 'Array of goal strings',
  `assigned_trainer_id`     VARCHAR(36)     DEFAULT NULL,
  `referral_source`         ENUM('facebook','walk_in','friend','website','sampath_promo','other') DEFAULT NULL,
  `referred_by_member_id`   VARCHAR(36)     DEFAULT NULL,
  `blood_type`              ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-') DEFAULT NULL,
  `occupation`              VARCHAR(100)    DEFAULT NULL,
  `is_onboarded`            TINYINT(1)      NOT NULL DEFAULT 0,
  `onboarded_at`            TIMESTAMP       NULL DEFAULT NULL,
  `member_status`           ENUM('active','inactive','suspended','incomplete') NOT NULL DEFAULT 'active',
  `version`                 INT             NOT NULL DEFAULT 1,
  `deleted_at`              TIMESTAMP       NULL DEFAULT NULL,
  `created_at`              TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`              TIMESTAMP       NULL ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `members_code_unique` (`member_code`),
  INDEX `members_user_idx` (`user_id`),
  INDEX `members_code_idx` (`member_code`),
  INDEX `members_branch_idx` (`home_branch_id`),
  INDEX `members_trainer_idx` (`assigned_trainer_id`),
  INDEX `idx_members_branch_status` (`home_branch_id`, `member_status`),
  CONSTRAINT `fk_members_user`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_members_branch`
    FOREIGN KEY (`home_branch_id`) REFERENCES `branches`(`id`) ON DELETE SET NULL
  -- Note: assigned_trainer_id FK deferred (references trainers, created later)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `member_documents` (
  `id`                    VARCHAR(36)     NOT NULL,
  `member_id`             VARCHAR(36)     NOT NULL,
  `document_type`         ENUM('nic_front','nic_back','selfie_with_nic','student_id','other') NOT NULL,
  `storage_key`           VARCHAR(500)    NOT NULL,
  `original_filename`     VARCHAR(255)    DEFAULT NULL,
  `mime_type`             VARCHAR(50)     DEFAULT NULL,
  `file_size_bytes`       INT             DEFAULT NULL,
  `verification_status`   ENUM('pending_review','verified','rejected') NOT NULL DEFAULT 'pending_review',
  `rejection_reason`      ENUM('blurry','incomplete','mismatch','expired_nic','wrong_document','custom') DEFAULT NULL,
  `rejection_note`        TEXT            DEFAULT NULL,
  `reviewed_by`           VARCHAR(36)     DEFAULT NULL,
  `reviewed_at`           TIMESTAMP       NULL DEFAULT NULL,
  `uploaded_at`           TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  INDEX `member_docs_member_idx` (`member_id`),
  INDEX `member_docs_status_idx` (`verification_status`),
  CONSTRAINT `fk_member_docs_member`
    FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_member_docs_reviewer`
    FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `member_metrics` (
  `id`                    VARCHAR(36)     NOT NULL,
  `member_id`             VARCHAR(36)     NOT NULL,
  `recorded_at`           TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `weight`                DECIMAL(5,2)    DEFAULT NULL COMMENT 'kg',
  `height`                DECIMAL(5,2)    DEFAULT NULL COMMENT 'cm',
  `body_fat_percentage`   DECIMAL(4,1)    DEFAULT NULL COMMENT '%',
  `muscle_mass`           DECIMAL(5,2)    DEFAULT NULL COMMENT 'kg',
  `bmi`                   DECIMAL(4,1)    DEFAULT NULL COMMENT 'auto-calculated',
  `resting_heart_rate`    INT             DEFAULT NULL COMMENT 'bpm',
  `waist_circumference`   DECIMAL(5,1)    DEFAULT NULL COMMENT 'cm',
  `chest_circumference`   DECIMAL(5,1)    DEFAULT NULL COMMENT 'cm',
  `metrics_source`        ENUM('manual','trainer','health_connect') NOT NULL DEFAULT 'manual',
  `notes`                 TEXT            DEFAULT NULL,
  `recorded_by`           VARCHAR(36)     DEFAULT NULL,

  PRIMARY KEY (`id`),
  INDEX `member_metrics_member_idx` (`member_id`),
  INDEX `member_metrics_date_idx` (`recorded_at`),
  CONSTRAINT `fk_member_metrics_member`
    FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_member_metrics_recorder`
    FOREIGN KEY (`recorded_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 4. STAFF & TRAINER PROFILES (2 tables)
-- ============================================================================

CREATE TABLE IF NOT EXISTS `staff` (
  `id`              VARCHAR(36)     NOT NULL,
  `user_id`         VARCHAR(36)     NOT NULL,
  `employee_code`   VARCHAR(20)     NOT NULL,
  `designation`     VARCHAR(100)    DEFAULT NULL,
  `branch_id`       VARCHAR(36)     DEFAULT NULL,
  `hire_date`       DATE            NOT NULL,
  `base_salary`     DECIMAL(10,2)   DEFAULT NULL,
  `is_key_holder`   TINYINT(1)      NOT NULL DEFAULT 0,
  `staff_status`    ENUM('active','inactive','on_leave','terminated') NOT NULL DEFAULT 'active',
  `version`         INT             NOT NULL DEFAULT 1,
  `deleted_at`      TIMESTAMP       NULL DEFAULT NULL,
  `created_at`      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      TIMESTAMP       NULL ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `staff_code_unique` (`employee_code`),
  INDEX `staff_user_idx` (`user_id`),
  INDEX `staff_code_idx` (`employee_code`),
  INDEX `staff_branch_idx` (`branch_id`),
  CONSTRAINT `fk_staff_user`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_staff_branch`
    FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `trainers` (
  `id`                  VARCHAR(36)     NOT NULL,
  `user_id`             VARCHAR(36)     NOT NULL,
  `staff_id`            VARCHAR(36)     DEFAULT NULL,
  `specialization`      VARCHAR(100)    DEFAULT NULL,
  `bio`                 TEXT            DEFAULT NULL,
  `certifications`      JSON            DEFAULT NULL COMMENT 'Array of {name, issuingBody, year}',
  `years_of_experience` INT             DEFAULT NULL,
  `hourly_rate`         DECIMAL(8,2)    DEFAULT NULL,
  `rating`              DECIMAL(3,2)    DEFAULT 5.00,
  `max_clients`         INT             DEFAULT 20,
  `branch_id`           VARCHAR(36)     DEFAULT NULL,
  `trainer_status`      ENUM('active','inactive','on_leave') NOT NULL DEFAULT 'active',
  `deleted_at`          TIMESTAMP       NULL DEFAULT NULL,
  `created_at`          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          TIMESTAMP       NULL ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  INDEX `trainers_user_idx` (`user_id`),
  INDEX `trainers_staff_idx` (`staff_id`),
  INDEX `trainers_branch_idx` (`branch_id`),
  CONSTRAINT `fk_trainers_user`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_trainers_staff`
    FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_trainers_branch`
    FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Deferred FK: members.assigned_trainer_id -> trainers.id
ALTER TABLE `members`
  ADD CONSTRAINT `fk_members_trainer`
    FOREIGN KEY (`assigned_trainer_id`) REFERENCES `trainers`(`id`) ON DELETE SET NULL;

-- ============================================================================
-- 5. SHIFT MANAGEMENT & TIME TRACKING (2 tables)
-- ============================================================================

CREATE TABLE IF NOT EXISTS `staff_shifts` (
  `id`              VARCHAR(36)     NOT NULL,
  `staff_id`        VARCHAR(36)     NOT NULL,
  `day_of_week`     ENUM('mon','tue','wed','thu','fri','sat') NOT NULL,
  `shift_start`     TIME            NOT NULL,
  `shift_end`       TIME            NOT NULL,
  `shift_type`      ENUM('morning','evening','split','cover') NOT NULL DEFAULT 'morning',
  `is_active`       TINYINT(1)      NOT NULL DEFAULT 1,
  `effective_from`  DATE            NOT NULL,
  `effective_until`  DATE           DEFAULT NULL,
  `break_duration_minutes` INT      DEFAULT 60,
  `shift_notes`     VARCHAR(255)    DEFAULT NULL,
  `created_at`      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  INDEX `staff_shifts_staff_idx` (`staff_id`),
  INDEX `staff_shifts_active_idx` (`is_active`),
  CONSTRAINT `fk_staff_shifts_staff`
    FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `shift_overrides` (
  `id`              VARCHAR(36)     NOT NULL,
  `staff_id`        VARCHAR(36)     NOT NULL,
  `override_date`   DATE            NOT NULL,
  `override_type`   ENUM('day_off','extra_shift','modified_hours') NOT NULL,
  `shift_start`     TIME            DEFAULT NULL,
  `shift_end`       TIME            DEFAULT NULL,
  `reason`          VARCHAR(255)    DEFAULT NULL,
  `approved_by`     VARCHAR(36)     DEFAULT NULL,
  `created_at`      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `shift_override_staff_date_idx` (`staff_id`, `override_date`),
  CONSTRAINT `fk_shift_overrides_staff`
    FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_shift_overrides_approver`
    FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 6. PHYSICAL ACCESS CONTROL — QR (4 tables)
-- ============================================================================

CREATE TABLE IF NOT EXISTS `zones` (
  `id`          VARCHAR(36)     NOT NULL,
  `branch_id`   VARCHAR(36)     NOT NULL,
  `name`        VARCHAR(50)     NOT NULL,
  `capacity`    INT             DEFAULT NULL,
  `created_at`  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  CONSTRAINT `fk_zones_branch`
    FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `gates` (
  `id`              VARCHAR(36)     NOT NULL,
  `zone_id`         VARCHAR(36)     DEFAULT NULL,
  `name`            VARCHAR(50)     DEFAULT NULL,
  `device_id`       VARCHAR(50)     DEFAULT NULL,
  `ip_address`      VARCHAR(50)     DEFAULT NULL,
  `last_heartbeat`  TIMESTAMP       NULL DEFAULT NULL,
  `gate_status`     ENUM('active','inactive','maintenance') NOT NULL DEFAULT 'active',
  `created_at`      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `gates_device_unique` (`device_id`),
  CONSTRAINT `fk_gates_zone`
    FOREIGN KEY (`zone_id`) REFERENCES `zones`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `visit_sessions` (
  `id`                      VARCHAR(36)     NOT NULL,
  `user_id`                 VARCHAR(36)     NOT NULL,
  `branch_id`               VARCHAR(36)     NOT NULL,
  `check_in_at`             TIMESTAMP       NOT NULL,
  `check_out_at`            TIMESTAMP       NULL DEFAULT NULL,
  `duration_minutes`        INT             DEFAULT NULL,
  `session_status`          ENUM('active','completed','auto_closed','cancelled') NOT NULL DEFAULT 'active',
  `visit_type`              ENUM('member_visit','staff_shift','manager_visit','admin_visit') NOT NULL,
  `is_auto_close_processed` TINYINT(1)      NOT NULL DEFAULT 0,
  `created_at`              TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  INDEX `visit_sessions_user_idx` (`user_id`),
  INDEX `visit_sessions_branch_idx` (`branch_id`),
  INDEX `visit_sessions_status_idx` (`session_status`),
  INDEX `visit_sessions_checkin_idx` (`check_in_at`),
  INDEX `idx_visits_branch_status_checkin` (`branch_id`, `session_status`, `check_in_at`),
  CONSTRAINT `fk_visit_sessions_user`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_visit_sessions_branch`
    FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `access_logs` (
  `id`              VARCHAR(36)     NOT NULL,
  `user_id`         VARCHAR(36)     NOT NULL,
  `gate_id`         VARCHAR(36)     DEFAULT NULL,
  `session_id`      VARCHAR(36)     DEFAULT NULL,
  `scanned_at`      TIMESTAMP       NOT NULL,
  `direction`       ENUM('in','out') NOT NULL,
  `is_authorized`   TINYINT(1)      NOT NULL,
  `deny_reason`     VARCHAR(100)    DEFAULT NULL,
  `is_synthetic`    TINYINT(1)      NOT NULL DEFAULT 0,
  `metadata`        JSON            DEFAULT NULL COMMENT 'Extensible key-value pairs (grace_warning, etc.)',
  `created_at`      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      TIMESTAMP       NULL ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  INDEX `access_logs_user_idx` (`user_id`),
  INDEX `access_logs_session_idx` (`session_id`),
  INDEX `access_logs_scanned_idx` (`scanned_at`),
  INDEX `access_logs_direction_idx` (`direction`),
  INDEX `idx_access_user_time` (`user_id`, `scanned_at`),
  CONSTRAINT `fk_access_logs_user`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_access_logs_gate`
    FOREIGN KEY (`gate_id`) REFERENCES `gates`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_access_logs_session`
    FOREIGN KEY (`session_id`) REFERENCES `visit_sessions`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 7. SUBSCRIPTIONS & PAYMENTS (4 tables)
-- ============================================================================

CREATE TABLE IF NOT EXISTS `subscription_plans` (
  `id`                    VARCHAR(36)     NOT NULL,
  `plan_code`             VARCHAR(30)     NOT NULL,
  `name`                  VARCHAR(100)    NOT NULL,
  `description`           TEXT            DEFAULT NULL,
  `plan_type`             ENUM('individual','couple','student','corporate','daily_pass') NOT NULL DEFAULT 'individual',
  `price`                 DECIMAL(10,2)   NOT NULL COMMENT 'LKR',
  `duration_days`         INT             NOT NULL,
  `features`              JSON            DEFAULT NULL COMMENT 'Array of feature strings',
  `included_pt_sessions`  INT             NOT NULL DEFAULT 0,
  `max_members`           INT             NOT NULL DEFAULT 1 COMMENT '1 = individual, 2 = couple',
  `requires_document`     VARCHAR(50)     DEFAULT NULL COMMENT 'e.g. student_id',
  `min_age`               INT             DEFAULT NULL,
  `max_age`               INT             DEFAULT NULL,
  `branch_id`             VARCHAR(36)     DEFAULT NULL,
  `is_active`             TINYINT(1)      NOT NULL DEFAULT 1,
  `sort_order`            INT             NOT NULL DEFAULT 0,
  `version`               INT             NOT NULL DEFAULT 1,
  `created_at`            TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`            TIMESTAMP       NULL ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at`            TIMESTAMP       NULL DEFAULT NULL,

  PRIMARY KEY (`id`),
  UNIQUE KEY `sub_plans_code_unique` (`plan_code`),
  CONSTRAINT `fk_sub_plans_branch`
    FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `subscriptions` (
  `id`                      VARCHAR(36)     NOT NULL,
  `member_id`               VARCHAR(36)     NOT NULL,
  `plan_id`                 VARCHAR(36)     NOT NULL,
  `start_date`              DATE            NOT NULL,
  `end_date`                DATE            NOT NULL,
  `subscription_status`     ENUM('pending_payment','active','frozen','expired','grace_period','inactive','cancelled') NOT NULL DEFAULT 'pending_payment',
  `price_paid`              DECIMAL(10,2)   DEFAULT NULL COMMENT 'Actual amount paid (after discounts)',
  `original_price`          DECIMAL(10,2)   DEFAULT NULL COMMENT 'Plan price at time of purchase',
  `discount_amount`         DECIMAL(10,2)   DEFAULT 0.00,
  `promotion_id`            VARCHAR(36)     DEFAULT NULL,
  `renewed_from_id`         VARCHAR(36)     DEFAULT NULL,
  `grace_expires_at`        DATE            DEFAULT NULL,
  `plan_snapshot`           JSON            DEFAULT NULL COMMENT 'Snapshot of plan details at purchase time',
  `pt_sessions_remaining`   INT             NOT NULL DEFAULT 0,
  `auto_renew`              TINYINT(1)      NOT NULL DEFAULT 0,
  `notes`                   TEXT            DEFAULT NULL,
  `version`                 INT             NOT NULL DEFAULT 1,
  `created_at`              TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`              TIMESTAMP       NULL ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at`              TIMESTAMP       NULL DEFAULT NULL,

  PRIMARY KEY (`id`),
  INDEX `subscriptions_member_idx` (`member_id`),
  INDEX `subscriptions_status_idx` (`subscription_status`),
  INDEX `subscriptions_end_date_idx` (`end_date`),
  INDEX `idx_sub_member_status` (`member_id`, `subscription_status`),
  CONSTRAINT `fk_subscriptions_member`
    FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_subscriptions_plan`
    FOREIGN KEY (`plan_id`) REFERENCES `subscription_plans`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `subscription_freezes` (
  `id`                  VARCHAR(36)     NOT NULL,
  `subscription_id`     VARCHAR(36)     NOT NULL,
  `freeze_start`        DATE            NOT NULL,
  `freeze_end`          DATE            NOT NULL,
  `actual_unfreeze_date` DATE           DEFAULT NULL,
  `reason`              VARCHAR(255)    DEFAULT NULL,
  `requested_by`        VARCHAR(36)     DEFAULT NULL,
  `created_at`          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          TIMESTAMP       NULL ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  INDEX `sub_freezes_sub_idx` (`subscription_id`),
  CONSTRAINT `fk_sub_freezes_subscription`
    FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_sub_freezes_requester`
    FOREIGN KEY (`requested_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `payments` (
  `id`                VARCHAR(36)     NOT NULL,
  `member_id`         VARCHAR(36)     NOT NULL,
  `subscription_id`   VARCHAR(36)     DEFAULT NULL,
  `amount`            DECIMAL(10,2)   NOT NULL COMMENT 'LKR',
  `payment_method`    ENUM('cash','card','bank_transfer','online') NOT NULL,
  `reference_number`  VARCHAR(100)    DEFAULT NULL,
  `receipt_number`    VARCHAR(50)     DEFAULT NULL,
  `card_type`         VARCHAR(50)     DEFAULT NULL,
  `card_last_four`    VARCHAR(4)      DEFAULT NULL,
  `promotion_id`      VARCHAR(36)     DEFAULT NULL,
  `discount_amount`   DECIMAL(10,2)   DEFAULT 0.00,
  `payment_date`      DATE            NOT NULL,
  `payment_status`    ENUM('completed','partially_refunded','refunded','disputed') NOT NULL DEFAULT 'completed',
  `refund_amount`     DECIMAL(10,2)   DEFAULT NULL,
  `refunded_at`       TIMESTAMP       NULL DEFAULT NULL,
  `refund_reason`     VARCHAR(255)    DEFAULT NULL,
  `original_payment_id` VARCHAR(36)   DEFAULT NULL,
  `recorded_by`       VARCHAR(36)     DEFAULT NULL,
  `notes`             TEXT            DEFAULT NULL COMMENT 'Discount details, Sampath card 10%, etc.',
  `created_at`        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        TIMESTAMP       NULL ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `payments_receipt_unique` (`receipt_number`),
  INDEX `payments_member_idx` (`member_id`),
  INDEX `payments_sub_idx` (`subscription_id`),
  INDEX `payments_date_idx` (`payment_date`),
  INDEX `idx_pay_date_method` (`payment_date`, `payment_method`),
  CONSTRAINT `fk_payments_member`
    FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_payments_subscription`
    FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_payments_recorder`
    FOREIGN KEY (`recorded_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 8. WORKOUTS & FITNESS (3 tables)
-- ============================================================================

CREATE TABLE IF NOT EXISTS `workout_plans` (
  `id`                VARCHAR(36)     NOT NULL,
  `member_id`         VARCHAR(36)     DEFAULT NULL COMMENT 'NULL = curated library template',
  `trainer_id`        VARCHAR(36)     DEFAULT NULL,
  `plan_name`         VARCHAR(150)    NOT NULL,
  `plan_description`  TEXT            DEFAULT NULL,
  `plan_source`       ENUM('ai_generated','trainer_created','curated_library') NOT NULL,
  `duration_weeks`    INT             NOT NULL,
  `days_per_week`     INT             NOT NULL,
  `plan_difficulty`   ENUM('beginner','intermediate','advanced') DEFAULT NULL,
  `category`          VARCHAR(50)     DEFAULT NULL,
  `plan_data`         JSON            DEFAULT NULL COMMENT 'AI prompt context, generation metadata',
  `is_active`         TINYINT(1)      NOT NULL DEFAULT 1,
  `started_at`        DATE            DEFAULT NULL,
  `completed_at`      DATE            DEFAULT NULL,
  `ai_model_used`     VARCHAR(50)     DEFAULT NULL,
  `ai_prompt_hash`    VARCHAR(64)     DEFAULT NULL,
  `created_at`        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        TIMESTAMP       NULL ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  INDEX `workout_plans_member_idx` (`member_id`),
  INDEX `workout_plans_trainer_idx` (`trainer_id`),
  INDEX `workout_plans_source_idx` (`plan_source`),
  CONSTRAINT `fk_workout_plans_member`
    FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_workout_plans_trainer`
    FOREIGN KEY (`trainer_id`) REFERENCES `trainers`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `workout_exercises` (
  `id`              VARCHAR(36)     NOT NULL,
  `plan_id`         VARCHAR(36)     NOT NULL,
  `day_number`      INT             NOT NULL,
  `exercise_order`  INT             NOT NULL,
  `exercise_name`   VARCHAR(100)    NOT NULL,
  `sets`            INT             DEFAULT NULL,
  `reps`            VARCHAR(50)     DEFAULT NULL COMMENT 'e.g. "8-12" or "30 sec"',
  `rest_seconds`    INT             DEFAULT NULL,
  `notes`           TEXT            DEFAULT NULL COMMENT 'Form tips, safety notes',
  `equipment`       VARCHAR(100)    DEFAULT NULL,
  `muscle_groups`   JSON            DEFAULT NULL COMMENT 'Array of muscle group strings',
  `created_at`      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  INDEX `workout_exercises_plan_idx` (`plan_id`),
  CONSTRAINT `fk_workout_exercises_plan`
    FOREIGN KEY (`plan_id`) REFERENCES `workout_plans`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `workout_logs` (
  `id`                VARCHAR(36)     NOT NULL,
  `member_id`         VARCHAR(36)     NOT NULL,
  `plan_id`           VARCHAR(36)     DEFAULT NULL,
  `workout_date`      DATE            NOT NULL,
  `exercises`         JSON            DEFAULT NULL COMMENT 'Array of {exerciseName, actualSets, actualReps, weight}',
  `duration_minutes`  INT             DEFAULT NULL,
  `workout_mood`      ENUM('great','good','okay','tired','poor') DEFAULT NULL,
  `calories_burned`   INT             DEFAULT NULL,
  `notes`             TEXT            DEFAULT NULL,
  `created_at`        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  INDEX `workout_logs_member_idx` (`member_id`),
  INDEX `workout_logs_date_idx` (`workout_date`),
  INDEX `idx_wlogs_member_date` (`member_id`, `workout_date`),
  CONSTRAINT `fk_workout_logs_member`
    FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_workout_logs_plan`
    FOREIGN KEY (`plan_id`) REFERENCES `workout_plans`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 9. TRAINER AVAILABILITY & PERSONAL TRAINING (3 tables)
-- ============================================================================

CREATE TABLE IF NOT EXISTS `trainer_availability` (
  `id`                      VARCHAR(36)     NOT NULL,
  `trainer_id`              VARCHAR(36)     NOT NULL,
  `available_date`          DATE            NOT NULL,
  `start_time`              TIME            NOT NULL,
  `end_time`                TIME            NOT NULL,
  `slot_duration_minutes`   INT             NOT NULL DEFAULT 60,
  `created_at`              TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`              TIMESTAMP       NULL ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  INDEX `trainer_avail_trainer_date_idx` (`trainer_id`, `available_date`),
  CONSTRAINT `fk_trainer_avail_trainer`
    FOREIGN KEY (`trainer_id`) REFERENCES `trainers`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `training_sessions` (
  `id`                  VARCHAR(36)     NOT NULL,
  `member_id`           VARCHAR(36)     NOT NULL,
  `trainer_id`          VARCHAR(36)     NOT NULL,
  `session_date`        DATE            NOT NULL,
  `start_time`          TIME            NOT NULL,
  `end_time`            TIME            NOT NULL,
  `training_session_status` ENUM('booked','confirmed','in_progress','completed','cancelled_by_member','cancelled_by_trainer','no_show') NOT NULL DEFAULT 'booked',
  `cancelled_at`        TIMESTAMP       NULL DEFAULT NULL,
  `cancellation_reason` VARCHAR(255)    DEFAULT NULL,
  `created_at`          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          TIMESTAMP       NULL ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `training_sessions_trainer_slot_idx` (`trainer_id`, `session_date`, `start_time`),
  INDEX `training_sessions_member_idx` (`member_id`),
  INDEX `training_sessions_trainer_idx` (`trainer_id`),
  INDEX `training_sessions_date_idx` (`session_date`),
  INDEX `idx_tsess_trainer_date_status` (`trainer_id`, `session_date`, `training_session_status`),
  CONSTRAINT `fk_training_sessions_member`
    FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_training_sessions_trainer`
    FOREIGN KEY (`trainer_id`) REFERENCES `trainers`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `session_notes` (
  `id`                    VARCHAR(36)     NOT NULL,
  `session_id`            VARCHAR(36)     NOT NULL,
  `trainer_id`            VARCHAR(36)     NOT NULL,
  `performance_rating`    INT             DEFAULT NULL COMMENT '1-5 scale',
  `exercises_completed`   JSON            DEFAULT NULL COMMENT 'Array of exercise strings',
  `weight_progression`    TEXT            DEFAULT NULL,
  `areas_of_concern`      TEXT            DEFAULT NULL,
  `recommendations`       TEXT            DEFAULT NULL,
  `next_session_focus`    TEXT            DEFAULT NULL,
  `created_at`            TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  INDEX `session_notes_session_idx` (`session_id`),
  CONSTRAINT `fk_session_notes_session`
    FOREIGN KEY (`session_id`) REFERENCES `training_sessions`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_session_notes_trainer`
    FOREIGN KEY (`trainer_id`) REFERENCES `trainers`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 10. EQUIPMENT & INVENTORY (5 tables)
-- ============================================================================

CREATE TABLE IF NOT EXISTS `equipment` (
  `id`                        VARCHAR(36)     NOT NULL,
  `branch_id`                 VARCHAR(36)     NOT NULL,
  `name`                      VARCHAR(100)    NOT NULL,
  `equipment_category`        ENUM('cardio','strength_machine','free_weight','bench','accessory','other') NOT NULL,
  `manufacturer`              VARCHAR(100)    DEFAULT NULL,
  `model`                     VARCHAR(100)    DEFAULT NULL,
  `serial_number`             VARCHAR(100)    DEFAULT NULL,
  `purchase_date`             DATE            DEFAULT NULL,
  `purchase_price`            DECIMAL(10,2)   DEFAULT NULL COMMENT 'LKR',
  `warranty_expiry`           DATE            DEFAULT NULL,
  `asset_tag`                 VARCHAR(50)     DEFAULT NULL,
  `expected_lifespan_years`   INT             DEFAULT NULL,
  `depreciated_value`         DECIMAL(10,2)   DEFAULT NULL COMMENT 'Current book value LKR',
  `quantity`                  INT             NOT NULL DEFAULT 1,
  `equipment_status`          ENUM('operational','needs_maintenance','under_maintenance','retired') NOT NULL DEFAULT 'operational',
  `location_zone`             VARCHAR(50)     DEFAULT NULL,
  `last_maintenance_date`     DATE            DEFAULT NULL,
  `next_maintenance_due`      DATE            DEFAULT NULL,
  `maintenance_interval_days` INT             DEFAULT NULL,
  `notes`                     TEXT            DEFAULT NULL,
  `qr_code`                   VARCHAR(100)    DEFAULT NULL,
  `version`                   INT             NOT NULL DEFAULT 1,
  `created_at`                TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`                TIMESTAMP       NULL ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `equipment_asset_tag_unique` (`asset_tag`),
  INDEX `equipment_branch_idx` (`branch_id`),
  INDEX `equipment_status_idx` (`equipment_status`),
  CONSTRAINT `fk_equipment_branch`
    FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `equipment_issues` (
  `id`              VARCHAR(36)     NOT NULL,
  `equipment_id`    VARCHAR(36)     NOT NULL,
  `reported_by`     VARCHAR(36)     NOT NULL,
  `issue_type`      ENUM('malfunction','damage','noise','safety_concern','missing_part','other') NOT NULL,
  `issue_severity`  ENUM('low','medium','high','critical') NOT NULL,
  `description`     TEXT            NOT NULL,
  `photo_url`       VARCHAR(500)    DEFAULT NULL,
  `issue_status`    ENUM('open','in_progress','resolved','dismissed') NOT NULL DEFAULT 'open',
  `resolved_by`     VARCHAR(36)     DEFAULT NULL,
  `resolved_at`     TIMESTAMP       NULL DEFAULT NULL,
  `resolution_note` TEXT            DEFAULT NULL,
  `created_at`      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  INDEX `equip_issues_equipment_idx` (`equipment_id`),
  INDEX `equip_issues_status_idx` (`issue_status`),
  INDEX `idx_equip_issues_status_sev` (`issue_status`, `issue_severity`),
  CONSTRAINT `fk_equip_issues_equipment`
    FOREIGN KEY (`equipment_id`) REFERENCES `equipment`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_equip_issues_reporter`
    FOREIGN KEY (`reported_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_equip_issues_resolver`
    FOREIGN KEY (`resolved_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `maintenance_logs` (
  `id`                  VARCHAR(36)     NOT NULL,
  `equipment_id`        VARCHAR(36)     NOT NULL,
  `issue_id`            VARCHAR(36)     DEFAULT NULL,
  `description`         TEXT            NOT NULL,
  `cost`                DECIMAL(10,2)   DEFAULT NULL COMMENT 'LKR',
  `performed_by`        VARCHAR(100)    DEFAULT NULL COMMENT 'Name (may be external vendor)',
  `is_external_vendor`  TINYINT(1)      NOT NULL DEFAULT 0,
  `duration_hours`      DECIMAL(4,1)    DEFAULT NULL,
  `parts_replaced`      TEXT            DEFAULT NULL,
  `status_after`        ENUM('operational','needs_more_work') NOT NULL,
  `performed_at`        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `logged_by`           VARCHAR(36)     DEFAULT NULL,

  PRIMARY KEY (`id`),
  INDEX `maint_logs_equipment_idx` (`equipment_id`),
  CONSTRAINT `fk_maint_logs_equipment`
    FOREIGN KEY (`equipment_id`) REFERENCES `equipment`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_maint_logs_issue`
    FOREIGN KEY (`issue_id`) REFERENCES `equipment_issues`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_maint_logs_logger`
    FOREIGN KEY (`logged_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `inventory_items` (
  `id`                  VARCHAR(36)     NOT NULL,
  `branch_id`           VARCHAR(36)     NOT NULL,
  `name`                VARCHAR(100)    NOT NULL,
  `category`            VARCHAR(50)     NOT NULL,
  `sku`                 VARCHAR(50)     DEFAULT NULL,
  `quantity_in_stock`   INT             NOT NULL DEFAULT 0,
  `reorder_threshold`   INT             NOT NULL DEFAULT 5,
  `unit_cost`           DECIMAL(10,2)   DEFAULT NULL COMMENT 'LKR',
  `selling_price`       DECIMAL(10,2)   DEFAULT NULL COMMENT 'LKR',
  `supplier`            VARCHAR(100)    DEFAULT NULL,
  `last_restocked_at`   TIMESTAMP       NULL DEFAULT NULL,
  `is_active`           TINYINT(1)      NOT NULL DEFAULT 1,
  `created_at`          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          TIMESTAMP       NULL ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  INDEX `inventory_items_branch_idx` (`branch_id`),
  INDEX `inventory_items_category_idx` (`category`),
  CONSTRAINT `fk_inventory_items_branch`
    FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `inventory_transactions` (
  `id`              VARCHAR(36)     NOT NULL,
  `item_id`         VARCHAR(36)     NOT NULL,
  `change_amount`   INT             NOT NULL COMMENT 'Positive = restock, Negative = sale/damage',
  `transaction_reason` ENUM('sale','restock','damage','adjustment','expired') NOT NULL,
  `member_id`       VARCHAR(36)     DEFAULT NULL COMMENT 'For sales to members',
  `recorded_by`     VARCHAR(36)     DEFAULT NULL,
  `notes`           TEXT            DEFAULT NULL,
  `created_at`      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  INDEX `inv_transactions_item_idx` (`item_id`),
  CONSTRAINT `fk_inv_transactions_item`
    FOREIGN KEY (`item_id`) REFERENCES `inventory_items`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_inv_transactions_member`
    FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_inv_transactions_recorder`
    FOREIGN KEY (`recorded_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 11. NOTIFICATIONS (1 table)
-- ============================================================================

CREATE TABLE IF NOT EXISTS `notifications` (
  `id`                      VARCHAR(36)     NOT NULL,
  `user_id`                 VARCHAR(36)     NOT NULL,
  `title`                   VARCHAR(200)    NOT NULL,
  `body`                    TEXT            NOT NULL,
  `type`                    VARCHAR(50)     NOT NULL COMMENT 'e.g. subscription_expiry, session_booked, equipment_alert',
  `notification_priority`   ENUM('low','normal','high','critical') NOT NULL DEFAULT 'normal',
  `action_url`              VARCHAR(255)    DEFAULT NULL,
  `is_read`                 TINYINT(1)      NOT NULL DEFAULT 0,
  `read_at`                 TIMESTAMP       NULL DEFAULT NULL,
  `created_at`              TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  INDEX `notifications_user_idx` (`user_id`),
  INDEX `notifications_read_idx` (`is_read`),
  INDEX `notifications_type_idx` (`type`),
  INDEX `idx_notif_user_unread` (`user_id`, `is_read`, `created_at`),
  CONSTRAINT `fk_notifications_user`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 12. SYSTEM & AUDIT (3 tables)
-- ============================================================================

CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id`          VARCHAR(36)     NOT NULL,
  `actor_id`    VARCHAR(36)     DEFAULT NULL,
  `action`      VARCHAR(100)    NOT NULL COMMENT 'e.g. member.subscription.created',
  `target_type` VARCHAR(50)     DEFAULT NULL COMMENT 'e.g. subscription, member, equipment',
  `target_id`   VARCHAR(36)     DEFAULT NULL,
  `changes`     JSON            DEFAULT NULL COMMENT '{ before: {...}, after: {...} }',
  `ip_address`  VARCHAR(45)     DEFAULT NULL,
  `user_agent`  VARCHAR(255)    DEFAULT NULL,
  `created_at`  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  INDEX `audit_logs_actor_idx` (`actor_id`),
  INDEX `audit_logs_action_idx` (`action`),
  INDEX `audit_logs_target_idx` (`target_type`, `target_id`),
  INDEX `audit_logs_date_idx` (`created_at`),
  CONSTRAINT `fk_audit_logs_actor`
    FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `system_config` (
  `key`         VARCHAR(100)    NOT NULL,
  `value`       TEXT            NOT NULL,
  `description` VARCHAR(255)    DEFAULT NULL,
  `updated_by`  VARCHAR(36)     DEFAULT NULL,
  `updated_at`  TIMESTAMP       NULL ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`key`),
  CONSTRAINT `fk_system_config_updater`
    FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `cron_job_runs` (
  `id`              VARCHAR(36)     NOT NULL,
  `job_name`        VARCHAR(100)    NOT NULL,
  `started_at`      TIMESTAMP       NOT NULL,
  `completed_at`    TIMESTAMP       NULL DEFAULT NULL,
  `cron_status`     ENUM('running','completed','failed') NOT NULL,
  `result`          JSON            DEFAULT NULL,
  `error_message`   TEXT            DEFAULT NULL,

  PRIMARY KEY (`id`),
  INDEX `cron_runs_job_idx` (`job_name`),
  INDEX `cron_runs_date_idx` (`started_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 13. PROMOTIONS & DISCOUNTS (1 table)
-- ============================================================================

CREATE TABLE IF NOT EXISTS `promotions` (
  `id`                  VARCHAR(36)     NOT NULL,
  `code`                VARCHAR(50)     NOT NULL,
  `name`                VARCHAR(100)    NOT NULL,
  `discount_type`       ENUM('percentage','fixed_amount') NOT NULL,
  `discount_value`      DECIMAL(10,2)   NOT NULL,
  `min_purchase_amount` DECIMAL(10,2)   DEFAULT NULL,
  `applicable_plan_ids` JSON            DEFAULT NULL COMMENT 'Array of plan IDs this promo applies to',
  `card_type`           VARCHAR(50)     DEFAULT NULL COMMENT 'e.g. sampath_visa, sampath_mastercard',
  `usage_limit`         INT             DEFAULT NULL COMMENT 'NULL = unlimited',
  `used_count`          INT             NOT NULL DEFAULT 0,
  `valid_from`          DATE            NOT NULL,
  `valid_until`         DATE            DEFAULT NULL,
  `is_active`           TINYINT(1)      NOT NULL DEFAULT 1,
  `created_by`          VARCHAR(36)     DEFAULT NULL,
  `created_at`          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          TIMESTAMP       NULL ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `promotions_code_unique` (`code`),
  INDEX `promotions_code_idx` (`code`),
  INDEX `promotions_active_idx` (`is_active`, `valid_from`, `valid_until`),
  CONSTRAINT `fk_promotions_creator`
    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 14. SUBSCRIPTION LINKS — COUPLE PLANS (1 table)
-- ============================================================================

CREATE TABLE IF NOT EXISTS `subscription_links` (
  `id`                VARCHAR(36)     NOT NULL,
  `subscription_id`   VARCHAR(36)     NOT NULL,
  `member_id`         VARCHAR(36)     NOT NULL,
  `link_role`         ENUM('primary','secondary') NOT NULL,
  `linked_at`         TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `sub_links_sub_member_idx` (`subscription_id`, `member_id`),
  INDEX `sub_links_member_idx` (`member_id`),
  CONSTRAINT `fk_sub_links_subscription`
    FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_sub_links_member`
    FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 15. SUBSCRIPTION TRANSITIONS — PLAN CHANGE AUDIT (1 table)
-- ============================================================================

CREATE TABLE IF NOT EXISTS `subscription_transitions` (
  `id`                    VARCHAR(36)     NOT NULL,
  `member_id`             VARCHAR(36)     NOT NULL,
  `from_subscription_id`  VARCHAR(36)     DEFAULT NULL,
  `to_subscription_id`    VARCHAR(36)     DEFAULT NULL,
  `transition_type`       ENUM('renewal','upgrade','downgrade','cancellation','freeze','unfreeze') NOT NULL,
  `prorated_credit`       DECIMAL(10,2)   DEFAULT NULL,
  `effective_date`        DATE            NOT NULL,
  `processed_by`          VARCHAR(36)     DEFAULT NULL,
  `notes`                 TEXT            DEFAULT NULL,
  `created_at`            TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  INDEX `sub_transitions_member_idx` (`member_id`),
  INDEX `sub_transitions_type_idx` (`transition_type`),
  CONSTRAINT `fk_sub_transitions_member`
    FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_sub_transitions_from`
    FOREIGN KEY (`from_subscription_id`) REFERENCES `subscriptions`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_sub_transitions_to`
    FOREIGN KEY (`to_subscription_id`) REFERENCES `subscriptions`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_sub_transitions_processor`
    FOREIGN KEY (`processed_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 16. TRAINER REVIEWS (1 table)
-- ============================================================================

CREATE TABLE IF NOT EXISTS `trainer_reviews` (
  `id`                    VARCHAR(36)     NOT NULL,
  `training_session_id`   VARCHAR(36)     NOT NULL,
  `member_id`             VARCHAR(36)     NOT NULL,
  `trainer_id`            VARCHAR(36)     NOT NULL,
  `rating`                INT             NOT NULL COMMENT '1-5 scale',
  `comment`               TEXT            DEFAULT NULL,
  `is_anonymous`          TINYINT(1)      NOT NULL DEFAULT 1,
  `created_at`            TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `trainer_reviews_session_unique` (`training_session_id`),
  INDEX `trainer_reviews_trainer_idx` (`trainer_id`),
  INDEX `trainer_reviews_member_idx` (`member_id`),
  CONSTRAINT `fk_trainer_reviews_session`
    FOREIGN KEY (`training_session_id`) REFERENCES `training_sessions`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_trainer_reviews_member`
    FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_trainer_reviews_trainer`
    FOREIGN KEY (`trainer_id`) REFERENCES `trainers`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 17. NOTIFICATION TEMPLATES (1 table)
-- ============================================================================

CREATE TABLE IF NOT EXISTS `notification_templates` (
  `id`                VARCHAR(36)     NOT NULL,
  `code`              VARCHAR(50)     NOT NULL,
  `title_template`    VARCHAR(200)    NOT NULL,
  `body_template`     TEXT            NOT NULL,
  `channel`           ENUM('in_app','email','sms') NOT NULL DEFAULT 'in_app',
  `default_priority`  ENUM('low','normal','high','critical') NOT NULL DEFAULT 'normal',
  `is_active`         TINYINT(1)      NOT NULL DEFAULT 1,
  `updated_by`        VARCHAR(36)     DEFAULT NULL,
  `created_at`        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        TIMESTAMP       NULL ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `notif_templates_code_unique` (`code`),
  CONSTRAINT `fk_notif_templates_updater`
    FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 18. EMAIL QUEUE (1 table)
-- ============================================================================

CREATE TABLE IF NOT EXISTS `email_queue` (
  `id`                VARCHAR(36)     NOT NULL,
  `to_email`          VARCHAR(255)    NOT NULL,
  `subject`           VARCHAR(255)    NOT NULL,
  `body_html`         TEXT            DEFAULT NULL,
  `template_code`     VARCHAR(50)     DEFAULT NULL,
  `template_data`     JSON            DEFAULT NULL,
  `email_status`      ENUM('queued','sending','sent','failed','bounced') NOT NULL DEFAULT 'queued',
  `attempts`          INT             NOT NULL DEFAULT 0,
  `max_attempts`      INT             NOT NULL DEFAULT 3,
  `last_attempted_at` TIMESTAMP       NULL DEFAULT NULL,
  `sent_at`           TIMESTAMP       NULL DEFAULT NULL,
  `error_message`     TEXT            DEFAULT NULL,
  `scheduled_for`     TIMESTAMP       NULL DEFAULT NULL,
  `created_at`        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  INDEX `email_queue_status_idx` (`email_status`),
  INDEX `email_queue_scheduled_idx` (`scheduled_for`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 19. DAILY BRANCH SNAPSHOTS — PRE-AGGREGATED ANALYTICS (1 table)
-- ============================================================================

CREATE TABLE IF NOT EXISTS `daily_branch_snapshots` (
  `id`                      VARCHAR(36)     NOT NULL,
  `branch_id`               VARCHAR(36)     NOT NULL,
  `snapshot_date`           DATE            NOT NULL,
  `total_checkins`          INT             NOT NULL DEFAULT 0,
  `unique_visitors`         INT             NOT NULL DEFAULT 0,
  `peak_occupancy`          INT             NOT NULL DEFAULT 0,
  `revenue_total`           DECIMAL(12,2)   NOT NULL DEFAULT 0.00 COMMENT 'LKR',
  `revenue_cash`            DECIMAL(12,2)   NOT NULL DEFAULT 0.00 COMMENT 'LKR',
  `revenue_card`            DECIMAL(12,2)   NOT NULL DEFAULT 0.00 COMMENT 'LKR',
  `new_members`             INT             NOT NULL DEFAULT 0,
  `expired_subscriptions`   INT             NOT NULL DEFAULT 0,
  `active_members_count`    INT             NOT NULL DEFAULT 0,
  `avg_visit_duration_min`  INT             DEFAULT NULL,
  `created_at`              TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `daily_snap_branch_date_idx` (`branch_id`, `snapshot_date`),
  CONSTRAINT `fk_daily_snap_branch`
    FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- DEFERRED FOREIGN KEYS (self-referencing & cross-referencing)
-- ============================================================================

-- members.referred_by_member_id -> members.id (self-referencing)
ALTER TABLE `members`
  ADD CONSTRAINT `fk_members_referrer`
    FOREIGN KEY (`referred_by_member_id`) REFERENCES `members`(`id`) ON DELETE SET NULL;

-- subscriptions.promotion_id -> promotions.id
ALTER TABLE `subscriptions`
  ADD CONSTRAINT `fk_subscriptions_promotion`
    FOREIGN KEY (`promotion_id`) REFERENCES `promotions`(`id`) ON DELETE SET NULL;

-- subscriptions.renewed_from_id -> subscriptions.id (self-referencing)
ALTER TABLE `subscriptions`
  ADD CONSTRAINT `fk_subscriptions_renewed_from`
    FOREIGN KEY (`renewed_from_id`) REFERENCES `subscriptions`(`id`) ON DELETE SET NULL;

-- payments.promotion_id -> promotions.id
ALTER TABLE `payments`
  ADD CONSTRAINT `fk_payments_promotion`
    FOREIGN KEY (`promotion_id`) REFERENCES `promotions`(`id`) ON DELETE SET NULL;

-- payments.original_payment_id -> payments.id (self-referencing, for refunds)
ALTER TABLE `payments`
  ADD CONSTRAINT `fk_payments_original`
    FOREIGN KEY (`original_payment_id`) REFERENCES `payments`(`id`) ON DELETE SET NULL;

-- ============================================================================
-- CHECK CONSTRAINTS (MySQL 8.0.16+)
-- ============================================================================

-- Member metrics: physical limits
ALTER TABLE `member_metrics`
  ADD CONSTRAINT `chk_weight` CHECK (`weight` > 0 AND `weight` < 500),
  ADD CONSTRAINT `chk_height` CHECK (`height` > 30 AND `height` < 300),
  ADD CONSTRAINT `chk_body_fat` CHECK (`body_fat_percentage` >= 0 AND `body_fat_percentage` <= 70),
  ADD CONSTRAINT `chk_bmi` CHECK (`bmi` > 5 AND `bmi` < 100),
  ADD CONSTRAINT `chk_rhr` CHECK (`resting_heart_rate` > 20 AND `resting_heart_rate` < 250);

-- Trainers: rating & experience bounds
ALTER TABLE `trainers`
  ADD CONSTRAINT `chk_trainer_rating` CHECK (`rating` >= 0 AND `rating` <= 5.00),
  ADD CONSTRAINT `chk_trainer_experience` CHECK (`years_of_experience` >= 0 AND `years_of_experience` <= 60);

-- Session notes: performance rating scale
ALTER TABLE `session_notes`
  ADD CONSTRAINT `chk_perf_rating` CHECK (`performance_rating` >= 1 AND `performance_rating` <= 5);

-- Trainer reviews: rating scale
ALTER TABLE `trainer_reviews`
  ADD CONSTRAINT `chk_review_rating` CHECK (`rating` >= 1 AND `rating` <= 5);

-- Subscriptions: date sanity
ALTER TABLE `subscriptions`
  ADD CONSTRAINT `chk_sub_dates` CHECK (`end_date` >= `start_date`);

-- Subscription freezes: date sanity
ALTER TABLE `subscription_freezes`
  ADD CONSTRAINT `chk_freeze_dates` CHECK (`freeze_end` >= `freeze_start`);

-- Payments: positive amounts
ALTER TABLE `payments`
  ADD CONSTRAINT `chk_pay_amount` CHECK (`amount` > 0);

-- Subscription plans: valid pricing & duration
ALTER TABLE `subscription_plans`
  ADD CONSTRAINT `chk_plan_price` CHECK (`price` > 0),
  ADD CONSTRAINT `chk_plan_duration` CHECK (`duration_days` > 0 AND `duration_days` <= 3650);

-- Workout plans: sensible ranges
ALTER TABLE `workout_plans`
  ADD CONSTRAINT `chk_wp_weeks` CHECK (`duration_weeks` > 0 AND `duration_weeks` <= 52),
  ADD CONSTRAINT `chk_wp_days` CHECK (`days_per_week` >= 1 AND `days_per_week` <= 7);

-- Equipment: maintenance interval
ALTER TABLE `equipment`
  ADD CONSTRAINT `chk_maint_interval` CHECK (`maintenance_interval_days` > 0),
  ADD CONSTRAINT `chk_equipment_qty` CHECK (`quantity` > 0);

-- Branches: capacity & grace
ALTER TABLE `branches`
  ADD CONSTRAINT `chk_capacity` CHECK (`capacity` > 0),
  ADD CONSTRAINT `chk_grace` CHECK (`grace_period_days` >= 0 AND `grace_period_days` <= 30);

-- Inventory: stock levels
ALTER TABLE `inventory_items`
  ADD CONSTRAINT `chk_stock` CHECK (`quantity_in_stock` >= 0),
  ADD CONSTRAINT `chk_reorder` CHECK (`reorder_threshold` >= 0);

-- Promotions: discount values
ALTER TABLE `promotions`
  ADD CONSTRAINT `chk_promo_value` CHECK (`discount_value` > 0),
  ADD CONSTRAINT `chk_promo_usage` CHECK (`used_count` >= 0);

-- ============================================================================
-- SCHEMA SUMMARY
-- ============================================================================
-- Total tables: 44
--
-- Section 1  — Core Auth:             users, refresh_tokens, permissions, role_permissions
-- Section 2  — Branch Config:         branches, branch_closures, announcement_banners
-- Section 3  — Member Profiles:       members, member_documents, member_metrics
-- Section 4  — Staff & Trainers:      staff, trainers
-- Section 5  — Shift Management:      staff_shifts, shift_overrides
-- Section 6  — Access Control (QR):   zones, gates, visit_sessions, access_logs
-- Section 7  — Subscriptions:         subscription_plans, subscriptions, subscription_freezes, payments
-- Section 8  — Workouts:              workout_plans, workout_exercises, workout_logs
-- Section 9  — Training Sessions:     trainer_availability, training_sessions, session_notes
-- Section 10 — Equipment/Inventory:   equipment, equipment_issues, maintenance_logs, inventory_items, inventory_transactions
-- Section 11 — Notifications:         notifications
-- Section 12 — System & Audit:        audit_logs, system_config, cron_job_runs
-- Section 13 — Promotions:            promotions
-- Section 14 — Subscription Links:    subscription_links
-- Section 15 — Subscription Transitions: subscription_transitions
-- Section 16 — Trainer Reviews:       trainer_reviews
-- Section 17 — Notification Templates: notification_templates
-- Section 18 — Email Queue:           email_queue
-- Section 19 — Daily Snapshots:       daily_branch_snapshots
-- ============================================================================
