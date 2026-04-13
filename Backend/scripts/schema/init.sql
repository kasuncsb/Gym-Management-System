-- ============================================================================
-- Power World Gyms — Kiribathgoda Branch
-- Schema v5  |  MySQL 8.0+  |  entity_lifecycle + members/trainers
-- ============================================================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- ============================================================================
-- 1. CONFIG
-- ============================================================================

CREATE TABLE IF NOT EXISTS `config` (
  `key`         VARCHAR(50)   NOT NULL,
  `value`       VARCHAR(500)  NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `config` (`key`, `value`) VALUES
  ('branch_capacity', '120'),
  ('grace_days',      '3'),
  ('timezone',        'Asia/Colombo'),
  ('checkin_qr_ttl_seconds', '120'),
  ('checkin_scan_max_retries', '5'),
  ('payment_failure_max_retries', '3'),
  ('login_failure_lock_threshold', '5'),
  ('login_failure_lock_minutes', '15'),
  ('db_backup_retention_days', '14'),
  ('db_backup_frequency', 'daily'),
  ('ai_chat_rate_limit_per_minute', '20'),
  ('pt_booking_advance_days_max', '60'),
  ('gym_open_time',   '06:00'),
  ('gym_close_time',  '22:00'),
  ('session_idle_timeout_minutes', '30'),
  ('email_queue_max_attempts', '5'),
  ('maintenance_mode', 'false'),
  ('notify_email', 'true'),
  ('notify_sms', 'false'),
  ('auto_backup', 'true');

-- ============================================================================
-- 2. ENTITY_LIFECYCLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS `entity_lifecycle` (
  `id`         VARCHAR(36)   NOT NULL,
  `created_at` TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP     NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP     NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 3. USERS (identity + auth + admin/manager ops; avatar/cover)
-- ============================================================================

CREATE TABLE IF NOT EXISTS `users` (
  `id`               VARCHAR(36)   NOT NULL,
  `lifecycle_id`     VARCHAR(36)   NOT NULL,

  `full_name`        VARCHAR(100)  NOT NULL,
  `email`            VARCHAR(255)  NOT NULL,
  `phone`            VARCHAR(20)   DEFAULT NULL,
  `dob`              DATE          DEFAULT NULL,
  `gender`           ENUM('male','female','other') DEFAULT NULL,
  `nic_number`       VARCHAR(20)   DEFAULT NULL,

  `role`             ENUM('admin','manager','trainer','member') NOT NULL DEFAULT 'member',
  `is_active`        TINYINT(1)    NOT NULL DEFAULT 1,

  `password_hash`    VARCHAR(255)  NOT NULL,
  `email_verified`   TINYINT(1)    NOT NULL DEFAULT 0,
  `email_verify_token` VARCHAR(255) DEFAULT NULL,
  `qr_secret`        VARCHAR(64)   DEFAULT NULL,
  `avatar_key`       VARCHAR(500)  DEFAULT NULL,
  `cover_key`        VARCHAR(500)  DEFAULT NULL,
  `last_login_at`    TIMESTAMP     NULL DEFAULT NULL,
  `failed_attempts`  TINYINT       NOT NULL DEFAULT 0,
  `locked_until`     TIMESTAMP     NULL DEFAULT NULL,
  `reset_token`      VARCHAR(255)  DEFAULT NULL,
  `reset_expires`    TIMESTAMP     NULL DEFAULT NULL,

  `employee_code`    VARCHAR(20)   DEFAULT NULL,
  `hire_date`        DATE          DEFAULT NULL,
  `designation`      VARCHAR(100)  DEFAULT NULL,
  `base_salary`      DECIMAL(10,2) DEFAULT NULL,
  `is_key_holder`    TINYINT(1)    NOT NULL DEFAULT 0,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_email`         (`email`),
  UNIQUE KEY `uq_user_lifecycle` (`lifecycle_id`),
  UNIQUE KEY `uq_employee_code_users` (`employee_code`),
  INDEX `idx_role`              (`role`),
  INDEX `idx_active`            (`is_active`, `role`),

  CONSTRAINT `fk_users_lifecycle` FOREIGN KEY (`lifecycle_id`) REFERENCES `entity_lifecycle`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 4. MEMBERS (1:1 member user)
-- ============================================================================

CREATE TABLE IF NOT EXISTS `members` (
  `user_id`                 VARCHAR(36)  NOT NULL,
  `lifecycle_id`            VARCHAR(36)  NOT NULL,

  `blood_type`              ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-') DEFAULT NULL,
  `medical_conditions`      TEXT         DEFAULT NULL,
  `allergies`               TEXT         DEFAULT NULL,
  `fitness_goals`           VARCHAR(500) DEFAULT NULL,
  `experience_level`        ENUM('beginner','intermediate','advanced') DEFAULT NULL,
  `emergency_name`          VARCHAR(100) DEFAULT NULL,
  `emergency_phone`         VARCHAR(20)  DEFAULT NULL,
  `emergency_relation`      VARCHAR(50)  DEFAULT NULL,
  `is_onboarded`            TINYINT(1)   NOT NULL DEFAULT 0,
  `onboarded_at`            TIMESTAMP    NULL DEFAULT NULL,

  `id_document_type`        ENUM('nic','driving_license','passport') DEFAULT NULL,
  `id_nic_front`            VARCHAR(500) DEFAULT NULL,
  `id_nic_back`             VARCHAR(500) DEFAULT NULL,
  `id_verification_status`  ENUM('pending','approved','rejected') DEFAULT NULL,
  `id_verification_note`    TEXT         DEFAULT NULL,
  `id_submitted_at`         TIMESTAMP    NULL DEFAULT NULL,

  `member_code`             VARCHAR(20)  DEFAULT NULL,
  `join_date`               DATE         DEFAULT NULL,
  `member_status`           ENUM('active','inactive','suspended') DEFAULT NULL,
  `assigned_trainer`        VARCHAR(36)  DEFAULT NULL,

  PRIMARY KEY (`user_id`),
  UNIQUE KEY `uq_member_lifecycle` (`lifecycle_id`),
  UNIQUE KEY `uq_member_code` (`member_code`),
  CONSTRAINT `fk_members_user`      FOREIGN KEY (`user_id`)       REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_members_lifecycle` FOREIGN KEY (`lifecycle_id`)  REFERENCES `entity_lifecycle`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_members_trainer` FOREIGN KEY (`assigned_trainer`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 5. TRAINERS (1:1 trainer user)
-- ============================================================================

CREATE TABLE IF NOT EXISTS `trainers` (
  `user_id`          VARCHAR(36)   NOT NULL,
  `lifecycle_id`     VARCHAR(36)   NOT NULL,

  `employee_code`    VARCHAR(20)   DEFAULT NULL,
  `hire_date`        DATE          DEFAULT NULL,
  `designation`      VARCHAR(100)  DEFAULT NULL,
  `base_salary`      DECIMAL(10,2) DEFAULT NULL,
  `is_key_holder`    TINYINT(1)    NOT NULL DEFAULT 0,
  `specialization`   VARCHAR(100)  DEFAULT NULL,
  `pt_hourly_rate`   DECIMAL(8,2)  DEFAULT NULL,
  `pt_rating`        DECIMAL(3,2)  DEFAULT NULL,
  `years_experience` TINYINT       DEFAULT NULL,

  PRIMARY KEY (`user_id`),
  UNIQUE KEY `uq_trainer_lifecycle` (`lifecycle_id`),
  UNIQUE KEY `uq_employee_code_trainers` (`employee_code`),
  CONSTRAINT `fk_trainers_user`      FOREIGN KEY (`user_id`)      REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_trainers_lifecycle` FOREIGN KEY (`lifecycle_id`) REFERENCES `entity_lifecycle`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_pt_rating`  CHECK (`pt_rating` IS NULL OR (`pt_rating` BETWEEN 0 AND 5)),
  CONSTRAINT `chk_years_exp`  CHECK (`years_experience` IS NULL OR `years_experience` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 6. MEMBER_METRICS
-- ============================================================================

CREATE TABLE IF NOT EXISTS `member_metrics` (
  `id`            VARCHAR(36)   NOT NULL,
  `lifecycle_id`  VARCHAR(36)   NOT NULL,
  `person_id`     VARCHAR(36)   NOT NULL,
  `recorded_at`   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `source`        ENUM('manual','trainer','device') NOT NULL DEFAULT 'manual',
  `weight_kg`     DECIMAL(5,2)  DEFAULT NULL,
  `height_cm`     DECIMAL(5,2)  DEFAULT NULL,
  `bmi`           DECIMAL(4,1)  DEFAULT NULL,
  `resting_hr`    TINYINT       DEFAULT NULL,
  `notes`         TEXT          DEFAULT NULL,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_metrics_lifecycle` (`lifecycle_id`),
  INDEX `idx_metrics_person` (`person_id`),
  INDEX `idx_metrics_date`   (`recorded_at`),
  CONSTRAINT `fk_metrics_lifecycle` FOREIGN KEY (`lifecycle_id`) REFERENCES `entity_lifecycle`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_metrics_person`   FOREIGN KEY (`person_id`)  REFERENCES `users`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_weight`    CHECK (`weight_kg`   IS NULL OR `weight_kg`   BETWEEN 1   AND 500),
  CONSTRAINT `chk_height`    CHECK (`height_cm`   IS NULL OR `height_cm`   BETWEEN 50  AND 250),
  CONSTRAINT `chk_bmi`       CHECK (`bmi`          IS NULL OR `bmi`          BETWEEN 5  AND 80)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 7. VISITS
-- ============================================================================

CREATE TABLE IF NOT EXISTS `visits` (
  `id`           VARCHAR(36)  NOT NULL,
  `lifecycle_id` VARCHAR(36)  NOT NULL,
  `person_id`    VARCHAR(36)  NOT NULL,
  `check_in_at`  TIMESTAMP    NOT NULL,
  `check_out_at` TIMESTAMP    NULL DEFAULT NULL,
  `duration_min` SMALLINT     DEFAULT NULL,
  `status`       ENUM('active','completed','auto_closed','denied') NOT NULL DEFAULT 'active',
  `deny_reason`  VARCHAR(100) DEFAULT NULL,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_visit_lifecycle` (`lifecycle_id`),
  INDEX `idx_visit_person`  (`person_id`),
  INDEX `idx_visit_checkin` (`check_in_at`),
  INDEX `idx_visit_status`  (`status`, `check_in_at`),
  CONSTRAINT `fk_visit_lifecycle` FOREIGN KEY (`lifecycle_id`) REFERENCES `entity_lifecycle`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_visit_person` FOREIGN KEY (`person_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 8. SUBSCRIPTION_PLANS
-- ============================================================================

CREATE TABLE IF NOT EXISTS `subscription_plans` (
  `id`             VARCHAR(36)   NOT NULL,
  `lifecycle_id`   VARCHAR(36)   NOT NULL,
  `plan_code`      VARCHAR(30)   NOT NULL,
  `name`           VARCHAR(100)  NOT NULL,
  `description`    TEXT          DEFAULT NULL,
  `plan_type`      ENUM('individual','couple','student','corporate','daily_pass') NOT NULL,
  `price`          DECIMAL(10,2) NOT NULL,
  `duration_days`  SMALLINT      NOT NULL,
  `is_active`      TINYINT(1)    NOT NULL DEFAULT 1,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_plan_lifecycle` (`lifecycle_id`),
  UNIQUE KEY `uq_plan_code` (`plan_code`),
  CONSTRAINT `fk_plan_lifecycle` FOREIGN KEY (`lifecycle_id`) REFERENCES `entity_lifecycle`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_plan_price`    CHECK (`price`         > 0),
  CONSTRAINT `chk_plan_duration` CHECK (`duration_days` > 0 AND `duration_days` <= 3650)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 9. PROMOTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS `promotions` (
  `id`             VARCHAR(36)   NOT NULL,
  `lifecycle_id`   VARCHAR(36)   NOT NULL,
  `code`           VARCHAR(50)   NOT NULL,
  `name`           VARCHAR(100)  NOT NULL,
  `discount_type`  ENUM('percentage','fixed') NOT NULL,
  `discount_value` DECIMAL(10,2) NOT NULL,
  `used_count`     SMALLINT      NOT NULL DEFAULT 0,
  `valid_from`     DATE          NOT NULL,
  `valid_until`    DATE          DEFAULT NULL,
  `is_active`      TINYINT(1)    NOT NULL DEFAULT 1,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_promo_lifecycle` (`lifecycle_id`),
  UNIQUE KEY `uq_promo_code` (`code`),
  CONSTRAINT `fk_promo_lifecycle` FOREIGN KEY (`lifecycle_id`) REFERENCES `entity_lifecycle`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_promo_value`  CHECK (`discount_value` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 10. SUBSCRIPTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS `subscriptions` (
  `id`               VARCHAR(36)   NOT NULL,
  `lifecycle_id`     VARCHAR(36)   NOT NULL,
  `member_id`        VARCHAR(36)   NOT NULL,
  `plan_id`          VARCHAR(36)   NOT NULL,
  `start_date`       DATE          NOT NULL,
  `end_date`         DATE          NOT NULL,
  `status`           ENUM('pending_payment','active','grace_period','expired','cancelled') NOT NULL DEFAULT 'pending_payment',
  `price_paid`       DECIMAL(10,2) DEFAULT NULL,
  `discount_amount`  DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `promotion_id`     VARCHAR(36)   DEFAULT NULL,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_sub_lifecycle` (`lifecycle_id`),
  INDEX `idx_sub_member`        (`member_id`),
  INDEX `idx_sub_status`        (`status`),
  INDEX `idx_sub_end`           (`end_date`),
  INDEX `idx_sub_member_status` (`member_id`, `status`),
  CONSTRAINT `fk_sub_lifecycle` FOREIGN KEY (`lifecycle_id`) REFERENCES `entity_lifecycle`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_sub_member`   FOREIGN KEY (`member_id`)       REFERENCES `users`(`id`)             ON DELETE RESTRICT,
  CONSTRAINT `fk_sub_plan`     FOREIGN KEY (`plan_id`)         REFERENCES `subscription_plans`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_sub_promo`    FOREIGN KEY (`promotion_id`)    REFERENCES `promotions`(`id`)          ON DELETE SET NULL,
  CONSTRAINT `chk_sub_dates`   CHECK (`end_date` >= `start_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 11. PAYMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS `payments` (
  `id`                  VARCHAR(36)   NOT NULL,
  `lifecycle_id`        VARCHAR(36)   NOT NULL,
  `subscription_id`     VARCHAR(36)   NOT NULL,
  `amount`              DECIMAL(10,2) NOT NULL,
  `payment_method`      ENUM('cash','card','bank_transfer','online') NOT NULL,
  `payment_date`        DATE          NOT NULL,
  `status`              ENUM('completed','disputed') NOT NULL DEFAULT 'completed',
  `receipt_number`      VARCHAR(50)   DEFAULT NULL,
  `reference_number`    VARCHAR(100)  DEFAULT NULL,
  `instrument_hash`     VARCHAR(64)   DEFAULT NULL,
  `promotion_id`        VARCHAR(36)   DEFAULT NULL,
  `discount_amount`     DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `recorded_by`         VARCHAR(36)   DEFAULT NULL,
  `invoice_number`      VARCHAR(50)   DEFAULT NULL,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_pay_lifecycle` (`lifecycle_id`),
  UNIQUE KEY `uq_pay_invoice` (`invoice_number`),
  UNIQUE KEY `uq_receipt` (`receipt_number`),
  INDEX `idx_pay_sub`  (`subscription_id`),
  INDEX `idx_pay_date` (`payment_date`),
  CONSTRAINT `fk_pay_lifecycle` FOREIGN KEY (`lifecycle_id`) REFERENCES `entity_lifecycle`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_pay_sub`     FOREIGN KEY (`subscription_id`)    REFERENCES `subscriptions`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_pay_promo`   FOREIGN KEY (`promotion_id`)        REFERENCES `promotions`(`id`)    ON DELETE SET NULL,
  CONSTRAINT `fk_pay_by`      FOREIGN KEY (`recorded_by`)         REFERENCES `users`(`id`)        ON DELETE SET NULL,
  CONSTRAINT `chk_pay_amount` CHECK (`amount` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 12. WORKOUT_PLANS
-- ============================================================================

CREATE TABLE IF NOT EXISTS `workout_plans` (
  `id`             VARCHAR(36)  NOT NULL,
  `lifecycle_id`   VARCHAR(36)  NOT NULL,
  `member_id`      VARCHAR(36)  DEFAULT NULL,
  `trainer_id`     VARCHAR(36)  DEFAULT NULL,
  `name`           VARCHAR(150) NOT NULL,
  `description`    TEXT         DEFAULT NULL,
  `source`         ENUM('trainer_created','ai_generated','library') NOT NULL,
  `difficulty`     ENUM('beginner','intermediate','advanced') DEFAULT NULL,
  `duration_weeks` TINYINT   NOT NULL,
  `days_per_week`  TINYINT   NOT NULL,
  `is_active`      TINYINT(1)   NOT NULL DEFAULT 1,
  `program_json`   LONGTEXT     NOT NULL,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_wp_lifecycle` (`lifecycle_id`),
  INDEX `idx_wp_member`  (`member_id`),
  INDEX `idx_wp_trainer` (`trainer_id`),
  INDEX `idx_wp_source`  (`source`),
  CONSTRAINT `fk_wp_lifecycle` FOREIGN KEY (`lifecycle_id`) REFERENCES `entity_lifecycle`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_wp_member`  FOREIGN KEY (`member_id`)  REFERENCES `users`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_wp_trainer` FOREIGN KEY (`trainer_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_wp_weeks` CHECK (`duration_weeks` BETWEEN 1 AND 52),
  CONSTRAINT `chk_wp_days`  CHECK (`days_per_week`  BETWEEN 1 AND 7)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 13. PT_SESSIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS `pt_sessions` (
  `id`             VARCHAR(36)  NOT NULL,
  `lifecycle_id`   VARCHAR(36)  NOT NULL,
  `member_id`      VARCHAR(36)  NOT NULL,
  `trainer_id`     VARCHAR(36)  NOT NULL,
  `session_date`      DATE         NOT NULL,
  `start_time`        TIME         NOT NULL,
  `end_time`          TIME         NOT NULL,
  `duration_minutes`  SMALLINT     NOT NULL DEFAULT 60,
  `status`            ENUM('booked','confirmed','completed','cancelled','no_show') NOT NULL DEFAULT 'booked',
  `cancel_reason`  VARCHAR(255) DEFAULT NULL,
  `review_rating`  TINYINT      DEFAULT NULL,
  `review_comment` TEXT         DEFAULT NULL,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_pts_lifecycle` (`lifecycle_id`),
  UNIQUE KEY `uq_trainer_slot` (`trainer_id`, `session_date`, `start_time`),
  INDEX `idx_pts_member`  (`member_id`),
  INDEX `idx_pts_trainer` (`trainer_id`),
  INDEX `idx_pts_date`    (`session_date`),
  CONSTRAINT `fk_pts_lifecycle` FOREIGN KEY (`lifecycle_id`) REFERENCES `entity_lifecycle`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_pts_member`   FOREIGN KEY (`member_id`)  REFERENCES `users`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_pts_trainer`  FOREIGN KEY (`trainer_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_review_rate` CHECK (`review_rating` IS NULL OR `review_rating` BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 15. EQUIPMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS `equipment` (
  `id`             VARCHAR(36)  NOT NULL,
  `lifecycle_id`   VARCHAR(36)  NOT NULL,
  `name`           VARCHAR(100) NOT NULL,
  `category`       ENUM('cardio','strength_machine','free_weight','bench','accessory','other') NOT NULL,
  `quantity`       TINYINT      NOT NULL DEFAULT 1,
  `status`         ENUM('operational','needs_maintenance','under_maintenance','retired') NOT NULL DEFAULT 'operational',
  `zone_label`     VARCHAR(50)  DEFAULT NULL,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_equip_lifecycle` (`lifecycle_id`),
  INDEX `idx_equip_status` (`status`),
  CONSTRAINT `fk_equip_lifecycle` FOREIGN KEY (`lifecycle_id`) REFERENCES `entity_lifecycle`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_equip_qty` CHECK (`quantity` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 16. EQUIPMENT_EVENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS `equipment_events` (
  `id`             VARCHAR(36)  NOT NULL,
  `lifecycle_id`   VARCHAR(36)  NOT NULL,
  `equipment_id`   VARCHAR(36)  NOT NULL,
  `event_type`     ENUM('issue_reported','maintenance_done') NOT NULL,
  `severity`       ENUM('low','medium','high','critical') DEFAULT NULL,
  `description`    TEXT         NOT NULL,
  `status`         ENUM('open','in_progress','resolved') DEFAULT NULL,
  `logged_by`      VARCHAR(36)  DEFAULT NULL,
  `resolved_by`    VARCHAR(36)  DEFAULT NULL,
  `resolved_at`    TIMESTAMP    NULL DEFAULT NULL,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ee_lifecycle` (`lifecycle_id`),
  INDEX `idx_ee_equipment` (`equipment_id`),
  INDEX `idx_ee_status`    (`status`),
  CONSTRAINT `fk_ee_lifecycle` FOREIGN KEY (`lifecycle_id`) REFERENCES `entity_lifecycle`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_ee_equipment` FOREIGN KEY (`equipment_id`) REFERENCES `equipment`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_ee_logger`    FOREIGN KEY (`logged_by`)     REFERENCES `users`(`id`)   ON DELETE SET NULL,
  CONSTRAINT `fk_ee_resolver`  FOREIGN KEY (`resolved_by`)   REFERENCES `users`(`id`)   ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 17. INVENTORY
-- ============================================================================

CREATE TABLE IF NOT EXISTS `inventory_items` (
  `id`                VARCHAR(36)   NOT NULL,
  `lifecycle_id`      VARCHAR(36)   NOT NULL,
  `name`              VARCHAR(100)  NOT NULL,
  `category`          VARCHAR(50)   NOT NULL,
  `qty_in_stock`      SMALLINT      NOT NULL DEFAULT 0,
  `reorder_threshold` SMALLINT     NOT NULL DEFAULT 5,
  `is_active`         TINYINT(1)    NOT NULL DEFAULT 1,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_inv_item_lifecycle` (`lifecycle_id`),
  CONSTRAINT `fk_inv_item_lifecycle` FOREIGN KEY (`lifecycle_id`) REFERENCES `entity_lifecycle`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_inv_stock` CHECK (`qty_in_stock`     >= 0),
  CONSTRAINT `chk_reorder`   CHECK (`reorder_threshold` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `inventory_transactions` (
  `id`             VARCHAR(36)   NOT NULL,
  `lifecycle_id`   VARCHAR(36)   NOT NULL,
  `item_id`        VARCHAR(36)   NOT NULL,
  `txn_type`       ENUM('restock','sale','adjustment','waste') NOT NULL,
  `qty_change`     SMALLINT      NOT NULL,
  `reference`      VARCHAR(100)  DEFAULT NULL,
  `recorded_by`    VARCHAR(36)   DEFAULT NULL,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_itxn_lifecycle` (`lifecycle_id`),
  INDEX `idx_itxn_item` (`item_id`),
  CONSTRAINT `fk_itxn_lifecycle` FOREIGN KEY (`lifecycle_id`) REFERENCES `entity_lifecycle`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_itxn_item` FOREIGN KEY (`item_id`)     REFERENCES `inventory_items`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_itxn_by`   FOREIGN KEY (`recorded_by`) REFERENCES `users`(`id`)          ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 18. AUDIT_LOGS
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
-- 18b. REPORT_RUNS (report generation audit)
-- ============================================================================

CREATE TABLE IF NOT EXISTS `report_runs` (
  `id`                   VARCHAR(36)   NOT NULL,
  `actor_id`             VARCHAR(36)   NOT NULL,
  `report_type`          VARCHAR(50)   NOT NULL,
  `from_date`            VARCHAR(20)   DEFAULT NULL,
  `to_date`              VARCHAR(20)   DEFAULT NULL,
  `channel`              ENUM('summary','pdf') NOT NULL,
  `direct_rows_approx`   SMALLINT UNSIGNED DEFAULT NULL,
  `created_at`           TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_report_runs_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 19. AI_INTERACTIONS (chat lines: chat_session_id + seq + chat_message_role)
-- ============================================================================

CREATE TABLE IF NOT EXISTS `ai_interactions` (
  `id`               VARCHAR(36)  NOT NULL,
  `lifecycle_id`     VARCHAR(36)  NOT NULL,
  `user_id`          VARCHAR(36)  NOT NULL,
  `user_role`        ENUM('admin','manager','trainer','member') NOT NULL,
  `interaction_type` ENUM('chat','workout_plan','insight') NOT NULL,
  `prompt_text`      TEXT         DEFAULT NULL,
  `response_text`    TEXT         DEFAULT NULL,
  `source`           ENUM('rag','gemini','fallback','system') NOT NULL DEFAULT 'fallback',
  `metadata_json`    TEXT         DEFAULT NULL,
  `chat_session_id`  VARCHAR(36)  DEFAULT NULL,
  `chat_message_role` ENUM('user','assistant','system') DEFAULT NULL,
  `seq`              SMALLINT     DEFAULT NULL,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ai_lifecycle` (`lifecycle_id`),
  INDEX `idx_ai_user` (`user_id`),
  INDEX `idx_ai_type` (`interaction_type`),
  INDEX `idx_ai_interactions_chat_session_seq` (`chat_session_id`, `seq`),
  CONSTRAINT `fk_ai_lifecycle` FOREIGN KEY (`lifecycle_id`) REFERENCES `entity_lifecycle`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_ai_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 20. WORKOUT_SESSIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS `workout_sessions` (
  `id`              VARCHAR(36)  NOT NULL,
  `lifecycle_id`    VARCHAR(36)  NOT NULL,
  `person_id`       VARCHAR(36)  NOT NULL,
  `plan_id`         VARCHAR(36)  DEFAULT NULL,
  `status`          ENUM('active','paused','completed','stopped') NOT NULL DEFAULT 'active',
  `started_at`      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ended_at`        TIMESTAMP    NULL DEFAULT NULL,
  `duration_min`    SMALLINT     DEFAULT NULL,
  `calories_burned` SMALLINT    DEFAULT NULL,
  `mood`            ENUM('great','good','okay','tired','poor') DEFAULT NULL,
  `notes`           TEXT         DEFAULT NULL,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ws_lifecycle` (`lifecycle_id`),
  INDEX `idx_workout_sessions_person_status` (`person_id`, `status`),
  INDEX `idx_workout_sessions_started` (`started_at`),
  CONSTRAINT `fk_ws_lifecycle` FOREIGN KEY (`lifecycle_id`) REFERENCES `entity_lifecycle`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_workout_sessions_person` FOREIGN KEY (`person_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_workout_sessions_plan` FOREIGN KEY (`plan_id`) REFERENCES `workout_plans`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 21. BRANCH_CLOSURES
-- ============================================================================

CREATE TABLE IF NOT EXISTS `branch_closures` (
  `id`             VARCHAR(36)  NOT NULL,
  `lifecycle_id`   VARCHAR(36)  NOT NULL,
  `closure_date`   DATE         NOT NULL,
  `reason`         VARCHAR(255) DEFAULT NULL,
  `is_emergency`   TINYINT(1)   NOT NULL DEFAULT 0,
  `closed_by`      VARCHAR(36)  DEFAULT NULL,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_bc_lifecycle` (`lifecycle_id`),
  UNIQUE KEY `uq_closure_date` (`closure_date`),
  CONSTRAINT `fk_bc_lifecycle` FOREIGN KEY (`lifecycle_id`) REFERENCES `entity_lifecycle`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_closure_by` FOREIGN KEY (`closed_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 22. SHIFTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS `shifts` (
  `id`             VARCHAR(36)  NOT NULL,
  `lifecycle_id`   VARCHAR(36)  NOT NULL,
  `staff_id`       VARCHAR(36)  NOT NULL,
  `shift_type`     ENUM('morning','afternoon','evening','full_day') NOT NULL,
  `shift_date`     DATE         NOT NULL,
  `start_time`     VARCHAR(8)   NOT NULL,
  `end_time`       VARCHAR(8)   NOT NULL,
  `status`         ENUM('scheduled','active','completed','missed','swapped') NOT NULL DEFAULT 'scheduled',
  `notes`          VARCHAR(255) DEFAULT NULL,
  `created_by`     VARCHAR(36)  DEFAULT NULL,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_shift_lifecycle` (`lifecycle_id`),
  INDEX `idx_shift_staff` (`staff_id`),
  INDEX `idx_shift_date`  (`shift_date`),
  CONSTRAINT `fk_shift_lifecycle` FOREIGN KEY (`lifecycle_id`) REFERENCES `entity_lifecycle`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_shift_staff`   FOREIGN KEY (`staff_id`)   REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_shift_creator` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
