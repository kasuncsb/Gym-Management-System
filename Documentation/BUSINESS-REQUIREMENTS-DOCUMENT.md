# Power World Gyms — Kiribathgoda Branch
# Comprehensive Business Requirements & System Design Document

**Version:** 1.0  
**Date:** July 2025  
**Scope:** Single-branch gym management system for the Power World Gyms Kiribathgoda fitness centre  
**Status:** PRE-IMPLEMENTATION — Requires stakeholder review before any code is written

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Business Context & Real-World Data](#2-business-context--real-world-data)
3. [System Scope & Boundaries](#3-system-scope--boundaries)
4. [User Roles, Personas & Access Model](#4-user-roles-personas--access-model)
5. [Module 1 — QR-Based Physical Access Control](#5-module-1--qr-based-physical-access-control)
6. [Module 2 — Staff Time Tracking & Workforce Management](#6-module-2--staff-time-tracking--workforce-management)
7. [Module 3 — Member Registration & Identity Verification](#7-module-3--member-registration--identity-verification)
8. [Module 4 — Subscription & Payment Management](#8-module-4--subscription--payment-management)
9. [Module 5 — Member Onboarding & Vitals Collection](#9-module-5--member-onboarding--vitals-collection)
10. [Module 6 — AI-Powered Workout Generation & Management](#10-module-6--ai-powered-workout-generation--management)
11. [Module 7 — Google Health Connect Integration](#11-module-7--google-health-connect-integration)
12. [Module 8 — Trainer Management & Personal Sessions](#12-module-8--trainer-management--personal-sessions)
13. [Module 9 — Equipment & Inventory Management](#13-module-9--equipment--inventory-management)
14. [Module 10 — Dashboard & Analytics (Role-Based)](#14-module-10--dashboard--analytics-role-based)
15. [Module 11 — Notifications & Communication](#15-module-11--notifications--communication)
16. [Module 12 — Simulation & Demo Scripts](#16-module-12--simulation--demo-scripts)
17. [Non-Functional Requirements](#17-non-functional-requirements)
18. [Technical Architecture](#18-technical-architecture)
19. [Database Design Principles](#19-database-design-principles)
20. [API Design Principles](#20-api-design-principles)
21. [Security Architecture](#21-security-architecture)
22. [Implementation Phases](#22-implementation-phases)
23. [Risk Register](#23-risk-register)
24. [Glossary](#24-glossary)

---

## 1. Executive Summary

### 1.1 Purpose

This document defines every business requirement, user story, edge case, data flow, and system behaviour for a **complete gym management system** built for the **Power World Gyms Kiribathgoda branch** located at **311, Kandy Road, Gala Junction, Kiribathgoda** (Phone: 0114203615).

The system replaces manual paper-based workflows currently used by the branch with a fully digital platform spanning:

- A **Next.js web portal** serving all internal roles (Staff, Manager, Admin) and self-service member features
- A **Node.js/Express REST API** backend with MySQL persistence
- **QR code-based physical access control** for members and staff
- **Oracle Object Storage** for secure identity document storage
- **Google Health Connect API** integration for automated vitals capture
- **AI/RAG-based workout plan generation** personalised to member profiles
- **Simulation scripts** for demonstrating real-time scenarios without physical hardware

### 1.2 Business Objectives

| # | Objective | Success Metric |
|---|-----------|---------------|
| 1 | Eliminate manual attendance registers | 100% of entry/exit events captured digitally via QR |
| 2 | Enforce subscription validation at the door | Zero unauthorized access events per month |
| 3 | Reduce member onboarding time | Registration-to-first-workout < 15 minutes |
| 4 | Provide trainers with real-time member data | Trainer sees member vitals within 2 seconds of scan |
| 5 | Automate workout plan creation for new members | 90% of members receive AI-generated plan on Day 1 |
| 6 | Track staff hours accurately for payroll | Overtime calculations within 1% accuracy |
| 7 | Provide manager with actionable business insights | Daily revenue, occupancy, and churn metrics on dashboard |
| 8 | Maintain equipment operational uptime | Equipment downtime < 5% annually |

### 1.3 Key Constraints

- **Single-branch only**: Kiribathgoda. No multi-branch syncing, no branch-transfer logic.
- **No mobile app**: All interactions through the responsive web portal. Mobile users access the same Next.js app via browser.
- **QR hardware is simulated**: Physical turnstile/scanner hardware is replaced by simulation scripts for demo purposes. The API layer is designed to accept real hardware calls in the future.
- **Currency**: Sri Lankan Rupee (LKR). All monetary values in LKR.
- **Locale**: en-LK. Date format: `YYYY-MM-DD`. Time format: 24h. Timezone: `Asia/Colombo` (UTC+5:30).

---

## 2. Business Context & Real-World Data

### 2.1 About Power World Gyms

Power World Gyms is a Sri Lankan fitness chain operating **24 fitness centres** across the Western Province. The brand is positioned as an affordable, community-driven gym network targeting middle-income Sri Lankans aged 18–45. The company tagline is **"POWER UP — FITNESS WITH POWER WORLD GYMS"**.

**Head Office**: 136/5, S. De S. Jayasinghe Mawatha, Nugegoda  
**Corporate Phone**: 0114308034  
**Website**: https://powerworldgyms.com  
**Member Portal**: https://app.powerworldgyms.com (Bubble.io platform — being replaced by this system)  
**Social Media**: Facebook (@PowerWorldGymsSriLanka), Instagram, TikTok, WhatsApp

### 2.2 Kiribathgoda Branch Profile

| Attribute | Value |
|-----------|-------|
| Branch Name | Kiribathgoda |
| Branch Code | KB |
| Address | 311, Kandy Road, Gala Junction, Kiribathgoda |
| Phone | 0114203615 |
| Operating Hours | 5:00 AM – 10:00 PM |
| Operating Days | Monday – Saturday (including Poya Days) |
| Closed | Sundays |
| Estimated Capacity | 80–100 members at peak |
| Estimated Total Members | 400–600 active |
| Estimated Staff Count | 8–12 (including trainers) |

### 2.3 Operating Hours — Edge Cases

- **Poya Days**: Full operating day, same hours. Some members may expect closure — system displays a banner: "Open on Poya days, 5 AM–10 PM."
- **Sundays**: Facility closed. QR scans on Sundays return `BRANCH_CLOSED`. Staff attempting clock-in on Sunday receive a notification.
- **National Holidays (non-Poya)**: Treated as normal operating days unless the Manager explicitly marks the day as closed via the admin panel.
- **Early Closure / Emergency Closure**: Manager can set a "Close Now" override that immediately halts new entries and sends push notification to all checked-in members/staff: "Branch closing early at [time]. Please exit before [deadline]."
- **Pre-opening / Post-closing Access**: Designated staff (marked as `key_holder` in the system) can scan in 30 minutes before official opening and 30 minutes after closing for setup/cleanup.
- **Power Outage Recovery**: If the system was offline and comes back, it must not create phantom check-ins. Any entries older than 18 hours are auto-closed with a `SYSTEM_TIMEOUT` flag.

### 2.4 Subscription Plans (Estimated — To Be Confirmed with Client)

Since the actual plan pricing is dynamically loaded in the existing Bubble.io platform and not available in the saved pages, the following are estimated plans based on typical Power World Gyms pricing. **These MUST be confirmed before implementation.**

| Plan Name | Duration | Price (LKR) | Description |
|-----------|----------|-------------|-------------|
| Daily Pass | 1 day | 500 | Walk-in single visit |
| Monthly Basic | 30 days | 3,000 | Standard gym access, no personal training |
| Monthly Premium | 30 days | 5,000 | Gym access + 4 personal training sessions |
| Quarterly Basic | 90 days | 7,500 | 3-month standard access (17% discount) |
| Quarterly Premium | 90 days | 12,000 | 3-month access + 12 PT sessions |
| Semi-Annual | 180 days | 13,500 | 6-month standard access (25% discount) |
| Annual | 365 days | 24,000 | 12-month standard access (33% discount) |
| Student Monthly | 30 days | 2,000 | Valid student ID required |
| Couple Monthly | 30 days | 5,000 | Two members on one plan |
| Corporate | 30 days | Custom | Bulk pricing negotiated per company |

**Plan Rules:**
- Plans are non-transferable between members.
- Plans are non-refundable after the first 3 days (cooling-off period).
- Frozen/suspended plans pause the countdown. Maximum freeze: 30 days per year.
- Expired plans give a 3-day grace period where the system warns but still allows entry.
- After grace period, QR scan returns `SUBSCRIPTION_EXPIRED` and denies entry.

### 2.5 Nearby Branch Context

While this system only manages Kiribathgoda, the data model must accommodate future multi-branch expansion. Nearby branches that members might ask about or transfer to/from include:

| Branch | Distance | Address |
|--------|----------|---------|
| Ragama | ~5 km | 51, 2/1, Kadawatha Road, Ragama |
| Welisara | ~8 km | 621 Negombo Road, Magammana |
| IDH (Gothatuwa) | ~10 km | 877 A, 2/1, Thalagaha Junction, New Town |

---

## 3. System Scope & Boundaries

### 3.1 In Scope

| Area | Description |
|------|-------------|
| Member lifecycle | Registration → Identity verification → Subscription purchase → Onboarding → Daily usage → Renewal/Churn |
| Staff lifecycle | Hire entry → QR clock-in/out → Shift tracking → Overtime → Task management |
| Trainer operations | Availability display → Personal session booking → Member management → Equipment reporting |
| Physical access | QR scan → Subscription/status validation → Entry/exit logging → Duration tracking |
| Fitness workflows | Vitals capture → AI workout generation → Workout selection → Progress tracking → Health Connect sync |
| Equipment management | Registration → Status tracking → Issue reporting → Maintenance scheduling → Retirement |
| Inventory management | Stock items (supplements, towels, water) → Purchase tracking → Low-stock alerts |
| Notifications | Email, in-app, SMS (future) for key events |
| Analytics | Role-appropriate dashboards with real-time and historical data |
| Simulation | Scripts that simulate door scans, vital capture, member traffic patterns |

### 3.2 Out of Scope (v1)

| Area | Reason |
|------|--------|
| Online payment gateway | Phase 1 records payments manually. Gateway integration (Stripe, PayHere) deferred to Phase 3. |
| Mobile native apps | Web portal is responsive. Native apps (React Native) deferred to post-v1. |
| Multi-branch sync | Only Kiribathgoda. Multi-branch is a future architectural expansion. |
| Supplement e-commerce | No online shop. Inventory tracks stock but doesn't sell online. |
| CCTV integration | No camera feed integration. `snapshot_url` in access logs reserved for future. |
| Automated billing/invoicing | Invoices generated manually or via template. No recurring charge automation in v1. |
| Biometric auth | Fingerprint/face recognition not supported. QR code is the sole physical auth method. |

### 3.3 Assumptions

1. Staff members, trainers, and the manager all physically visit the gym and use QR codes the same way members do.
2. Every user in the system has exactly one role. No dual-role (e.g., a trainer who is also a member) in v1.
3. The branch has stable internet. Offline-first is not a requirement, but the API should handle brief network drops gracefully (retry with idempotency keys).
4. Oracle Object Storage credentials and bucket configuration will be provided before Phase 1 begins.
5. The Gemini API (or equivalent LLM) endpoint will be available for workout generation.
6. The existing Bubble.io platform (app.powerworldgyms.com) will remain operational during migration; no data migration from Bubble is in scope.

---

## 4. User Roles, Personas & Access Model

### 4.1 Role Definitions

#### 4.1.1 Member

**Persona**: Kasun, 27, software engineer, visits the gym 4–5 times a week after work.

**Description**: The primary end-user of the gym. Members purchase subscriptions, check in/out via QR, follow workout plans, and track their fitness progress.

**Frequency of system use**: Daily, briefly at check-in. Weekly for checking workout plans, progress, and scheduling.

**Key capabilities:**
- Self-register through the web portal
- Upload identity documents (NIC front/back)
- Purchase/renew subscription plans
- View and download their QR code
- Check in/out at the gym entrance
- Complete onboarding vitals form (new members)
- View AI-generated workout plans
- Browse and select curated workout programmes
- Track workout history and progress
- View personal trainer availability
- Book personal training sessions
- View subscription status, history, and renewal dates
- Update profile (phone, email, emergency contact, avatar)
- View their own access history (entry/exit times, duration)

**Cannot:**
- Access any other member's data
- View staff dashboards or internal tools
- Modify subscription prices or plans
- Override access control decisions

#### 4.1.2 Staff (Including Trainers)

**Persona**: Nimal, 32, fitness trainer, works the 5 AM – 1 PM shift, 6 days a week.

**Description**: Staff members are the daily operators of the Kiribathgoda branch. This role encompasses **front desk staff** (reception, member check-in assistance) and **trainers** (who have additional fitness-specific capabilities). Trainers are a specialization of Staff — every Trainer is also Staff, but not every Staff is a Trainer.

**Frequency of system use**: Every working day, throughout their shift.

**Key capabilities (all staff):**
- Clock in/out via QR code (same physical scanner as members)
- View their own clock-in history, hours worked, overtime
- View the daily member check-in list
- Search members by name, code, or phone number
- View a member's profile, subscription status, and vitals summary
- Report equipment issues (select equipment → describe problem → submit)
- Log maintenance activities on equipment
- View branch announcements and notices
- View their shift schedule

**Additional capabilities (trainers only):**
- View their assigned members list
- Access full vitals history for assigned members
- Create and edit workout plans for assigned members
- View AI-generated workout suggestions for a member and approve/modify them
- Mark personal training session attendance
- View and manage their availability calendar
- Record brief session notes after each personal training session

**Cannot:**
- Access payroll or financial summaries
- Approve or reject member identity documents
- Manage subscription plans or pricing
- Create/delete other staff accounts
- View business revenue metrics

#### 4.1.3 Manager

**Persona**: Ruwan, 45, branch manager, visits the gym 2–3 times per week. Needs mobile-friendly dashboards to check stats from home.

**Description**: The Kiribathgoda branch manager. Makes business decisions, monitors KPIs, oversees staff. Visits the branch infrequently but needs full operational visibility.

**Frequency of system use**: 2–3 times per week, primarily dashboards and reports. Occasional operational actions.

**Key capabilities:**
- View comprehensive business dashboard:
  - Today's revenue, member count, new signups, check-in count
  - Weekly/monthly trends: revenue, churn rate, peak hours, popular plans
  - Staff attendance summary: who's present, who's late, overtime totals
  - Equipment health overview: operational, under maintenance, retired
  - Inventory stock levels with low-stock alerts
- Manage staff:
  - View all staff profiles and schedules
  - Add/edit staff shifts
  - Approve overtime requests
  - View individual staff attendance reports
- Manage members at a high level:
  - Search and view any member's profile
  - Freeze/unfreeze member subscriptions
  - Handle member complaints (view history, add notes)
- Generate reports:
  - Monthly revenue report
  - Member retention report
  - Staff attendance report
  - Equipment maintenance cost report
- Set branch-level configurations:
  - Operating hours overrides (early closure, holidays)
  - Announcement banners displayed to staff and members
  - Grace period duration for expired subscriptions
- Inventory management:
  - View stock levels
  - Approve purchase requests
  - Set reorder thresholds

**Cannot:**
- Manage system-level configuration (API keys, integrations, storage)
- Access raw database or server logs
- Create Admin accounts
- Modify subscription plan pricing (requires Admin)

#### 4.1.4 Admin

**Persona**: You (the developer), or a designated system administrator. Rarely logs in. Handles technical setup and emergency overrides.

**Description**: The system administrator and technical overseer. This role exists for system configuration, troubleshooting, and operations that require elevated privileges. The Admin does **not** manage day-to-day gym operations.

**Frequency of system use**: Rarely. During initial setup, when adding new subscription plans, or when resolving escalated issues.

**Key capabilities:**
- All Manager capabilities (superset)
- **Identity document review**: Approve or reject member NIC uploads with reasons
- **Subscription plan management**: Create, edit, deactivate, and price plans
- **User account management**: Create/deactivate any user, reset passwords, change roles
- **System configuration**:
  - Oracle Object Storage connection settings
  - AI/LLM API endpoint and model configuration
  - Email SMTP settings
  - Rate limiting thresholds
  - Session timeout durations
- **Audit log access**: View all system events (who did what, when)
- **Data management**: Export data (CSV), manage soft-deleted records, database health
- **Branch configuration**: Edit branch details (address, phone, operating hours)
- **System health monitoring**: API response times, error rates, storage usage

**Cannot:**
- Nothing. Admin is the supreme role with full system access.

### 4.2 Permission Matrix

| Permission | Member | Staff | Trainer | Manager | Admin |
|-----------|--------|-------|---------|---------|-------|
| QR check-in/out | Yes | Yes | Yes | Yes | Yes |
| View own profile | Yes | Yes | Yes | Yes | Yes |
| Edit own profile | Yes | Yes | Yes | Yes | Yes |
| View own access logs | Yes | Yes | Yes | Yes | Yes |
| View own workout plans | Yes | — | — | — | — |
| View member directory | — | Yes | Yes | Yes | Yes |
| View specific member profile | — | Read | Read (assigned only) | Read | Full |
| Create/edit workout plans | — | — | For assigned members | — | All |
| Report equipment issues | — | Yes | Yes | Yes | Yes |
| Log equipment maintenance | — | Yes | Yes | Yes | Yes |
| View staff attendance | — | Own only | Own only | All | All |
| Manage shifts | — | — | — | Yes | Yes |
| View business dashboard | — | — | — | Yes | Yes |
| Approve documents | — | — | — | — | Yes |
| Manage subscription plans | — | — | — | — | Yes |
| Manage users | — | — | — | — | Yes |
| System configuration | — | — | — | — | Yes |
| Audit logs | — | — | — | — | Yes |

### 4.3 Authentication Architecture

**Primary authentication**: Email + password with JWT tokens.

**Token strategy:**
- **Access token**: Short-lived (15 minutes), stored in `httpOnly` cookie or memory. Contains `userId`, `role`, `branchId`.
- **Refresh token**: Long-lived (7 days), stored in `httpOnly` secure cookie. Rotated on each refresh. Stored server-side (DB) for revocation capability.
- **QR token**: A cryptographically random secret unique to each user, encoded into a QR code. Not a JWT. Used solely for physical access validation. Can be regenerated by the user at any time (invalidates previous QR).

**Session rules:**
- Concurrent sessions: Maximum 3 devices per user.
- Idle timeout: 30 minutes of inactivity → access token not refreshed → redirect to login.
- Force logout: Admin can invalidate all refresh tokens for a user (e.g., stolen device scenario).
- Password change: Invalidates all existing refresh tokens.

---

## 5. Module 1 — QR-Based Physical Access Control

### 5.1 Overview

Every person entering or leaving the Kiribathgoda branch — members, staff, trainers, and the manager — scans a unique QR code at the gym entrance. The system records the exact timestamp, validates authorization, and either grants or denies entry.

### 5.2 QR Code Generation

**How QR codes are created:**

1. When a user account is created (any role), the system generates a `qr_code_secret` — a 128-bit cryptographically random string (e.g., `a7f3b2c1-d9e8-4506-9abc-1234def56789`).
2. The QR code encodes a JSON payload → Base64:
   ```json
   {
     "uid": "USER_ID",
     "sec": "QR_CODE_SECRET",
     "v": 1
   }
   ```
3. The `v` (version) field allows future QR format changes.
4. The QR image is generated client-side using a library (e.g., `qrcode.react`), so the secret never passes through a CDN or image cache.

**QR code display rules:**
- Members see their QR code on the **home page** of the web portal after login, with a "Download QR" button.
- Staff also see their QR on their dashboard.
- QR codes can be printed, screenshotted, or saved to phone wallet. The system does not enforce a specific display method.
- A user can regenerate their QR code at any time (Settings → "Generate New QR Code"). This invalidates the previous QR immediately.

**Edge case — QR code compromise:**
- If a member reports a stolen QR code, any staff or the member themselves can trigger "Regenerate QR" from the member's profile.
- The old `qr_code_secret` is overwritten; any scan with the old secret returns `QR_INVALID`.

### 5.3 QR Scan Processing Flow

When a QR code is scanned at the entrance (or via the simulation endpoint):

```
┌─────────────┐
│  QR Scanned │
└──────┬──────┘
       │
       ▼
┌──────────────────────┐
│ Decode Base64 payload │
│ Extract uid, sec, v   │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐     ┌─────────────────┐
│ Lookup user by uid   │──NO──│ DENY: USER_NOT  │
│ and verify sec match │      │ _FOUND          │
└──────┬───────────────┘     └─────────────────┘
       │ YES
       ▼
┌──────────────────────┐     ┌─────────────────┐
│ Is user.is_active?   │──NO──│ DENY: ACCOUNT   │
│                      │      │ _SUSPENDED      │
└──────┬───────────────┘     └─────────────────┘
       │ YES
       ▼
┌──────────────────────┐     ┌─────────────────┐
│ Is branch currently  │──NO──│ DENY: BRANCH    │
│ open? (hours check)  │      │ _CLOSED         │
└──────┬───────────────┘     └─────────────────┘
       │ YES
       ▼
┌──────────────────────┐
│ Determine direction  │
│ (IN or OUT)          │
│ based on last event  │
└──────┬───────────────┘
       │
       ├── Direction = IN ──────────────────────────┐
       │                                            ▼
       │                              ┌───────────────────────┐
       │                              │ Role-based validation │
       │                              └──────┬────────────────┘
       │                                     │
       │                    ┌────────────────┼────────────────┐
       │                    ▼                ▼                ▼
       │              ┌──────────┐    ┌───────────┐    ┌───────────┐
       │              │ MEMBER   │    │ STAFF /   │    │ MANAGER / │
       │              │          │    │ TRAINER   │    │ ADMIN     │
       │              └────┬─────┘    └─────┬─────┘    └─────┬─────┘
       │                   │                │                │
       │                   ▼                ▼                ▼
       │           ┌──────────────┐  ┌──────────────┐  ┌──────────┐
       │           │Has active    │  │Is within     │  │Always    │
       │           │subscription? │  │shift window? │  │allowed   │
       │           │(incl. grace) │  │(±30 min)     │  │          │
       │           └──┬───────────┘  └──┬───────────┘  └──┬───────┘
       │              │                 │                  │
       │          YES/NO             YES/NO              ALLOW
       │              │                 │
       │         ┌────┴────┐      ┌────┴────┐
       │         │ ALLOW / │      │ ALLOW / │
       │         │ DENY:   │      │ WARN:   │
       │         │ SUB_    │      │ OFF_    │
       │         │ EXPIRED │      │ SHIFT   │
       │         └─────────┘      └─────────┘
       │
       ├── Direction = OUT ─────────────────────┐
       │                                        ▼
       │                          ┌───────────────────────┐
       │                          │ Always allowed. Log   │
       │                          │ exit. Calculate       │
       │                          │ visit_duration.       │
       │                          └───────────────────────┘
       │
       └─────────────────────────────────────────┘
```

### 5.4 Direction Determination Logic

The system does not have separate "IN" and "OUT" scanners. It uses a **toggle model**:

1. Look up the user's most recent `access_log` entry for today.
2. If no entry exists → direction is `IN`.
3. If the most recent entry is `IN` → direction is `OUT`.
4. If the most recent entry is `OUT` → direction is `IN`.

**Edge cases:**
- **Double scan within 30 seconds**: Debounced. Second scan is ignored. Response: `SCAN_DEBOUNCED — Please wait before scanning again.`
- **Member scans OUT without scanning IN**: This can happen if someone entered before the system was online. The system creates a synthetic `IN` event timestamped to `branch_open_time` of that day, flagged as `synthetic: true`, and then records the `OUT`.
- **Member never scans OUT (forgets)**: At 11:00 PM (1 hour after closing), a cron job runs and auto-closes all open sessions with direction `OUT`, flagged as `auto_closed: true`. Duration calculation uses `branch_close_time` as the exit time.
- **Staff scans OUT and immediately back IN** (e.g., stepped outside for a delivery): Allowed. Creates a new session. The short gap appears in the time tracking report.

### 5.5 Access Log Data Model

Each scan creates an `access_log` entry:

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID FK | The person who scanned |
| gate_id | UUID FK (nullable) | Which scanner device (null for simulation) |
| scanned_at | TIMESTAMP | Exact scan time in UTC |
| direction | ENUM('in', 'out') | Entry or exit |
| is_authorized | BOOLEAN | Whether access was granted |
| deny_reason | VARCHAR(100) | Null if authorized. Otherwise: `SUB_EXPIRED`, `ACCOUNT_SUSPENDED`, `BRANCH_CLOSED`, `QR_INVALID`, etc. |
| session_id | UUID | Groups an IN-OUT pair into a single "visit" |
| is_synthetic | BOOLEAN | True if system-generated (e.g., auto-close) |
| metadata | JSON | Additional data: `{ "qr_version": 1, "client_ip": "...", "user_agent": "..." }` |
| created_at | TIMESTAMP | Record creation time |

### 5.6 Visit Sessions

A **visit session** is a logical grouping of one IN event and one OUT event:

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Session ID (referenced by access logs) |
| user_id | UUID FK | The visitor |
| check_in_at | TIMESTAMP | When they entered |
| check_out_at | TIMESTAMP (nullable) | When they exited (null = still inside) |
| duration_minutes | INT (nullable) | Calculated on check-out |
| status | ENUM('active', 'completed', 'auto_closed', 'cancelled') | Session state |
| visit_type | ENUM('member_visit', 'staff_shift', 'guest_visit') | Purpose of visit |
| created_at | TIMESTAMP | Record creation time |

### 5.7 Subscription Validation Details (For Members)

When a member scans IN, the system checks:

1. **Active subscription exists?** Query `subscriptions` where `member_id = X AND status = 'active' AND start_date <= NOW() AND end_date >= NOW()`.
2. **If no active subscription, check grace period**: Query where `end_date >= (NOW() - INTERVAL grace_days DAY)`. If found, allow entry but set `access_log.metadata.grace_warning = true`.
3. **If subscription is frozen**: Deny with reason `SUB_FROZEN`.
4. **If member has a pending identity verification**: Allow entry (they paid) but show a banner on their dashboard: "Complete your identity verification to avoid interruptions."

### 5.8 Real-Time Occupancy

The system maintains a **real-time occupancy count**:

- Incremented on every `IN` event (authorized).
- Decremented on every `OUT` event.
- Never goes below 0 (floor at 0 to handle edge cases).
- Displayed on the Staff and Manager dashboards.
- If occupancy reaches the branch capacity (configurable, default 100), new entries are allowed but a `CAPACITY_WARNING` is logged and the Manager receives a notification.

---

## 6. Module 2 — Staff Time Tracking & Workforce Management

### 6.1 Overview

Every staff member (front desk, trainers, manager) uses the same QR scan for attendance. The system tracks their working hours, calculates overtime, and supports shift management.

### 6.2 Clock-In / Clock-Out

- Staff scan the same QR scanner as members.
- The system identifies them as staff (role check) and records a `staff_shift` visit session.
- Clock-in time = first IN scan of the day.
- Clock-out time = last OUT scan of the day.

**Edge cases:**
- **Late arrival**: If a staff member clocks in more than 15 minutes after their scheduled shift start, the system flags it as `LATE`. The lateness duration is recorded.
- **Early departure**: If a staff member clocks out more than 15 minutes before their scheduled shift end, flagged as `EARLY_DEPARTURE`.
- **Multiple IN/OUT in a day**: Only the first IN and last OUT count for shift duration. Intermediate exits (e.g., lunch break, stepping out) are logged but don't affect total hours unless explicitly configured.
- **Forgot to clock out**: Auto-closed at 11 PM by the cron job. Flagged for Manager review.
- **Clock in on a day off**: Allowed (staff may swap shifts informally), but flagged for Manager review.

### 6.3 Shift Management

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| staff_id | UUID FK | The staff member |
| day_of_week | ENUM('mon'...'sat') | Scheduled day |
| shift_start | TIME | e.g., 05:00 |
| shift_end | TIME | e.g., 13:00 |
| is_active | BOOLEAN | Current schedule or historical |
| effective_from | DATE | When this schedule starts |
| effective_until | DATE (nullable) | When this schedule ends (null = ongoing) |

**Standard shifts for Kiribathgoda:**
- **Morning shift**: 05:00 – 13:00 (8 hours)
- **Evening shift**: 13:00 – 22:00 (9 hours)
- **Split shift**: 05:00 – 09:00, then 17:00 – 22:00 (trainers who cover peak hours)

### 6.4 Overtime Calculation

- **Standard hours**: Based on assigned shift duration.
- **Overtime threshold**: Hours worked beyond the scheduled shift duration.
- **Overtime rate**: 1.5x for the first 2 hours, 2.0x for anything beyond (configurable by Admin).
- **Weekly cap**: If a staff member exceeds 48 hours in a week (Mon–Sat), all excess hours are at 2.0x rate.
- **Overtime approval**: Manager must approve overtime claims above 5 hours per week before they appear in the payroll export.

### 6.5 Trainer Availability

Trainers have an additional scheduling layer on top of shifts:

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| trainer_id | UUID FK | The trainer |
| date | DATE | Specific date |
| start_time | TIME | Available from |
| end_time | TIME | Available until |
| slot_duration_minutes | INT | Default 60 |
| is_booked | BOOLEAN | Whether a member has booked this slot |
| booked_by_member_id | UUID FK (nullable) | The member who booked |
| status | ENUM('available', 'booked', 'completed', 'cancelled', 'no_show') | Slot state |

**Availability rules:**
- Trainers set their availability weekly in advance.
- Default: If a trainer doesn't set availability, the system assumes they're available during their shift hours.
- Members can only book "available" slots. Double-booking is prevented at the database level (unique constraint on trainer + date + time).
- Maximum advance booking: 7 days ahead. No same-day booking within 1 hour of the slot start.
- Cancellation policy: Free cancellation up to 4 hours before the slot. Late cancellation or no-show costs the member one of their included PT sessions.

### 6.6 Staff Dashboard Data

Each staff member's dashboard shows:

- **Today**: Clock-in time, hours worked so far, shift remaining
- **This week**: Total hours, overtime hours, late arrivals
- **This month**: Total hours, overtime summary, attendance percentage
- **Members present now**: Live list of checked-in members with their names, member codes, and check-in times

---

## 7. Module 3 — Member Registration & Identity Verification

### 7.1 Registration Flow

The member registration is a multi-step wizard on the web portal (publicly accessible, no login required):

```
Step 1: Account Creation
├── Full name
├── Email address
├── Phone number
├── Password (min 8 chars, 1 uppercase, 1 number, 1 special char)
├── Confirm password
├── Date of birth
├── Gender (Male / Female / Prefer not to say)
└── Home branch: Pre-selected "Kiribathgoda" (single branch v1)

Step 2: Identity Verification
├── NIC Number (National Identity Card)
├── Upload NIC Front Photo (JPEG/PNG, max 5 MB)
├── Upload NIC Back Photo (JPEG/PNG, max 5 MB)
└── Optional: Upload a selfie holding NIC (for additional verification)

Step 3: Subscription Selection
├── Browse available plans (cards with price, duration, features)
├── Select a plan
├── Review order summary
└── Confirm (marks subscription as 'pending_payment')

Step 4: Welcome Dashboard
├── Email verification prompt
├── QR code display
├── "Come visit us at Kiribathgoda!" message
├── Link to complete onboarding vitals (optional, can do later)
└── Print QR code button
```

### 7.2 Identity Document Storage (Oracle Object Storage)

**Why Oracle Object Storage?**
- Identity documents (NIC photos) are sensitive PII.
- They must not be stored on the application server or in the database.
- Oracle Object Storage provides server-side encryption, access policies, and audit logging.

**Upload flow:**
1. Member selects NIC photo from their device.
2. Frontend sends the file to the backend API endpoint: `POST /api/v1/members/documents/upload`.
3. Backend validates: file type (JPEG/PNG only), file size (< 5 MB), image dimensions (min 600×400).
4. Backend generates a unique object name: `nic/{member_id}/{timestamp}_{front|back}.{ext}`.
5. Backend uploads to Oracle Object Storage bucket `powerworld-nic-docs` using the Oracle SDK.
6. Backend stores the **object key** (not the full URL) in `member_documents` table.
7. The actual image is **never served directly to the frontend**. When Admin reviews documents, the backend generates a **pre-signed URL** (valid for 5 minutes) and returns it to the Admin's browser.

**Security:**
- Bucket policy: No public access. Only the application's service account can read/write.
- Pre-signed URLs expire after 5 minutes.
- Deletion: When a member account is deleted (GDPR-style right to erasure), the backend deletes objects from Oracle Storage and soft-deletes the DB record.

### 7.3 Identity Verification Workflow (Admin Review)

```
Member uploads NIC → Status: 'pending_review'
                           │
                    Admin views pending queue
                           │
           ┌───────────────┼───────────────┐
           ▼                               ▼
     ┌───────────┐                   ┌───────────┐
     │ APPROVE   │                   │ REJECT    │
     │           │                   │ + Reason  │
     └─────┬─────┘                   └─────┬─────┘
           │                               │
           ▼                               ▼
   Status: 'verified'              Status: 'rejected'
   Member notified via email       Member notified via email
   "Your identity is verified"    "Rejected because: [reason]"
                                   "Please re-upload clearer photos"
                                           │
                                           ▼
                                   Member re-uploads → back to 'pending_review'
```

**Rejection reasons (predefined + custom):**
- `BLURRY` — Photo is too blurry to read
- `INCOMPLETE` — Part of the NIC is cut off
- `MISMATCH` — Name on NIC doesn't match registered name
- `EXPIRED_NIC` — NIC appears to be expired
- `WRONG_DOCUMENT` — Uploaded document is not a NIC
- `CUSTOM` — Admin writes a free-text reason

**Important**: Identity verification does NOT block gym access. A member with a pending or rejected document status can still use their subscription. The verification is for compliance purposes (e.g., confirming age for certain equipment, handling accidents). The system displays a persistent banner: "Please complete your identity verification."

### 7.4 Email Verification

After registration, the system sends a verification email:
- Contains a one-time link: `https://gym.example.com/verify-email?token={UUID}`.
- Token expires after 24 hours.
- If unverified after 72 hours, system sends a reminder email.
- Unverified email after 30 days → account flagged for review (but not deactivated).

### 7.5 Edge Cases in Registration

- **Duplicate email**: "An account with this email already exists. Try logging in or resetting your password."
- **Duplicate phone**: Allowed (a family might share a phone number), but a warning is shown.
- **Underage registration**: If date of birth < 16 years → Blocked. "Members must be at least 16 years old."
- **16–18 years**: Allowed with a warning: "Members under 18 should have parental consent." (No enforcement mechanism in v1; a consent form upload can be added later.)
- **Bot prevention**: Google reCAPTCHA v3 on the registration form. Score < 0.5 → block.
- **Partial registration abandonment**: If a user completes Step 1 but never finishes, the account is created with `status: 'incomplete'`. After 7 days, incomplete accounts are purged by a cleanup cron job.

---

## 8. Module 4 — Subscription & Payment Management

### 8.1 Subscription Lifecycle

```
            ┌──────────────────────────────────────────────────────┐
            │                  SUBSCRIPTION LIFECYCLE              │
            │                                                      │
            │  pending_payment ──→ active ──→ expired              │
            │       │                │          │                  │
            │       │                │          └──→ grace_period  │
            │       │                │                   │         │
            │       │                │                   └──→ inactive │
            │       │                ▼                             │
            │       │           frozen ──→ active (resume)         │
            │       │                                              │
            │       └──→ cancelled (never paid)                    │
            └──────────────────────────────────────────────────────┘
```

### 8.2 Subscription States

| State | Description | Entry Allowed? |
|-------|-------------|---------------|
| pending_payment | Plan selected but not yet paid | No |
| active | Paid and within date range | Yes |
| frozen | Member requested a pause | No |
| expired | End date passed | No (unless in grace period) |
| grace_period | Expired but within grace window | Yes (with warning) |
| inactive | Grace period also expired | No |
| cancelled | Cancelled before activation | No |

### 8.3 Payment Recording (Manual — v1)

In Phase 1, payments are recorded manually by staff:

1. Member comes to the front desk and pays (cash, card machine, or bank transfer).
2. Staff opens the member's profile → "Record Payment".
3. Staff enters:
   - Amount (LKR)
   - Payment method: Cash, Card, Bank Transfer, Online
   - Reference number (for card/bank: transaction ID)
   - Notes (optional)
4. System creates a `payment` record and activates the subscription.

**Payment data model:**

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| member_id | UUID FK | Who paid |
| subscription_id | UUID FK | Which subscription this payment covers |
| amount | DECIMAL(10,2) | Amount in LKR |
| payment_method | ENUM('cash', 'card', 'bank_transfer', 'online') | How they paid |
| reference_number | VARCHAR(100) (nullable) | External reference |
| recorded_by | UUID FK | Staff who recorded the payment |
| payment_date | DATE | When the payment was made |
| status | ENUM('completed', 'refunded', 'disputed') | Payment status |
| notes | TEXT (nullable) | Free text |
| created_at | TIMESTAMP | Record creation |

### 8.4 Subscription Renewal

**Auto-renewal (future):** Not in v1. Members must manually renew.

**Renewal reminders:**
- **7 days before expiry**: Email + in-app notification: "Your subscription expires on [date]. Renew now to continue uninterrupted."
- **3 days before expiry**: Second reminder.
- **Day of expiry**: "Your subscription expires today."
- **1 day after expiry (grace period)**: "Your subscription has expired. You have [X] grace days remaining."
- **Grace period ended**: "Your subscription is now inactive. Please visit the front desk to renew."

### 8.5 Subscription Freezing

- Member requests freeze via web portal or in-person (staff does it).
- Minimum freeze: 7 days. Maximum freeze: 30 days per 365-day rolling window.
- During freeze, the subscription `end_date` is extended by the freeze duration.
- Entry is denied during freeze with reason: `SUB_FROZEN`.
- Unfreeze: Automatic on the scheduled unfreeze date, OR manual unfreeze by member/staff.

### 8.6 Pricing Edge Cases

- **Plan price changes**: Do not affect existing active subscriptions. Only new purchases use the updated price. Historical payment records always reflect the price at time of purchase.
- **Proration**: Not supported in v1. If a member upgrades from Basic to Premium mid-cycle, they pay the full Premium price and a new subscription starts from today. The remaining Basic days are forfeited (or a manual credit can be noted in payment notes).
- **Couple plans**: Linked subscriptions. Two `member_id`s reference the same `subscription` via a `subscription_members` join table. If one member freezes, only their access is frozen; the other continues.
- **Corporate plans**: A `corporate_account` entity links to multiple member subscriptions. Corporate admin receives a monthly invoice (PDF generated by the system with line items).
- **Refunds**: Staff/Manager can record a refund against a payment. Refund amount must be ≤ original payment. Subscription is cancelled upon full refund.

---

## 9. Module 5 — Member Onboarding & Vitals Collection

### 9.1 Onboarding Flow

After registration, the first time a member visits the gym, they undergo an onboarding process:

```
Member scans QR (first ever visit detected)
            │
            ▼
Staff sees "NEW MEMBER" badge on dashboard
            │
            ▼
Staff greets member, confirms identity
            │
            ▼
   ┌─────────────────────────────────────┐
   │ Is the member new to working out    │
   │ or are they an experienced gymgoer? │
   └──────────┬──────────────────────────┘
              │
    ┌─────────┴──────────┐
    ▼                    ▼
┌──────────┐      ┌──────────────┐
│ BEGINNER │      │ EXPERIENCED  │
│ Path     │      │ Path         │
└────┬─────┘      └──────┬───────┘
     │                   │
     ▼                   ▼
┌──────────────┐  ┌──────────────┐
│ Detailed     │  │ Quick vitals │
│ vitals +     │  │ + goal       │
│ goals +      │  │ selection    │
│ medical      │  │              │
│ history      │  │              │
└──────┬───────┘  └──────┬───────┘
       │                 │
       ▼                 ▼
┌──────────────┐  ┌──────────────┐
│ AI generates │  │ Show curated │
│ starter plan │  │ workout      │
│ (gentle,     │  │ library      │
│ progressive) │  │ (filter by   │
│              │  │ goal)        │
└──────┬───────┘  └──────┬───────┘
       │                 │
       └────────┬────────┘
                ▼
        Trainer assigned
        First workout begins
```

### 9.2 Vitals Collection Form

**Core vitals (always collected):**

| Field | Type | Unit | Validation |
|-------|------|------|------------|
| Weight | DECIMAL(5,2) | kg | 30 – 250 |
| Height | DECIMAL(5,2) | cm | 100 – 250 |
| Age | INT | years | Auto-calculated from DOB |
| BMI | DECIMAL(4,1) | — | Auto-calculated: weight / (height/100)² |
| Body fat % | DECIMAL(4,1) | % | 3 – 60 (optional in v1, requires caliper/machine) |
| Resting heart rate | INT | bpm | 40 – 120 |

**Goals (multi-select, at least one required):**
- Weight loss
- Muscle gain
- General fitness
- Flexibility & mobility
- Endurance / cardio
- Strength training
- Stress relief
- Sports-specific training (specify sport)
- Rehabilitation (specify condition)

**Medical history (optional but recommended):**
- Known medical conditions: Diabetes, Hypertension, Asthma, Heart conditions, Joint problems, Back problems, Other (free text)
- Current medications: Free text
- Recent surgeries (last 12 months): Yes/No + details
- Allergies: Free text
- Emergency contact name + phone (if not already provided at registration)

**Experience level:**
- `beginner` — Never been to a gym or < 3 months experience
- `intermediate` — 3–12 months of regular gym experience
- `advanced` — 1+ years of consistent training
- `returning` — Was experienced but inactive for 6+ months (treat as beginner for plan generation)

### 9.3 Vitals History & Trends

Every vitals collection is stored as a timestamped record:

```sql
member_metrics (
  id, member_id, recorded_at,
  weight, height, body_fat_percentage,
  muscle_mass, bmi, resting_heart_rate,
  waist_circumference, chest_circumference,
  notes, recorded_by -- trainer or self-reported
)
```

- Members can update their own vitals via the web portal (self-reported).
- Trainers can record vitals during personal sessions.
- The system displays a **line chart** showing weight, BMI, and body fat % over time.
- Weekly auto-reminders for members who haven't logged vitals in 14+ days.

### 9.4 BMI Categories & Guidance

| BMI Range | Category | System Action |
|-----------|----------|---------------|
| < 18.5 | Underweight | AI prioritizes muscle gain + caloric surplus suggestions |
| 18.5 – 24.9 | Normal | Standard plan |
| 25.0 – 29.9 | Overweight | AI includes more cardio, moderate caloric deficit |
| 30.0 – 34.9 | Obese Class I | Flag for trainer review, low-impact start |
| 35.0+ | Obese Class II+ | Mandatory trainer consultation before first workout |

---

## 10. Module 6 — AI-Powered Workout Generation & Management

### 10.1 Overview

New members (especially beginners) receive an AI-generated workout plan tailored to their vitals, goals, and experience level. The system uses a RAG (Retrieval-Augmented Generation) agent powered by an LLM (e.g., Gemini, GPT-4o-mini) to create structured workout programmes.

### 10.2 AI Prompt Construction

When generating a workout plan, the system constructs a prompt:

```
You are a certified personal fitness trainer at Power World Gyms in Sri Lanka.
Generate a structured weekly workout plan for the following member:

MEMBER PROFILE:
- Age: {age} years
- Gender: {gender}
- Weight: {weight} kg
- Height: {height} cm
- BMI: {bmi} ({bmi_category})
- Body fat: {body_fat}% (if available)
- Resting heart rate: {resting_hr} bpm (if available)
- Experience level: {beginner|intermediate|advanced|returning}
- Goals: {comma-separated goals}
- Medical conditions: {conditions or "None reported"}
- Available days per week: {days}

CONSTRAINTS:
- Equipment available: Standard gym (dumbbells, barbells, cables, treadmills,
  ellipticals, leg press, smith machine, pull-up bars, benches)
- Session duration: 60 minutes maximum
- Must include warm-up (5 min) and cool-down (5 min)
- For beginners: No exercises requiring a spotter. Machines over free weights.
- For medical conditions: Avoid contraindicated movements.

OUTPUT FORMAT (JSON):
{
  "plan_name": "string",
  "plan_description": "string",
  "duration_weeks": number,
  "days": [
    {
      "day_number": 1,
      "focus": "string (e.g., 'Upper Body')",
      "exercises": [
        {
          "name": "string",
          "sets": number,
          "reps": "string (e.g., '10-12' or '30 seconds')",
          "rest_seconds": number,
          "notes": "string (form tips, alternatives)",
          "equipment": "string",
          "muscle_groups": ["string"]
        }
      ]
    }
  ],
  "progression_notes": "string",
  "nutrition_tips": "string (general, non-prescriptive)"
}
```

### 10.3 Workout Plan Storage

```sql
workout_plans (
  id, member_id, trainer_id (nullable),
  plan_name, plan_description,
  source ENUM('ai_generated', 'trainer_created', 'curated_library'),
  duration_weeks, days_per_week,
  plan_data JSON, -- The full structured plan
  is_active BOOLEAN,
  started_at DATE, completed_at DATE,
  ai_model_used VARCHAR(50), -- e.g., 'gemini-2.0-flash'
  ai_prompt_hash VARCHAR(64), -- SHA-256 of the prompt for traceability
  created_at TIMESTAMP, updated_at TIMESTAMP
)

workout_exercises (
  id, plan_id FK, day_number, exercise_order,
  exercise_name, sets, reps, rest_seconds,
  notes, equipment, muscle_groups JSON,
  created_at TIMESTAMP
)
```

### 10.4 Curated Workout Library

In addition to AI-generated plans, the system maintains a **curated library** of pre-built workout programmes:

| Category | Example Programmes |
|----------|-------------------|
| Beginner | "First 30 Days", "Introduction to Strength", "Cardio Foundations" |
| Weight Loss | "Fat Burn 60", "HIIT Circuit", "Steady State Cardio Programme" |
| Muscle Building | "Push/Pull/Legs Split", "Upper/Lower 4-Day", "Full Body 3×Week" |
| Flexibility | "Dynamic Stretching Routine", "Yoga for Lifters" |
| Sports-Specific | "Cricket Fitness", "Running Performance", "Swimming Dryland" |

These are created by Admin/Trainers and stored in the same `workout_plans` table with `source = 'curated_library'` and `member_id = NULL` (template plans).

### 10.5 Workout Tracking

When a member performs a workout:

```sql
workout_logs (
  id, member_id, plan_id FK (nullable),
  workout_date DATE,
  exercises JSON, -- What they actually did
  duration_minutes INT,
  notes TEXT,
  mood ENUM('great', 'good', 'okay', 'tired', 'poor'),
  calories_burned INT (nullable), -- From Health Connect or estimate
  created_at TIMESTAMP
)
```

**Tracking UX:**
- Member opens their active plan → Sees today's workout day.
- For each exercise, they can log: actual sets, actual reps, weight used.
- After completing the workout, they rate their mood and save.
- The system calculates estimated calories burned using METs (Metabolic Equivalent of Task) if Health Connect data is unavailable.

### 10.6 Plan Progression

- After the plan's `duration_weeks` ends, the system prompts: "Your plan period has ended! Would you like a new AI-generated plan based on your updated stats?"
- If the member re-records vitals, the AI generates a progressively harder plan.
- If no vitals update, the AI generates a plan with slightly increased volume/intensity based on their workout logs (progressive overload).

---

## 11. Module 7 — Google Health Connect Integration

### 11.1 Overview

Google Health Connect (formerly Google Fit) is Android's unified health data layer. Members who use Android devices can connect their Health Connect data to the gym system, enabling automated vitals synchronization.

### 11.2 Supported Data Types

| Health Connect Data Type | System Field | Sync Direction |
|--------------------------|-------------|----------------|
| Weight | member_metrics.weight | Read from device |
| Height | member_metrics.height | Read from device |
| Heart rate (resting) | member_metrics.resting_heart_rate | Read from device |
| Body fat | member_metrics.body_fat_percentage | Read from device |
| Steps (daily) | workout_logs.metadata.steps | Read from device |
| Active calories burned | workout_logs.calories_burned | Read from device |
| Exercise sessions | workout_logs (auto-create) | Read from device |
| Sleep duration | member_metrics.metadata.sleep_hours | Read from device |

### 11.3 Integration Architecture

Since we do NOT have a native mobile app, Health Connect integration works through a **companion approach**:

1. **Option A — Web-based OAuth flow** (preferred for v1):
   - Member connects their Google account via OAuth 2.0 on the web portal.
   - The backend periodically queries the Google Fitness REST API (which underlies Health Connect) for the member's data.
   - Requires the member to grant `fitness.body.read`, `fitness.activity.read` permissions.

2. **Option B — Simulation** (for demo):
   - A simulation script generates realistic Health Connect-like data for demo members.
   - Simulates: daily weight fluctuations, heart rate during workouts, step counts, calorie burns.

### 11.4 Data Sync Frequency

- **Vitals (weight, height, body fat)**: Synced once daily at midnight (Asia/Colombo).
- **Workout data (steps, calories, exercise sessions)**: Synced every 4 hours.
- **Manual sync**: Member can trigger a sync from their profile page.
- **Conflict resolution**: If both manual entry and Health Connect provide weight for the same day, Health Connect value is preferred (marked as `source: 'health_connect'`). Manual overrides are preserved with `source: 'manual'`.

### 11.5 Privacy & Consent

- Members must explicitly opt-in to Health Connect sync. Default is OFF.
- Members can disconnect at any time. Upon disconnection, synced data is retained (member already agreed to collection) but no new data is fetched.
- The system never writes data TO Health Connect (read-only access).
- Data from Health Connect is stored in the same `member_metrics` table with a `source` field distinguishing it.

---

## 12. Module 8 — Trainer Management & Personal Sessions

### 12.1 Trainer Profile

Each trainer has an extended profile beyond standard staff:

| Field | Description |
|-------|-------------|
| specialization | e.g., "Weight Training", "Cardio & HIIT", "Yoga & Flexibility" |
| bio | Free text, displayed to members on the "Our Trainers" page |
| certifications | List of certifications (name, issuing body, year) |
| years_of_experience | INT |
| hourly_rate | LKR, used for calculating PT session costs |
| rating | Decimal 1.0 – 5.0, calculated from member reviews |
| max_clients | Maximum number of active assigned members |
| avatar_url | Profile photo |

### 12.2 Trainer Assignment

- When a member completes onboarding, they are assigned a default trainer based on availability and specialization matching.
- Assignment algorithm:
  1. Filter trainers with matching specialization to member's primary goal.
  2. Sort by: fewest active clients (load balancing) → highest rating → longest tenure.
  3. Assign the top result. If all trainers are at max capacity, mark the member as `waiting_for_trainer`.
- Members can request a trainer change (once per 30 days, free; additional changes require Manager approval).

### 12.3 Personal Training Sessions

**Booking flow:**
1. Member views "Trainers" tab → sees available trainers.
2. Member selects a trainer → sees their weekly availability calendar.
3. Member picks an available 60-minute slot → "Book Session".
4. System checks:
   - Member's subscription includes PT sessions (or member pays extra).
   - The slot is still available (race condition prevention via DB transaction with row lock).
   - Member doesn't already have a session booked at that time.
5. Session booked. Both member and trainer receive confirmation notification.

**Session lifecycle:**
```
booked → confirmed (trainer acknowledges) → in_progress (member checks in)
       → completed (trainer marks done, adds notes)
       OR → cancelled_by_member / cancelled_by_trainer / no_show
```

**No-show handling:**
- If the member doesn't check into the gym within 15 minutes of the session start, the trainer can mark it as `no_show`.
- First no-show: Warning notification to member.
- Second no-show within 30 days: The session is deducted from their PT allocation.
- Third no-show: Temporary booking restriction (7 days).

### 12.4 Session Notes

After completing a session, the trainer records:

| Field | Description |
|-------|-------------|
| performance_rating | 1–5 scale (how well the member performed) |
| exercises_completed | List of exercises actually done |
| weight_progression | Any new PRs (personal records) set |
| areas_of_concern | e.g., "Poor squat form, need to focus on mobility" |
| recommendations | e.g., "Add extra stretching routine, consider massage" |
| next_session_focus | What to prioritize next time |

These notes are visible to the member on their profile, building a history of their training journey.

### 12.5 Trainer Member Management View

Trainers see a dedicated view of their assigned members:

- **Member grid**: Photo, name, code, last visit date, last vitals date, active plan name
- **Quick actions**: View profile, Record vitals, Edit plan, Book next session
- **Alerts**: Members who haven't visited in 7+ days, Members whose plans ended, Members with overdue vitals

### 12.6 Conflict Prevention

- A trainer cannot be booked for two overlapping sessions.
- A member cannot book two sessions at the same time.
- If a trainer calls in sick, their booked sessions for that day are auto-cancelled with notification to affected members. Manager is alerted.
- If a member's subscription expires before a booked session, the session is auto-cancelled.

---

## 13. Module 9 — Equipment & Inventory Management

### 13.1 Equipment Registry

Every piece of equipment in the Kiribathgoda branch is catalogued:

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| branch_id | UUID FK | Always Kiribathgoda in v1 |
| name | VARCHAR(100) | e.g., "Treadmill #3" |
| category | ENUM | 'cardio', 'strength_machine', 'free_weight', 'bench', 'accessory', 'other' |
| manufacturer | VARCHAR(100) | Brand name |
| model | VARCHAR(100) | Model number |
| serial_number | VARCHAR(100) | Unique serial |
| purchase_date | DATE | When acquired |
| purchase_price | DECIMAL(10,2) | Cost in LKR |
| warranty_expiry | DATE | Warranty end date |
| status | ENUM | 'operational', 'needs_maintenance', 'under_maintenance', 'retired' |
| location_zone | VARCHAR(50) | e.g., "Cardio Zone", "Free Weights Area", "Studio" |
| last_maintenance_date | DATE | Last serviced |
| next_maintenance_due | DATE | Scheduled service |
| maintenance_interval_days | INT | How often to service (e.g., 90 days) |
| notes | TEXT | Any additional info |
| qr_code | VARCHAR(100) | QR code on the equipment for quick identification |

### 13.2 Issue Reporting by Staff/Trainers

Any staff member or trainer can report an equipment issue:

1. Open "Equipment" → select the item (or scan its QR code).
2. Choose issue type: `malfunction`, `damage`, `noise`, `safety_concern`, `missing_part`, `other`.
3. Describe the issue (free text).
4. Optionally attach a photo.
5. Set severity: `low` (cosmetic), `medium` (functional but degraded), `high` (unusable), `critical` (safety hazard).
6. Submit. Equipment status auto-changes based on severity:
   - `low` / `medium` → status remains `operational`, issue is queued.
   - `high` → status changes to `needs_maintenance`.
   - `critical` → status changes to `under_maintenance` and Manager receives immediate notification.

### 13.3 Maintenance Scheduling

- **Preventive maintenance**: System generates auto-reminders when `next_maintenance_due` is within 7 days. Displayed on Manager dashboard.
- **Reactive maintenance**: Triggered by issue reports.
- **Maintenance log entry:**
  - Description of work done
  - Cost (LKR)
  - Performed by: internal staff or external vendor (name, contact)
  - Duration (hours)
  - Parts replaced (if any)
  - Status after maintenance: `operational` or `still_needs_work`

### 13.4 Equipment Lifecycle Reporting

Manager can generate:
- **Equipment cost report**: Total purchase cost, total maintenance cost, cost per equipment item.
- **Downtime report**: Days each equipment item was non-operational. Machines with highest downtime.
- **Age report**: Equipment sorted by age. Flagging items past recommended lifespan.

### 13.5 Inventory Management (Consumables)

Beyond equipment, the gym stocks consumable items:

| Item Type | Examples |
|-----------|---------|
| Supplements | Protein powder, BCAAs, pre-workout, energy bars |
| Hydration | Water bottles, sports drinks |
| Accessories | Gym towels, wrist wraps, resistance bands |
| Cleaning | Disinfectant spray, paper towels |
| Merchandise | Branded T-shirts, gym bags |

**Inventory data model:**

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(100) | Item name |
| category | VARCHAR(50) | Type of item |
| sku | VARCHAR(50) | Stock keeping unit |
| quantity_in_stock | INT | Current count |
| reorder_threshold | INT | Alert when stock drops below this |
| unit_cost | DECIMAL(10,2) | Cost per unit (LKR) |
| selling_price | DECIMAL(10,2) | Retail price (LKR) |
| supplier | VARCHAR(100) | Supplier name |
| last_restocked_at | TIMESTAMP | When last restocked |

**Inventory flow:**
- Items are added/restocked by Manager or authorized Staff.
- Sales/dispensing: Staff records an item sale to a member → quantity decrements.
- Low stock alert: When `quantity_in_stock <= reorder_threshold`, a notification appears on the Manager dashboard and an email is sent.

---

## 14. Module 10 — Dashboard & Analytics (Role-Based)

### 14.1 Member Dashboard

**Layout:**

| Section | Contents |
|---------|----------|
| **Hero / QR** | QR code (large, scannable), "Show this at the entrance" |
| **Subscription** | Plan name, days remaining, bar chart showing usage, renewal CTA |
| **Today's Workout** | Active plan's workout for today, quick-start button |
| **Recent Visits** | Last 5 visits with check-in/out times and durations |
| **Progress** | Weight trend chart (last 30 days), BMI indicator |
| **Notifications** | Subscription expiry warnings, new workout available, session reminders |
| **Quick Links** | Book PT session, Update vitals, View trainers |

### 14.2 Staff / Trainer Dashboard

| Section | Contents |
|---------|----------|
| **Clock Status** | "You clocked in at 5:02 AM. Shift ends at 1:00 PM." (or "Not clocked in") |
| **Members Present** | Live count + scrollable list. Each row: name, code, check-in time, subscription status |
| **New Members Today** | Highlighted entries needing onboarding |
| **Equipment Alerts** | Items needing attention (issues reported, maintenance due) |
| **My Schedule** (trainer) | Today's booked PT sessions with member names and times |
| **My Members** (trainer) | Assigned members with quick access to profiles |
| **Branch Stats** | Today's total check-ins, current occupancy, peak time indicator |

### 14.3 Manager Dashboard

| Section | Contents |
|---------|----------|
| **Revenue Today** | Total LKR collected today (payments), compared to same day last week |
| **Revenue This Month** | Running total vs. monthly target. Bar chart by day. |
| **Membership Metrics** | Active members, new signups this month, churned this month, retention rate % |
| **Occupancy** | Current count, peak today, average this week. Heatmap by hour of day. |
| **Staff Attendance** | Present today (list), late arrivals, absent without notice |
| **Subscription Distribution** | Pie chart of plan types (Basic, Premium, Quarterly, etc.) |
| **Equipment Health** | Operational %, items under maintenance, overdue maintenance count |
| **Inventory Alerts** | Low-stock items requiring reorder |
| **Recent Activity Feed** | Last 20 system events: new signups, payments, equipment reports, etc. |

### 14.4 Admin Dashboard

Includes everything the Manager sees, plus:

| Section | Contents |
|---------|----------|
| **Identity Verification Queue** | Pending documents count, oldest pending age |
| **System Health** | API uptime, error rate (last 24h), storage usage |
| **User Management** | Quick search for any user, recent account changes |
| **Audit Log** | Last 50 system events with actor, action, target, timestamp |
| **Configuration** | Quick links to all system settings |

---

## 15. Module 11 — Notifications & Communication

### 15.1 Notification Channels

| Channel | Supported | Use Cases |
|---------|-----------|-----------|
| In-app (web portal) | Yes (v1) | All notifications |
| Email | Yes (v1) | Registration, verification, reminders, receipts |
| SMS | No (future) | Critical alerts only |
| Push (browser) | No (future) | Real-time alerts |
| WhatsApp | No (future) | Marketing messages |

### 15.2 Notification Events

| Event | Recipient | Channel | Priority |
|-------|-----------|---------|----------|
| Registration complete | Member | Email + In-app | Normal |
| Email verification | Member | Email | High |
| Document approved/rejected | Member | Email + In-app | High |
| Subscription activated | Member | Email + In-app | Normal |
| Subscription expiring (7d, 3d, 0d) | Member | Email + In-app | High |
| Subscription expired (grace) | Member | Email + In-app | Critical |
| Subscription expired (inactive) | Member | Email + In-app | Critical |
| New workout plan generated | Member | In-app | Normal |
| PT session booked | Member + Trainer | Email + In-app | Normal |
| PT session cancelled | Member + Trainer | Email + In-app | High |
| PT session no-show | Member | In-app | High |
| Vitals reminder (14d no entry) | Member | In-app | Low |
| Equipment issue reported | Manager | In-app | Normal |
| Critical equipment issue | Manager | Email + In-app | Critical |
| Staff late arrival | Manager | In-app | Low |
| Low inventory alert | Manager | In-app | Normal |
| Branch early closure | All checked-in users | In-app | Critical |
| Monthly report ready | Manager | Email | Normal |
| Document pending review | Admin | In-app | Normal |
| System error threshold exceeded | Admin | Email | Critical |

### 15.3 Notification Data Model

```sql
notifications (
  id UUID PK,
  user_id UUID FK,
  title VARCHAR(200),
  body TEXT,
  type VARCHAR(50), -- 'subscription_warning', 'session_booked', etc.
  priority ENUM('low', 'normal', 'high', 'critical'),
  action_url VARCHAR(255), -- Deep link within the app
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  created_at TIMESTAMP
)
```

---

## 16. Module 12 — Simulation & Demo Scripts

### 16.1 Purpose

Since the system is a portfolio/demo project without physical hardware, simulation scripts create realistic scenarios for demonstration.

### 16.2 Simulation Scripts

#### 16.2.1 Door Access Simulator

**Script**: `scripts/simulate-door-access.ts`

**Behaviour:**
- Simulates a day at the gym from 5:00 AM to 10:00 PM.
- Generates randomized member check-ins following a realistic pattern:
  - **5:00–7:00 AM**: Early birds (10% of members), predominantly muscle-building goals.
  - **7:00–9:00 AM**: Morning rush (25% of members), mix of goals.
  - **9:00 AM–4:00 PM**: Off-peak (10% of members), retirees, shift workers.
  - **4:00–7:00 PM**: Evening rush (40% of members), the busiest period.
  - **7:00–10:00 PM**: Evening crowd (15% of members), winding down.
- Each member stays for 45–90 minutes (randomized normal distribution).
- Staff clock-ins follow their assigned shift schedules.
- Includes realistic edge cases: 2% of members forget to scan out, 1% trigger subscription warnings.

#### 16.2.2 Vitals Capture Simulator

**Script**: `scripts/simulate-vitals.ts`

**Behaviour:**
- For each demo member, generates 30 days of historical vitals data.
- Weight fluctuates ±0.5 kg day-to-day, with an overall trend matching their goal:
  - Weight loss goal: -2 to -4 kg over 30 days.
  - Muscle gain goal: +0.5 to +1.5 kg over 30 days.
  - General fitness: stable ±1 kg.
- BMI recalculated for each weight entry.
- Resting heart rate improves (decreases) by 2–5 bpm over 30 days for active members.
- Body fat decreases by 0.5–2% for weight loss goals.

#### 16.2.3 Health Connect Simulator

**Script**: `scripts/simulate-health-connect.ts`

**Behaviour:**
- Generates workout session data as if synced from Health Connect.
- Creates entries for: steps walked (3,000–12,000/day), calories burned per session (200–600), exercise type and duration.
- Mimics realistic patterns: no data on rest days, higher calorie burns on leg days.

#### 16.2.4 Full Day Simulator

**Script**: `scripts/simulate-full-day.ts`

**Behaviour:**
- Orchestrates all the above simulators for a complete demo day.
- Creates a realistic "day in the life" of the Kiribathgoda branch:
  1. Staff clock in → Morning members arrive → Trainer conducts PT sessions → Equipment issue reported → New member registers mid-day → Evening rush → Staff clock out → Auto-close open sessions.
- Outputs a summary: total check-ins, revenue collected, new signups, issues reported, sessions conducted.

### 16.3 Demo Data Seeding

**Script**: `scripts/seed-demo-data.ts`

Seeds the database with:
- 1 Admin, 1 Manager, 3 Staff, 4 Trainers
- 50 Members with realistic Sri Lankan names, varying subscription plans
- 10 equipment items across categories
- 20 inventory items
- 6 subscription plans
- 30 days of historical access logs, vitals, and workout logs
- 5 pending identity documents for Admin review

---

## 17. Non-Functional Requirements

### 17.1 Performance

| Metric | Target |
|--------|--------|
| API response time (p95) | < 200ms for reads, < 500ms for writes |
| QR scan validation | < 300ms end-to-end |
| Dashboard initial load | < 2 seconds |
| AI workout generation | < 10 seconds |
| Concurrent users | Support 50 simultaneous users |
| Database query time (p95) | < 100ms |

### 17.2 Reliability

- **Uptime target**: 99.5% (allows ~1.8 hours/month downtime).
- **Data durability**: MySQL with daily automated backups. 30-day backup retention.
- **Graceful degradation**: If the AI service is down, the system falls back to curated workout suggestions. If Oracle Storage is down, document upload returns a user-friendly error with retry guidance.

### 17.3 Scalability

- v1 is designed for a single branch with 50 concurrent users. The architecture (stateless API, connection pooling, indexed queries) supports scaling to 200+ concurrent users with minimal changes.
- Database schema includes `branch_id` foreign keys even though only one branch exists, enabling future multi-branch expansion without schema migration.

### 17.4 Accessibility

- WCAG 2.1 Level AA compliance for all public-facing pages.
- Keyboard navigation support throughout the web portal.
- Minimum contrast ratio of 4.5:1 for all text.
- Screen reader-compatible form labels and error messages.
- QR code also encodable as a text string for accessibility.

### 17.5 Browser Support

| Browser | Minimum Version |
|---------|----------------|
| Chrome | 90+ |
| Firefox | 90+ |
| Safari | 14+ |
| Edge | 90+ |
| Mobile Chrome (Android) | 90+ |
| Mobile Safari (iOS) | 14+ |

### 17.6 Localization

- **v1 language**: English only.
- All user-facing strings stored in translation files (`en.json`) for future i18n.
- Date/time always stored in UTC internally, displayed in Asia/Colombo timezone.
- Currency: LKR, formatted as `Rs. 3,000.00`.

---

## 18. Technical Architecture

### 18.1 System Architecture Diagram

```
┌───────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                           │
│                                                               │
│  ┌─────────────────────┐    ┌──────────────────────────────┐  │
│  │   Next.js Web App   │    │   Simulation CLI Scripts     │  │
│  │   (React 19, TS,    │    │   (TypeScript, Node.js)      │  │
│  │    Tailwind CSS 4)  │    │                              │  │
│  └─────────┬───────────┘    └──────────────┬───────────────┘  │
│            │ HTTPS                          │ HTTP (localhost)  │
└────────────┼────────────────────────────────┼─────────────────┘
             │                                │
             ▼                                ▼
┌───────────────────────────────────────────────────────────────┐
│                        API LAYER                              │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │          Node.js + Express + TypeScript                 │  │
│  │                                                         │  │
│  │  Routes → Controllers → Services → Repositories → DB   │  │
│  │                                                         │  │
│  │  Middleware: Auth (JWT) → Rate Limit → Validation →     │  │
│  │              RBAC → Error Handler → Logger              │  │
│  └─────────────────────────┬───────────────────────────────┘  │
│                            │                                   │
└────────────────────────────┼───────────────────────────────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
          ▼                  ▼                  ▼
┌──────────────────┐ ┌───────────────┐ ┌────────────────────┐
│   MySQL 8.0+     │ │ Oracle Object │ │  External APIs     │
│   (Drizzle ORM)  │ │ Storage       │ │                    │
│                  │ │ (NIC docs)    │ │  - Gemini/LLM API  │
│  - Users         │ │               │ │  - Google Health   │
│  - Members       │ │               │ │    Connect API     │
│  - Subscriptions │ │               │ │  - SMTP (Email)    │
│  - Access Logs   │ │               │ │  - reCAPTCHA       │
│  - Workouts      │ │               │ │                    │
│  - Equipment     │ │               │ │                    │
│  - Inventory     │ │               │ │                    │
│  - Payments      │ │               │ │                    │
│  - Notifications │ │               │ │                    │
│  - Audit Logs    │ │               │ │                    │
└──────────────────┘ └───────────────┘ └────────────────────┘
```

### 18.2 Backend Architecture (Layered)

```
routes/           → Define HTTP endpoints and attach middleware
controllers/      → Parse requests, call services, format responses
services/         → Business logic, orchestration, no DB awareness
repositories/     → Data access layer, Drizzle queries, no business logic
middleware/       → Cross-cutting: auth, RBAC, validation, rate-limit, logging
utils/            → Helpers: date formatting, ID generation, encryption
config/           → Environment variables, constants, feature flags
db/               → Drizzle schema definitions, migration files, connection
validators/       → Joi schemas for request validation
types/            → TypeScript interfaces and type definitions
jobs/             → Cron job definitions (auto-close, reminders, sync)
```

### 18.3 Frontend Architecture

```
src/
├── app/                    → Next.js App Router pages
│   ├── (auth)/             → Public routes: login, register, forgot-password
│   ├── (portal)/           → Authenticated routes
│   │   ├── member/         → Member dashboard, workouts, profile, sessions
│   │   ├── staff/          → Staff dashboard, member lookup, equipment
│   │   ├── trainer/        → Trainer view (extends staff)
│   │   ├── manager/        → Manager dashboard, reports, staff mgmt
│   │   └── admin/          → Admin tools, config, verification queue
│   └── layout.tsx          → Root layout with auth provider
├── components/
│   ├── ui/                 → Reusable primitives (Button, Card, Input, Modal)
│   ├── charts/             → Chart components (Recharts wrappers)
│   ├── forms/              → Form components (registration, vitals, etc.)
│   ├── layouts/            → Sidebar, Navbar, PageHeader
│   └── domain/             → Domain-specific (MemberCard, EquipmentRow, etc.)
├── hooks/                  → Custom React hooks
├── lib/                    → API client (Axios), utils, constants
├── stores/                 → State management (Zustand or Context)
├── types/                  → Shared TypeScript types
└── styles/                 → Global styles, Tailwind config
```

---

## 19. Database Design Principles

### 19.1 Core Principles

1. **UUID primary keys**: All primary keys are UUIDv4 strings. No auto-increment integers (prevents ID enumeration attacks, simplifies merging if multi-branch is added later).
2. **Soft deletes everywhere**: `deleted_at TIMESTAMP DEFAULT NULL`. Records are never physically deleted. Queries filter `WHERE deleted_at IS NULL`.
3. **Audit columns**: Every table has `created_at`, `updated_at`.
4. **Status enums are table-specific**: No shared "status" enum across unrelated entities. `subscription.status` is different from `equipment.status`.
5. **Indexes on foreign keys**: Every FK column has an index. Additionally, indexes on commonly queried columns: `email`, `member_code`, `employee_code`, `phone`.
6. **JSON for flexible data**: Fields like `features`, `metadata`, `plan_data` use MySQL JSON type for schema-flexible storage.
7. **No destructive migrations**: Schema changes are additive. No `DROP TABLE` in migration files. Use `ALTER TABLE` for modifications.
8. **Referential integrity**: All foreign keys have explicit `ON DELETE` rules (mostly `RESTRICT`, with `CASCADE` only for child records that are meaningless without the parent).

### 19.2 Table Summary

| Category | Tables |
|----------|--------|
| Core Auth | users, permissions, role_permissions, refresh_tokens |
| Profiles | members, staff, trainers, branches |
| Documents | member_documents |
| Health | member_metrics, health_connect_sync_log |
| Access | access_logs, visit_sessions, gates, zones |
| Subscriptions | subscription_plans, subscriptions, subscription_freezes |
| Payments | payments, refunds |
| Workouts | workout_plans, workout_exercises, workout_logs |
| Training | trainer_availability, training_sessions, session_notes |
| Equipment | equipment, equipment_issues, maintenance_logs |
| Inventory | inventory_items, inventory_transactions |
| Scheduling | staff_shifts, shift_overrides, branch_hours, branch_closures |
| Communication | notifications, email_templates, announcement_banners |
| System | audit_logs, system_config, cron_job_runs |

**Estimated total: ~35 tables** (up from the current 25, adding shift management, inventory, session notes, Health Connect sync, audit logs, and configuration tables).

---

## 20. API Design Principles

### 20.1 RESTful Conventions

- **Base URL**: `/api/v1/`
- **Versioning**: URL path versioning (`/api/v1/`, `/api/v2/`). No breaking changes within a version.
- **HTTP Methods**: GET (read), POST (create), PUT (full update), PATCH (partial update), DELETE (soft delete).
- **Status Codes**: 200 (OK), 201 (Created), 204 (No Content), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 409 (Conflict), 422 (Validation Error), 429 (Rate Limited), 500 (Internal Error).

### 20.2 Response Format

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

Error response:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request body contains invalid data.",
    "details": [
      { "field": "email", "message": "Must be a valid email address" }
    ]
  }
}
```

### 20.3 Key API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /auth/register | Member registration | Public |
| POST | /auth/login | Login (returns JWT) | Public |
| POST | /auth/refresh | Refresh access token | Refresh token |
| POST | /auth/forgot-password | Start password reset | Public |
| POST | /auth/reset-password | Complete password reset | Token |
| POST | /access/scan | QR scan processing | System (API key) |
| GET | /access/occupancy | Current branch occupancy | Staff+ |
| GET | /members | List members (paginated) | Staff+ |
| GET | /members/:id | Get member profile | Staff+ (or self) |
| PATCH | /members/:id | Update member profile | Self or Admin |
| POST | /members/:id/documents | Upload identity document | Self |
| PATCH | /members/:id/documents/:docId/review | Approve/reject document | Admin |
| GET | /members/:id/metrics | Get vitals history | Self or Trainer (assigned) |
| POST | /members/:id/metrics | Record new vitals | Self or Trainer |
| GET | /subscriptions/plans | List available plans | Public |
| POST | /subscriptions | Create subscription | Staff+ |
| PATCH | /subscriptions/:id/freeze | Freeze subscription | Self or Staff+ |
| POST | /payments | Record payment | Staff+ |
| GET | /workouts/plans | List workout plans | Self |
| POST | /workouts/plans/generate | Generate AI workout plan | Self or Trainer |
| POST | /workouts/logs | Log a completed workout | Self |
| GET | /trainers | List trainers with availability | Member+ |
| GET | /trainers/:id/availability | Get trainer calendar | Member+ |
| POST | /training-sessions | Book a PT session | Member |
| PATCH | /training-sessions/:id | Update session status | Trainer |
| GET | /equipment | List all equipment | Staff+ |
| POST | /equipment/:id/issues | Report equipment issue | Staff+ |
| POST | /equipment/:id/maintenance | Log maintenance | Staff+ |
| GET | /inventory | List inventory items | Staff+ |
| PATCH | /inventory/:id | Update stock | Staff+ |
| GET | /staff/shifts | Get shift schedule | Staff+ |
| GET | /staff/:id/attendance | Get attendance report | Self or Manager+ |
| GET | /dashboard/:role | Get role-specific dashboard data | Role-matched |
| GET | /reports/:type | Generate report | Manager+ |
| GET | /audit-logs | View audit logs | Admin |
| PATCH | /system/config | Update system config | Admin |
| GET | /notifications | Get user's notifications | Any authenticated |
| PATCH | /notifications/:id/read | Mark notification as read | Self |

### 20.4 Pagination

All list endpoints support consistent pagination:
- `page` (default 1)
- `limit` (default 20, max 100)
- `sort` (field name, default varies by endpoint)
- `order` (`asc` or `desc`, default `desc`)
- `search` (free text search, applies to relevant fields)
- `filter[field]` (e.g., `filter[status]=active`, `filter[role]=trainer`)

### 20.5 Rate Limiting

| Endpoint Group | Rate Limit |
|----------------|------------|
| /auth/* | 10 requests/minute per IP |
| /access/scan | 30 requests/minute per device |
| /workouts/plans/generate | 5 requests/hour per user |
| All other authenticated | 100 requests/minute per user |
| All other public | 30 requests/minute per IP |

Rate limiting implemented via Redis (or in-memory for v1 with sticky sessions).

---

## 21. Security Architecture

### 21.1 Authentication Security

- Passwords hashed with **bcrypt** (cost factor 12).
- JWT secrets: Separate secrets for access tokens and refresh tokens. Minimum 256-bit random strings. **Never hardcoded** — sourced from environment variables.
- Refresh tokens stored in DB, hashed (SHA-256). On rotation, old token is invalidated.
- CSRF protection: SameSite=Strict cookies + custom header check.
- Brute-force protection: Account locked after 5 failed login attempts for 15 minutes. IP-based rate limiting on auth endpoints.

### 21.2 Authorization Security

- **RBAC middleware**: Every authenticated route checks `req.user.role` against the allowed roles for that endpoint.
- **Resource ownership**: Members can only access their own data. Trainers can only access their assigned members' data.
- **No client-side trust**: All authorization checks happen server-side. Frontend role checks are UX enhancements only; the API enforces all rules.

### 21.3 Data Security

- **Encryption at rest**: Oracle Object Storage provides server-side encryption for NIC documents.
- **Encryption in transit**: All communication over HTTPS (TLS 1.2+). HSTS header enabled.
- **PII handling**: Member addresses, phone numbers, and NIC numbers are never logged. Winston logger strips PII from log entries.
- **SQL injection prevention**: Parameterized queries via Drizzle ORM. No raw string concatenation in queries.
- **XSS prevention**: Next.js auto-escapes rendering. Content-Security-Policy header configured.
- **Environment variables**: All secrets in `.env` file, gitignored. `.env.example` contains placeholder values only.

### 21.4 Audit Trail

Every state-changing action creates an audit log entry:

```sql
audit_logs (
  id UUID PK,
  actor_id UUID FK, -- Who did it
  action VARCHAR(100), -- e.g., 'member.subscription.created'
  target_type VARCHAR(50), -- e.g., 'subscription'
  target_id UUID, -- The affected record's ID
  changes JSON, -- { before: {...}, after: {...} }
  ip_address VARCHAR(45),
  user_agent VARCHAR(255),
  created_at TIMESTAMP
)
```

Audit logs are **append-only**. No update or delete operations on this table. Admin can view and export them. Retention: Indefinite.

---

## 22. Implementation Phases

### Phase 1 — Foundation (Estimated: 3–4 weeks)

**Goal**: Establish the complete groundwork — database schema, auth system, role-based dashboards, QR access, basic member and staff management.

| # | Task | Deliverable |
|---|------|-------------|
| 1.1 | Database schema creation | Complete MySQL schema (~35 tables) with Drizzle ORM definitions |
| 1.2 | Auth system | Registration, login, JWT access/refresh tokens, password reset, email verification |
| 1.3 | RBAC middleware | Role-based access control on all routes |
| 1.4 | QR code generation | User QR generation, display on frontend, regeneration |
| 1.5 | QR scan processing | Scan endpoint with full validation flow (direction, subscription, hours) |
| 1.6 | Frontend layouts | Next.js app with Sidebar, Navbar, route groups per role |
| 1.7 | Member dashboard (basic) | QR display, subscription status, recent visits |
| 1.8 | Staff dashboard (basic) | Clock status, members present, basic stats |
| 1.9 | Manager dashboard (basic) | Revenue today, member count, staff attendance |
| 1.10 | Admin dashboard (basic) | System health, user management list, config page |
| 1.11 | Demo data seeder | Script to populate all tables with realistic data |
| 1.12 | Basic simulation | Door access simulator |

### Phase 2 — Core Features (Estimated: 4–5 weeks)

**Goal**: Build out the internal workflows — onboarding, vitals, workout plans, trainer management, equipment tracking, payments.

| # | Task | Deliverable |
|---|------|-------------|
| 2.1 | Member registration wizard | 4-step flow with validation and NIC upload |
| 2.2 | Oracle Object Storage integration | Upload, retrieve (pre-signed URLs), delete NIC documents |
| 2.3 | Identity verification queue | Admin review interface with approve/reject workflow |
| 2.4 | Subscription management | Plan CRUD (Admin), purchase flow, freeze/unfreeze, grace period |
| 2.5 | Payment recording | Staff payment entry, payment history, basic receipts |
| 2.6 | Vitals collection | Onboarding form, vitals history, trend charts |
| 2.7 | AI workout generation | LLM integration, prompt construction, plan storage |
| 2.8 | Curated workout library | Admin/Trainer plan creation, member plan selection |
| 2.9 | Workout tracking | Member exercise logging, session completion, mood tracking |
| 2.10 | Trainer availability | Calendar management, slot booking, conflict prevention |
| 2.11 | Personal training sessions | Booking, status lifecycle, notes, no-show handling |
| 2.12 | Equipment registry | CRUD, issue reporting, maintenance logging |
| 2.13 | Staff shift management | Shift creation, assignment, overtime calculation |
| 2.14 | Notification system | In-app + email notifications for all events |
| 2.15 | Full simulation suite | Vitals, Health Connect, full-day simulators |

### Phase 3 — Polish & Complete (Estimated: 3–4 weeks)

**Goal**: End-to-end integration, advanced features, reporting, optimization, testing.

| # | Task | Deliverable |
|---|------|-------------|
| 3.1 | Google Health Connect integration | OAuth flow, data sync, conflict resolution |
| 3.2 | Inventory management | CRUD, stock tracking, low-stock alerts, sales recording |
| 3.3 | Reporting engine | Monthly revenue, retention, attendance, equipment cost reports |
| 3.4 | Manager analytics | Advanced charts, heatmaps, trend analysis |
| 3.5 | Audit log system | Comprehensive event logging, admin viewer, export |
| 3.6 | Advanced notifications | Subscription renewal sequences, trainer reminders, session follow-ups |
| 3.7 | Performance optimization | Query optimization, caching (Redis or in-memory), lazy loading |
| 3.8 | Security hardening | Penetration testing checklist, CORS, CSP, rate limit tuning |
| 3.9 | Error handling & logging | Global error handler, structured logging, error monitoring |
| 3.10 | Responsive design polish | Mobile-first review of all pages, touch-friendly interactions |
| 3.11 | End-to-end testing | Cypress or Playwright tests for critical flows |
| 3.12 | Documentation | API docs (Swagger/OpenAPI), README, deployment guide |

---

## 23. Risk Register

| # | Risk | Probability | Impact | Mitigation |
|---|------|------------|--------|------------|
| R1 | Oracle Object Storage credentials not available | Medium | High (blocks document upload) | Use local filesystem fallback in dev; abstract storage behind an interface |
| R2 | LLM API rate limits or downtime | Medium | Medium (workout generation fails) | Cache generated plans; fall back to curated library |
| R3 | Google Health Connect API changes | Low | Medium (broken sync) | Abstract behind adapter pattern; comprehensive error handling |
| R4 | Database schema changes during development | High | Medium (migration conflicts) | Use Drizzle migrations from Day 1; never edit production schema directly |
| R5 | Subscription plan pricing not confirmed | High | Low (use estimates, easy to update) | Design plan management as fully dynamic (Admin-configurable). Seed with estimates. |
| R6 | Concurrent QR scan race condition | Medium | High (double entry) | Database-level unique constraint on session + user + time window; DB transactions |
| R7 | Scope creep from multi-branch features | Medium | High (delays v1) | Strict single-branch scope. branch_id fields exist but no multi-branch logic |
| R8 | Performance under load (50+ concurrent) | Low | Medium | Connection pooling, query optimization, load testing before demo |

---

## 24. Glossary

| Term | Definition |
|------|-----------|
| **QR Code** | Quick Response code — 2D barcode containing encoded user identity data |
| **NIC** | National Identity Card — Sri Lankan government-issued identification |
| **LKR** | Sri Lankan Rupee — the national currency |
| **Poya Day** | Full-moon day observed as a public holiday in Sri Lanka (Buddhist observance) |
| **PT** | Personal Training — one-on-one session with a trainer |
| **RAG** | Retrieval-Augmented Generation — AI technique combining document retrieval with LLM generation |
| **MET** | Metabolic Equivalent of Task — measure of exercise intensity (1 MET = resting energy expenditure) |
| **Grace Period** | Number of days after subscription expiry where entry is still allowed with a warning |
| **Freeze** | Temporary suspension of a subscription that pauses the countdown |
| **Visit Session** | A paired check-in and check-out event representing one gym visit |
| **Occupancy** | The count of people currently inside the gym (checked in but not checked out) |
| **Churn** | Members whose subscriptions expire and are not renewed within 30 days |
| **Retention Rate** | Percentage of members who renew their subscription upon expiry |

---

## Document End

**Next step**: Review this document, confirm or adjust subscription plan pricing, and approve to begin Phase 1 implementation.

**Prepared by**: GitHub Copilot (AI Assistant)  
**Reviewed by**: _[Pending client review]_
