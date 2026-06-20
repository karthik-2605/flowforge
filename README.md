# ⚡ FlowForge

> A distributed job scheduling & workflow orchestration platform — schedule recurring jobs with cron, run them on a horizontally-scalable worker fleet, and watch every execution in real time.

FlowForge lets you define jobs (email, webhook, report, data-sync), schedule them with standard cron expressions, and dispatch them onto a BullMQ-backed worker pool running on Redis. Every run is recorded, every worker reports a heartbeat, and completion/failure events flow through Redis Pub/Sub into a live notification feed and analytics dashboard.

---

## ✨ Features

- **JWT authentication** — register/login with bcrypt-hashed passwords and 7-day signed tokens; every `/api` route (except auth and health) is protected by a Bearer-token middleware.
- **Cron recurring jobs** — schedule jobs with standard cron expressions, backed by BullMQ repeatable jobs. A live cron preview endpoint shows the next 5 run times.
- **4 job types** — pluggable execution strategies for `email`, `webhook`, `report`, and `data_sync`.
- **Full job lifecycle** — create, update, **pause / resume / delete**, and **retry** failed executions, governed by a state machine of valid status transitions.
- **Execution history** — every run is persisted with status, start/end timestamps, duration, attempt number, and error message.
- **Worker monitoring & heartbeats** — workers self-register, emit a heartbeat every 10s, and report `idle` / `busy` / `offline` status plus a processed-jobs counter.
- **Redis Pub/Sub notifications** — workers publish `job_completed` / `job_failed` events to a `job-events` channel; a subscriber persists them into a per-user notification feed.
- **Dashboard analytics** — aggregate job/execution stats, 24-hour success rate, live queue depth, recent activity, and hourly trend data for charts.
- **Dockerized** — one command brings up the full stack (web, API, Postgres, Redis).
- **CI** — GitHub Actions pipeline for lint and build.

---

## 🧰 Tech Stack

### Backend
| Concern | Technology |
| --- | --- |
| Runtime / framework | Node.js, **Express 5** |
| Database | **PostgreSQL** (`pg`) |
| Queue / scheduling | **Redis** + **BullMQ**, `ioredis`, `croner` / `node-cron` |
| Auth | `jsonwebtoken` (JWT), `bcryptjs` |
| Validation / security | `joi`, `helmet`, `cors`, `morgan` |

### Frontend
| Concern | Technology |
| --- | --- |
| Framework | **React 19** + **Vite** |
| Styling | **TailwindCSS**, **shadcn/ui** (Radix UI primitives) |
| Charts / motion | **Recharts**, **Framer Motion** |
| Data / routing | **Axios**, **React Router** |

### Infrastructure
- **Docker Compose** for local and full-stack runs
- **GitHub Actions** for CI

---

## 🏗️ Architecture

```
                 ┌──────────────────────────────────────────────┐
                 │                  Browser                       │
                 │   React 19 + Vite SPA (Tailwind / shadcn)      │
                 └───────────────────────┬──────────────────────┘
                                         │  HTTP / JSON (Axios)
                                         ▼
                 ┌──────────────────────────────────────────────┐
                 │              Express API (port 4000)           │
                 │   routes → services → repositories             │
                 │   JWT auth middleware · responseHelper         │
                 └───────────┬───────────────────────┬──────────┘
                             │                        │
              schedule jobs  │                        │ read / write
                             ▼                        ▼
              ┌─────────────────────────┐   ┌────────────────────────┐
              │  Scheduler (BullMQ Queue)│   │     PostgreSQL          │
              │  repeatable + delayed     │   │  users · jobs ·         │
              └────────────┬─────────────┘   │  executions · workers · │
                           │                  │  notifications          │
                           ▼                  └────────────▲───────────┘
              ┌─────────────────────────┐                  │
              │          Redis           │                  │ record run
              │  BullMQ queue · Pub/Sub   │                  │
              └────────────┬─────────────┘                  │
                           │ consume                         │
                           ▼                                 │
              ┌─────────────────────────┐                   │
              │   Worker (BullMQ Worker) │───────────────────┘
              │  Strategy per job type   │
              │  concurrency 5 · heartbeat│
              └────────────┬─────────────┘
                           │ publish 'job-events'
                           ▼
              ┌─────────────────────────┐
              │  Notification subscriber │──► persists notifications
              └─────────────────────────┘
```

**Data flow.** The React SPA calls the Express API over JSON. When a job is created, the **job service** writes it to PostgreSQL and hands it to the **scheduler**, which adds it to the BullMQ **queue** in Redis (as a repeatable job if it has a cron expression, otherwise immediate). A **worker** consumes the queue, selects the right **strategy** for the job type, executes it, and records an `executions` row (running → success/failed). On completion or failure the worker **publishes** an event to the Redis `job-events` channel; the **notification subscriber** picks it up and persists a notification. The dashboard reads aggregate stats from PostgreSQL and live queue depth from BullMQ.

> See **[ARCHITECTURE.md](./ARCHITECTURE.md)** for a layer-by-layer breakdown and the full job lifecycle.

---

## 🚀 Quick Start

You need **Docker** (for either mode). For the local mode you also need **Node.js 18+**.

### (a) Run with Docker Compose

Brings up the full stack — frontend, API, PostgreSQL, and Redis. Migrations run automatically on API startup.

```bash
docker compose up --build
```

Then open the app:

```
http://localhost:3000
```

### (b) Run locally

Start only the infrastructure (PostgreSQL + Redis) in Docker, and run the apps on your host with hot reload.

```bash
# 1. Infrastructure (Postgres + Redis)
docker compose -f docker-compose.dev.yml up -d

# 2. Backend API (Express on port 4000)
cd backend
npm install
npm run migrate      # apply DB migrations
npm run dev          # nodemon

# 3. Frontend (Vite dev server on port 5173)
cd frontend
npm install
npm run dev
```

Then open the Vite dev server:

```
http://localhost:5173
```

### Environment variables

The backend reads configuration from environment variables (via `dotenv`):

| Variable | Description | Default |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL connection string | _required_ |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `JWT_SECRET` | Secret used to sign/verify JWTs | _required_ |
| `PORT` | API listen port | `4000` |
| `RUN_MIGRATIONS` | Set to `false` to skip auto-migrate on startup | `true` |

> **Note:** the backend defaults to **port 4000**.

---

## 📖 API Documentation

A complete endpoint reference — grouped by resource, with auth requirements, request/response examples, and the response-wrapper conventions — lives in **[API.md](./API.md)**.

Quick orientation:
- All `/api` routes require a `Bearer <JWT>` header **except** `POST /api/auth/register`, `POST /api/auth/login`, and `GET /api/health/*`.
- Auth, jobs, workers, dashboard, and notifications responses use the `{ success, data }` wrapper.
- Executions and health endpoints return raw JSON.

---

## 🧩 Design Patterns

| Pattern | Where it lives | Why |
| --- | --- | --- |
| **Singleton** | `config/database.js`, `config/redis.js` | One shared PostgreSQL pool and one Redis client, lazily created and reused everywhere. |
| **Repository** | `repositories/*.repository.js` | Isolates all SQL behind a data-access API so services never write queries inline. |
| **Strategy** | `workers/strategies/*.strategy.js` | Each job type (`email`, `webhook`, `report`, `data_sync`) has its own `execute()` implementation behind a common `BaseStrategy` interface. |
| **Factory** | `workers/workerRegistry.js` | `getStrategy(jobType)` constructs the correct strategy instance for a job type. |
| **Observer** | worker `publishEvent` → Redis `job-events` channel → `services/notification.service.js` subscriber | Decouples job execution from notification side-effects via Pub/Sub. |
| **State** | `services/job.service.js` (`VALID_TRANSITIONS`) | Enforces legal job status transitions: `active ↔ paused`, and either → `deleted`. |

---

## 📂 Project Structure

```
flowforge/
├── backend/
│   └── src/
│       ├── index.js                # Express app bootstrap + startup sequence
│       ├── config/                 # database & redis singletons
│       ├── controllers/            # auth controller
│       ├── middleware/             # JWT auth middleware
│       ├── routes/                 # auth, jobs, executions, workers,
│       │                           #   dashboard, notifications, health
│       ├── services/               # business logic (auth, job, dashboard,
│       │                           #   worker, notification)
│       ├── repositories/           # SQL data access (user, job, execution,
│       │                           #   worker, notification)
│       ├── scheduler/              # BullMQ queue, scheduler, queue events
│       ├── workers/
│       │   ├── job.worker.js        # BullMQ worker + heartbeat
│       │   ├── workerRegistry.js    # strategy factory
│       │   └── strategies/          # email · webhook · report · data_sync
│       ├── utilities/              # responseHelper, cronParser
│       └── db/
│           ├── migrate.js
│           └── migrations/          # 000–008 SQL migrations
└── frontend/
    └── src/
        ├── App.jsx                 # routes (login, register, dashboard,
        │                           #   jobs, job detail, workers, notifications)
        ├── pages/                  # one component per route
        ├── components/             # dashboard, jobs, workers, layout, ui
        ├── context/                # AuthContext, NotificationContext
        ├── api/                    # Axios clients per resource
        ├── hooks/ · lib/ · utils/
        └── main.jsx
```

---

## 🗺️ Roadmap

FlowForge was built as a **20-day project**, layered up incrementally: authentication → jobs CRUD → execution tracking → BullMQ worker integration → recurring jobs & executions API → strategy/factory worker design → observer-based notifications → dashboard analytics & worker monitoring.

Future directions: multi-tenant RBAC, per-job concurrency limits, dead-letter inspection UI, alerting integrations, and distributed multi-node worker autoscaling.
