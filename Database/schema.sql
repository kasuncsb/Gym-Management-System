-- Database Schema for Power World Gym Management System
-- Generated based on Drizzle ORM Schema
-- Supports MySQL 8.0+

SET FOREIGN_KEY_CHECKS = 0;

-- --- 1. CORE IDENTITY & AUTH ---

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` varchar(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('admin','manager','staff','trainer','member') NOT NULL DEFAULT 'member',
  `full_name` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `avatar_url` varchar(255) DEFAULT NULL,
  `is_active` boolean DEFAULT true,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
);

DROP TABLE IF EXISTS `permissions`;
CREATE TABLE `permissions` (
  `id` varchar(36) NOT NULL,
  `code` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
);

DROP TABLE IF EXISTS `role_permissions`;
CREATE TABLE `role_permissions` (
  `role` enum('admin','manager','staff','trainer','member') NOT NULL,
  `permission_code` varchar(50) NOT NULL,
  UNIQUE KEY `role_perm_idx` (`role`,`permission_code`)
);

-- --- 2. PROFILES & CRM ---

DROP TABLE IF EXISTS `branches`;
CREATE TABLE `branches` (
  `id` varchar(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `code` varchar(20) NOT NULL,
  `address` text NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `is_active` boolean DEFAULT true,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
);

DROP TABLE IF EXISTS `leads`;
CREATE TABLE `leads` (
  `id` varchar(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `source` varchar(50) DEFAULT NULL,
  `status` enum('new','contacted','converted','lost') DEFAULT 'new',
  `notes` text,
  `follow_up_date` date DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

DROP TABLE IF EXISTS `members`;
CREATE TABLE `members` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `member_code` varchar(20) NOT NULL,
  `date_of_birth` date DEFAULT NULL,
  `gender` enum('male','female','other') DEFAULT NULL,
  `emergency_contact_name` varchar(100) DEFAULT NULL,
  `emergency_contact_phone` varchar(20) DEFAULT NULL,
  `medical_conditions` text,
  `home_branch_id` varchar(36) DEFAULT NULL,
  `join_date` date NOT NULL,
  `status` enum('active','inactive','suspended','pending','archived','banned') DEFAULT 'active',
  `qr_code` varchar(100) DEFAULT NULL,
  `qr_code_secret` text,
  `last_qr_generated_at` timestamp DEFAULT NULL,
  `referral_source_id` varchar(36) DEFAULT NULL,
  `deleted_at` timestamp DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `member_code` (`member_code`),
  UNIQUE KEY `qr_code` (`qr_code`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  FOREIGN KEY (`home_branch_id`) REFERENCES `branches` (`id`)
);

DROP TABLE IF EXISTS `member_documents`;
CREATE TABLE `member_documents` (
  `id` varchar(36) NOT NULL,
  `member_id` varchar(36) NOT NULL,
  `type` varchar(50) NOT NULL,
  `file_url` varchar(255) NOT NULL,
  `signed_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`member_id`) REFERENCES `members` (`id`)
);

DROP TABLE IF EXISTS `member_metrics`;
CREATE TABLE `member_metrics` (
  `id` varchar(36) NOT NULL,
  `member_id` varchar(36) NOT NULL,
  `recorded_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `weight` decimal(5,2) DEFAULT NULL,
  `height` decimal(5,2) DEFAULT NULL,
  `body_fat_percentage` decimal(4,1) DEFAULT NULL,
  `muscle_mass` decimal(5,2) DEFAULT NULL,
  `bmi` decimal(4,1) DEFAULT NULL,
  `notes` text,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`member_id`) REFERENCES `members` (`id`)
);

DROP TABLE IF EXISTS `staff`;
CREATE TABLE `staff` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `employee_code` varchar(20) NOT NULL,
  `designation` varchar(100) DEFAULT NULL,
  `branch_id` varchar(36) DEFAULT NULL,
  `hire_date` date NOT NULL,
  `base_salary` decimal(10,2) DEFAULT NULL,
  `status` enum('active','inactive','suspended','pending','archived','banned') DEFAULT 'active',
  `deleted_at` timestamp DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `employee_code` (`employee_code`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`)
);

DROP TABLE IF EXISTS `trainers`;
CREATE TABLE `trainers` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `specialization` varchar(100) DEFAULT NULL,
  `bio` text,
  `hourly_rate` decimal(8,2) DEFAULT NULL,
  `rating` decimal(3,2) DEFAULT '5.00',
  `branch_id` varchar(36) DEFAULT NULL,
  `deleted_at` timestamp DEFAULT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`)
);

-- --- 3. OPERATIONS, ASSETS & IOT ---

DROP TABLE IF EXISTS `zones`;
CREATE TABLE `zones` (
  `id` varchar(36) NOT NULL,
  `branch_id` varchar(36) NOT NULL,
  `name` varchar(50) NOT NULL,
  `capacity` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`)
);

DROP TABLE IF EXISTS `gates`;
CREATE TABLE `gates` (
  `id` varchar(36) NOT NULL,
  `zone_id` varchar(36) DEFAULT NULL,
  `name` varchar(50) DEFAULT NULL,
  `device_id` varchar(50) DEFAULT NULL,
  `ip_address` varchar(50) DEFAULT NULL,
  `last_heartbeat` timestamp DEFAULT NULL,
  `status` enum('active','inactive','suspended','pending','archived','banned') DEFAULT 'active',
  PRIMARY KEY (`id`),
  UNIQUE KEY `device_id` (`device_id`),
  FOREIGN KEY (`zone_id`) REFERENCES `zones` (`id`)
);

DROP TABLE IF EXISTS `access_logs`;
CREATE TABLE `access_logs` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `gate_id` varchar(36) DEFAULT NULL,
  `timestamp` datetime NOT NULL,
  `direction` enum('in','out') NOT NULL,
  `is_authorized` boolean NOT NULL,
  `deny_reason` varchar(100) DEFAULT NULL,
  `snapshot_url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  FOREIGN KEY (`gate_id`) REFERENCES `gates` (`id`)
);

DROP TABLE IF EXISTS `equipment`;
CREATE TABLE `equipment` (
  `id` varchar(36) NOT NULL,
  `branch_id` varchar(36) DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `type` varchar(50) DEFAULT NULL,
  `serial_number` varchar(100) DEFAULT NULL,
  `purchase_date` date DEFAULT NULL,
  `warranty_expiry` date DEFAULT NULL,
  `status` enum('operational','maintenance','retired') DEFAULT 'operational',
  `last_maintenance_date` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`)
);

DROP TABLE IF EXISTS `maintenance_logs`;
CREATE TABLE `maintenance_logs` (
  `id` varchar(36) NOT NULL,
  `equipment_id` varchar(36) NOT NULL,
  `description` text NOT NULL,
  `cost` decimal(10,2) DEFAULT NULL,
  `performed_by` varchar(100) DEFAULT NULL,
  `performed_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`equipment_id`) REFERENCES `equipment` (`id`)
);

-- --- 4. BILLING, INVENTORY & FINANCE ---

DROP TABLE IF EXISTS `subscription_plans`;
CREATE TABLE `subscription_plans` (
  `id` varchar(36) NOT NULL,
  `name` varchar(50) NOT NULL,
  `description` text,
  `price` decimal(10,2) NOT NULL,
  `duration_days` int NOT NULL,
  `features` json DEFAULT NULL,
  `is_active` boolean DEFAULT true,
  `deleted_at` timestamp DEFAULT NULL,
  PRIMARY KEY (`id`)
);

DROP TABLE IF EXISTS `subscriptions`;
CREATE TABLE `subscriptions` (
  `id` varchar(36) NOT NULL,
  `member_id` varchar(36) NOT NULL,
  `plan_id` varchar(36) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `status` enum('active','inactive','suspended','pending','archived','banned') DEFAULT 'active',
  `auto_renew` boolean DEFAULT true,
  `notes` text,
  `deleted_at` timestamp DEFAULT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`member_id`) REFERENCES `members` (`id`),
  FOREIGN KEY (`plan_id`) REFERENCES `subscription_plans` (`id`)
);

DROP TABLE IF EXISTS `product_categories`;
CREATE TABLE `product_categories` (
  `id` varchar(36) NOT NULL,
  `name` varchar(50) NOT NULL,
  `description` text,
  PRIMARY KEY (`id`)
);

DROP TABLE IF EXISTS `products`;
CREATE TABLE `products` (
  `id` varchar(36) NOT NULL,
  `category_id` varchar(36) DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `sku` varchar(50) DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `cost_price` decimal(10,2) DEFAULT NULL,
  `stock_quantity` int DEFAULT '0',
  `reorder_level` int DEFAULT '10',
  `is_active` boolean DEFAULT true,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sku` (`sku`),
  FOREIGN KEY (`category_id`) REFERENCES `product_categories` (`id`)
);

DROP TABLE IF EXISTS `inventory_logs`;
CREATE TABLE `inventory_logs` (
  `id` varchar(36) NOT NULL,
  `product_id` varchar(36) NOT NULL,
  `change_amount` int NOT NULL,
  `reason` varchar(100) DEFAULT NULL,
  `staff_id` varchar(36) DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`)
);

DROP TABLE IF EXISTS `invoices`;
CREATE TABLE `invoices` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `invoice_number` varchar(50) NOT NULL,
  `issue_date` date NOT NULL,
  `due_date` date NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `paid_amount` decimal(10,2) DEFAULT '0.00',
  `status` enum('draft','issued','paid','void','overdue') DEFAULT 'draft',
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoice_number` (`invoice_number`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
);

DROP TABLE IF EXISTS `invoice_items`;
CREATE TABLE `invoice_items` (
  `id` varchar(36) NOT NULL,
  `invoice_id` varchar(36) NOT NULL,
  `description` varchar(255) NOT NULL,
  `product_id` varchar(36) DEFAULT NULL,
  `plan_id` varchar(36) DEFAULT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `unit_price` decimal(10,2) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`),
  FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  FOREIGN KEY (`plan_id`) REFERENCES `subscription_plans` (`id`)
);

DROP TABLE IF EXISTS `payments`;
CREATE TABLE `payments` (
  `id` varchar(36) NOT NULL,
  `invoice_id` varchar(36) DEFAULT NULL,
  `user_id` varchar(36) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `method` enum('cash','card','transfer','online') NOT NULL,
  `transaction_id` varchar(100) DEFAULT NULL,
  `payment_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `status` enum('success','failed','pending') DEFAULT 'success',
  `gateway_response` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
);

-- --- 5. ACADEMICS & ENGAGEMENT ---

DROP TABLE IF EXISTS `classes`;
CREATE TABLE `classes` (
  `id` varchar(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text,
  `type` varchar(50) DEFAULT NULL,
  `difficulty` enum('beginner','intermediate','advanced') DEFAULT NULL,
  `capacity` int DEFAULT NULL,
  PRIMARY KEY (`id`)
);

DROP TABLE IF EXISTS `class_schedules`;
CREATE TABLE `class_schedules` (
  `id` varchar(36) NOT NULL,
  `class_id` varchar(36) NOT NULL,
  `trainer_id` varchar(36) DEFAULT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime NOT NULL,
  `max_capacity` int DEFAULT '20',
  `location` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`),
  FOREIGN KEY (`trainer_id`) REFERENCES `trainers` (`id`)
);

DROP TABLE IF EXISTS `class_bookings`;
CREATE TABLE `class_bookings` (
  `id` varchar(36) NOT NULL,
  `schedule_id` varchar(36) NOT NULL,
  `member_id` varchar(36) NOT NULL,
  `booking_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `status` enum('confirmed','cancelled','attended','no_show') DEFAULT 'confirmed',
  PRIMARY KEY (`id`),
  FOREIGN KEY (`schedule_id`) REFERENCES `class_schedules` (`id`),
  FOREIGN KEY (`member_id`) REFERENCES `members` (`id`)
);

DROP TABLE IF EXISTS `appointments`;
CREATE TABLE `appointments` (
  `id` varchar(36) NOT NULL,
  `member_id` varchar(36) NOT NULL,
  `trainer_id` varchar(36) NOT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime NOT NULL,
  `type` enum('consultation','training_session','assessment','other') DEFAULT 'training_session',
  `status` enum('pending','confirmed','completed','cancelled') DEFAULT 'pending',
  `notes` text,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`member_id`) REFERENCES `members` (`id`),
  FOREIGN KEY (`trainer_id`) REFERENCES `trainers` (`id`)
);

DROP TABLE IF EXISTS `exercises`;
CREATE TABLE `exercises` (
  `id` varchar(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text,
  `category` varchar(50) DEFAULT NULL,
  `video_url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
);

DROP TABLE IF EXISTS `workout_routines`;
CREATE TABLE `workout_routines` (
  `id` varchar(36) NOT NULL,
  `member_id` varchar(36) DEFAULT NULL,
  `creator_id` varchar(36) DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `description` text,
  `is_active` boolean DEFAULT true,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`member_id`) REFERENCES `members` (`id`),
  FOREIGN KEY (`creator_id`) REFERENCES `trainers` (`id`)
);

DROP TABLE IF EXISTS `routine_exercises`;
CREATE TABLE `routine_exercises` (
  `id` varchar(36) NOT NULL,
  `routine_id` varchar(36) NOT NULL,
  `exercise_id` varchar(36) NOT NULL,
  `sets` int DEFAULT NULL,
  `reps` text,
  `rest_time_seconds` int DEFAULT NULL,
  `order_index` int NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`routine_id`) REFERENCES `workout_routines` (`id`),
  FOREIGN KEY (`exercise_id`) REFERENCES `exercises` (`id`)
);

DROP TABLE IF EXISTS `workout_logs`;
CREATE TABLE `workout_logs` (
  `id` varchar(36) NOT NULL,
  `member_id` varchar(36) NOT NULL,
  `routine_id` varchar(36) DEFAULT NULL,
  `date` datetime NOT NULL,
  `duration_minutes` int DEFAULT NULL,
  `calories_burned` int DEFAULT NULL,
  `notes` text,
  `verified_by` varchar(36) DEFAULT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`member_id`) REFERENCES `members` (`id`),
  FOREIGN KEY (`routine_id`) REFERENCES `workout_routines` (`id`),
  FOREIGN KEY (`verified_by`) REFERENCES `staff` (`id`)
);

DROP TABLE IF EXISTS `diet_plans`;
CREATE TABLE `diet_plans` (
  `id` varchar(36) NOT NULL,
  `member_id` varchar(36) NOT NULL,
  `trainer_id` varchar(36) DEFAULT NULL,
  `daily_calorie_target` int DEFAULT NULL,
  `macro_ratio` varchar(50) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `is_active` boolean DEFAULT true,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`member_id`) REFERENCES `members` (`id`),
  FOREIGN KEY (`trainer_id`) REFERENCES `trainers` (`id`)
);

DROP TABLE IF EXISTS `workout_plans`;
CREATE TABLE `workout_plans` (
  `id` varchar(36) NOT NULL,
  `member_id` varchar(36) DEFAULT NULL,
  `creator_id` varchar(36) DEFAULT NULL,
  `name` varchar(100) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `is_active` boolean DEFAULT true,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`member_id`) REFERENCES `members` (`id`),
  FOREIGN KEY (`creator_id`) REFERENCES `trainers` (`id`)
);


-- --- 7. HUMAN RESOURCES (HR) ---

DROP TABLE IF EXISTS `shifts`;
CREATE TABLE `shifts` (
  `id` varchar(36) NOT NULL,
  `staff_id` varchar(36) NOT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime NOT NULL,
  `type` enum('morning','evening','night','cover') DEFAULT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`)
);

-- --- 8. SYSTEM ---

DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `entity` varchar(50) DEFAULT NULL,
  `entity_id` varchar(36) DEFAULT NULL,
  `details` json DEFAULT NULL,
  `ip_address` varchar(50) DEFAULT NULL,
  `timestamp` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
  -- No FK on user_id to allow logs for deleted users
);

DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `title` varchar(100) NOT NULL,
  `message` text NOT NULL,
  `type` varchar(50) DEFAULT NULL,
  `is_read` boolean DEFAULT false,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
);

SET FOREIGN_KEY_CHECKS = 1;
