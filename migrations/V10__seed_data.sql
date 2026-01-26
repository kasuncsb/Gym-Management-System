-- Migration V10: Seed Data
-- Version: 1.0
-- Date: 2026-01-25
-- Description: Inserts sample data for testing and development

-- ============================================================
-- 1. INSERT SUBSCRIPTION PLANS
-- ============================================================
INSERT INTO subscription_plan (plan_id, plan_name, description, price, duration_days, access_hours, facilities, max_appointments_per_month, priority_level, is_active) VALUES
('PLAN001', 'Basic Monthly', 'Access to gym equipment during off-peak hours', 3000.00, 30, '06:00-16:00', '{"gym": true, "pool": false, "sauna": false, "classes": false}', 2, 1, TRUE),
('PLAN002', 'Standard Monthly', 'Full gym access with pool and sauna', 5000.00, 30, '06:00-22:00', '{"gym": true, "pool": true, "sauna": true, "classes": false}', 4, 2, TRUE),
('PLAN003', 'Premium Monthly', 'Unlimited access with personal training sessions', 8000.00, 30, '24/7', '{"gym": true, "pool": true, "sauna": true, "classes": true}', 8, 3, TRUE),
('PLAN004', 'Student Monthly', 'Discounted plan for students', 2500.00, 30, '06:00-20:00', '{"gym": true, "pool": false, "sauna": false, "classes": false}', 2, 1, TRUE),
('PLAN005', 'Annual Premium', 'Annual premium package with best value', 80000.00, 365, '24/7', '{"gym": true, "pool": true, "sauna": true, "classes": true}', 12, 4, TRUE);

-- ============================================================
-- 2. INSERT SAMPLE STAFF
-- ============================================================
INSERT INTO staff (staff_id, first_name, last_name, email, phone, date_of_birth, role, hire_date, password_hash, status, permissions) VALUES
('STF001', 'Kamal', 'Silva', 'kamal.silva@powerworld.lk', '+94771234567', '1985-03-15', 'admin', '2020-01-15', '$2b$10$dummyhash001', 'active', '{"can_manage_members": true, "can_manage_staff": true, "can_view_reports": true, "can_modify_system": true}'),
('STF002', 'Nimal', 'Perera', 'nimal.perera@powerworld.lk', '+94772345678', '1990-07-22', 'manager', '2021-03-10', '$2b$10$dummyhash002', 'active', '{"can_manage_members": true, "can_view_reports": true, "can_manage_schedules": true}'),
('STF003', 'Sanduni', 'Fernando', 'sanduni.fernando@powerworld.lk', '+94773456789', '1992-11-05', 'receptionist', '2022-06-01', '$2b$10$dummyhash003', 'active', '{"can_checkin_members": true, "can_view_members": true}'),
('STF004', 'Ranil', 'Wickramasinghe', 'ranil.w@powerworld.lk', '+94774567890', '1988-05-18', 'trainer', '2020-08-20', '$2b$10$dummyhash004', 'active', '{"can_manage_appointments": true, "can_create_workouts": true}'),
('STF005', 'Chamari', 'Athapaththu', 'chamari.a@powerworld.lk', '+94775678901', '1991-02-28', 'trainer', '2021-11-15', '$2b$10$dummyhash005', 'active', '{"can_manage_appointments": true, "can_create_workouts": true}');

-- ============================================================
-- 3. INSERT SAMPLE TRAINERS
-- ============================================================
INSERT INTO trainer (trainer_id, staff_id, specialization, certification, hourly_rate, availability, bio) VALUES
('TRN001', 'STF004', 'Strength Training & Bodybuilding', 'NSCA-CPT, ACE Personal Trainer', 2500.00, 
 '{"mon": ["08:00-16:00"], "tue": ["08:00-16:00"], "wed": ["08:00-16:00"], "thu": ["08:00-16:00"], "fri": ["08:00-14:00"]}',
 'Specialized in strength training with 12+ years of experience. Former national bodybuilding champion.'),
('TRN002', 'STF005', 'Yoga & Pilates', 'RYT-500, Pilates Instructor Certification', 2000.00,
 '{"mon": ["09:00-17:00"], "wed": ["09:00-17:00"], "thu": ["09:00-17:00"], "sat": ["07:00-12:00"]}',
 'Certified yoga instructor focusing on flexibility, mindfulness, and core strength.');

-- ============================================================
-- 4. INSERT SAMPLE MEMBERS
-- ============================================================
INSERT INTO member (member_id, first_name, last_name, email, phone, date_of_birth, join_date, emergency_contact, password_hash, status) VALUES
('MEM001', 'Samantha', 'Jayawardena', 'samantha.j@email.com', '+94761234567', '1995-04-12', '2024-01-15', 'Mrs. Jayawardena - 0712345678', '$2b$10$memberHash001', 'active'),
('MEM002', 'Dinesh', 'Chandimal', 'dinesh.c@email.com', '+94762345678', '1988-08-20', '2024-02-01', 'Mr. Chandimal Sr. - 0723456789', '$2b$10$memberHash002', 'active'),
('MEM003', 'Nadeesha', 'Wijesinghe', 'nadeesha.w@email.com', '+94763456789', '1993-11-30', '2024-01-20', 'Dr. Wijesinghe - 0734567890', '$2b$10$memberHash003', 'active'),
('MEM004', 'Kasun', 'Silva', 'kasun.silva@email.com', '+94764567890', '1996-06-15', '2024-03-10', 'Ms. Silva - 0745678901', '$2b$10$memberHash004', 'active'),
('MEM005', 'Tharushi', 'De Silva', 'tharushi.d@email.com', '+94765678901', '1999-09-22', '2024-02-15', 'Mr. De Silva - 0756789012', '$2b$10$memberHash005', 'active'),
('MEM006', 'Chaminda', 'Vaas', 'chaminda.v@email.com', '+94766789012', '1974-07-27', '2024-01-05', 'Mrs. Vaas - 0767890123', '$2b$10$memberHash006', 'active'),
('MEM007', 'Lasith', 'Malinga', 'lasith.m@email.com', '+94767890123', '1983-08-28', '2024-03-01', 'Mrs. Malinga - 0778901234', '$2b$10$memberHash007', 'active'),
('MEM008', 'Sangakkara', 'Kumar', 'sanga.k@email.com', '+94768901234', '1977-10-27', '2024-01-25', 'Mrs. Kumar - 0789012345', '$2b$10$memberHash008', 'active'),
('MEM009', 'Mahela', 'Jayawardene', 'mahela.j@email.com', '+94769012345', '1977-05-27', '2024-02-20', 'Mrs. Jayawardene - 0790123456', '$2b$10$memberHash009', 'active'),
('MEM010', 'Angelo', 'Mathews', 'angelo.m@email.com', '+94760123456', '1987-06-02', '2024-03-05', 'Mr. Mathews Sr. - 0701234567', '$2b$10$memberHash010', 'active');

-- ============================================================
-- 5. INSERT SAMPLE SUBSCRIPTIONS
-- ============================================================
INSERT INTO subscription (subscription_id, member_id, plan_id, start_date, end_date, status, auto_renew, payment_status) VALUES
('SUB00120240115', 'MEM001', 'PLAN003', '2024-01-15', '2024-02-14', 'active', TRUE, 'paid'),
('SUB00220240201', 'MEM002', 'PLAN002', '2024-02-01', '2024-03-01', 'active', TRUE, 'paid'),
('SUB00320240120', 'MEM003', 'PLAN003', '2024-01-20', '2024-02-19', 'active', FALSE, 'paid'),
('SUB00420240310', 'MEM004', 'PLAN001', '2024-03-10', '2024-04-09', 'active', TRUE, 'paid'),
('SUB00520240215', 'MEM005', 'PLAN004', '2024-02-15', '2024-03-15', 'active', TRUE, 'paid'),
('SUB00620240105', 'MEM006', 'PLAN005', '2024-01-05', '2025-01-04', 'active', TRUE, 'paid'),
('SUB00720240301', 'MEM007', 'PLAN002', '2024-03-01', '2024-03-31', 'active', FALSE, 'paid'),
('SUB00820240125', 'MEM008', 'PLAN003', '2024-01-25', '2024-02-24', 'active', TRUE, 'paid'),
('SUB00920240220', 'MEM009', 'PLAN002', '2024-02-20', '2024-03-20', 'active', TRUE, 'paid'),
('SUB01020240305', 'MEM010', 'PLAN001', '2024-03-05', '2024-04-04', 'active', TRUE, 'paid');

-- ============================================================
-- 6. INSERT SAMPLE PAYMENTS
-- ============================================================
INSERT INTO payment (payment_id, member_id, subscription_id, amount, payment_date, payment_method, status, transaction_id) VALUES
('PAY00120240115', 'MEM001', 'SUB00120240115', 8000.00, '2024-01-15 10:30:00', 'credit_card', 'success', 'TXN_CC_001'),
('PAY00220240201', 'MEM002', 'SUB00220240201', 5000.00, '2024-02-01 09:15:00', 'debit_card', 'success', 'TXN_DC_002'),
('PAY00320240120', 'MEM003', 'SUB00320240120', 8000.00, '2024-01-20 14:45:00', 'credit_card', 'success', 'TXN_CC_003'),
('PAY00420240310', 'MEM004', 'SUB00420240310', 3000.00, '2024-03-10 11:20:00', 'cash', 'success', 'TXN_CASH_004'),
('PAY00520240215', 'MEM005', 'SUB00520240215', 2500.00, '2024-02-15 16:00:00', 'credit_card', 'success', 'TXN_CC_005'),
('PAY00620240105', 'MEM006', 'SUB00620240105', 80000.00, '2024-01-05 08:30:00', 'bank_transfer', 'success', 'TXN_BT_006'),
('PAY00720240301', 'MEM007', 'SUB00720240301', 5000.00, '2024-03-01 13:10:00', 'debit_card', 'success', 'TXN_DC_007'),
('PAY00820240125', 'MEM008', 'SUB00820240125', 8000.00, '2024-01-25 10:50:00', 'credit_card', 'success', 'TXN_CC_008'),
('PAY00920240220', 'MEM009', 'SUB00920240220', 5000.00, '2024-02-20 15:30:00', 'debit_card', 'success', 'TXN_DC_009'),
('PAY01020240305', 'MEM010', 'SUB01020240305', 3000.00, '2024-03-05 12:00:00', 'cash', 'success', 'TXN_CASH_010');

-- ============================================================
-- 7. INSERT SAMPLE EQUIPMENT
-- ============================================================
INSERT INTO equipment (equipment_id, name, category, brand, purchase_date, status, location, last_maintenance_date, next_maintenance_date) VALUES
('EQ001', 'Treadmill Pro X1', 'Cardio', 'TechnoGym', '2023-01-15', 'active', 'Cardio Zone A', '2024-01-10', '2024-04-10'),
('EQ002', 'Elliptical Trainer', 'Cardio', 'Precor', '2023-02-20', 'active', 'Cardio Zone A', '2024-01-15', '2024-04-15'),
('EQ003', 'Bench Press Station', 'Strength', 'Rogue Fitness', '2022-11-05', 'active', 'Free Weights Area', '2024-02-01', '2024-05-01'),
('EQ004', 'Leg Press Machine', 'Strength', 'Life Fitness', '2023-03-10', 'active', 'Machine Zone', '2024-01-20', '2024-04-20'),
('EQ005', 'Cable Crossover', 'Strength', 'Matrix', '2023-04-15', 'active', 'Machine Zone', '2024-02-05', '2024-05-05'),
('EQ006', 'Rowing Machine', 'Cardio', 'Concept2', '2023-05-20', 'active', 'Cardio Zone B', '2024-01-25', '2024-04-25'),
('EQ007', 'Smith Machine', 'Strength', 'TechnoGym', '2022-12-01', 'maintenance', 'Free Weights Area', '2024-03-01', '2024-03-15'),
('EQ008', 'Dumbbells Set (5-50kg)', 'Free Weights', 'York', '2022-10-01', 'active', 'Free Weights Area', '2024-02-10', '2024-05-10');

-- ============================================================
-- 8. INSERT SAMPLE SYSTEM CONFIGURATION
-- ============================================================
INSERT INTO system_config (config_key, config_value, data_type, description, category, is_editable, modified_by) VALUES
('gym.opening_hours', '06:00-22:00', 'string', 'Regular gym operating hours', 'gym_settings', TRUE, 'STF001'),
('gym.name', 'PowerWorld Fitness - Kiribathgoda', 'string', 'Official gym name', 'gym_settings', TRUE, 'STF001'),
('qr.expiry_minutes', '15', 'number', 'QR code token expiry time in minutes', 'security', TRUE, 'STF001'),
('subscription.grace_period_days', '3', 'number', 'Grace period after subscription expiry', 'subscription', TRUE, 'STF001'),
('notification.email_enabled', 'true', 'boolean', 'Enable email notifications', 'notification', TRUE, 'STF001'),
('notification.sms_enabled', 'false', 'boolean', 'Enable SMS notifications', 'notification', TRUE, 'STF001'),
('payment.gateway', 'stripe', 'string', 'Payment gateway provider', 'payment', FALSE, 'STF001'),
('system.version', '1.0.0', 'string', 'System version number', 'system', FALSE, 'STF001');

-- ============================================================
-- 9. INSERT SAMPLE ATTENDANCE RECORDS (Last 7 days)
-- ============================================================
-- This is a simplified sample - in production, you'd have many more records
INSERT INTO attendance (member_id, event_type, timestamp, gate_id, device_id, location, validation_status) VALUES
('MEM001', 'IN', DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 8 HOUR, 'GATE01', 'SCANNER01', 'Main Entrance', 'granted'),
('MEM001', 'OUT', DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 10 HOUR, 'GATE01', 'SCANNER01', 'Main Entrance', 'granted'),
('MEM002', 'IN', DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 7 HOUR, 'GATE01', 'SCANNER01', 'Main Entrance', 'granted'),
('MEM002', 'OUT', DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 9 HOUR, 'GATE01', 'SCANNER01', 'Main Entrance', 'granted'),
('MEM003', 'IN', DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 18 HOUR, 'GATE01', 'SCANNER01', 'Main Entrance', 'granted'),
('MEM003', 'OUT', DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 20 HOUR, 'GATE01', 'SCANNER01', 'Main Entrance', 'granted');

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================
SELECT 'Subscription Plans' AS table_name, COUNT(*) AS row_count FROM subscription_plan
UNION ALL
SELECT 'Staff', COUNT(*) FROM staff
UNION ALL
SELECT 'Trainers', COUNT(*) FROM trainer
UNION ALL
SELECT 'Members', COUNT(*) FROM member
UNION ALL
SELECT 'Subscriptions', COUNT(*) FROM subscription
UNION ALL
SELECT 'Payments', COUNT(*) FROM payment
UNION ALL
SELECT 'Equipment', COUNT(*) FROM equipment
UNION ALL
SELECT 'System Config', COUNT(*) FROM system_config
UNION ALL
SELECT 'Attendance', COUNT(*) FROM attendance;

-- Verify active members with subscriptions
SELECT * FROM vw_active_members;

-- Check QR tokens were auto-generated
SELECT member_id, first_name, last_name, 
       LEFT(qr_code_token, 20) AS qr_preview,
       qr_token_issued_at
FROM member
LIMIT 5;
