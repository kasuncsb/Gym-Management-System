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
