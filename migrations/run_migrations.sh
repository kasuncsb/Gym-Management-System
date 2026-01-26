#!/bin/bash
# Migration Runner Script for Gym Management System
# Version: 1.0
# Date: 2026-01-25

# Configuration
DB_NAME="gym_management_system"
DB_USER="root"
DB_HOST="localhost"
MIGRATION_DIR="./migrations"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   PowerWorld Gym Management System                   ║${NC}"
echo -e "${GREEN}║   Database Migration Runner                           ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if migration directory exists
if [ ! -d "$MIGRATION_DIR" ]; then
    echo -e "${RED}Error: Migration directory '$MIGRATION_DIR' not found!${NC}"
    exit 1
fi

# Prompt for MySQL password
echo -e "${YELLOW}Enter MySQL password for user '$DB_USER':${NC}"
read -s DB_PASS

# Test connection
echo -e "\n${YELLOW}Testing database connection...${NC}"
mysql -u"$DB_USER" -p"$DB_PASS" -h"$DB_HOST" -e "SELECT 1;" > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Could not connect to MySQL. Please check your credentials.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Connection successful${NC}"

# Create database if it doesn't exist
echo -e "\n${YELLOW}Creating database '$DB_NAME' if not exists...${NC}"
mysql -u"$DB_USER" -p"$DB_PASS" -h"$DB_HOST" -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database ready${NC}"
else
    echo -e "${RED}Error: Could not create database${NC}"
    exit 1
fi

# Run migrations in order
MIGRATIONS=(
    "V1__create_user_tables.sql"
    "V2__create_subscription_payment_tables.sql"
    "V3__create_access_attendance_tables.sql"
    "V4__create_appointment_tables.sql"
    "V5__create_workout_progress_tables.sql"
    "V6__create_system_audit_tables.sql"
    "V7__create_triggers.sql"
    "V8__create_stored_procedures.sql"
    "V9__create_views.sql"
    "V10__seed_data.sql"
)

echo -e "\n${YELLOW}Starting migrations...${NC}\n"

SUCCESS_COUNT=0
TOTAL_COUNT=${#MIGRATIONS[@]}

for migration in "${MIGRATIONS[@]}"; do
    echo -e "${YELLOW}Running: $migration${NC}"
    
    mysql -u"$DB_USER" -p"$DB_PASS" -h"$DB_HOST" "$DB_NAME" < "$MIGRATION_DIR/$migration" 2>&1
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $migration completed${NC}\n"
        ((SUCCESS_COUNT++))
    else
        echo -e "${RED}✗ $migration failed${NC}\n"
        echo -e "${RED}Migration stopped at: $migration${NC}"
        exit 1
    fi
done

# Summary
echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Migration Summary                                   ║${NC}"
echo -e "${GREEN}╠═══════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║   Total Migrations: $TOTAL_COUNT                                 ║${NC}"
echo -e "${GREEN}║   Successful: $SUCCESS_COUNT                                      ║${NC}"
echo -e "${GREEN}║   Failed: $((TOTAL_COUNT - SUCCESS_COUNT))                                           ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"

# Run verification
echo -e "\n${YELLOW}Running verification checks...${NC}\n"

echo -e "${YELLOW}Tables created:${NC}"
mysql -u"$DB_USER" -p"$DB_PASS" -h"$DB_HOST" "$DB_NAME" -e "SHOW TABLES;" 2>&1

echo -e "\n${YELLOW}Sample data verification:${NC}"
mysql -u"$DB_USER" -p"$DB_PASS" -h"$DB_HOST" "$DB_NAME" -e "
SELECT 'Members' AS table_name, COUNT(*) AS row_count FROM member
UNION ALL SELECT 'Subscriptions', COUNT(*) FROM subscription
UNION ALL SELECT 'Payments', COUNT(*) FROM payment
UNION ALL SELECT 'Equipment', COUNT(*) FROM equipment;" 2>&1

echo -e "\n${GREEN}✓ All migrations completed successfully!${NC}"
echo -e "${GREEN}✓ Database is ready for backend integration${NC}\n"
