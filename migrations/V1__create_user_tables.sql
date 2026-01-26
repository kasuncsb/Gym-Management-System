-- Migration V1: Create User Management Tables
-- Version: 1.0
-- Date: 2026-01-25
-- Description: Creates core user tables (member, staff, trainer)

-- ============================================================
-- 1. MEMBER TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS member (
    member_id VARCHAR(20) PRIMARY KEY COMMENT 'Format: MEM001',
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(15),
    date_of_birth DATE,
    join_date DATE NOT NULL DEFAULT (CURRENT_DATE),
    emergency_contact VARCHAR(100),
    password_hash VARCHAR(255) NOT NULL COMMENT 'bcrypt hashed',
    qr_code_token VARCHAR(100) UNIQUE NOT NULL COMMENT 'Secure QR token',
    qr_token_issued_at DATETIME COMMENT 'For time-limited QR codes',
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_qr_token (qr_code_token),
    INDEX idx_status (status),
    INDEX idx_join_date (join_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Stores gym member information and authentication details';

-- ============================================================
-- 2. STAFF TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS staff (
    staff_id VARCHAR(10) PRIMARY KEY COMMENT 'Format: STF001',
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(15),
    date_of_birth DATE,
    role ENUM('trainer', 'manager', 'admin', 'receptionist') NOT NULL,
    hire_date DATE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    permissions JSON COMMENT 'Role-based permissions object',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_role (role),
    INDEX idx_status (status),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Stores staff members with role-based access';

-- ============================================================
-- 3. TRAINER TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS trainer (
    trainer_id VARCHAR(10) PRIMARY KEY COMMENT 'Format: TRN001',
    staff_id VARCHAR(10) NOT NULL,
    specialization VARCHAR(100),
    certification VARCHAR(200),
    hourly_rate DECIMAL(10,2),
    availability JSON COMMENT 'Weekly schedule: {"mon": ["09:00-17:00"], ...}',
    qr_hash VARCHAR(100) UNIQUE COMMENT 'For trainer QR access',
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (staff_id) REFERENCES staff(staff_id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_specialization (specialization),
    INDEX idx_staff (staff_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Extended trainer-specific information';

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================
-- Verify tables created
SHOW TABLES LIKE '%member%';
SHOW TABLES LIKE '%staff%';
SHOW TABLES LIKE '%trainer%';

-- Check table structures
DESCRIBE member;
DESCRIBE staff;
DESCRIBE trainer;
