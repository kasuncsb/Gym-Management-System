#!/bin/sh
set -e

echo "Starting backend entrypoint script..."

# Check if the users table exists. If it doesn't, we assume the DB is empty.
# We use mysql command line client (installed in Dockerfile) to check this quietly.
echo "Checking database schema..."
DB_CHECK=$(node --no-deprecation -e "
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

echo "Starting Redis server in background..."
cd /tmp && redis-server --daemonize yes && cd /app

# BUG-20 fix: Wait until Redis responds to PING before starting Node.js.
# Previously the server could start before Redis was ready, causing the first
# setRefreshToken call (during login) to fail with a connection error.
echo "Waiting for Redis to be ready..."
until redis-cli ping 2>/dev/null | grep -q PONG; do
  sleep 0.1
done
echo "Redis is ready."

echo "Starting server..."
exec "$@"
