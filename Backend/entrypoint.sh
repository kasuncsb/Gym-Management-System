#!/bin/sh
set -e

echo "Starting backend entrypoint script..."

# Check if the users table exists. If it doesn't, we assume the DB is empty.
# We use mysql command line client (installed in Dockerfile) to check this quietly.
echo "Checking database schema..."
DB_CHECK=$(node -e "
  const mysql = require('mysql2/promise');
  async function check() {
    try {
      const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
      });
      const [rows] = await conn.query(\"SHOW TABLES LIKE 'users'\");
      await conn.end();
      if (rows.length === 0) {
        console.log('EMPTY');
      } else {
        console.log('EXISTS');
      }
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  }
  check();
")

if [ "$DB_CHECK" = "EMPTY" ]; then
  echo "Database is empty. Pushing schema..."
  npx drizzle-kit push
  
  echo "Seeding database..."
  # Use tsx to run the seed script since it's TypeScript
  npx tsx scripts/seed.ts
else
  echo "Database schema already exists. Skipping migration and seed."
fi

echo "Starting server..."
exec "$@"
