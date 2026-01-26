-- Migration V7: Create Database Triggers
-- Version: 1.0
-- Date: 2026-01-25
-- Description: Creates triggers for business logic automation

DELIMITER $$

-- ============================================================
-- TRIGGER 1: Auto-generate QR tokens for new members
-- ============================================================
CREATE TRIGGER IF NOT EXISTS trg_generate_member_qr
BEFORE INSERT ON member
FOR EACH ROW
BEGIN
    IF NEW.qr_code_token IS NULL OR NEW.qr_code_token = '' THEN
        SET NEW.qr_code_token = CONCAT(
            'QR_',
            NEW.member_id,
            '_',
            SHA2(CONCAT(NEW.member_id, UUID(), NOW()), 256)
        );
    END IF;
    SET NEW.qr_token_issued_at = NOW();
END$$

-- ============================================================
-- TRIGGER 2: Auto-generate QR hash for trainers
-- ============================================================
CREATE TRIGGER IF NOT EXISTS trg_generate_trainer_qr
BEFORE INSERT ON trainer
FOR EACH ROW
BEGIN
    IF NEW.qr_hash IS NULL OR NEW.qr_hash = '' THEN
        SET NEW.qr_hash = CONCAT(
            'TRN_QR_',
            NEW.trainer_id,
            '_',
            SHA2(CONCAT(NEW.trainer_id, UUID(), NOW()), 256)
        );
    END IF;
END$$

-- ============================================================
-- TRIGGER 3: Validate subscription dates
-- ============================================================
CREATE TRIGGER IF NOT EXISTS trg_validate_subscription_dates
BEFORE INSERT ON subscription
FOR EACH ROW
BEGIN
    IF NEW.end_date <= NEW.start_date THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'End date must be after start date';
    END IF;
END$$

-- ============================================================
-- TRIGGER 4: Prevent overlapping appointments (same trainer)
-- ============================================================
CREATE TRIGGER IF NOT EXISTS trg_prevent_appointment_overlap
BEFORE INSERT ON appointment
FOR EACH ROW
BEGIN
    DECLARE overlap_count INT;
    
    SELECT COUNT(*) INTO overlap_count
    FROM appointment
    WHERE trainer_id = NEW.trainer_id
      AND appointment_date = NEW.appointment_date
      AND status = 'scheduled'
      AND (
          (NEW.start_time >= start_time AND NEW.start_time < end_time)
          OR (NEW.end_time > start_time AND NEW.end_time <= end_time)
          OR (NEW.start_time <= start_time AND NEW.end_time >= end_time)
      );
    
    IF overlap_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Appointment time overlaps with existing booking';
    END IF;
END$$

-- ============================================================
-- TRIGGER 5: Audit log for member changes
-- ============================================================
CREATE TRIGGER IF NOT EXISTS trg_audit_member_insert
AFTER INSERT ON member
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (entity_type, entity_id, action, new_value)
    VALUES ('member', NEW.member_id, 'CREATE', JSON_OBJECT(
        'member_id', NEW.member_id,
        'email', NEW.email,
        'status', NEW.status
    ));
END$$

CREATE TRIGGER IF NOT EXISTS trg_audit_member_update
AFTER UPDATE ON member
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (entity_type, entity_id, action, old_value, new_value)
    VALUES ('member', NEW.member_id, 'UPDATE', 
        JSON_OBJECT('email', OLD.email, 'status', OLD.status),
        JSON_OBJECT('email', NEW.email, 'status', NEW.status)
    );
END$$

-- ============================================================
-- TRIGGER 6: Audit log for subscription changes
-- ============================================================
CREATE TRIGGER IF NOT EXISTS trg_audit_subscription_insert
AFTER INSERT ON subscription
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (entity_type, entity_id, action, new_value)
    VALUES ('subscription', NEW.subscription_id, 'CREATE', JSON_OBJECT(
        'member_id', NEW.member_id,
        'plan_id', NEW.plan_id,
        'status', NEW.status
    ));
END$$

CREATE TRIGGER IF NOT EXISTS trg_audit_subscription_update
AFTER UPDATE ON subscription
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (entity_type, entity_id, action, old_value, new_value)
    VALUES ('subscription', NEW.subscription_id, 'UPDATE',
        JSON_OBJECT('status', OLD.status, 'payment_status', OLD.payment_status),
        JSON_OBJECT('status', NEW.status, 'payment_status', NEW.payment_status)
    );
END$$

-- ============================================================
-- TRIGGER 7: Audit log for payment transactions
-- ============================================================
CREATE TRIGGER IF NOT EXISTS trg_audit_payment_insert
AFTER INSERT ON payment
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (entity_type, entity_id, action, new_value)
    VALUES ('payment', NEW.payment_id, 'CREATE', JSON_OBJECT(
        'member_id', NEW.member_id,
        'amount', NEW.amount,
        'status', NEW.status
    ));
END$$

DELIMITER ;

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================
SHOW TRIGGERS;
