# PowerWorld Gyms Management System

A comprehensive management system for PowerWorld Gyms, Kiribathgoda, Sri Lanka. This repository contains both the backend API and the frontend web application.

## 🏗 Project Structure

```
Gym-Management-System/
├── Backend/               # Express.js API with TypeScript & Prisma
├── Frontend/              # Next.js Web Portal
├── Database/              # Database scripts/schemas
└── Demo Assets/           # Project assets and demos
```

## 🚀 Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js with TypeScript
- **Database**: MySQL with Prisma ORM
- **Authentication**: JWT with bcrypt
- **Validation**: Joi
- **Logging**: Winston

### Frontend
- **Framework**: Next.js 15+ (App Router)
- **Styling**: Vanilla CSS (Glassmorphism design)
- **Language**: TypeScript
- **API Client**: Axios
- **State**: React Context API

## 🛠 Setup & Installation

### Prerequisites
- Node.js 18 or higher
- MySQL Database

### 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd Backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment:
   - Copy `.env.example` to `.env`
   - Update database credentials and JWT secrets

4. Setup Database:
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

5. Run Server:
   ```bash
   npm run dev
   ```
   > Server runs on `http://localhost:5000`

### 2. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd "Frontend/Web Portal"
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run Development Server:
   ```bash
   npm run dev
   ```
   > App runs on `http://localhost:3000`

## 📚 API Endpoints Overview

- **Auth**: Login, Profile, Refresh Token
- **Members**: Register, Search, Stats
- **QR Scanning**: Attendance, Access Logs
- **Subscriptions**: Validate, Renewals, Plans

## ✨ Frontend Features

- Modern glassmorphism design
- Role-based routing (Member/Trainer/Manager/Admin)
- Real-time subscription validation
- QR code display & scanning
- Dark mode support

## 📄 License

Proprietary - PowerWorld Gyms
