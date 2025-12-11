# Backend Architecture Overview

## 1. High-Level Topology

- **Entry point (`server.js`)** wires Express, loads env vars, initializes the database (Sequelize), registers global middlewares, then mounts routers under `/api`.
- **Layering** (outside-in): Routes → Controllers → Services → Repositories → Models (Sequelize) / DB.
- **Cross-cutting**: Validation, authentication, authorization, logging, event emitters live in `middlewares/` & `utils/`.

```
Client → Routes → Controllers → Services → Repositories → Sequelize Models → PostgreSQL
                                 ↓
                           Notifications / Jobs
```

## 2. Folder Responsibilities

| Folder             | Responsibility                                                                                                                     |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| `src/config`       | Environment loading, database connection (`Sequelize`), app-level constants.                                                       |
| `src/models`       | Sequelize models + association wiring. Mirrors DB schema (auth, patients, prescriptions, notifications, legal).                    |
| `src/repositories` | Thin data-access wrappers encapsulating query logic per aggregate (e.g., `UserRepository`). Use transactions supplied by services. |
| `src/services`     | Business logic orchestrating repositories, adapters (notifications, storage). enforce RBAC & invariants.                           |
| `src/controllers`  | HTTP adapters: parse/validate request, call services, shape responses, map errors.                                                 |
| `src/routes`       | Express routers grouped by domain (`auth.routes.js`, `patients.routes.js`, ...). Attach validators & middlewares.                  |
| `src/middlewares`  | Global/auth middlewares (JWT verification, role guard, error handler, rate limiting).                                              |
| `src/utils`        | Shared helpers (logger, crypto, pagination, timezones, schema validators).                                                         |

## 3. Database & ORM Strategy

- **PostgreSQL** with `pgcrypto` extension enabled for `gen_random_uuid()`. Run once: `CREATE EXTENSION IF NOT EXISTS "pgcrypto";`.
- **Sequelize** chosen for mature Postgres support, migrations, and associations.
- **Model conventions**:
  - `underscored: true`, keep snake_case columns.
  - `timestamps: false` (tables already store `created_at`/`updated_at`).
  - UUID PKs via `defaultValue: DataTypes.UUIDV4` to match `gen_random_uuid()`.
  - Enumerations enforced with `validate: { isIn: [...] }` where appropriate.
  - JSONB columns mapped with `DataTypes.JSONB`.
- **Associations** set in `src/models/index.js` so services can import a single object and avoid circular dependencies.

## 4. Cross-Cutting Concerns

- **Authentication & RBAC**: JWT strategy in `middlewares/isAuth.js`; `services/auth.service.js` handles login & self-service registration (defaulting new accounts to role code `USER`); `RoleGuard` will check `req.user.role.code`.
- **Validation**: Use `celebrate`/`Joi` (or `zod`) in `routes` before controllers. Central error handler normalizes messages.
- **Auditing**: Services touching legal or critical tables emit audit events to a queue/log (placeholder `utils/auditLogger`).
- **Notifications**: Dedicated `NotificationService` dispatches push/email using `notification_preferences` and `push_devices` data. Background workers can live in `jobs/` later.
- **Scheduling**: Medication reminders derived from `medication_regimens.schedule_payload`; consider BullMQ/Temporal for durable scheduling.

## 5. Startup Flow

1. Load `.env` via `src/config/env.js`.
2. Initialize Sequelize (`src/config/database.js`).
3. Import and sync models via `src/models/index.js` (disable `sync` outside dev if migrations preferred).
4. Bootstrap Express app, register middlewares, mount routers.
5. Start HTTP server & attach gracefull shutdown hooks (close DB, flush queues).

## 6. Next Steps Before Feature Work

1. Add `src/routes/*.js` skeletons with versioned router (`/api/v1`).
2. Implement `src/middlewares/errorHandler.js` plus role-based guards/rate limiting.
3. Create repositories/services per aggregate (Users, PatientProfiles, Prescriptions, Notifications, Legal).
4. Add migration scripts (Sequelize CLI or `umzug`) mirroring provided SQL to keep schema in source control.
5. Wire tests (Jest + supertest) for core flows (auth, patient profile CRUD, regimen tracking).

## 7. Auth API (MVP)

- **Env vars**: set `JWT_SECRET`, `JWT_EXPIRES_IN` (e.g., `1h`), and optional `BCRYPT_SALT_ROUNDS` (default `10`).
- **POST `/api/v1/auth/login`**
  - Body: `{ "email": string, "password": string }`.
  - Response: `{ "user": { ... }, "token": "<jwt>" }` where `user` excludes `password_hash` and includes `role` association when present.
  - Errors: `400` when fields missing, `401` on invalid credentials, `403` when status = `disabled`.
- **POST `/api/v1/auth/register`**
  - Body: `{ "email": string, "password": string, "full_name": string, "phone_number"?: string }`.
  - Behavior: email normalized to lowercase, password hashed via bcrypt, role defaults to code `USER` (must exist in `roles` table).
  - Response: `201` with `{ "user": { ... }, "token": "<jwt>" }` so clients can treat registration as an immediate login.
  - Errors: `400` for missing fields, `409` if email already exists, `500` if default role missing (seed roles first).
- **Middleware `isAuth`** parses `Authorization: Bearer <token>`, validates via JWT, loads the user + role, rejects disabled users, and injects `req.user` + `req.auth` for downstream handlers.

This document guides the model scaffolding + service layering the user requested. Update it as domain logic evolves.
