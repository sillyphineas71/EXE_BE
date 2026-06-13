# CareDose — Medication Management & Reminder API

Backend for **CareDose**, a mobile app that helps people manage medications for
themselves and their family — tracking prescriptions, scheduling dose reminders,
logging intake, and sending push notifications when it's time to take a medicine.

This repository contains the **REST API** and the **reminder engine**, deployed on
AWS with a **serverless API + containerized worker** architecture.

> 📱 Mobile client (React Native / Expo) lives in a separate repository.

---

## Tech Stack

| Area | Technology |
|------|------------|
| Runtime / Framework | Node.js, Express 5 |
| Database | PostgreSQL + Sequelize (ORM), UUID primary keys |
| Queue & Scheduling | Bull (Redis-backed) + node-cron |
| Auth | JWT + bcrypt, role-based access control (RBAC) |
| Push Notifications | Firebase Admin (FCM) |
| Email | Nodemailer |
| PDF Export | Custom profile-PDF builder |
| Serverless API | `serverless-http` on **AWS Lambda** |
| Worker | Docker container on **AWS ECS** |

---

## Architecture

```
            Mobile App (Expo)
                  │  HTTPS · JWT
                  ▼
          ┌─────────────────┐
          │   AWS Lambda    │  serverless-http  ┌──────────────┐
          │   (REST API)    │ ────────────────► │  PostgreSQL  │
          └────────┬────────┘                   └──────────────┘
                   │ enqueue
                   ▼
            ┌─────────────┐   Redis (Bull queue: "medication-reminders")
            │    Redis    │ ◄──────────────────────────────────┐
            └──────┬──────┘                                    │
                   │ consume                                   │ enqueue
                   ▼                                           │
          ┌─────────────────┐   daily cron scans active   ┌────┴─────────┐
          │   AWS ECS       │   medication regimens  ◄──── │  node-cron   │
          │ (worker + cron) │ ──► Firebase Cloud Messaging └──────────────┘
          └─────────────────┘        (push reminders)
```

The system is split into **two deployment units**:

1. **API — AWS Lambda.** The Express app is wrapped with `serverless-http`
   (`lambda.js`). The handler caches the database connection across warm
   invocations (`ensureDbConnected`) so the connection pool isn't re-opened on
   every request, and normalizes request bodies that arrive as a `Buffer`/string
   from the Lambda Function URL before they reach the JSON parser.

2. **Reminder worker — AWS ECS.** A long-running container
   (`worker.js` / `Dockerfile.worker`) runs the daily cron job and the Bull queue
   processor. The cron scans active medication regimens (timezone-aware,
   `Asia/Ho_Chi_Minh`) and schedules reminders; the worker consumes the queue and
   delivers push notifications via FCM at each dose time.

This keeps the request/response API **serverless and cheap to run**, while the
always-on scheduling work lives where long-running processes belong.

> **Cost note:** the reminder worker is the only always-on component. Depending on
> scale and budget it can run on ECS, be consolidated onto a small EC2 instance, or
> be refactored into an **EventBridge-scheduled Lambda** — the daily scan maps
> cleanly to a once-a-day scheduled invocation.

---

## Features

- 🔐 Authentication & RBAC (roles, JWT, bcrypt)
- 👤 Patient profiles (self + family) with sharing roles (owner / caregiver / viewer)
- 💊 Prescriptions, prescription items & uploaded prescription files
- 🧪 Drug catalog, substances & drug-interaction / medication-safety checks
- 📅 Medication regimens with scheduled dose reminders
- ✅ Intake logging (taken / missed events)
- 📝 Symptom journal with symptom–medication links
- 🔔 Push-device registration, notifications & per-user notification preferences
- 📄 Legal documents & user consent tracking
- 🖨️ Patient-profile export to PDF & profile sharing

---

## Project Structure

```
.
├── lambda.js            # AWS Lambda handler (serverless-http)
├── app.js               # Express app (serverless body normalization + DB warm-cache)
├── server.js            # Local entry point
├── worker.js            # ECS worker entry (cron + queue processor)
├── Dockerfile.worker    # Container image for the ECS worker
└── src/
    ├── config/          # database, redis, firebase, env
    ├── routes/          # /api/v1/* route definitions
    ├── controllers/     # request handlers
    ├── services/        # business logic
    ├── models/          # Sequelize models (UUID PKs)
    ├── middlewares/     # auth, error handling
    ├── queues/          # Bull queue (medication-reminders)
    ├── workers/         # queue job processors
    ├── cron/            # daily regimen scan
    └── utils/           # PDF builder, helpers
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL
- Redis (required by the reminder queue / worker)

### Install
```bash
npm install
```

### Environment
Create a `.env` in the project root (never commit it — it's git-ignored):

```dotenv
PORT=3000

# Database
DB_HOST=your-postgres-host
DB_PORT=5432
DB_NAME=caredose
DB_USER=postgres
DB_PASSWORD=your-password
DB_SSL=true

# Auth
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=1h

# Redis (Bull queue)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=

# Email (Nodemailer)
EMAIL_USER=your@email.com
EMAIL_PASSWORD=your-app-password

# Firebase Admin (service account)
FB_PROJECT_ID=...
FB_CLIENT_EMAIL=...
FB_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
# (plus the remaining FB_* fields from the service account)
```

### Run locally
```bash
# API (development, with auto-reload)
npm start            # nodemon server.js

# Run the reminder worker separately
node worker.js
```

### Deploy
- **API** → packaged and deployed to **AWS Lambda**; entry point `lambda.js`
  (exported `handler`). All routes are served under the `/api/v1` base path.
- **Worker** → built from `Dockerfile.worker` and run as an **AWS ECS** service.

---

## API Overview

All endpoints are mounted under **`/api/v1`**, for example:

```
/api/v1/auth                 # register / login
/api/v1/users                # user management
/api/v1/patient-profiles     # patient profiles + sharing
/api/v1/prescriptions        # prescriptions & items
/api/v1/regimens             # medication regimens (dose schedules)
/api/v1/intake               # intake (taken / missed) events
/api/v1/symptoms             # symptom journal
/api/v1/push-devices         # device registration for push
/api/v1/notifications        # notifications + preferences
/api/v1/legal-documents      # legal documents & acceptances
```

---

## Status

Built as a course capstone project. The iOS build was distributed to testers via
**TestFlight**; the Android client is built with **EAS Build**.
