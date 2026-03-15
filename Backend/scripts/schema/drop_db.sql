-- ============================================================================
-- Drop schema (database) and recreate it empty (uses gms_db).
--
-- Option 1 — run this file, then init + seed:
--   mysql -u USER -p < Backend/scripts/schema/drop_and_recreate.sql
--   npm run db:init && npm run db:seed
--
-- Option 2 — drop, recreate, and run init in one go (from repo root):
--   mysql -u USER -p -e "DROP DATABASE IF EXISTS \`gms_db\`; CREATE DATABASE \`gms_db\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
--   mysql -u USER -p gms_db < Backend/scripts/schema/init.sql
--   cd Backend && npm run db:seed
-- ============================================================================

DROP DATABASE IF EXISTS `gms_db`;
CREATE DATABASE `gms_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
