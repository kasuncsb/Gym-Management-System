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
- **Framework**: Next.js 16+ (App Router)
- **Library**: React 19+
- **Styling**: Tailwind CSS (Pure Black & Glassmorphism design)
- **Icons**: Lucide React
- **Charts**: Recharts
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

## 👥 User Role Hierarchy

The system implements a structured role hierarchy to ensure secure access and management:

- **Users** (Base Class)
  - **Members**: Customers with access to workouts, schedules, and check-ins.
  - **Staff** (Super Class)
    - **Admin**: Full system control and configuration.
    - **Manager**: Branch management and staff coordination.
    - **Trainer**: Program creation and member guidance.

## 📐 Architecture & Design

Detailed design documents are available in the [Documentation](./Documentation) directory:

- 📊 **Database Schema**: [Relational Schema](./Documentation/REL_SCHEMA.svg)
- 🕸 **Data Modeling**: [ER Diagram](./Documentation/ERD.svg)
- 📑 **System Analysis**: [Proposed System Analysis](./Documentation/Proposed_System_Analysis_IM_2022_001.pdf)
- 📋 **Requirements**: [Requirement Analysis](./Documentation/Requirement_Analysis_IM_2022_001.pdf)

## ✨ Frontend Features

- Modern "Pure Black" glassmorphism design
- Role-based routing (Member/Trainer/Manager/Admin)
- Real-time subscription validation
- Interactive Dashboard Charts
- Animated UI components
- QR code display & scanning
- Dark mode support

## 📄 License

Proprietary - PowerWorld Gyms
