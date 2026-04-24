# GymSphere Gym Management Suite

## Project Purpose

GymSphere Gym Management Suite is an end-to-end software platform for gym operations, member services, and internal administration.  
This repository represents a one-year, individual software development project implemented across frontend, backend, data, and deployment layers.

The project is designed to consolidate operational workflows into a single system, replacing fragmented manual coordination with traceable, role-aware, and data-driven processes.

## Project Scope and Context

The system supports four primary operational roles:

- **Member**: onboarding, profile, subscriptions, check-ins, workout tracking, and self-service workflows.
- **Trainer**: member support, equipment issue reporting, task execution, and PT activity management.
- **Manager**: branch operations, staffing visibility, KPI monitoring, and reporting.
- **Admin**: governance-level user/plan/config control and system supervision.

From a systems perspective, the codebase includes:

- a Next.js frontend (`Frontend/`) for user interaction,
- an Express + TypeScript backend (`Backend/`) for domain logic and APIs,
- MySQL + Redis integration via Drizzle ORM and token/session controls,
- containerized runtime definitions for local and deployment-oriented operation.

## Architectural Overview

### Frontend

The frontend is implemented in Next.js with role-based route segmentation and shared UI primitives.  
It includes:

- dashboard and workflow pages by role,
- PWA support (manifest, service worker integration, offline fallback),
- reusable UI components for modals, forms, cards, tables, and alerts,
- API client abstractions for backend interaction.

### Backend

The backend follows a service-oriented modular structure:

- **controllers** expose HTTP endpoints and enforce request-level checks,
- **services** implement business logic and orchestration,
- **validators** enforce payload constraints,
- **utils** provide infrastructure helpers (email, IDs, storage, security).

Core security and identity controls include:

- JWT access tokens and Redis-backed refresh token revocation,
- account lockout handling for repeated authentication failures,
- role-aware authorization and route protection,
- entity lifecycle support for controlled data state transitions.

### Data Layer

The MySQL schema models operational entities including users, members, trainers, visits, plans, subscriptions, payments, PT sessions, equipment, inventory, shifts, reports, and AI interaction logs.  
Drizzle ORM is used for typed access patterns and service-level query composition.

## Business Logic Overview

### 1. Identity, Onboarding, and Account Lifecycle

- Email/password authentication with verification and password reset workflows.
- Member onboarding captures profile, emergency, and health context.
- Member identity verification status influences purchase permissions.
- Admin/manager workflows can update role-specific account states.

### 2. Membership and Subscription Domain

- Plan catalog supports multiple plan types and active/inactive state management.
- Subscription purchase validates business rules before activation.
- Promotion and referral handling integrates into payment/subscription records.
- Invoice/receipt artifacts are generated and exposed through member history views.

### 3. Attendance and Access Flow

- Check-in/check-out lifecycle records visit status and duration.
- Access workflows include code/token-based simulation paths for controlled testing.
- Branch/system configuration values influence operational controls (e.g., timing, limits).

### 4. Trainer and PT Operations

- PT sessions support creation, status transitions, and role-aware updates.
- Availability and scheduling logic supports conflict-aware planning.
- Shift assignment and status tracking are integrated for staff visibility.

### 5. Workout Intelligence

- Workout plans are managed from three sources: `trainer_created`, `ai_generated`, and `library`.
- Members can receive personalized AI-assisted plan generation from profile and preference context.
- Workout sessions and logs persist activity progression and summary metrics.

### 6. Equipment and Inventory Control

- Equipment entities model category/state and incident workflow (`open`, `in_progress`, `resolved`).
- Inventory supports stock, threshold, and movement transaction records.
- Operational dashboards consume these streams for risk and action visibility.

### 7. Analytics and Reporting

- Summary and PDF report generation supports multiple report types.
- Report output includes KPI views, trends, and structured narrative content.
- Report run events are auditable for operational traceability.

### 8. AI-Assisted Workflows

- Member and manager AI chat flows are context-aware and role-tailored.
- Retrieval-augmented context is used where available for grounded responses.
- Interactions are logged for observability and operational review.

## Current Codebase Snapshot

```text
Gym-Management-System/
├── Backend/                  # API, services, schema, seeds, business logic
├── Frontend/                 # Next.js app, PWA shell, role-based UI
├── scripts/                  # helper scripts and workflow utilities
├── docker-compose.yml        # container orchestration (primary)
└── docker-compose.dev.yml    # development-oriented composition
```

## Technology Stack

- **Frontend**: Next.js, React, TypeScript
- **Backend**: Node.js, Express, TypeScript
- **Data**: MySQL, Redis, Drizzle ORM
- **Delivery**: Docker and Docker Compose

## Demo Credentials

When running seeded demo data (`Backend/scripts/seed.ts`), the following accounts are available:

- `admin@gymsphere.demo` (admin)
- `manager@gymsphere.demo` (manager)
- `trainer1@gymsphere.demo`, `trainer2@gymsphere.demo`, `trainer3@gymsphere.demo` (trainers)
- `member1@gymsphere.demo` to `member5@gymsphere.demo` (members)

Shared demo password for seeded users:

- `DemoPass#2026`

Email delivery is intentionally skipped for demo-domain seeded accounts to prevent non-production notification behavior during development/testing.

## Open-Source Status

This project is now open-source and distributed under the MIT License.

- License text: `LICENSE`
- Copyright: Kasun Chanaka

## License

MIT License. See the `LICENSE` file for full terms.
