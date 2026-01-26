# Database Migration Scripts

## Overview

This directory contains versioned SQL migration scripts for the PowerWorld Gym Management System database. The migrations are designed to be run sequentially to build the complete database schema from scratch.

## Prerequisites

- **MySQL 8.0+** installed and running
- **Database created**: `gym_management_system`
- **User with appropriate privileges** (CREATE, ALTER, INSERT, etc.)

## Migration Files

| File | Description | Dependencies |
|------|-------------|--------------|
| `V1__create_user_tables.sql` | Creates member, staff, and trainer tables | None |
| `V2__create_subscription_payment_tables.sql` | Creates subscription plans, subscriptions, and payments | V1 |
| `V3__create_access_attendance_tables.sql` | Creates attendance and door access logs | V1 |
| `V4__create_appointment_tables.sql` | Creates appointment and waitlist tables | V1, V3 |
| `V5__create_workout_progress_tables.sql` | Creates workout, equipment, and progress tables | V1 |
| `V6__create_system_audit_tables.sql` | Creates system config and audit log tables | V1 |
| `V7__create_triggers.sql` | Creates database triggers for automation | V1-V6 |
| `V8__create_stored_procedures.sql` | Creates stored procedures and functions | V1-V6 |
| `V9__create_views.sql` | Creates reporting views | V1-V6 |
| `V10__seed_data.sql` | Inserts sample data for testing | V1-V9 |

## Quick Start

### Option 1: Run All Migrations at Once

```bash
# Navigate to project directory
cd /c/Users/kasun/repos/my/Gym-Management-System

# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE IF NOT EXISTS gym_management_system 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE gym_management_system;

# Run all migrations in order
SOURCE migrations/V1__create_user_tables.sql;
SOURCE migrations/V2__create_subscription_payment_tables.sql;
SOURCE migrations/V3__create_access_attendance_tables.sql;
SOURCE migrations/V4__create_appointment_tables.sql;
SOURCE migrations/V5__create_workout_progress_tables.sql;
SOURCE migrations/V6__create_system_audit_tables.sql;
SOURCE migrations/V7__create_triggers.sql;
SOURCE migrations/V8__create_stored_procedures.sql;
SOURCE migrations/V9__create_views.sql;
SOURCE migrations/V10__seed_data.sql;
```

### Option 2: Run Individually

```bash
# For each file, run:
mysql -u root -p gym_management_system < migrations/V1__create_user_tables.sql
mysql -u root -p gym_management_system < migrations/V2__create_subscription_payment_tables.sql
# ... and so on
```

### Option 3: Use the Migration Runner Script

```bash
# Make the script executable
chmod +x run_migrations.sh

# Run all migrations
./run_migrations.sh
```

## Database Configuration

### Character Set
- **Character Set**: `utf8mb4`
- **Collation**: `utf8mb4_unicode_ci`
- Supports emojis, international characters, and full Unicode

### Engine
- **InnoDB** for all tables (ACID compliance, foreign key support)

### Timezone
```sql
SET GLOBAL time_zone = '+05:30';  -- Asia/Colombo (Sri Lanka)
```

## Verification

After running all migrations, verify the setup:

```sql
-- Check all tables are created
SHOW TABLES;

-- Expected output: 17 tables
-- member, staff, trainer, subscription_plan, subscription, payment
-- attendance, door_access, appointment, appointment_waitlist
-- workout_schedule, workout_session, equipment, session_equipment
-- progress, system_config, audit_log

-- Check views
SHOW FULL TABLES WHERE Table_type = 'VIEW';

-- Expected output: 10 views
-- vw_active_members, vw_trainer_schedule, vw_equipment_usage
-- vw_monthly_revenue, vw_member_attendance, vw_expiring_subscriptions
-- vw_daily_attendance, vw_member_progress_summary, vw_trainer_availability
-- vw_subscription_plan_performance

-- Check triggers
SHOW TRIGGERS;

-- Expected output: 7+ triggers

-- Check stored procedures and functions
SHOW PROCEDURE STATUS WHERE Db = 'gym_management_system';
SHOW FUNCTION STATUS WHERE Db = 'gym_management_system';

-- Test sample data
SELECT COUNT(*) AS total_members FROM member;
SELECT COUNT(*) AS active_subscriptions FROM subscription WHERE status = 'active';
SELECT * FROM vw_active_members LIMIT 5;
```

## Testing

### Test Core Functionality

```sql
-- Test 1: QR Code Authentication
CALL sp_authenticate_qr_access(
    (SELECT qr_code_token FROM member WHERE member_id = 'MEM001'),
    'SCANNER01',
    'GATE01',
    @access_granted,
    @member_id,
    @member_name,
    @reason
);

SELECT @access_granted, @member_id, @member_name, @reason;

-- Test 2: Subscription Validation
CALL sp_validate_subscription(
    'MEM001',
    @is_valid,
    @subscription_id,
    @plan_name,
    @end_date,
    @message
);

SELECT @is_valid, @subscription_id, @plan_name, @end_date, @message;

-- Test 3: Book Appointment
CALL sp_book_appointment(
    'MEM001',
    'TRN001',
    DATE_ADD(CURRENT_DATE, INTERVAL 1 DAY),
    '10:00:00',
    '11:00:00',
    'Personal training session',
    @appointment_id,
    @success,
    @message
);

SELECT @appointment_id, @success, @message;
```

## Rollback

To completely reset the database:

```sql
-- WARNING: This will delete ALL data!
DROP DATABASE IF EXISTS gym_management_system;
CREATE DATABASE gym_management_system 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Then re-run all migrations.

## Common Issues

### Issue 1: Foreign Key Constraint Fails
**Solution**: Ensure migrations are run in order (V1 → V2 → V3...)

### Issue 2: Trigger Already Exists
**Solution**: The triggers use `IF NOT EXISTS` in V7. If you get errors, drop existing triggers first:
```sql
DROP TRIGGER IF EXISTS trg_generate_member_qr;
-- ... drop other triggers
```

### Issue 3: Generated Column Error (V5)
**Solution**: Ensure you're using MySQL 5.7.6+ which supports generated columns

### Issue 4: CHECK Constraint Not Working
**Solution**: MySQL 8.0.16+ is required for CHECK constraints. For older versions, use triggers instead.

## Next Steps

After successful migration:

1. ✅ **Verify Data**: Run verification queries above
2. ✅ **Set Up Database Users**: Create application user with limited privileges
3. ✅ **Configure Backups**: Set up automated backup schedule
4. ✅ **Performance Tuning**: Analyze slow queries and add additional indexes if needed
5. ✅ **Backend Development**: Connect your backend API to this database

## Database Users

### Create Application User

```sql
-- Create app user (for backend API)
CREATE USER 'gms_app'@'localhost' IDENTIFIED BY 'your_secure_password_here';
GRANT SELECT, INSERT, UPDATE, DELETE ON gym_management_system.* TO 'gms_app'@'localhost';
FLUSH PRIVILEGES;

-- Create readonly user (for reporting/analytics)
CREATE USER 'gms_readonly'@'localhost' IDENTIFIED BY 'readonly_password_here';
GRANT SELECT ON gym_management_system.* TO 'gms_readonly'@'localhost';
FLUSH PRIVILEGES;
```

## Performance Optimization

### Enable Slow Query Log

```sql
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;  -- Log queries taking > 2 seconds
SET GLOBAL slow_query_log_file = '/var/log/mysql/slow-query.log';
```

### Analyze Tables After Large Inserts

```sql
ANALYZE TABLE member, subscription, attendance, payment;
```

## Support

For issues or questions:
- Check the main documentation: `database_design_action_plan.md`
- Review ER diagrams in `refer-docs/`
- Contact: IM/2022/001 – A.M.K.C.S.B. Abeykoon

---

**Version**: 1.0  
**Last Updated**: 2026-01-25  
**Database**: MySQL 8.0+  
**Project**: PowerWorld Gym Management System
