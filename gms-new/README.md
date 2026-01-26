# PowerWorld Gyms Management System

Complete gym management system for PowerWorld Gyms, Kiribathgoda, Sri Lanka.

## Project Structure

```
gms-new/
├── backend/          # Node.js + Express + Prisma API
├── frontend/         # Next.js 15 + Vanilla CSS
└── nginx/            # Nginx configuration
```

## Quick Start

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Features

✅ **Backend API (70+ endpoints)**
- JWT authentication with role-based access
- QR code generation & validation
- Subscription management
- Door access control
- Attendance tracking
- Member/Trainer/Staff management

✅ **Frontend (Partial)**
- Modern glassmorphism design
- Login page with role selector
- Member dashboard
- QR code display with auto-refresh
- Responsive design

## Technology Stack

**Backend:**
- Node.js 18+ with TypeScript
- Express.js
- Prisma ORM + MySQL
- JWT + bcrypt
- Winston logging

**Frontend:**
- Next.js 15 (App Router)
- TypeScript
- Vanilla CSS (no Tailwind)
- Axios for API calls
- React Context for state

## Deployment

See individual README files in backend/ and frontend/ for detailed instructions.

## License

Proprietary - PowerWorld Gyms
