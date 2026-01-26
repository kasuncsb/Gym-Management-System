-- Seed Data for Power World Gym Management System
-- Default Password for all users: 'Password@123'
-- Hash: '$2b$10$wL.XwV8.c4.O1.y8.p1.u.o1.i' (Example placeholder hash)

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Branches
INSERT INTO `branches` (`id`, `name`, `code`, `address`, `phone`, `email`, `is_active`) VALUES
('b1001', 'Power World Kiribathgoda', 'KBT', '154 Kandy Rd, Kiribathgoda', '+94 11 291 0000', 'kbt@powerworld.lk', 1),
('b1002', 'Power World Colombo 7', 'CMB7', '21 Torrington Ave, Colombo 00700', '+94 11 291 0001', 'cmb7@powerworld.lk', 1);

-- 2. Users (Admin, Manager, Staff, Trainer, Members)
-- Passwords are placeholders. In real app, these would be bcrypt hashes.
INSERT INTO `users` (`id`, `email`, `password_hash`, `role`, `full_name`, `phone`, `is_active`) VALUES
('u0001', 'admin@powerworld.lk', '$2b$10$X7...', 'admin', 'System Administrator', '+94 77 000 0000', 1),
('u0002', 'manager.kbt@powerworld.lk', '$2b$10$X7...', 'manager', 'Kamal Perera', '+94 77 111 2222', 1),
('u0003', 'trainer.jay@powerworld.lk', '$2b$10$X7...', 'trainer', 'Jayantha Silva', '+94 77 333 4444', 1),
('u0004', 'rec.amara@powerworld.lk', '$2b$10$X7...', 'staff', 'Amara Fernando', '+94 77 555 6666', 1),
('u1001', 'kasun.m@gmail.com', '$2b$10$X7...', 'member', 'Kasun Mendis', '+94 71 234 5678', 1),
('u1002', 'nimali.d@gmail.com', '$2b$10$X7...', 'member', 'Nimali De Silva', '+94 71 876 5432', 1);

-- 3. Profiles
INSERT INTO `staff` (`id`, `user_id`, `employee_code`, `designation`, `branch_id`, `hire_date`, `base_salary`, `status`) VALUES
('s0001', 'u0002', 'EMP001', 'Branch Manager', 'b1001', '2020-01-15', 150000.00, 'active'),
('s0002', 'u0004', 'EMP002', 'Front Desk Officer', 'b1001', '2021-03-10', 45000.00, 'active');

INSERT INTO `trainers` (`id`, `user_id`, `specialization`, `bio`, `hourly_rate`, `rating`, `branch_id`) VALUES
('t0001', 'u0003', 'Bodybuilding & Strength', 'Certified personal trainer with 5 years experience.', 2500.00, 4.8, 'b1001');

INSERT INTO `members` (`id`, `user_id`, `member_code`, `date_of_birth`, `gender`, `home_branch_id`, `join_date`, `status`, `qr_code_secret`) VALUES
('m0001', 'u1001', 'MEM001', '1995-05-20', 'male', 'b1001', '2023-01-01', 'active', 'JBSWY3DPEHPK3PXP'),
('m0002', 'u1002', 'MEM002', '1998-08-15', 'female', 'b1001', '2023-02-15', 'active', 'K4S6S62JS62KD8S2');

-- 4. Zones & Gates
INSERT INTO `zones` (`id`, `branch_id`, `name`, `capacity`) VALUES
('z101', 'b1001', 'Main Gym Floor', 100),
('z102', 'b1001', 'Cardio Section', 40);

INSERT INTO `gates` (`id`, `zone_id`, `name`, `device_id`, `ip_address`, `status`) VALUES
('g001', 'z101', 'Main Turnstile In', 'DEV-MAC-01', '192.168.1.50', 'active'),
('g002', 'z101', 'Main Turnstile Out', 'DEV-MAC-02', '192.168.1.51', 'active');

-- 5. Products & Inventory
INSERT INTO `product_categories` (`id`, `name`) VALUES
('pc001', 'Supplements'),
('pc002', 'Apparel'),
('pc003', 'Beverages');

INSERT INTO `products` (`id`, `category_id`, `name`, `sku`, `price`, `stock_quantity`) VALUES
('p001', 'pc001', 'Whey Protein (2lbs)', 'SUP-WHEY-2LB', 12500.00, 20),
('p002', 'pc001', 'Creatine Monohydrate', 'SUP-CRE-300G', 4500.00, 15),
('p003', 'pc003', 'Energy Drink', 'BEV-NRG-500', 350.00, 100);

-- 6. Subscription Plans
INSERT INTO `subscription_plans` (`id`, `name`, `price`, `duration_days`, `features`) VALUES
('plan001', 'Monthly Access', 5000.00, 30, '{"gym": true, "pool": false, "classes": false}'),
('plan002', 'Annual Gold', 45000.00, 365, '{"gym": true, "pool": true, "classes": true}');

INSERT INTO `subscriptions` (`id`, `member_id`, `plan_id`, `start_date`, `end_date`, `status`) VALUES
('sub001', 'm0001', 'plan002', '2023-01-01', '2023-12-31', 'active'),
('sub002', 'm0002', 'plan001', '2023-06-01', '2023-07-01', 'active');

-- 7. Equipment
INSERT INTO `equipment` (`id`, `branch_id`, `name`, `type`, `serial_number`, `purchase_date`, `status`) VALUES
('eq001', 'b1001', 'LifeFitness Treadmill', 'Cardio', 'LF-TM-2022-001', '2022-01-01', 'operational'),
('eq002', 'b1001', 'Smith Machine', 'Strength', 'LF-SM-2022-055', '2022-01-01', 'operational');

-- 8. Exercises
INSERT INTO `exercises` (`id`, `name`, `category`, `video_url`) VALUES
('ex001', 'Bench Press', 'Chest', 'https://example.com/videos/bench_press.mp4'),
('ex002', 'Squat', 'Legs', 'https://example.com/videos/squat.mp4'),
('ex003', 'Deadlift', 'Back', 'https://example.com/videos/deadlift.mp4');

-- 9. Activity (Access Logs)
INSERT INTO `access_logs` (`id`, `user_id`, `gate_id`, `timestamp`, `direction`, `is_authorized`) VALUES
('log001', 'u1001', 'g001', NOW() - INTERVAL 2 HOUR, 'in', 1),
('log002', 'u1001', 'g002', NOW() - INTERVAL 1 HOUR, 'out', 1);

SET FOREIGN_KEY_CHECKS = 1;
