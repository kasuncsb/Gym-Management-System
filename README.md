# PowerWorld Gyms Management System

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Express.js](https://img.shields.io/badge/Express-4.18-gray?logo=express)](https://expressjs.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red)](#license)

A premium, enterprise-grade management suite for **PowerWorld Gyms**. Built with a focus on high-performance, real-time tracking, and a stunning "Pure Black" glassmorphism UI.

## 📋 Table of Contents
- [🏗 Project Organization](#-project-organization)
- [🚀 Tech Stack](#-tech-stack)
- [📦 Core Modules](#-core-modules)
- [💎 Key Technical Highlights](#-key-technical-highlights)
- [🛠 Setup & Installation](#-setup--installation)
- [📚 API Endpoints Overview](#-api-endpoints-overview)
- [👥 User Role Hierarchy](#-user-role-hierarchy)
- [📐 Architecture & Design](#-architecture--design)
- [✨ Frontend Features](#-frontend-features)
- [🛤 Roadmap & Future Goals](#-roadmap--future-goals)
- [🤝 Support & Contact](#-support--contact)

---

## 🏗 Project Organization

The repository is structured to separate concerns between the backend services, the frontend user portal, and the core database logic:

```bash
Gym-Management-System/
├── 📂 Backend/           # Express API with TypeScript & Prisma
│   ├── 📂 src/           # Source code (routes, controllers, services)
│   └── 📄 prisma/        # Database schema and migrations
├── 📂 Frontend/          # Client-side applications
│   ├── 📂 Web Portal/    # Next.js 16 App with Tailwind
│   │   ├── 📂 app/       # Role-based pages and layouts
│   │   ├── 📂 components/# Shared UI components
│   │   └── 📂 context/   # Auth & Global state management
│   └── 📂 Mobile Apps/   # Target for future cross-platform development
├── 📂 Database/          # Raw SQL scripts and ERD exports
├── 📂 Documentation/     # Full project analysis, SRD, and diagrams
└── 📂 Demo Assets/       # Visual guides and design mockups
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

## 📦 Core Modules

- **🔐 Auth & Security**: Secure JWT authentication with refresh token rotation and bcrypt password hashing.
- **🙋 Membership Management**: Full lifecycle management for gym members, including registration, profile tracking, and status.
- **💳 Subscription Engine**: Powerful subscription system with automated validation and plan management.
- **📲 QR Attendance**: Real-time check-in/out system using high-security encrypted QR codes.
- **🏗 Inventory & Equipment**: Track gym assets, maintenance logs, and inventory levels across branches.
- **📅 Appointments & Leads**: Integrated scheduling for trainer sessions and lead tracking for potential members.
- **📊 Interactive Dashboards**: Real-time analytics and data visualization using Recharts.

## 💎 Key Technical Highlights

- **⚡ High-Performance Architecture**: Modular backend service layer for decoupled business logic and easier scaling.
- **🛡 Enterprise Security**: Multi-layered auth flow with Refresh Token rotation, CSRF protection, and role-based middleware.
- **🎨 Glassmorphism v2**: Custom-built design system using Tailwind CSS 4.x for a sleek, premium "Pure Black" aesthetic.
- **📊 Data Visualization**: Dynamic, responsive charts for tracking gym performance and member activity.
- **� Real-time Validation**: Instant seat availability and subscription status checks across all branch access points.

## �🛠 Setup & Installation

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
   - **Database**: Port 3306 (MySQL)
   - **Secrets**: Update `JWT_SECRET` and `QR_SECRET`
   - **Integrations**: Configure `STRIPE_SECRET_KEY` and `SMTP_USER` for payments and emails.
4. Setup Database:
   ```bash
   npx prisma generate
   npx prisma migrate dev
   npm run seed:demo     # Optional: Seed data
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

## 🛤 Roadmap & Future Goals

Upcoming features include:

- [ ] **📱 Mobile App**: Cross-platform React Native app for members.
- [ ] **🤖 AI Training Plans**: Personalized workout generation based on member goals.
- [ ] **🏪 E-commerce Integration**: In-app purchase for supplements and gym gear.
- [ ] **🏨 Multi-branch Sync**: Enhanced real-time synchronization for global member roaming.

## 🤝 Support & Contact

- 📧 **Email**: [kasun@kasunc.uk](mailto:kasun@kasunc.uk)
- 🌐 **Portfolio**: [kasunc.uk](https://kasunc.uk)
- 🏢 **Branch**: PowerWorld Gyms - Kiribathgoda

## 📄 License

Proprietary - PowerWorld Gyms
