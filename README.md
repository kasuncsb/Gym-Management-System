# PowerWorld Gyms Management System

A web-based gym management system developed for PowerWorld Gyms (Kiribathgoda Branch). This software is designed to handle membership registration, subscription management, staff operations, and secure identity verification.

## Table of Contents
- [Project Overview](#project-overview)
- [Client Requirements](#client-requirements)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [User Roles](#user-roles)

---

## Project Overview

The system is developed as a modular web application. It separates the presentation layer (frontend) from the business logic and data persistence layer (backend). The entire system is containerized for consistent deployment across environments.

```text
Gym-Management-System/
├── Backend/                 # Node.js API Service
│   ├── src/                 # Application source code
│   ├── src/db/              # Database schema
│   └── scripts/             # Database seeding scripts
├── Frontend/                # Next.js Client Application
│   ├── app/                 # Next.js pages (App Router)
│   ├── components/          # React UI components
│   ├── context/             # React Context state
│   └── lib/                 # API client utilities
└── docker-compose.yml       # Docker configuration
```

## Client Requirements

PowerWorld Gyms required a digital solution to replace localized spreadsheet tracking. Core requirements included:
- A centralized database for member profiles and subscription statuses.
- Secure upload and approval of member identification documents (NIC).
- Role-based access control to distinguish between base members, trainers, branch managers, and system administrators.
- A functional dashboard for branch performance metrics.
- Seamless deployment capabilities for remote hosting.

---

## Technology Stack

The project utilizes a modern Javascript/Typescript stack:

### Backend Architecture
- **Environment**: Node.js
- **Framework**: Express.js (TypeScript)
- **Object-Relational Mapping (ORM)**: Drizzle ORM
- **Database**: MySQL
- **Caching & Sessions**: Redis
- **Storage**: Oracle Cloud Infrastructure (OCI) Object Storage
- **Authentication**: JSON Web Tokens (JWT) stored in securing httpOnly cookies.

### Frontend Architecture
- **Framework**: Next.js (App Router)
- **UI Library**: React
- **Styling**: Tailwind CSS
- **Data Visualization**: Recharts
- **Language**: TypeScript

---

## System Architecture

### Separation of Concerns
The system consists of two distinct Docker containers interconnected via a Docker bridge network. 
1. The **Backend API** handles database queries, input validation, and secure cloud interactions. 
2. The **Frontend Client** handles the user interface and serves as a reverse proxy to strictly enforce Cross-Origin Resource Sharing (CORS) security policies. External requests map through Nginx/OpenResty to the frontend.

### Authentication & Session Management
Authentication relies on an asymmetric JWT approach. Users receive short-lived access tokens for request authorization, mitigating the impact of intercepted tokens. Long-lived refresh tokens are tracked in the Redis cache securely, allowing administrators to definitively revoke sessions across all user devices if malicious activity or role changes are detected.

### Secure File Storage
Due to the sensitivity of government ID documents (NICs), files are not stored on the local file system. The backend negotiates with Oracle Cloud Infrastructure (OCI) using Instance Principals to securely transmit buffers directly to private Object Storage buckets. These files are never exposed via public URLs; they are streamed securely through a protected backend proxy route, accessible only to authorized administrators.

### Automated Database Initialization
The deployment pipeline includes self-healing database initialization scripts. During container startup, the system evaluates the MySQL schema state. If no tables exist, it programmatically pushes the Drizzle schema and seeds vital configuration data alongside an initial administrative user, ensuring the system boots reliably without manual database intervention.

---

## User Roles

The application strictly enforces Role-Based Access Control (RBAC):

- **Member**: Standard user access. Capable of viewing personal schedules, tracking workouts, and renewing subscriptions.
- **Trainer**: Elevated privileges for creating and modifying training programs and tracking assigned members.
- **Manager**: Branch-level administrative access. Oversees staff operations and evaluates localized gym performance data.
- **Admin**: Complete system control, specifically handling identity verification reviews and overarching system configuration.
