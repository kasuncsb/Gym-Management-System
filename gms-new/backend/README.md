# PowerWorld Gyms Management System - Backend

Production-ready backend API for PowerWorld Gyms, Kiribathgoda, Sri Lanka.

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js with TypeScript
- **Database**: MySQL with Prisma ORM
- **Authentication**: JWT with bcrypt
- **Validation**: Joi
- **Logging**: Winston

## Project Structure

```
backend/
├── prisma/
│   └── schema.prisma          # Database schema (14 tables)
├── src/
│   ├── config/                # Configuration (database, logger)
│   ├── controllers/           # Route controllers
│   ├── middleware/            # Express middleware
│   ├── routes/                # API routes
│   ├── services/              # Business logic
│   ├── utils/                 # Helper functions
│   ├── app.ts                 # Express app setup
│   └── server.ts              # Server entry point
├── logs/                      # Application logs
├── .env.example               # Environment variables template
├── package.json
└── tsconfig.json
```

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:
- Database connection string
- JWT secret
- Stripe keys
- SMTP credentials

### 3. Setup Database

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Open Prisma Studio
npm run prisma:studio
```

### 4. Run Development Server

```bash
npm run dev
```

Server runs on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login (member/trainer/staff)
- `POST /api/auth/refresh` - Refresh JWT token
- `GET /api/auth/profile` - Get current user profile
- `POST /api/auth/change-password` - Change password
- `GET /api/auth/qr-code` - Generate member QR code

### Members
- `POST /api/members/register` - Register new member
- `GET /api/members/profile` - Get own profile
- `PUT /api/members/profile` - Update own profile
- `GET /api/members` - Get all members (admin)
- `GET /api/members/search` - Search members (admin)
- `GET /api/members/stats` - Member statistics (admin)

### QR Scanning
- `POST /api/qr/scan` - Process QR code scan
- `GET /api/qr/attendance/history` - Get attendance history
- `GET /api/qr/access-logs` - Get door access logs (admin)

### Subscriptions
- `GET /api/subscriptions/validate` - Validate subscription
- `GET /api/subscriptions/my-subscriptions` - Get member subscriptions
- `GET /api/subscriptions/active` - Get active subscription
- `GET /api/subscriptions/plans` - Get all plans
- `GET /api/subscriptions/renewals/upcoming` - Upcoming renewals (admin)

## Scripts

```bash
npm run dev          # Development server with hot reload
npm run build        # Build for production
npm start            # Start production server
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run database migrations
npm run prisma:studio    # Open Prisma Studio
```

## Environment Variables

See `.env.example` for all required variables.

## License

Proprietary - PowerWorld Gyms
