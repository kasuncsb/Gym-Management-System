-- Migration V8: Create Stored Procedures & Functions
-- Version: 1.0
-- Date: 2026-01-25
-- Description: Creates stored procedures for business logic

DELIMITER $$

-- ============================================================
-- PROCEDURE 1: Validate Subscription (UC-02)
-- ============================================================
CREATE PROCEDURE IF NOT EXISTS sp_validate_subscription(
    IN p_member_id VARCHAR(20),
    OUT p_is_valid BOOLEAN,
    OUT p_subscription_id VARCHAR(20),
    OUT p_plan_name VARCHAR(50),
    OUT p_end_date DATE,
    OUT p_message VARCHAR(200)
)
BEGIN
    DECLARE v_count INT;
    DECLARE v_status VARCHAR(20);
    
    -- Check for active subscriptions
    SELECT COUNT(*) INTO v_count
    FROM subscription
    WHERE member_id = p_member_id
      AND status = 'active'
      AND payment_status = 'paid'
      AND start_date <= CURRENT_DATE
      AND end_date >= CURRENT_DATE;
    
    IF v_count = 0 THEN
        SET p_is_valid = FALSE;
        SET p_message = 'No active subscription found';
        SET p_subscription_id = NULL;
        SET p_plan_name = NULL;
        SET p_end_date = NULL;
    ELSE
        -- Get highest priority active subscription
        SELECT s.subscription_id, sp.plan_name, s.end_date
        INTO p_subscription_id, p_plan_name, p_end_date
        FROM subscription s
        JOIN subscription_plan sp ON s.plan_id = sp.plan_id
        WHERE s.member_id = p_member_id
          AND s.status = 'active'
          AND s.payment_status = 'paid'
          AND s.start_date <= CURRENT_DATE
          AND s.end_date >= CURRENT_DATE
        ORDER BY sp.priority_level DESC
        LIMIT 1;
        
        SET p_is_valid = TRUE;
        SET p_message = 'Valid subscription';
    END IF;
END$$

-- ============================================================
-- PROCEDURE 2: Authenticate and Record Access (UC-01, UC-03, UC-04)
-- ============================================================
CREATE PROCEDURE IF NOT EXISTS sp_authenticate_qr_access(
    IN p_qr_token VARCHAR(100),
    IN p_device_id VARCHAR(20),
    IN p_gate_id VARCHAR(10),
    OUT p_access_granted BOOLEAN,
    OUT p_member_id VARCHAR(20),
    OUT p_member_name VARCHAR(100),
    OUT p_reason VARCHAR(200)
)
BEGIN
    DECLARE v_member_status VARCHAR(20);
    DECLARE v_is_valid BOOLEAN;
    DECLARE v_subscription_id VARCHAR(20);
    DECLARE v_plan_name VARCHAR(50);
    DECLARE v_end_date DATE;
    DECLARE v_message VARCHAR(200);
    
    -- Find member by QR token
    SELECT member_id, CONCAT(first_name, ' ', last_name), status
    INTO p_member_id, p_member_name, v_member_status
    FROM member
    WHERE qr_code_token = p_qr_token
    LIMIT 1;
    
    -- Check if member exists
    IF p_member_id IS NULL THEN
        SET p_access_granted = FALSE;
        SET p_reason = 'Invalid QR code';
        
        -- Log denied access
        INSERT INTO door_access (member_id, door_id, access_time, access_type, status, reason)
        VALUES (NULL, p_gate_id, NOW(), 'entry', 'denied', 'Invalid QR code');
        
    ELSEIF v_member_status != 'active' THEN
        SET p_access_granted = FALSE;
        SET p_reason = CONCAT('Member account is ', v_member_status);
        
        -- Log denied access
        INSERT INTO door_access (member_id, door_id, access_time, access_type, status, reason)
        VALUES (p_member_id, p_gate_id, NOW(), 'entry', 'denied', p_reason);
        
    ELSE
        -- Validate subscription
        CALL sp_validate_subscription(p_member_id, v_is_valid, v_subscription_id, v_plan_name, v_end_date, v_message);
        
        IF v_is_valid THEN
            SET p_access_granted = TRUE;
            SET p_reason = 'Access granted';
            
            -- Log successful access
            INSERT INTO door_access (member_id, door_id, access_time, access_type, status, reason)
            VALUES (p_member_id, p_gate_id, NOW(), 'entry', 'granted', NULL);
            
            -- Record attendance (check-in)
            INSERT INTO attendance (member_id, event_type, timestamp, gate_id, device_id, validation_status)
            VALUES (p_member_id, 'IN', NOW(), p_gate_id, p_device_id, 'granted');
        ELSE
            SET p_access_granted = FALSE;
            SET p_reason = v_message;
            
            -- Log denied access
            INSERT INTO door_access (member_id, door_id, access_time, access_type, status, reason)
            VALUES (p_member_id, p_gate_id, NOW(), 'entry', 'denied', v_message);
        END IF;
    END IF;
END$$

-- ============================================================
-- PROCEDURE 3: Book Appointment (UC-06)
-- ============================================================
CREATE PROCEDURE IF NOT EXISTS sp_book_appointment(
    IN p_member_id VARCHAR(20),
    IN p_trainer_id VARCHAR(10),
    IN p_appointment_date DATE,
    IN p_start_time TIME,
    IN p_end_time TIME,
    IN p_notes TEXT,
    OUT p_appointment_id VARCHAR(20),
    OUT p_success BOOLEAN,
    OUT p_message VARCHAR(200)
)
BEGIN
    DECLARE v_overlap_count INT;
    DECLARE v_new_id VARCHAR(20);
    
    -- Check for slot conflicts
    SELECT COUNT(*) INTO v_overlap_count
    FROM appointment
    WHERE trainer_id = p_trainer_id
      AND appointment_date = p_appointment_date
      AND status = 'scheduled'
      AND (
          (p_start_time >= start_time AND p_start_time < end_time)
          OR (p_end_time > start_time AND p_end_time <= end_time)
          OR (p_start_time <= start_time AND p_end_time >= end_time)
      );
    
    IF v_overlap_count > 0 THEN
        SET p_success = FALSE;
        SET p_message = 'Time slot already booked';
        SET p_appointment_id = NULL;
    ELSE
        -- Generate appointment ID
        SET v_new_id = CONCAT('APP', LPAD((SELECT COALESCE(MAX(CAST(SUBSTRING(appointment_id, 4) AS UNSIGNED)), 0) + 1 FROM appointment), 15, '0'));
        
        -- Create appointment
        INSERT INTO appointment (appointment_id, member_id, trainer_id, appointment_date, start_time, end_time, status, notes)
        VALUES (v_new_id, p_member_id, p_trainer_id, p_appointment_date, p_start_time, p_end_time, 'scheduled', p_notes);
        
        SET p_appointment_id = v_new_id;
        SET p_success = TRUE;
        SET p_message = 'Appointment booked successfully';
    END IF;
END$$

-- ============================================================
-- PROCEDURE 4: Check Out Member (UC-04)
-- ============================================================
CREATE PROCEDURE IF NOT EXISTS sp_checkout_member(
    IN p_member_id VARCHAR(20),
    IN p_device_id VARCHAR(20),
    IN p_gate_id VARCHAR(10),
    OUT p_success BOOLEAN,
    OUT p_message VARCHAR(200)
)
BEGIN
    DECLARE v_last_event VARCHAR(10);
    
    -- Get last event type for member
    SELECT event_type INTO v_last_event
    FROM attendance
    WHERE member_id = p_member_id
    ORDER BY timestamp DESC
    LIMIT 1;
    
    IF v_last_event = 'OUT' THEN
        SET p_success = FALSE;
        SET p_message = 'Already checked out';
    ELSE
        -- Record check-out
        INSERT INTO attendance (member_id, event_type, timestamp, gate_id, device_id, validation_status)
        VALUES (p_member_id, 'OUT', NOW(), p_gate_id, p_device_id, 'granted');
        
        -- Log door access
        INSERT INTO door_access (member_id, door_id, access_time, access_type, status)
        VALUES (p_member_id, p_gate_id, NOW(), 'exit', 'granted');
        
        SET p_success = TRUE;
        SET p_message = 'Checked out successfully';
    END IF;
END$$

-- ============================================================
-- FUNCTION 1: Get Active Member Count
-- ============================================================
CREATE FUNCTION IF NOT EXISTS fn_get_active_member_count()
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_count INT;
    
    SELECT COUNT(*) INTO v_count
    FROM member
    WHERE status = 'active';
    
    RETURN v_count;
END$$

-- ============================================================
-- FUNCTION 2: Calculate Member Visit Count
-- ============================================================
CREATE FUNCTION IF NOT EXISTS fn_get_member_visit_count(p_member_id VARCHAR(20), p_start_date DATE, p_end_date DATE)
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_count INT;
    
    SELECT COUNT(*) INTO v_count
    FROM attendance
    WHERE member_id = p_member_id
      AND event_type = 'IN'
      AND DATE(timestamp) BETWEEN p_start_date AND p_end_date;
    
    RETURN v_count;
END$$

DELIMITER ;

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================
SHOW PROCEDURE STATUS WHERE Db = DATABASE();
SHOW FUNCTION STATUS WHERE Db = DATABASE();
