-- Migration V4: Create Scheduling & Appointment Tables
-- Version: 1.0
-- Date: 2026-01-25
-- Description: Creates appointment and waitlist tables

-- ============================================================
-- 9. APPOINTMENT TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS appointment (
    appointment_id VARCHAR(20) PRIMARY KEY COMMENT 'Format: APP00120240115',
    member_id VARCHAR(20) NOT NULL,
    trainer_id VARCHAR(10) NOT NULL,
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status ENUM('scheduled', 'completed', 'cancelled', 'no-show') DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    cancelled_at TIMESTAMP NULL,
    cancellation_reason VARCHAR(200),
    
    FOREIGN KEY (member_id) REFERENCES member(member_id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (trainer_id) REFERENCES trainer(trainer_id) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
        
    INDEX idx_trainer_date (trainer_id, appointment_date, start_time),
    INDEX idx_member_status (member_id, status),
    INDEX idx_date_status (appointment_date, status),
    INDEX idx_status (status),
    
    CONSTRAINT chk_time_order CHECK (end_time > start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Trainer appointment scheduling';

-- ============================================================
-- 10. APPOINTMENT_WAITLIST TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS appointment_waitlist (
    waitlist_id INT PRIMARY KEY AUTO_INCREMENT,
    member_id VARCHAR(20) NOT NULL,
    trainer_id VARCHAR(10) NOT NULL,
    preferred_date DATE,
    preferred_time_range VARCHAR(50) COMMENT 'e.g., morning, afternoon, evening',
    status ENUM('waiting', 'notified', 'expired') DEFAULT 'waiting',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notified_at TIMESTAMP NULL,
    
    FOREIGN KEY (member_id) REFERENCES member(member_id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (trainer_id) REFERENCES trainer(trainer_id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
        
    INDEX idx_trainer_status (trainer_id, status),
    INDEX idx_member (member_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Waitlist for fully booked trainers';

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================
SHOW TABLES LIKE '%appointment%';

DESCRIBE appointment;
DESCRIBE appointment_waitlist;
