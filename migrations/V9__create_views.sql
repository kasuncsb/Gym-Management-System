-- Migration V9: Create Views for Reporting
-- Version: 1.0
-- Date: 2026-01-25
-- Description: Creates database views for common queries and reports

-- ============================================================
-- VIEW 1: Active Members with Current Subscription
-- ============================================================
CREATE OR REPLACE VIEW vw_active_members AS
SELECT 
    m.member_id,
    m.first_name,
    m.last_name,
    m.email,
    m.phone,
    m.join_date,
    s.subscription_id,
    s.plan_id,
    sp.plan_name,
    s.start_date,
    s.end_date,
    DATEDIFF(s.end_date, CURRENT_DATE) AS days_remaining,
    s.payment_status,
    sp.price AS monthly_cost
FROM member m
JOIN subscription s ON m.member_id = s.member_id
JOIN subscription_plan sp ON s.plan_id = sp.plan_id
WHERE s.status = 'active' 
  AND m.status = 'active'
  AND s.start_date <= CURRENT_DATE
  AND s.end_date >= CURRENT_DATE;

-- ============================================================
-- VIEW 2: Trainer Schedule Overview
-- ============================================================
CREATE OR REPLACE VIEW vw_trainer_schedule AS
SELECT 
    t.trainer_id,
    s.first_name AS trainer_first_name,
    s.last_name AS trainer_last_name,
    t.specialization,
    a.appointment_id,
    a.appointment_date,
    a.start_time,
    a.end_time,
    a.status AS appointment_status,
    m.member_id,
    m.first_name AS member_first_name,
    m.last_name AS member_last_name,
    m.email AS member_email
FROM trainer t
JOIN staff s ON t.staff_id = s.staff_id
LEFT JOIN appointment a ON t.trainer_id = a.trainer_id
LEFT JOIN member m ON a.member_id = m.member_id
WHERE a.appointment_date >= CURRENT_DATE OR a.appointment_date IS NULL
ORDER BY a.appointment_date, a.start_time;

-- ============================================================
-- VIEW 3: Equipment Utilization Report
-- ============================================================
CREATE OR REPLACE VIEW vw_equipment_usage AS
SELECT 
    e.equipment_id,
    e.name,
    e.category,
    e.status,
    e.location,
    COUNT(se.session_id) AS total_sessions,
    SUM(se.duration_minutes) AS total_minutes_used,
    COALESCE(AVG(se.duration_minutes), 0) AS avg_session_duration,
    e.last_maintenance_date,
    e.next_maintenance_date
FROM equipment e
LEFT JOIN session_equipment se ON e.equipment_id = se.equipment_id
GROUP BY e.equipment_id, e.name, e.category, e.status, e.location, 
         e.last_maintenance_date, e.next_maintenance_date;

-- ============================================================
-- VIEW 4: Monthly Revenue Report
-- ============================================================
CREATE OR REPLACE VIEW vw_monthly_revenue AS
SELECT 
    DATE_FORMAT(payment_date, '%Y-%m') AS month,
    COUNT(*) AS total_transactions,
    SUM(CASE WHEN status = 'success' THEN amount ELSE 0 END) AS total_revenue,
    SUM(CASE WHEN status = 'refunded' THEN amount ELSE 0 END) AS total_refunds,
    SUM(CASE WHEN status = 'success' THEN amount ELSE 0 END) - 
    SUM(CASE WHEN status = 'refunded' THEN amount ELSE 0 END) AS net_revenue,
    COUNT(DISTINCT member_id) AS unique_members,
    ROUND(AVG(CASE WHEN status = 'success' THEN amount END), 2) AS avg_transaction_amount
FROM payment
GROUP BY DATE_FORMAT(payment_date, '%Y-%m')
ORDER BY month DESC;

-- ============================================================
-- VIEW 5: Member Attendance Summary
-- ============================================================
CREATE OR REPLACE VIEW vw_member_attendance AS
SELECT 
    m.member_id,
    m.first_name,
    m.last_name,
    m.email,
    COUNT(CASE WHEN a.event_type = 'IN' THEN 1 END) AS total_checkins,
    MAX(a.timestamp) AS last_visit,
    DATEDIFF(CURRENT_DATE, MAX(a.timestamp)) AS days_since_last_visit,
    COUNT(CASE WHEN a.event_type = 'IN' 
          AND DATE(a.timestamp) >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY) 
          THEN 1 END) AS checkins_last_30_days
FROM member m
LEFT JOIN attendance a ON m.member_id = a.member_id
WHERE m.status = 'active'
GROUP BY m.member_id, m.first_name, m.last_name, m.email;

-- ============================================================
-- VIEW 6: Subscription Expiration Alert
-- ============================================================
CREATE OR REPLACE VIEW vw_expiring_subscriptions AS
SELECT 
    m.member_id,
    m.first_name,
    m.last_name,
    m.email,
    m.phone,
    s.subscription_id,
    sp.plan_name,
    s.end_date,
    DATEDIFF(s.end_date, CURRENT_DATE) AS days_until_expiry,
    s.auto_renew
FROM member m
JOIN subscription s ON m.member_id = s.member_id
JOIN subscription_plan sp ON s.plan_id = sp.plan_id
WHERE s.status = 'active'
  AND s.end_date BETWEEN CURRENT_DATE AND DATE_ADD(CURRENT_DATE, INTERVAL 7 DAY)
ORDER BY s.end_date;

-- ============================================================
-- VIEW 7: Daily Attendance Report
-- ============================================================
CREATE OR REPLACE VIEW vw_daily_attendance AS
SELECT 
    DATE(timestamp) AS attendance_date,
    COUNT(CASE WHEN event_type = 'IN' THEN 1 END) AS total_checkins,
    COUNT(CASE WHEN event_type = 'OUT' THEN 1 END) AS total_checkouts,
    COUNT(DISTINCT member_id) AS unique_members,
    MIN(CASE WHEN event_type = 'IN' THEN timestamp END) AS first_checkin_time,
    MAX(CASE WHEN event_type = 'OUT' THEN timestamp END) AS last_checkout_time
FROM attendance
GROUP BY DATE(timestamp)
ORDER BY attendance_date DESC;

-- ============================================================
-- VIEW 8: Member Progress Dashboard
-- ============================================================
CREATE OR REPLACE VIEW vw_member_progress_summary AS
SELECT 
    m.member_id,
    m.first_name,
    m.last_name,
    COUNT(DISTINCT ws.session_id) AS total_workouts,
    SUM(ws.duration_minutes) AS total_workout_minutes,
    SUM(ws.calories_burned) AS total_calories_burned,
    COUNT(DISTINCT DATE(ws.start_time)) AS workout_days,
    MAX(ws.start_time) AS last_workout_date,
    DATEDIFF(CURRENT_DATE, MAX(ws.start_time)) AS days_since_last_workout
FROM member m
LEFT JOIN workout_session ws ON m.member_id = ws.member_id
WHERE m.status = 'active'
GROUP BY m.member_id, m.first_name, m.last_name;

-- ============================================================
-- VIEW 9: Trainer Availability
-- ============================================================
CREATE OR REPLACE VIEW vw_trainer_availability AS
SELECT 
    t.trainer_id,
    s.first_name,
    s.last_name,
    t.specialization,
    t.hourly_rate,
    s.status,
    COUNT(a.appointment_id) AS upcoming_appointments,
    t.availability AS weekly_schedule
FROM trainer t
JOIN staff s ON t.staff_id = s.staff_id
LEFT JOIN appointment a ON t.trainer_id = a.trainer_id 
    AND a.appointment_date >= CURRENT_DATE 
    AND a.status = 'scheduled'
WHERE s.status = 'active'
GROUP BY t.trainer_id, s.first_name, s.last_name, t.specialization, 
         t.hourly_rate, s.status, t.availability;

-- ============================================================
-- VIEW 10: Subscription Plan Performance
-- ============================================================
CREATE OR REPLACE VIEW vw_subscription_plan_performance AS
SELECT 
    sp.plan_id,
    sp.plan_name,
    sp.price,
    sp.duration_days,
    COUNT(s.subscription_id) AS total_subscriptions,
    COUNT(CASE WHEN s.status = 'active' THEN 1 END) AS active_subscriptions,
    COUNT(CASE WHEN s.status = 'expired' THEN 1 END) AS expired_subscriptions,
    COUNT(CASE WHEN s.status = 'cancelled' THEN 1 END) AS cancelled_subscriptions,
    SUM(CASE WHEN s.status = 'active' THEN sp.price ELSE 0 END) AS active_monthly_revenue
FROM subscription_plan sp
LEFT JOIN subscription s ON sp.plan_id = s.plan_id
WHERE sp.is_active = TRUE
GROUP BY sp.plan_id, sp.plan_name, sp.price, sp.duration_days;

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================
SHOW FULL TABLES WHERE Table_type = 'VIEW';

-- Test views
SELECT * FROM vw_active_members LIMIT 5;
SELECT * FROM vw_monthly_revenue LIMIT 5;
SELECT * FROM vw_member_attendance LIMIT 5;
