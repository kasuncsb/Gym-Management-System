-- Migration V5: Create Workout & Progress Tracking Tables
-- Version: 1.0
-- Date: 2026-01-25
-- Description: Creates workout, equipment, and progress tracking tables

-- ============================================================
-- 11. WORKOUT_SCHEDULE TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS workout_schedule (
    schedule_id VARCHAR(20) PRIMARY KEY COMMENT 'Format: WS00120240115',
    member_id VARCHAR(20) NOT NULL,
    workout_type VARCHAR(50) NOT NULL COMMENT 'Cardio, Strength, HIIT, Yoga, etc.',
    scheduled_date DATE NOT NULL,
    scheduled_time TIME,
    status ENUM('pending', 'completed', 'skipped', 'cancelled') DEFAULT 'pending',
    recurrence ENUM('none', 'daily', 'weekly', 'monthly') DEFAULT 'none',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (member_id) REFERENCES member(member_id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
        
    INDEX idx_member_date (member_id, scheduled_date),
    INDEX idx_status (status),
    INDEX idx_workout_type (workout_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Scheduled workouts for members';

-- ============================================================
-- 12. WORKOUT_SESSION TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS workout_session (
    session_id VARCHAR(20) PRIMARY KEY COMMENT 'Format: SESS00120240115',
    member_id VARCHAR(20) NOT NULL,
    schedule_id VARCHAR(20) COMMENT 'Link to scheduled workout',
    workout_type VARCHAR(50) NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME,
    duration_minutes INT GENERATED ALWAYS AS 
        (TIMESTAMPDIFF(MINUTE, start_time, end_time)) STORED,
    calories_burned INT,
    notes TEXT,
    equipments_used JSON COMMENT '[{"equipment": "Treadmill", "duration": 20}, ...]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (member_id) REFERENCES member(member_id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (schedule_id) REFERENCES workout_schedule(schedule_id) 
        ON DELETE SET NULL ON UPDATE CASCADE,
        
    INDEX idx_member_start (member_id, start_time),
    INDEX idx_workout_type (workout_type),
    INDEX idx_start_time (start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Completed workout sessions with equipment usage';

-- ============================================================
-- 13. EQUIPMENT TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS equipment (
    equipment_id VARCHAR(10) PRIMARY KEY COMMENT 'Format: EQ001',
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) COMMENT 'Cardio, Strength, Free Weights, etc.',
    brand VARCHAR(50),
    purchase_date DATE,
    status ENUM('active', 'maintenance', 'inactive', 'retired') DEFAULT 'active',
    location VARCHAR(50) COMMENT 'Zone/Area in gym',
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    maintenance_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_status_location (status, location),
    INDEX idx_category (category),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Gym equipment inventory and maintenance tracking';

-- ============================================================
-- 14. SESSION_EQUIPMENT TABLE (Junction Table)
-- ============================================================
CREATE TABLE IF NOT EXISTS session_equipment (
    session_id VARCHAR(20) NOT NULL,
    equipment_id VARCHAR(10) NOT NULL,
    duration_minutes INT NOT NULL,
    notes VARCHAR(200),
    
    PRIMARY KEY (session_id, equipment_id),
    
    FOREIGN KEY (session_id) REFERENCES workout_session(session_id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (equipment_id) REFERENCES equipment(equipment_id) 
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Many-to-many relationship: sessions and equipment';

-- ============================================================
-- 15. PROGRESS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS progress (
    progress_id INT PRIMARY KEY AUTO_INCREMENT,
    member_id VARCHAR(20) NOT NULL,
    session_id VARCHAR(20),
    metric_type VARCHAR(50) NOT NULL COMMENT 'weight, body_fat, muscle_mass, etc.',
    metric_value DECIMAL(10,2) NOT NULL,
    metric_unit VARCHAR(20) COMMENT 'kg, lbs, %, cm, etc.',
    date_recorded DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (member_id) REFERENCES member(member_id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (session_id) REFERENCES workout_session(session_id) 
        ON DELETE SET NULL ON UPDATE CASCADE,
        
    INDEX idx_member_metric (member_id, metric_type, date_recorded),
    INDEX idx_date (date_recorded),
    INDEX idx_metric_type (metric_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Member progress metrics and measurements';

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================
SHOW TABLES LIKE '%workout%';
SHOW TABLES LIKE '%equipment%';
SHOW TABLES LIKE '%progress%';

DESCRIBE workout_schedule;
DESCRIBE workout_session;
DESCRIBE equipment;
DESCRIBE session_equipment;
DESCRIBE progress;
