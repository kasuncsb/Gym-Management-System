#!/bin/sh
set -e

echo "Starting Nginx config test..."
nginx -t -c /etc/nginx/nginx.conf || exit 1

echo "Starting Nginx in background..."
nginx -c /etc/nginx/nginx.conf

echo "Starting Next.js in foreground..."
exec node server.js
