-- Migration V6: Create System Configuration & Audit Tables
-- Version: 1.0
-- Date: 2026-01-25
-- Description: Creates system configuration and audit logging tables

-- ============================================================
-- 16. SYSTEM_CONFIG TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS system_config (
    config_id INT PRIMARY KEY AUTO_INCREMENT,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT NOT NULL,
    data_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description VARCHAR(200),
    category VARCHAR(50) COMMENT 'gym_settings, payment, security, etc.',
    is_editable BOOLEAN DEFAULT TRUE,
    last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    modified_by VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (modified_by) REFERENCES staff(staff_id) 
        ON DELETE SET NULL ON UPDATE CASCADE,
        
    INDEX idx_category (category),
    INDEX idx_key (config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='System-wide configuration parameters';

-- ============================================================
-- 17. AUDIT_LOG TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_log (
    log_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    entity_type VARCHAR(50) NOT NULL COMMENT 'member, subscription, payment, etc.',
    entity_id VARCHAR(50) NOT NULL,
    action ENUM('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'ACCESS') NOT NULL,
    user_id VARCHAR(20) COMMENT 'Who performed the action',
    user_role VARCHAR(20) COMMENT 'member, staff, admin',
    old_value JSON COMMENT 'Before state (for UPDATE/DELETE)',
    new_value JSON COMMENT 'After state (for CREATE/UPDATE)',
    ip_address VARCHAR(45),
    user_agent VARCHAR(200),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_timestamp (timestamp),
    INDEX idx_user (user_id, action),
    INDEX idx_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Comprehensive audit trail for system actions';

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================
SHOW TABLES LIKE '%config%';
SHOW TABLES LIKE '%audit%';

DESCRIBE system_config;
DESCRIBE audit_log;
