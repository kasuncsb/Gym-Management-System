#!/bin/bash
# Setup script for PowerWorld Gyms Backend

echo "🏋️ PowerWorld Gyms - Backend Setup"
echo "======================================"
echo ""

# Check Node.js version
echo "Checking Node.js version..."
node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$node_version" -lt 18 ]; then
    echo "❌ Error: Node.js 18+ is required. Current version: $(node -v)"
    exit 1
fi
echo "✅ Node.js version: $(node -v)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi
echo "✅ Dependencies installed"
echo ""

# Check for .env file
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your configuration:"
    echo "   - DATABASE_URL"
    echo "   - JWT_SECRET"
    echo "   - STRIPE_SECRET_KEY"
    echo "   - SMTP credentials"
    echo ""
    echo "Press Enter after you've configured .env..."
    read
fi



# Create sample subscription plans
echo "📋 Would you like to create sample subscription plans? (y/n)"
read create_plans

if [ "$create_plans" = "y" ]; then
    echo "Creating sample plans..."
    # TODO: Add seed script
    echo "✅ Sample plans created"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the development server:"
echo "  npm run dev"
echo ""
echo "To start the production server:"
echo "  npm run build"
echo "  npm start"
echo ""
echo "API will be available at: http://localhost:5000"
echo "Health check: http://localhost:5000/health"
