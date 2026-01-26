-- PowerWorld Gyms - Sample Data Setup
-- Run this after schema is created

-- Insert Subscription Plans
INSERT INTO subscription_plans (plan_id, plan_name, price, duration_days, access_hours, facilities, description, created_at, updated_at) VALUES
('PLAN_BASIC', 'Basic Monthly', 3500.00, 30, '05:30-22:00', '{"gym":true,"pool":false,"sauna":false,"pt":false}', 'Standard gym access during regular hours', NOW(), NOW()),
('PLAN_PREMIUM', 'Premium Monthly', 5500.00, 30, '00:00-24:00', '{"gym":true,"pool":true,"sauna":true,"pt":false}', '24/7 gym access with pool and sauna', NOW(), NOW()),
('PLAN_STUDENT', 'Student Monthly', 2500.00, 30, '05:30-22:00', '{"gym":true,"pool":false,"sauna":false,"pt":false}', 'Discounted rate for students', NOW(), NOW()),
('PLAN_ANNUAL', 'Annual Membership', 35000.00, 365, '00:00-24:00', '{"gym":true,"pool":true,"sauna":true,"pt":true}', 'Best value - includes 2 PT sessions per month', NOW(), NOW());

-- Insert Sample Staff (Manager)
-- Password: Admin@123 (hashed with bcrypt 12 rounds)
INSERT INTO staff (staff_id, name, email, password_hash, phone, role, status, created_at, updated_at) VALUES
('PWG-KBT-STF-MGR01', 'Kasun Manager', 'manager@powerworld.lk', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TupxQJb.XzGKQXNzGGQOZZ0X8GKm', '+94712345678', 'MANAGER', 'ACTIVE', NOW(), NOW()),
('PWG-KBT-STF-ADM01', 'Admin User', 'admin@powerworld.lk', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TupxQXb.XzGKQXNzGGQOZZ0X8GKm', '+94712345679', 'ADMIN', 'ACTIVE', NOW(), NOW()),
('PWG-KBT-STF-RCP01', 'Reception Staff', 'reception@powerworld.lk', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TupxQJb.XzGKQXNzGGQOZZ0X8GKm', '+94712345680', 'RECEPTIONIST', 'ACTIVE', NOW(), NOW());

-- Insert Sample Trainer
INSERT INTO trainers (trainer_id, name, email, password_hash, phone, specialization, status, created_at, updated_at) VALUES
('PWG-KBT-TRN-TR001', 'John Trainer', 'trainer@powerworld.lk', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TupxQJb.XzGKQXNzGGQOZZ0X8GKm', '+94771234567', 'Strength & Conditioning', 'ACTIVE', NOW(), NOW());

-- Insert System Config
INSERT INTO system_config (config_key, config_value, created_at, updated_at) VALUES
('GYM_NAME', 'PowerWorld Gyms Kiribathgoda', NOW(), NOW()),
('GYM_LOCATION_CODE', 'KBT', NOW(), NOW()),
('GYM_OPENING_TIME', '05:30', NOW(), NOW()),
('GYM_CLOSING_TIME', '22:00', NOW(), NOW()),
('QR_EXPIRY_MINUTES', '5', NOW(), NOW()),
('RATE_LIMIT_QR_SCAN', '10', NOW(), NOW()),
('CURRENCY', 'LKR', NOW(), NOW()),
('TIMEZONE', 'Asia/Colombo', NOW(), NOW());

-- Note: To create test members, use the registration API endpoint
-- To activate subscriptions, insert into subscriptions table with member_id

-- Example subscription for a test member (replace MEMBER_ID):
-- INSERT INTO subscriptions (subscription_id, member_id, plan_id, start_date, end_date, payment_status, status, auto_renew, created_at, updated_at) VALUES
-- ('PWG-SUB-20260126-12345', 'MEMBER_ID_HERE', 'PLAN_PREMIUM', NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), 'PAID', 'ACTIVE', true, NOW(), NOW());
