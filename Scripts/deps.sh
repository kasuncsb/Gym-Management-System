#!/bin/bash

# Fresh Install Script - Clean and reinstall all dependencies
# Usage: bash Scripts/fresh-install.sh

set -e  # Exit on error

echo "============================================"
echo "  Fresh Install - Gym Management System"
echo "============================================"
echo ""

# Get the root directory (parent of Scripts)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# Backend
echo "📦 Cleaning Backend..."
cd "$ROOT_DIR/Backend"
rm -rf node_modules dist package-lock.json
echo "✓ Backend cleaned"
echo ""

echo "📦 Installing Backend dependencies..."
npm install
echo "✓ Backend dependencies installed"
echo ""

# Frontend
echo "📦 Cleaning Frontend..."
cd "$ROOT_DIR/Frontend"
rm -rf .next node_modules package-lock.json
echo "✓ Frontend cleaned"
echo ""

echo "📦 Installing Frontend dependencies..."
npm install
echo "✓ Frontend dependencies installed"
echo ""

echo "============================================"
echo "✅ Fresh install completed successfully!"
echo "============================================"
echo ""
echo "Next steps:"
echo "  1. Backend: cd Backend && npm run dev"
echo "  2. Frontend: cd 'Frontend' && npm run dev"
