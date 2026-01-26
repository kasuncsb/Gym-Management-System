# PowerWorld Gyms - Testing & Verification Guide

## Quick Test Checklist

### ✅ Backend API Tests

**1. Health Check**
```bash
curl http://localhost:5000/health
# Expected: {"status":"ok","timestamp":"...","service":"PowerWorld Gym API","version":"1.0.0"}
```

**2. Member Registration**
```bash
curl -X POST http://localhost:5000/api/members/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Member",
    "email": "test@example.com",
    "password": "Test@12345",
    "phone": "0771234567"
  }'
# Expected: 201 Created with member data
```

**3. Login**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@12345",
    "userType": "member"
  }'
# Expected: 200 OK with JWT token
# Save the token for next requests
```

**4. Get Profile (Authenticated)**
```bash
curl http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
# Expected: User profile data
```

**5. Generate QR Code**
```bash
curl http://localhost:5000/api/auth/qr-code \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
# Expected: QR code data URL and token
```

**6. Scan QR Code**
```bash
curl -X POST http://localhost:5000/api/qr/scan \
  -H "Content-Type: application/json" \
  -d '{
    "qrData": "QR_TOKEN_FROM_STEP_5",
    "gateId": "GATE01",
    "deviceId": "SCANNER01"
  }'
# Expected: Access granted/denied with member details
```

**7. Get Member Stats (Admin)**
```bash
curl http://localhost:5000/api/members/stats \
  -H "Authorization: Bearer ADMIN_TOKEN"
# Expected: Statistics (total, active, inactive, etc.)
```

---

### ✅ Frontend User Flows

**Test 1: Member Registration & Login**
1. Navigate to http://localhost:3000
2. Click "Register Now"
3. Fill form: Name, Email, Password, Phone
4. Click "Create Account"
5. Should auto-login and redirect to /member
6. ✅ Dashboard should show subscription status

**Test 2: QR Code Generation**
1. Login as member
2. Navigate to "My QR Code"
3. QR code should display
4. Click "Download QR Code" - should download PNG
5. Click "Copy Token" - should copy to clipboard
6. ✅ QR refreshes every 4 minutes

**Test 3: QR Scanner Kiosk**
1. Navigate to http://localhost:3000/qr-scanner
2. Paste QR token from step 2
3. Click "Validate Access"
4. Should show access granted/denied
5. ✅ Auto-clears after 3 seconds

**Test 4: Manager Dashboard**
1. Login as staff with role MANAGER
2. Should redirect to /manager
3. Should see member statistics
4. Should see revenue estimates
5. ✅ Charts and metrics display

**Test 5: Attendance History**
1. Login as member
2. Check dashboard "Recent Activity"
3. Should show IN/OUT events
4. ✅ Timestamps in Sri Lankan time

---

## Integration Tests

### Database Integration
```bash
cd backend
npm run prisma:studio
# Opens Prisma Studio at http://localhost:5555
# Verify tables: members, subscriptions, attendance, etc.
```

### API + Frontend Integration
1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Test full flow: Register → Login → Dashboard → QR Code
4. Check browser console for errors
5. Check backend logs for requests

---

## Edge Cases & Error Scenarios

### ✅ Test Cases

**1. Invalid Login**
- Email doesn't exist → "Invalid credentials"
- Wrong password → "Invalid credentials"  
- Account suspended → "Account is not active"

**2. Expired QR Code**
- Generate QR
- Wait 5+ minutes
- Try to scan → "QR code expired"

**3. No Active Subscription**
- Member without subscription
- Try to scan QR → "No active subscription found"

**4. Rate Limiting**
- Make 6 login attempts in 15 min → "Too many login attempts"
- Make 11 QR scans in 1 min → "Too many scan attempts"

**5. Invalid Input**
- Password < 8 chars → "Password must be at least 8 characters"
- Invalid email format → "Invalid email format"
- Invalid phone → "Invalid phone number format"

**6. Duplicate Registration**
- Register with existing email → "Email already registered"

**7. Token Expiry**
- Login and wait 7+ days
- Try API call → 401 Unauthorized, redirect to login

---

## Performance Tests

### Response Time Benchmarks
- Health check: < 50ms
- Login: < 200ms
- QR scan: < 300ms
- Member stats: < 500ms
- Dashboard load: < 1s

### Load Testing (Optional)
```bash
# Install Apache Bench
ab -n 100 -c 10 http://localhost:5000/health

# Expected:
# - No failed requests
# - Average response < 100ms
```

---

## Security Verification

### ✅ Security Checklist

**Authentication**
- [x] Passwords hashed with bcrypt (12 rounds)
- [x] JWTs signed with secret
- [x] Tokens expire after 7 days
- [x] Refresh tokens supported

**Authorization**
- [x] Role-based access control (RBAC)
- [x] Admin endpoints require admin role
- [x] Members can only access own data

**Input Validation**
- [x] All inputs validated with Joi
- [x] SQL injection protected (Prisma)
- [x] XSS prevention (input sanitization)

**QR Code Security**
- [x] HMAC signatures
- [x] 5-minute expiry
- [x] Unique per member
- [x] Auto-refresh

**Network Security**
- [x] CORS configured
- [x] Helmet security headers
- [x] Rate limiting implemented
- [x] HTTPS ready (production)

---

## Database Verification

### Check Database Health
```bash
cd backend

# Check connection
npm run prisma:studio

# Verify schema
npx prisma format
npx prisma validate

# View data
# Open http://localhost:5555
# Browse tables: members, subscriptions, attendance
```

### Sample Data Queries
```sql
-- Count members
SELECT COUNT(*) FROM members WHERE deleted_at IS NULL;

-- Active subscriptions
SELECT COUNT(*) FROM subscriptions 
WHERE status = 'ACTIVE' AND end_date >= NOW();

-- Today's attendance
SELECT COUNT(DISTINCT member_id) FROM attendance 
WHERE DATE(timestamp) = CURDATE() AND event_type = 'IN';
```

---

## Common Issues & Solutions

### Issue: "Cannot connect to database"
**Solution:**
1. Check MySQL is running
2. Verify DATABASE_URL in .env
3. Run `npm run prisma:generate`

### Issue: "CORS error in browser"
**Solution:**
1. Check backend CORS_ORIGIN in .env
2. Should match frontend URL: http://localhost:3000
3. Restart backend server

### Issue: "QR code not displaying"
**Solution:**
1. Check if logged in as member
2. Check browser console for errors
3. Verify JWT token is valid
4. Check backend logs

### Issue: "401 Unauthorized"
**Solution:**
1. Token expired - re-login
2. Invalid token - clear localStorage
3. User deleted/suspended - check database

---

## Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] No console errors
- [ ] Environment variables configured
- [ ] Database schema applied
- [ ] Sample subscription plans created
- [ ] Admin user created

### Production Setup
- [ ] MySQL database on Oracle VM
- [ ] Strong JWT_SECRET (32+ characters)
- [ ] Strong QR_SECRET
- [ ] NODE_ENV=production
- [ ] CORS_ORIGIN set to production domain
- [ ] SSL certificates configured
- [ ] nginx reverse proxy setup

---

## Test Data Setup

### Create Sample Subscription Plans
```sql
INSERT INTO subscription_plans (plan_id, plan_name, price, duration_days, access_hours, facilities, created_at, updated_at) VALUES
('PLAN_BASIC', 'Basic Monthly', 3500.00, 30, '05:30-22:00', '{"gym":true,"pool":false,"sauna":false}', NOW(), NOW()),
('PLAN_PREMIUM', 'Premium Monthly', 5500.00, 30, '00:00-24:00', '{"gym":true,"pool":true,"sauna":true}', NOW(), NOW()),
('PLAN_STUDENT', 'Student Monthly', 2500.00, 30, '05:30-22:00', '{"gym":true,"pool":false,"sauna":false}', NOW(), NOW());
```

### Create Admin User
```bash
# Register via API, then update role in database
curl -X POST http://localhost:5000/api/members/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@powerworld.lk",
    "password": "Admin@12345"
  }'

# Then in MySQL:
UPDATE staff SET role = 'ADMIN' WHERE email = 'admin@powerworld.lk';
```

---

## Success Criteria

### All Phases Complete ✅
- [x] Phase 1: Planning & Analysis
- [x] Phase 2: Database Design & Schema  
- [x] Phase 3: Backend Development
- [x] Phase 4: Frontend Development
- [x] Phase 5: Integration & Testing

### Core Features Working ✅
- [x] Member registration & login
- [x] QR code generation with auto-refresh
- [x] QR scanner validation
- [x] Attendance tracking (IN/OUT)
- [x] Subscription status checking
- [x] Member dashboard
- [x] Manager analytics
- [x] Role-based access control

### Ready for Deployment ✅
- [x] API documented
- [x] Frontend responsive
- [x] Security implemented
- [x] Error handling complete
- [x] Testing guide created

---

**PowerWorld Gyms - Testing Complete** ✅🎉
