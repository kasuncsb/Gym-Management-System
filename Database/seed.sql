-- Enhanced Seed Data for Power World Gym Management System
-- Based on real information from https://powerworldgyms.com/
-- Power World Gyms: Sri Lanka's largest fitness network with 24+ locations and 25,000+ members
-- Default Password for all users: 'Password@123'
-- Real bcrypt hash: $2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lW7QK5n8jLGG

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================================
-- 1. CORE IDENTITY & AUTH
-- ============================================================================

-- Branches (Real Power World Gyms locations)
INSERT INTO `branches` (`id`, `name`, `code`, `address`, `phone`, `email`, `is_active`) VALUES
('b1001', 'Power World Kiribathgoda', 'KBT', '154 Kandy Rd, Kiribathgoda', '+94 11 291 0000', 'kbt@powerworld.lk', 1),
('b1002', 'Power World Attidiya', 'ATD', 'Attidiya, Dehiwala', '+94 11 291 0001', 'attidiya@powerworld.lk', 1),
('b1003', 'Power World Londgen Place', 'LGP', 'Londgen Place, Colombo', '+94 11 291 0002', 'londgen@powerworld.lk', 1),
('b1004', 'Power World Dehiwala Ladies', 'DHL', 'Dehiwala', '+94 11 291 0003', 'dehiwala@powerworld.lk', 1),
('b1005', 'Power World Kottawa', 'KTW', 'Kottawa', '+94 11 291 0004', 'kottawa@powerworld.lk', 1);

-- Users (Admin, Managers, Trainers, Staff, Members)
INSERT INTO `users` (`id`, `email`, `password_hash`, `role`, `full_name`, `phone`, `avatar_url`, `is_active`) VALUES
-- Admin
('u0001', 'admin@powerworld.lk', '$2b$12$zBph6pz/nhIG8EMhWU22VuB7dkFPE8jGiusAvk8mBGI6AOiLJoqEe', 'admin', 'System Administrator', '+94 77 000 0000', '/avatars/admin.jpg', 1),
-- Managers
('u0002', 'manager.kbt@powerworld.lk', '$2b$12$zBph6pz/nhIG8EMhWU22VuB7dkFPE8jGiusAvk8mBGI6AOiLJoqEe', 'manager', 'Kamal Perera', '+94 77 111 2222', '/avatars/kamal.jpg', 1),
('u0003', 'manager.atd@powerworld.lk', '$2b$12$zBph6pz/nhIG8EMhWU22VuB7dkFPE8jGiusAvk8mBGI6AOiLJoqEe', 'manager', 'Sanduni Wijesinghe', '+94 77 222 3333', '/avatars/sanduni.jpg', 1),
-- Trainers (Certified trainers as per website)
('u0004', 'trainer.jay@powerworld.lk', '$2b$12$zBph6pz/nhIG8EMhWU22VuB7dkFPE8jGiusAvk8mBGI6AOiLJoqEe', 'trainer', 'Jayantha Silva', '+94 77 333 4444', '/avatars/jay.jpg', 1),
('u0005', 'trainer.nimal@powerworld.lk', '$2b$12$zBph6pz/nhIG8EMhWU22VuB7dkFPE8jGiusAvk8mBGI6AOiLJoqEe', 'trainer', 'Nimal Rajapakse', '+94 77 444 5555', '/avatars/nimal.jpg', 1),
('u0006', 'trainer.priya@powerworld.lk', '$2b$12$zBph6pz/nhIG8EMhWU22VuB7dkFPE8jGiusAvk8mBGI6AOiLJoqEe', 'trainer', 'Priya Kumari', '+94 77 555 6666', '/avatars/priya.jpg', 1),
('u0007', 'trainer.rohan@powerworld.lk', '$2b$12$zBph6pz/nhIG8EMhWU22VuB7dkFPE8jGiusAvk8mBGI6AOiLJoqEe', 'trainer', 'Rohan Fernando', '+94 77 666 7777', '/avatars/rohan.jpg', 1),
('u0008', 'trainer.madhushi@powerworld.lk', '$2b$12$zBph6pz/nhIG8EMhWU22VuB7dkFPE8jGiusAvk8mBGI6AOiLJoqEe', 'trainer', 'Madhushi Perera', '+94 77 777 8888', '/avatars/madhushi.jpg', 1),
-- Staff
('u0009', 'rec.amara@powerworld.lk', '$2b$12$zBph6pz/nhIG8EMhWU22VuB7dkFPE8jGiusAvk8mBGI6AOiLJoqEe', 'staff', 'Amara Fernando', '+94 77 888 9999', '/avatars/amara.jpg', 1),
('u0010', 'rec.dilshan@powerworld.lk', '$2b$12$zBph6pz/nhIG8EMhWU22VuB7dkFPE8jGiusAvk8mBGI6AOiLJoqEe', 'staff', 'Dilshan Wickramasinghe', '+94 77 999 0000', '/avatars/dilshan.jpg', 1),
-- Members (Diverse member base)
('u1001', 'kasun.m@gmail.com', '$2b$12$zBph6pz/nhIG8EMhWU22VuB7dkFPE8jGiusAvk8mBGI6AOiLJoqEe', 'member', 'Kasun Mendis', '+94 71 234 5678', '/avatars/kasun.jpg', 1),
('u1002', 'nimali.d@gmail.com', '$2b$12$zBph6pz/nhIG8EMhWU22VuB7dkFPE8jGiusAvk8mBGI6AOiLJoqEe', 'member', 'Nimali De Silva', '+94 71 876 5432', '/avatars/nimali.jpg', 1),
('u1003', 'saman.k@gmail.com', '$2b$12$zBph6pz/nhIG8EMhWU22VuB7dkFPE8jGiusAvk8mBGI6AOiLJoqEe', 'member', 'Saman Kumara', '+94 71 555 1234', '/avatars/saman.jpg', 1),
('u1004', 'priyanka.w@gmail.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lW7QK5n8jLGG', 'member', 'Priyanka Wickramasinghe', '+94 71 666 7890', '/avatars/priyanka.jpg', 1),
('u1005', 'tharindu.r@gmail.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lW7QK5n8jLGG', 'member', 'Tharindu Rathnayake', '+94 71 111 2222', '/avatars/tharindu.jpg', 1),
('u1006', 'chamari.s@gmail.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lW7QK5n8jLGG', 'member', 'Chamari Samaraweera', '+94 71 333 4444', '/avatars/chamari.jpg', 1),
('u1007', 'dinesh.p@gmail.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lW7QK5n8jLGG', 'member', 'Dinesh Pathirana', '+94 71 555 6666', '/avatars/dinesh.jpg', 1),
('u1008', 'anusha.g@gmail.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lW7QK5n8jLGG', 'member', 'Anusha Gunasekara', '+94 71 777 8888', '/avatars/anusha.jpg', 1),
('u1009', 'ruwan.h@gmail.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lW7QK5n8jLGG', 'member', 'Ruwan Herath', '+94 71 999 0000', '/avatars/ruwan.jpg', 1),
('u1010', 'malini.j@gmail.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lW7QK5n8jLGG', 'member', 'Malini Jayawardena', '+94 71 222 3333', '/avatars/malini.jpg', 1),
('u1011', 'ashan.b@gmail.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lW7QK5n8jLGG', 'member', 'Ashan Bandara', '+94 71 444 5555', '/avatars/ashan.jpg', 1),
('u1012', 'thilini.n@gmail.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lW7QK5n8jLGG', 'member', 'Thilini Nanayakkara', '+94 71 666 7777', '/avatars/thilini.jpg', 1);

-- Permissions
INSERT INTO `permissions` (`id`, `code`, `description`) VALUES
('perm001', 'manage_users', 'Create, update, and delete user accounts'),
('perm002', 'manage_members', 'Manage member profiles and subscriptions'),
('perm003', 'manage_inventory', 'Manage products and inventory'),
('perm004', 'view_reports', 'Access system reports and analytics'),
('perm005', 'manage_equipment', 'Track and maintain gym equipment'),
('perm006', 'manage_classes', 'Create and schedule classes'),
('perm007', 'access_pos', 'Access point of sale system'),
('perm008', 'manage_trainers', 'Assign and manage trainer schedules');

-- Role Permissions
INSERT INTO `role_permissions` (`role`, `permission_code`) VALUES
('admin', 'manage_users'),
('admin', 'manage_members'),
('admin', 'manage_inventory'),
('admin', 'view_reports'),
('admin', 'manage_equipment'),
('admin', 'manage_classes'),
('admin', 'access_pos'),
('admin', 'manage_trainers'),
('manager', 'manage_members'),
('manager', 'manage_inventory'),
('manager', 'view_reports'),
('manager', 'manage_equipment'),
('manager', 'access_pos'),
('manager', 'manage_trainers'),
('staff', 'access_pos'),
('staff', 'manage_equipment'),
('trainer', 'manage_classes');

-- ============================================================================
-- 2. PROFILES & CRM
-- ============================================================================

-- Leads (Prospective members)
INSERT INTO `leads` (`id`, `name`, `phone`, `email`, `source`, `lead_status`, `notes`, `follow_up_date`) VALUES
('lead001', 'Rajitha Fernando', '+94 71 999 8888', 'rajitha.f@gmail.com', 'walk_in', 'contacted', 'Interested in annual membership with personal training', '2026-01-28'),
('lead002', 'Dilshan Perera', '+94 71 888 7777', 'dilshan.p@gmail.com', 'social_media', 'new', 'Saw Facebook ad, interested in bodybuilding program', '2026-01-27'),
('lead003', 'Malini Silva', '+94 71 777 6666', 'malini.s@gmail.com', 'referral', 'converted', 'Referred by Kasun Mendis', NULL),
('lead004', 'Chathura Dias', '+94 71 666 5555', 'chathura.d@gmail.com', 'walk_in', 'new', 'Visited Kiribathgoda branch', '2026-01-29'),
('lead005', 'Ishara Perera', '+94 71 555 4444', 'ishara.p@gmail.com', 'social_media', 'contacted', 'Instagram inquiry about ladies-only classes', '2026-01-30');

-- Staff
INSERT INTO `staff` (`id`, `user_id`, `employee_code`, `designation`, `branch_id`, `hire_date`, `base_salary`, `status`) VALUES
('s0001', 'u0002', 'EMP001', 'Branch Manager', 'b1001', '2020-01-15', 150000.00, 'active'),
('s0002', 'u0003', 'EMP002', 'Branch Manager', 'b1002', '2021-06-01', 145000.00, 'active'),
('s0003', 'u0009', 'EMP003', 'Front Desk Officer', 'b1001', '2021-03-10', 45000.00, 'active'),
('s0004', 'u0010', 'EMP004', 'Front Desk Officer', 'b1002', '2022-01-15', 45000.00, 'active');

-- Trainers (Certified trainers with specializations)
INSERT INTO `trainers` (`id`, `user_id`, `specialization`, `bio`, `hourly_rate`, `rating`, `branch_id`) VALUES
('t0001', 'u0004', 'Bodybuilding and Strength Training', 'Certified personal trainer with 5 years experience in strength training and muscle building. Specializes in powerlifting and bodybuilding competition prep.', 2500.00, 4.8, 'b1001'),
('t0002', 'u0005', 'Yoga and Flexibility', 'Certified yoga instructor specializing in Hatha and Vinyasa styles. 3 years experience helping members improve flexibility and mindfulness.', 2000.00, 4.9, 'b1001'),
('t0003', 'u0006', 'Weight Loss and Cardio', 'Fitness expert focused on weight loss programs and cardiovascular health. Certified nutritionist with personalized diet planning.', 2200.00, 4.7, 'b1002'),
('t0004', 'u0007', 'CrossFit and HIIT', 'CrossFit Level 2 trainer specializing in high-intensity interval training and functional fitness.', 2400.00, 4.9, 'b1001'),
('t0005', 'u0008', 'Ladies Fitness and Zumba', 'Certified Zumba instructor and ladies fitness specialist. Creates fun, engaging workouts for women of all fitness levels.', 2100.00, 5.0, 'b1004');

-- Members
INSERT INTO `members` (`id`, `user_id`, `member_code`, `date_of_birth`, `gender`, `home_branch_id`, `join_date`, `status`, `qr_code_secret`, `emergency_contact_name`, `emergency_contact_phone`) VALUES
('m0001', 'u1001', 'MEM001', '1995-05-20', 'male', 'b1001', '2023-01-01', 'active', 'JBSWY3DPEHPK3PXP', 'Sanduni Mendis', '+94 71 234 9999'),
('m0002', 'u1002', 'MEM002', '1998-08-15', 'female', 'b1001', '2023-02-15', 'active', 'K4S6S62JS62KD8S2', 'Anil De Silva', '+94 71 876 1111'),
('m0003', 'u1003', 'MEM003', '1992-03-10', 'male', 'b1001', '2024-06-01', 'active', 'L5T7T73KT73LE9T3', 'Chamari Kumara', '+94 71 555 9999'),
('m0004', 'u1004', 'MEM004', '2000-11-25', 'female', 'b1004', '2025-01-10', 'active', 'M6U8U84LU84MF0U4', 'Rohan Wickramasinghe', '+94 71 666 1111'),
('m0005', 'u1005', 'MEM005', '1990-07-18', 'male', 'b1002', '2024-03-15', 'active', 'N7V9V95MV95NG1V5', 'Nadeeka Rathnayake', '+94 71 111 8888'),
('m0006', 'u1006', 'MEM006', '1996-12-05', 'female', 'b1001', '2025-05-20', 'active', 'O8W0W06NW06OH2W6', 'Sunil Samaraweera', '+94 71 333 2222'),
('m0007', 'u1007', 'MEM007', '1988-04-22', 'male', 'b1003', '2023-09-10', 'active', 'P9X1X17OX17PI3X7', 'Kumari Pathirana', '+94 71 555 3333'),
('m0008', 'u1008', 'MEM008', '1993-09-30', 'female', 'b1002', '2024-11-01', 'active', 'Q0Y2Y28PY28QJ4Y8', 'Prasad Gunasekara', '+94 71 777 4444'),
('m0009', 'u1009', 'MEM009', '1991-02-14', 'male', 'b1001', '2025-02-28', 'active', 'R1Z3Z39QZ39RK5Z9', 'Shanika Herath', '+94 71 999 5555'),
('m0010', 'u1010', 'MEM010', '1997-06-08', 'female', 'b1005', '2024-08-15', 'active', 'S2A4A40RA40SL6A0', 'Chandana Jayawardena', '+94 71 222 6666'),
('m0011', 'u1011', 'MEM011', '1994-10-12', 'male', 'b1001', '2025-12-01', 'active', 'T3B5B51SB51TM7B1', 'Nishani Bandara', '+94 71 444 7777'),
('m0012', 'u1012', 'MEM012', '1999-03-28', 'female', 'b1002', '2026-01-05', 'active', 'U4C6C62TC62UN8C2', 'Asanka Nanayakkara', '+94 71 666 8888');

-- Member Documents
INSERT INTO `member_documents` (`id`, `member_id`, `type`, `file_url`) VALUES
('doc001', 'm0001', 'waiver', '/uploads/waivers/mem001_waiver.pdf'),
('doc002', 'm0001', 'contract', '/uploads/contracts/mem001_contract.pdf'),
('doc003', 'm0002', 'waiver', '/uploads/waivers/mem002_waiver.pdf'),
('doc004', 'm0003', 'waiver', '/uploads/waivers/mem003_waiver.pdf'),
('doc005', 'm0004', 'waiver', '/uploads/waivers/mem004_waiver.pdf'),
('doc006', 'm0005', 'contract', '/uploads/contracts/mem005_contract.pdf');

-- Member Metrics (Progress tracking)
INSERT INTO `member_metrics` (`id`, `member_id`, `weight`, `height`, `body_fat_percentage`, `muscle_mass`, `bmi`, `notes`) VALUES
('metric001', 'm0001', 75.5, 175.0, 18.5, 62.0, 24.7, 'Initial assessment'),
('metric002', 'm0001', 73.2, 175.0, 16.8, 63.5, 23.9, 'After 3 months - excellent progress'),
('metric003', 'm0002', 58.0, 162.0, 22.0, 45.0, 22.1, 'Initial assessment'),
('metric004', 'm0003', 82.0, 180.0, 20.0, 66.0, 25.3, 'Initial assessment'),
('metric005', 'm0005', 78.5, 178.0, 19.2, 64.0, 24.8, 'Initial assessment'),
('metric006', 'm0006', 62.0, 165.0, 24.5, 47.0, 22.8, 'Initial assessment'),
('metric007', 'm0007', 85.0, 182.0, 22.0, 66.5, 25.7, 'Initial assessment'),
('metric008', 'm0008', 55.0, 160.0, 21.0, 43.5, 21.5, 'Initial assessment');

-- ============================================================================
-- 3. OPERATIONS, ASSETS & IOT
-- ============================================================================

-- Zones
INSERT INTO `zones` (`id`, `branch_id`, `name`, `capacity`) VALUES
('z101', 'b1001', 'Main Gym Floor', 100),
('z102', 'b1001', 'Cardio Zone', 40),
('z103', 'b1001', 'Strength Training Area', 50),
('z104', 'b1001', 'Studio A - Group Classes', 30),
('z105', 'b1002', 'Main Gym Floor', 80),
('z106', 'b1004', 'Ladies Only Section', 60);

-- Gates (IoT Access Control)
INSERT INTO `gates` (`id`, `zone_id`, `name`, `device_id`, `ip_address`, `status`, `last_heartbeat`) VALUES
('g001', 'z101', 'KBT Main Entrance', 'DEV-KBT-01', '192.168.1.50', 'active', NOW()),
('g002', 'z101', 'KBT Main Exit', 'DEV-KBT-02', '192.168.1.51', 'active', NOW()),
('g003', 'z105', 'ATD Main Entrance', 'DEV-ATD-01', '192.168.2.50', 'active', NOW()),
('g004', 'z106', 'DHL Ladies Entrance', 'DEV-DHL-01', '192.168.3.50', 'active', NOW());

-- Access Logs (Recent activity)
INSERT INTO `access_logs` (`id`, `user_id`, `gate_id`, `timestamp`, `attendance_type`, `is_authorized`) VALUES
('log001', 'u1001', 'g001', NOW() - INTERVAL 5 HOUR, 'in', 1),
('log002', 'u1001', 'g002', NOW() - INTERVAL 3 HOUR, 'out', 1),
('log003', 'u1002', 'g001', NOW() - INTERVAL 4 HOUR, 'in', 1),
('log004', 'u1003', 'g001', NOW() - INTERVAL 2 HOUR, 'in', 1),
('log005', 'u1004', 'g004', NOW() - INTERVAL 6 HOUR, 'in', 1),
('log006', 'u1005', 'g003', NOW() - INTERVAL 1 HOUR, 'in', 1),
('log007', 'u1006', 'g001', NOW() - INTERVAL 7 HOUR, 'in', 1),
('log008', 'u1007', 'g003', NOW() - INTERVAL 8 HOUR, 'in', 1),
('log009', 'u1008', 'g004', NOW() - INTERVAL 3 HOUR, 'in', 1),
('log010', 'u1009', 'g001', NOW() - INTERVAL 2 HOUR, 'in', 1);

-- Equipment (Top-of-the-line equipment as mentioned on website)
INSERT INTO `equipment` (`id`, `branch_id`, `name`, `type`, `serial_number`, `purchase_date`, `warranty_expiry`, `equipment_status`, `last_maintenance_date`) VALUES
('eq001', 'b1001', 'LifeFitness Treadmill T5', 'Cardio', 'LF-TM-2022-001', '2022-01-01', '2027-01-01', 'operational', '2025-11-15'),
('eq002', 'b1001', 'Hammer Strength Smith Machine', 'Strength', 'HS-SM-2022-055', '2022-01-01', '2027-01-01', 'operational', '2025-12-20'),
('eq003', 'b1001', 'Concept2 Rowing Machine', 'Cardio', 'C2-ROW-2023-012', '2023-06-15', '2028-06-15', 'operational', NULL),
('eq004', 'b1001', 'Cybex Leg Press', 'Strength', 'CX-LP-2023-020', '2023-08-01', '2028-08-01', 'operational', NULL),
('eq005', 'b1002', 'Precor Elliptical', 'Cardio', 'PR-EL-2024-005', '2024-01-10', '2029-01-10', 'operational', NULL),
('eq006', 'b1001', 'Technogym Cable Crossover', 'Strength', 'TG-CC-2023-030', '2023-05-20', '2028-05-20', 'operational', NULL),
('eq007', 'b1001', 'Matrix Spin Bike', 'Cardio', 'MX-SB-2024-015', '2024-02-01', '2029-02-01', 'operational', NULL),
('eq008', 'b1002', 'Hammer Strength Chest Press', 'Strength', 'HS-CP-2023-040', '2023-07-10', '2028-07-10', 'operational', NULL),
('eq009', 'b1003', 'StairMaster StepMill', 'Cardio', 'SM-SM-2024-008', '2024-03-15', '2029-03-15', 'operational', NULL),
('eq010', 'b1001', 'TRX Suspension Training System', 'Functional', 'TRX-ST-2023-025', '2023-09-01', '2026-09-01', 'operational', NULL);

-- Maintenance Logs
INSERT INTO `maintenance_logs` (`id`, `equipment_id`, `description`, `cost`, `performed_by`, `performed_at`) VALUES
('maint001', 'eq001', 'Belt replacement and motor calibration', 15000.00, 'TechFit Services', '2025-11-15 10:00:00'),
('maint002', 'eq002', 'Lubrication and safety inspection', 5000.00, 'Amara Fernando', '2025-12-20 14:30:00'),
('maint003', 'eq006', 'Cable replacement and pulley adjustment', 8000.00, 'TechFit Services', '2025-10-05 09:00:00');

-- ============================================================================
-- 4. BILLING, INVENTORY & FINANCE
-- ============================================================================

-- Subscription Plans (Based on Power World Gyms packages)
INSERT INTO `subscription_plans` (`id`, `name`, `description`, `price`, `duration_days`, `features`, `is_active`) VALUES
('plan001', 'Monthly Membership', 'Basic gym access for 30 days with all equipment', 5500.00, 30, '{"gym": true, "pool": false, "classes": false, "personal_training": false, "guest_passes": 0}', 1),
('plan002', 'Quarterly Membership', 'Three month access with group classes included', 14500.00, 90, '{"gym": true, "pool": false, "classes": true, "personal_training": false, "guest_passes": 1}', 1),
('plan003', 'Annual Gold Membership', 'Premium annual membership with all facilities and personal training sessions', 48000.00, 365, '{"gym": true, "pool": true, "classes": true, "personal_training": true, "guest_passes": 2, "pt_sessions": 4}', 1),
('plan004', 'Ladies Special Monthly', 'Ladies-only section access for 30 days', 4500.00, 30, '{"gym": true, "pool": false, "classes": true, "personal_training": false, "ladies_only": true}', 1);

-- Subscriptions
INSERT INTO `subscriptions` (`id`, `member_id`, `plan_id`, `start_date`, `end_date`, `status`, `auto_renew`, `notes`) VALUES
('sub001', 'm0001', 'plan003', '2026-01-01', '2026-12-31', 'active', 1, 'Annual Gold - Early bird discount applied'),
('sub002', 'm0002', 'plan001', '2026-01-15', '2026-02-14', 'active', 1, NULL),
('sub003', 'm0003', 'plan002', '2025-12-01', '2026-02-28', 'active', 0, NULL),
('sub004', 'm0004', 'plan004', '2025-11-01', '2026-10-31', 'active', 1, 'Ladies Special'),
('sub005', 'm0005', 'plan003', '2024-03-15', '2027-03-14', 'active', 1, 'Multi-year renewal'),
('sub006', 'm0006', 'plan001', '2026-01-20', '2026-02-19', 'active', 1, NULL),
('sub007', 'm0007', 'plan002', '2025-09-10', '2026-12-09', 'active', 1, NULL),
('sub008', 'm0008', 'plan001', '2026-01-10', '2026-02-09', 'active', 0, NULL),
('sub009', 'm0009', 'plan003', '2025-02-28', '2026-02-27', 'active', 1, NULL),
('sub010', 'm0010', 'plan002', '2024-08-15', '2026-11-13', 'active', 1, NULL);

-- Product Categories
INSERT INTO `product_categories` (`id`, `name`, `description`) VALUES
('pc001', 'Supplements', 'Protein powders, vitamins, and nutritional supplements'),
('pc002', 'Apparel', 'Gym clothing, shoes, and accessories'),
('pc003', 'Beverages', 'Energy drinks, protein shakes, and hydration products'),
('pc004', 'Equipment', 'Personal training equipment and accessories'),
('pc005', 'Recovery', 'Massage tools, foam rollers, and recovery aids');

-- Products (Gym shop inventory)
INSERT INTO `products` (`id`, `category_id`, `name`, `sku`, `price`, `cost_price`, `stock_quantity`, `reorder_level`, `is_active`) VALUES
('p001', 'pc001', 'Whey Protein Isolate (2lbs)', 'SUP-WHEY-2LB', 12500.00, 9000.00, 45, 10, 1),
('p002', 'pc001', 'Creatine Monohydrate (300g)', 'SUP-CRE-300G', 4500.00, 3200.00, 30, 8, 1),
('p003', 'pc003', 'Energy Drink (500ml)', 'BEV-NRG-500', 350.00, 200.00, 150, 30, 1),
('p004', 'pc002', 'Power World Gym T-Shirt', 'APP-TSHIRT-M', 1500.00, 800.00, 80, 15, 1),
('p005', 'pc004', 'Resistance Bands Set', 'EQP-BANDS-SET', 2500.00, 1500.00, 40, 10, 1),
('p006', 'pc001', 'BCAA Powder (400g)', 'SUP-BCAA-400G', 5500.00, 3800.00, 25, 8, 1),
('p007', 'pc002', 'Gym Shorts', 'APP-SHORTS-L', 2000.00, 1100.00, 60, 12, 1),
('p008', 'pc005', 'Foam Roller', 'REC-FOAM-ROLL', 3500.00, 2000.00, 20, 5, 1),
('p009', 'pc003', 'Protein Shake (Ready-to-Drink)', 'BEV-PROT-RTD', 450.00, 250.00, 100, 25, 1),
('p010', 'pc004', 'Lifting Straps', 'EQP-STRAPS', 1200.00, 600.00, 35, 8, 1);

-- Inventory Logs
INSERT INTO `inventory_logs` (`id`, `product_id`, `change_amount`, `reason`, `staff_id`) VALUES
('inv001', 'p001', 45, 'initial_stock', 's0003'),
('inv002', 'p002', 30, 'initial_stock', 's0003'),
('inv003', 'p003', 150, 'initial_stock', 's0003'),
('inv004', 'p001', -3, 'sale', 's0003'),
('inv005', 'p003', -8, 'sale', 's0003'),
('inv006', 'p004', -2, 'sale', 's0004'),
('inv007', 'p006', -1, 'sale', 's0003');

-- Invoices
INSERT INTO `invoices` (`id`, `user_id`, `invoice_number`, `issue_date`, `due_date`, `total_amount`, `paid_amount`, `invoice_status`) VALUES
('inv001', 'u1001', 'INV-2026-001', '2026-01-01', '2026-01-01', 48000.00, 48000.00, 'paid'),
('inv002', 'u1002', 'INV-2026-002', '2026-01-15', '2026-01-15', 5500.00, 5500.00, 'paid'),
('inv003', 'u1003', 'INV-2025-089', '2025-12-01', '2025-12-01', 14500.00, 14500.00, 'paid'),
('inv004', 'u1001', 'INV-2026-003', '2026-01-20', '2026-01-20', 37850.00, 37850.00, 'paid'),
('inv005', 'u1005', 'INV-2024-045', '2024-03-15', '2024-03-15', 48000.00, 48000.00, 'paid'),
('inv006', 'u1006', 'INV-2026-004', '2026-01-20', '2026-01-20', 7000.00, 7000.00, 'paid');

-- Invoice Items
INSERT INTO `invoice_items` (`id`, `invoice_id`, `description`, `product_id`, `plan_id`, `quantity`, `unit_price`, `amount`) VALUES
('item001', 'inv001', 'Annual Gold Membership', NULL, 'plan003', 1, 48000.00, 48000.00),
('item002', 'inv002', 'Monthly Membership', NULL, 'plan001', 1, 5500.00, 5500.00),
('item003', 'inv003', 'Quarterly Membership', NULL, 'plan002', 1, 14500.00, 14500.00),
('item004', 'inv004', 'Whey Protein Isolate (2lbs)', 'p001', NULL, 3, 12500.00, 37500.00),
('item005', 'inv004', 'Energy Drink (500ml)', 'p003', NULL, 1, 350.00, 350.00),
('item006', 'inv005', 'Annual Gold Membership', NULL, 'plan003', 1, 48000.00, 48000.00),
('item007', 'inv006', 'Monthly Membership', NULL, 'plan001', 1, 5500.00, 5500.00),
('item008', 'inv006', 'Gym T-Shirt', 'p004', NULL, 1, 1500.00, 1500.00);

-- Payments
INSERT INTO `payments` (`id`, `invoice_id`, `user_id`, `amount`, `payment_method`, `transaction_id`, `payment_status`, `payment_date`) VALUES
('pay001', 'inv001', 'u1001', 48000.00, 'card', 'TXN-STRIPE-20260101-001', 'success', '2026-01-01 10:30:00'),
('pay002', 'inv002', 'u1002', 5500.00, 'cash', NULL, 'success', '2026-01-15 14:15:00'),
('pay003', 'inv003', 'u1003', 14500.00, 'transfer', 'TXN-BANK-20251201-001', 'success', '2025-12-01 09:00:00'),
('pay004', 'inv004', 'u1001', 37850.00, 'card', 'TXN-STRIPE-20260120-002', 'success', '2026-01-20 16:45:00'),
('pay005', 'inv005', 'u1005', 48000.00, 'card', 'TXN-STRIPE-20240315-003', 'success', '2024-03-15 11:20:00'),
('pay006', 'inv006', 'u1006', 7000.00, 'cash', NULL, 'success', '2026-01-20 15:30:00');

-- ============================================================================
-- 5. ACADEMICS & ENGAGEMENT
-- ============================================================================

-- Classes (Popular classes at Power World Gyms)
INSERT INTO `classes` (`id`, `name`, `description`, `type`, `difficulty`, `capacity`) VALUES
('cls001', 'Morning Yoga Flow', 'Energizing yoga session to start your day with mindfulness and flexibility', 'Yoga', 'beginner', 25),
('cls002', 'HIIT Cardio Blast', 'High intensity interval training for maximum calorie burn', 'Cardio', 'advanced', 20),
('cls003', 'Strength Training 101', 'Introduction to weight training and proper form', 'Strength', 'beginner', 15),
('cls004', 'Zumba Dance Fitness', 'Fun Latin-inspired dance workout', 'Dance', 'intermediate', 30),
('cls005', 'CrossFit Fundamentals', 'Learn the basics of CrossFit training', 'CrossFit', 'intermediate', 18),
('cls006', 'Ladies Bootcamp', 'Full body workout designed for women', 'Strength', 'intermediate', 20),
('cls007', 'Spin Class', 'Indoor cycling for cardiovascular endurance', 'Cardio', 'intermediate', 25),
('cls008', 'Power Yoga', 'Challenging yoga flow for strength and flexibility', 'Yoga', 'advanced', 20);

-- Class Schedules (Weekly schedule)
INSERT INTO `class_schedules` (`id`, `class_id`, `trainer_id`, `start_time`, `end_time`, `max_capacity`, `location`) VALUES
-- Monday
('sch001', 'cls001', 't0002', '2026-01-27 07:00:00', '2026-01-27 08:00:00', 25, 'Studio A'),
('sch002', 'cls002', 't0004', '2026-01-27 18:00:00', '2026-01-27 19:00:00', 20, 'Main Gym Floor'),
('sch003', 'cls007', 't0003', '2026-01-27 19:00:00', '2026-01-27 20:00:00', 25, 'Cardio Zone'),
-- Tuesday
('sch004', 'cls004', 't0005', '2026-01-28 19:00:00', '2026-01-28 20:00:00', 30, 'Studio A'),
('sch005', 'cls003', 't0001', '2026-01-28 18:00:00', '2026-01-28 19:00:00', 15, 'Strength Area'),
-- Wednesday
('sch006', 'cls001', 't0002', '2026-01-29 07:00:00', '2026-01-29 08:00:00', 25, 'Studio A'),
('sch007', 'cls005', 't0004', '2026-01-29 18:30:00', '2026-01-29 19:30:00', 18, 'Main Gym Floor'),
-- Thursday
('sch008', 'cls006', 't0005', '2026-01-30 18:00:00', '2026-01-30 19:00:00', 20, 'Ladies Section'),
('sch009', 'cls008', 't0002', '2026-01-30 19:00:00', '2026-01-30 20:00:00', 20, 'Studio A'),
-- Friday
('sch010', 'cls002', 't0004', '2026-01-31 18:00:00', '2026-01-31 19:00:00', 20, 'Main Gym Floor');

-- Class Bookings
INSERT INTO `class_bookings` (`id`, `schedule_id`, `member_id`, `booking_status`, `booking_date`) VALUES
('book001', 'sch001', 'm0001', 'confirmed', '2026-01-25 10:00:00'),
('book002', 'sch001', 'm0002', 'confirmed', '2026-01-25 11:30:00'),
('book003', 'sch002', 'm0001', 'confirmed', '2026-01-26 14:00:00'),
('book004', 'sch004', 'm0006', 'confirmed', '2026-01-26 16:00:00'),
('book005', 'sch005', 'm0003', 'confirmed', '2026-01-27 09:00:00'),
('book006', 'sch006', 'm0002', 'confirmed', '2026-01-27 12:00:00'),
('book007', 'sch008', 'm0004', 'confirmed', '2026-01-28 10:00:00'),
('book008', 'sch001', 'm0005', 'confirmed', '2026-01-25 15:00:00');

-- Appointments (Personal training sessions)
INSERT INTO `appointments` (`id`, `member_id`, `trainer_id`, `start_time`, `end_time`, `appointment_type`, `appointment_status`, `notes`) VALUES
('apt001', 'm0001', 't0001', '2026-01-27 10:00:00', '2026-01-27 11:00:00', 'training_session', 'confirmed', 'Focus on chest and triceps - Bench press progression'),
('apt002', 'm0003', 't0001', '2026-01-27 14:00:00', '2026-01-27 15:00:00', 'consultation', 'completed', 'Initial fitness assessment and goal setting'),
('apt003', 'm0002', 't0002', '2026-01-28 09:00:00', '2026-01-28 10:00:00', 'training_session', 'confirmed', 'Yoga flexibility and core strength'),
('apt004', 'm0005', 't0004', '2026-01-28 16:00:00', '2026-01-28 17:00:00', 'training_session', 'confirmed', 'CrossFit technique refinement'),
('apt005', 'm0006', 't0005', '2026-01-29 10:00:00', '2026-01-29 11:00:00', 'consultation', 'confirmed', 'Weight loss program consultation'),
('apt006', 'm0007', 't0001', '2026-01-29 15:00:00', '2026-01-29 16:00:00', 'training_session', 'confirmed', 'Deadlift form check and progression'),
('apt007', 'm0008', 't0003', '2026-01-30 11:00:00', '2026-01-30 12:00:00', 'assessment', 'confirmed', 'Body composition analysis');

-- Exercises (Comprehensive exercise library)
INSERT INTO `exercises` (`id`, `name`, `description`, `category`, `video_url`) VALUES
('ex001', 'Barbell Bench Press', 'Compound chest exercise using barbell for upper body strength', 'Chest', 'https://example.com/videos/bench_press.mp4'),
('ex002', 'Back Squat', 'Lower body compound movement targeting quads, glutes, and hamstrings', 'Legs', 'https://example.com/videos/squat.mp4'),
('ex003', 'Conventional Deadlift', 'Full body compound lift emphasizing posterior chain', 'Back', 'https://example.com/videos/deadlift.mp4'),
('ex004', 'Pull-ups', 'Upper body pulling exercise for back and biceps', 'Back', 'https://example.com/videos/pullups.mp4'),
('ex005', 'Overhead Press', 'Shoulder pressing movement for upper body strength', 'Shoulders', 'https://example.com/videos/shoulder_press.mp4'),
('ex006', 'Barbell Bicep Curls', 'Isolation exercise targeting biceps', 'Arms', 'https://example.com/videos/bicep_curls.mp4'),
('ex007', 'Romanian Deadlift', 'Hip hinge movement for hamstrings and glutes', 'Legs', 'https://example.com/videos/rdl.mp4'),
('ex008', 'Dumbbell Rows', 'Unilateral back exercise for muscle balance', 'Back', 'https://example.com/videos/db_rows.mp4'),
('ex009', 'Leg Press', 'Machine-based lower body exercise', 'Legs', 'https://example.com/videos/leg_press.mp4'),
('ex010', 'Cable Flyes', 'Chest isolation using cable machine', 'Chest', 'https://example.com/videos/cable_flyes.mp4');

-- Workout Routines
INSERT INTO `workout_routines` (`id`, `member_id`, `creator_id`, `name`, `description`, `is_active`) VALUES
('rout001', 'm0001', 't0001', 'Beginner Full Body 3x/Week', 'Three day per week full body routine for beginners', 1),
('rout002', 'm0003', 't0001', 'Strength Builder 5x5', 'Focus on compound movements with 5x5 protocol', 1),
('rout003', 'm0005', 't0004', 'CrossFit WOD Program', 'Daily varied functional fitness workouts', 1),
('rout004', 'm0006', 't0003', 'Weight Loss Circuit', 'High-rep circuit training for fat loss', 1);

-- Routine Exercises
INSERT INTO `routine_exercises` (`id`, `routine_id`, `exercise_id`, `sets`, `reps`, `rest_time_seconds`, `order_index`) VALUES
('rex001', 'rout001', 'ex002', 3, '10-12', 90, 1),
('rex002', 'rout001', 'ex001', 3, '8-10', 90, 2),
('rex003', 'rout001', 'ex004', 3, '6-8', 120, 3),
('rex004', 'rout002', 'ex003', 5, '5', 180, 1),
('rex005', 'rout002', 'ex002', 5, '5', 180, 2),
('rex006', 'rout002', 'ex001', 5, '5', 180, 3),
('rex007', 'rout003', 'ex003', 3, '10', 60, 1),
('rex008', 'rout003', 'ex004', 3, '10', 60, 2);

-- Workout Logs
INSERT INTO `workout_logs` (`id`, `member_id`, `routine_id`, `date`, `duration_minutes`, `calories_burned`, `notes`, `verified_by`) VALUES
('wlog001', 'm0001', 'rout001', '2026-01-20 18:00:00', 60, 350, 'Great session, felt strong on squats', 's0003'),
('wlog002', 'm0001', 'rout001', '2026-01-22 18:00:00', 55, 320, 'Slightly tired but completed all sets', NULL),
('wlog003', 'm0003', 'rout002', '2026-01-21 17:00:00', 75, 420, 'New PR on deadlift - 140kg!', 's0003'),
('wlog004', 'm0005', 'rout003', '2026-01-23 19:00:00', 45, 380, 'Intense WOD, finished in 18:30', NULL),
('wlog005', 'm0006', 'rout004', '2026-01-24 18:30:00', 50, 400, 'Circuit training - 4 rounds completed', 's0003');

-- Diet Plans
INSERT INTO `diet_plans` (`id`, `member_id`, `trainer_id`, `daily_calorie_target`, `macro_ratio`, `start_date`, `end_date`, `is_active`) VALUES
('diet001', 'm0001', 't0001', 2500, '40P/30C/30F', '2026-01-01', '2026-03-31', 1),
('diet002', 'm0003', 't0001', 2800, '35P/40C/25F', '2026-01-01', '2026-03-31', 1),
('diet003', 'm0006', 't0003', 1800, '35P/35C/30F', '2026-01-20', '2026-04-20', 1);

-- ============================================================================
-- 6. HUMAN RESOURCES
-- ============================================================================

-- Shifts
INSERT INTO `shifts` (`id`, `staff_id`, `start_time`, `end_time`, `shift_type`) VALUES
('shift001', 's0003', '2026-01-27 06:00:00', '2026-01-27 14:00:00', 'morning'),
('shift002', 's0003', '2026-01-28 06:00:00', '2026-01-28 14:00:00', 'morning'),
('shift003', 's0001', '2026-01-27 09:00:00', '2026-01-27 18:00:00', 'morning'),
('shift004', 's0004', '2026-01-27 14:00:00', '2026-01-27 22:00:00', 'evening'),
('shift005', 's0004', '2026-01-28 14:00:00', '2026-01-28 22:00:00', 'evening');

-- ============================================================================
-- 7. SYSTEM
-- ============================================================================

-- Audit Logs
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `ip_address`, `timestamp`) VALUES
('audit001', 'u0001', 'CREATE_USER', 'users', 'u1001', '192.168.1.100', '2023-01-01 10:00:00'),
('audit002', 'u0002', 'UPDATE_MEMBER', 'members', 'm0001', '192.168.1.101', '2026-01-15 14:30:00'),
('audit003', 'u0009', 'CREATE_INVOICE', 'invoices', 'inv004', '192.168.1.102', '2026-01-20 16:45:00'),
('audit004', 'u0001', 'CREATE_SUBSCRIPTION_PLAN', 'subscription_plans', 'plan004', '192.168.1.100', '2025-10-01 09:00:00'),
('audit005', 'u0002', 'UPDATE_EQUIPMENT', 'equipment', 'eq001', '192.168.1.101', '2025-11-15 10:00:00');

-- Notifications
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `created_at`) VALUES
('notif001', 'u1001', 'Subscription Renewal Reminder', 'Your Annual Gold membership will renew on 2026-12-31. Auto-renewal is enabled.', 'info', 0, NOW() - INTERVAL 1 DAY),
('notif002', 'u1002', 'Class Reminder', 'Your Morning Yoga Flow class starts in 1 hour at Studio A', 'alert', 1, NOW() - INTERVAL 2 HOUR),
('notif003', 'u1001', 'Appointment Confirmed', 'Your training session with Jayantha Silva is confirmed for 2026-01-27 10:00 AM', 'info', 1, NOW() - INTERVAL 1 DAY),
('notif004', 'u1003', 'Payment Received', 'Your payment of LKR 14,500 has been successfully processed. Thank you!', 'info', 1, NOW() - INTERVAL 30 DAY),
('notif005', 'u1005', 'New Class Available', 'Power Yoga class now available on Thursdays at 7 PM. Book your spot now!', 'info', 0, NOW() - INTERVAL 3 HOUR),
('notif006', 'u1006', 'Membership Expiring Soon', 'Your monthly membership expires in 5 days. Renew now to avoid interruption.', 'alert', 0, NOW() - INTERVAL 6 HOUR);

SET FOREIGN_KEY_CHECKS = 1;
