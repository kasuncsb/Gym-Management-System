-- Migration V3: Create Access Control & Attendance Tables
-- Version: 1.0
-- Date: 2026-01-25
-- Description: Creates attendance and door access logging tables

-- ============================================================
-- 7. ATTENDANCE TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS attendance (
    attendance_id INT PRIMARY KEY AUTO_INCREMENT,
    member_id VARCHAR(20) NOT NULL,
    event_type ENUM('IN', 'OUT') NOT NULL,
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    gate_id VARCHAR(10) COMMENT 'Physical gate identifier',
    device_id VARCHAR(20) COMMENT 'Scanner device ID',
    location VARCHAR(50) COMMENT 'e.g., Main Entrance, Side Door',
    qr_scan_success BOOLEAN DEFAULT TRUE,
    validation_status ENUM('granted', 'denied') DEFAULT 'granted',
    denial_reason VARCHAR(200),
    
    FOREIGN KEY (member_id) REFERENCES member(member_id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
        
    INDEX idx_member_timestamp (member_id, timestamp),
    INDEX idx_event_type (event_type),
    INDEX idx_gate (gate_id, timestamp),
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Member check-in and check-out timestamp records';

-- ============================================================
-- 8. DOOR_ACCESS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS door_access (
    access_id INT PRIMARY KEY AUTO_INCREMENT,
    member_id VARCHAR(20),
    trainer_id VARCHAR(10),
    access_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    door_id VARCHAR(10) NOT NULL,
    access_type ENUM('entry', 'exit') NOT NULL,
    status ENUM('granted', 'denied') NOT NULL,
    reason VARCHAR(200) COMMENT 'Subscription expired, Invalid QR, etc.',
    
    FOREIGN KEY (member_id) REFERENCES member(member_id) 
        ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (trainer_id) REFERENCES trainer(trainer_id) 
        ON DELETE SET NULL ON UPDATE CASCADE,
        
    INDEX idx_access_time (access_time),
    INDEX idx_door_status (door_id, status),
    INDEX idx_member (member_id),
    INDEX idx_trainer (trainer_id),
    
    CONSTRAINT chk_user_exists CHECK (member_id IS NOT NULL OR trainer_id IS NOT NULL)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Door access attempts for members and trainers';

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================
SHOW TABLES LIKE '%attendance%';
SHOW TABLES LIKE '%door%';

DESCRIBE attendance;
DESCRIBE door_access;
