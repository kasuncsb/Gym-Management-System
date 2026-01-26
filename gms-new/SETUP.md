# PowerWorld Gyms - Complete Setup Guide

## 📋 Prerequisites

- Node.js 18+
- MySQL 8.0+
- Git
- npm or yarn

## 🚀 Quick Setup (5 Minutes)

### Step 1: Clone & Navigate
```bash
cd gms-new
```

### Step 2: Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Edit .env file with your settings:
# - DATABASE_URL=mysql://root:password@localhost:3306/powerworld_gym
# - JWT_SECRET=your-super-secret-jwt-key-min-32-chars
# - QR_SECRET=your-qr-secret-key
```

### Step 3: Database Setup
```bash
# Generate Prisma client
npm run prisma:generate

# Push schema to database (creates all tables)
npm run prisma:push

# Seed sample data
mysql -u root -p powerworld_gym < prisma/seed.sql

# Or use Prisma Studio to add data manually
npm run prisma:studio
```

### Step 4: Start Backend
```bash
npm run dev
# Backend running on http://localhost:5000
```

### Step 5: Frontend Setup (New Terminal)
```bash
cd ../frontend

# Install dependencies
npm install

# Start frontend
npm run dev
# Frontend running on http://localhost:3000
```

### Step 6: Test the System
1. Visit http://localhost:3000
2. Click "Register Now"
3. Create account
4. Login and explore dashboard
5. View QR code
6. Test scanner at http://localhost:3000/qr-scanner

---

## 🔑 Default Login Credentials

**Manager:**
- Email: manager@powerworld.lk
- Password: Admin@123

**Admin:**
- Email: admin@powerworld.lk
- Password: Admin@123

**Trainer:**
- Email: trainer@powerworld.lk
- Password: Admin@123

---

## 📦 Features Included

### Backend API ✅
- 30+ REST endpoints
- JWT authentication
- QR code generation/validation
- Subscription management
- Attendance tracking
- Door access control
- Member/Trainer/Staff management
- Analytics endpoints

### Frontend ✅
- Modern glassmorphism design
- Login/Registration
- Member dashboard
- QR code display (auto-refresh)
- QR scanner kiosk
- Manager dashboard
- Responsive design
- Dark mode support

---

## 🧪 Testing

See [TESTING.md](./TESTING.md) for comprehensive testing guide.

**Quick API Test:**
```bash
curl http://localhost:5000/health
```

**Quick Frontend Test:**
1. Open http://localhost:3000
2. Register new member
3. View dashboard
4. Check QR code

---

## 📚 Documentation

- **Backend API**: `backend/README.md`
- **Frontend**: `frontend/README.md`
- **Testing**: `TESTING.md`
- **Walkthrough**: See artifacts folder

---

## 🐛 Troubleshooting

**Database Connection Error:**
```bash
# Check MySQL is running
mysql -u root -p

# Verify DATABASE_URL in .env
# Format: mysql://USER:PASSWORD@HOST:PORT/DATABASE
```

**Port Already in Use:**
```bash
# Backend (default 5000)
# Change PORT in backend/.env

# Frontend (default 3000)
# It will prompt to use 3001
```

**Prisma Client Not Generated:**
```bash
cd backend
npm run prisma:generate
```

---

## 🚢 Deployment

### Production Checklist
1. Set NODE_ENV=production
2. Use strong JWT_SECRET (32+ characters)
3. Configure production DATABASE_URL
4. Set CORS_ORIGIN to production domain
5. Enable SSL/HTTPS
6. Configure nginx reverse proxy
7. Setup PM2 for process management

### Docker Deployment (Optional)
```bash
# Build backend
cd backend
docker build -t powerworld-backend .

# Build frontend
cd ../frontend
docker build -t powerworld-frontend .

# Run with docker-compose
docker-compose up -d
```

---

## 📞 Support

For issues:
1. Check TESTING.md for common problems
2. Review README files
3. Check database connection
4. Verify environment variables

---

## ✅ System Status

**Phases Complete:**
- ✅ Phase 1: Planning & Analysis
- ✅ Phase 2: Database Design & Schema
- ✅ Phase 3: Backend Development
- ✅ Phase 4: Frontend Development
- ✅ Phase 5: Integration & Testing

**Production Ready:** ✅  
**Test Coverage:** ✅  
**Documentation:** ✅  

---

**PowerWorld Gyms © 2026** - Kiribathgoda, Sri Lanka 🇱🇰
