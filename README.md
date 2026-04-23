# GymSphere Gym Management Suite

A full-stack platform for gym operations, including member lifecycle management, staff workflows, and branch administration.

## Overview

This project provides a centralized system for day-to-day gym management across operational roles.  
It combines a web frontend, backend API, and supporting services into a deployable containerized stack.

## Core Modules

- **Frontend (`Frontend/`)**: Next.js web application for member and staff experiences.
- **Backend (`Backend/`)**: TypeScript API for business logic, data access, and authorization.
- **Infrastructure**: Docker Compose for app services, with external MySQL and Redis.

## Key Capabilities

- Member onboarding and profile management
- Subscription and plan lifecycle handling
- Role-based access for members, trainers, managers, and admins
- Operational dashboards and branch management workflows
- Integrated messaging, reporting, and AI-assisted backend workflows

## Demo Credentials

When running with seeded demo data (`Backend/scripts/seed.ts`), use the following accounts:

- `admin@gymsphere.demo` (admin)
- `manager@gymsphere.demo` (manager)
- `trainer1@gymsphere.demo`, `trainer2@gymsphere.demo`, `trainer3@gymsphere.demo` (trainers)
- `member1@gymsphere.demo` to `member5@gymsphere.demo` (members)

Shared demo password for all seeded users: `DemoPass#2026`

## Tech Stack (High Level)

- **Frontend**: Next.js + React + TypeScript
- **Backend**: Node.js + Express + TypeScript
- **Data Layer**: Drizzle ORM + MySQL + Redis
- **Deployment**: Docker / Docker Compose

## Repository Structure

```text
Gym-Management-System/
├── Backend/
├── Frontend/
├── scripts/
├── docker-compose.yml
└── docker-compose.dev.yml
```
