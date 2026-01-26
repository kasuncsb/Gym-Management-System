-- Migration V2: Create Subscription & Payment Tables
-- Version: 1.0
-- Date: 2026-01-25
-- Description: Creates subscription plans, subscriptions, and payment tables

-- ============================================================
-- 4. SUBSCRIPTION_PLAN TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS subscription_plan (
    plan_id VARCHAR(10) PRIMARY KEY COMMENT 'Format: PLAN001',
    plan_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    duration_days INT NOT NULL COMMENT 'Subscription validity period',
    access_hours VARCHAR(100) COMMENT 'e.g., 06:00-22:00 or 24/7',
    facilities JSON COMMENT '{"gym": true, "pool": false, "sauna": true}',
    max_appointments_per_month INT DEFAULT 0 COMMENT 'Trainer appointment quota',
    priority_level INT DEFAULT 1 COMMENT 'For resolving multiple subscriptions',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_active (is_active),
    INDEX idx_price (price),
    INDEX idx_priority (priority_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Available subscription plans and pricing';

-- ============================================================
-- 5. SUBSCRIPTION TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS subscription (
    subscription_id VARCHAR(20) PRIMARY KEY COMMENT 'Format: SUB00120240115',
    member_id VARCHAR(20) NOT NULL,
    plan_id VARCHAR(10) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status ENUM('active', 'expired', 'cancelled', 'pending') DEFAULT 'pending',
    auto_renew BOOLEAN DEFAULT TRUE,
    payment_status ENUM('paid', 'pending', 'failed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    cancelled_at TIMESTAMP NULL,
    cancellation_reason VARCHAR(200),
    
    FOREIGN KEY (member_id) REFERENCES member(member_id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES subscription_plan(plan_id) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
        
    INDEX idx_member_status (member_id, status),
    INDEX idx_dates (start_date, end_date),
    INDEX idx_payment_status (payment_status),
    INDEX idx_status (status),
    
    CONSTRAINT chk_date_order CHECK (end_date > start_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Member subscription records and status';

-- ============================================================
-- 6. PAYMENT TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS payment (
    payment_id VARCHAR(20) PRIMARY KEY COMMENT 'Format: PAY00120240115',
    member_id VARCHAR(20) NOT NULL,
    subscription_id VARCHAR(20),
    amount DECIMAL(10,2) NOT NULL,
    payment_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    payment_method VARCHAR(50) NOT NULL COMMENT 'credit_card, debit_card, cash, etc.',
    status ENUM('success', 'failed', 'pending', 'refunded') NOT NULL,
    transaction_id VARCHAR(100) UNIQUE COMMENT 'External gateway transaction ID',
    gateway_response JSON COMMENT 'Full payment gateway response',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (member_id) REFERENCES member(member_id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (subscription_id) REFERENCES subscription(subscription_id) 
        ON DELETE SET NULL ON UPDATE CASCADE,
        
    INDEX idx_member_payment (member_id, payment_date),
    INDEX idx_status (status),
    INDEX idx_transaction (transaction_id),
    INDEX idx_date (payment_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Payment records and transaction details';

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================
SHOW TABLES LIKE '%subscription%';
SHOW TABLES LIKE '%payment%';

DESCRIBE subscription_plan;
DESCRIBE subscription;
DESCRIBE payment;
