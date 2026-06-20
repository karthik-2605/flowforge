# FlowForge — Architecture

FlowForge is a distributed job scheduling and workflow orchestration platform. It is organised as a layered backend (Express → services → repositories → PostgreSQL) with an asynchronous execution plane (BullMQ on Redis → worker fleet) and a React SPA on top. This document describes each layer, the end-to-end job lifecycle, where each design pattern lives and why, and how Redis is used throughout.

---

## Layered diagram

```
┌────────────────────────────────────────────────────────────────────┐
│  PRESENTATION                                                         │
│  React 19 + Vite SPA — pages, Axios clients, Auth/Notification ctx   │
└───────────────────────────────┬────────────────────────────────────┘
                                │  HTTP / JSON, Bearer JWT
                                ▼
┌────────────────────────────────────────────────────────────────────┐
│  API GATEWAY  (Express 5, port 4000)                                 │
│  helmet · cors · morgan · express.json                              │
│  routes/*  →  middleware/auth (JWT)  →  utilities/responseHelper     │
└───────────────────────────────┬────────────────────────────────────┘
                                ▼
┌────────────────────────────────────────────────────────────────────┐
│  SERVICE LAYER  (services/*)                                         │
│  auth · job (state machine) · dashboard · worker · notification     │
└──────────────┬──────────────────────────────┬──────────────────────┘
              │ schedule                       │ persist / query
              ▼                                ▼
┌──────────────────────────┐      ┌────────────────────────────────────┐
│  SCHEDULER (BullMQ Queue) │      │  REPOSITORY LAYER (repositories/*) │
│  scheduler.js · queue.js  │      │  user · job · execution · worker · │
│  events.js (QueueEvents)  │      │  notification  (all SQL lives here)│
└─────────────┬────────────┘      └──────────────────┬─────────────────┘
              ▼                                       ▼
┌──────────────────────────┐      ┌────────────────────────────────────┐
│  REDIS                    │      │  POSTGRESQL                        │
│  • BullMQ queue 'job-queue'│      │  users · jobs · executions ·       │
│  • repeatable / delayed    │      │  workers · notifications           │
│  • Pub/Sub 'job-events'    │      └──────────────────▲─────────────────┘
└─────────────┬────────────┘                          │ record runs,
              │ consume                                │ heartbeats
              ▼                                        │
┌────────────────────────────────────────────────────┴───────────────┐
│  WORKER PLANE  (workers/job.worker.js, concurrency 5)               │
│  workerRegistry (factory) → strategies/* (email·webhook·report·sync)│
│  publishes 'job-events' ──► notification subscriber persists rows    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Layer responsibilities

### API gateway (`backend/src/index.js`, `routes/`, `middleware/`)
Express 5 application. On startup it: (1) runs migrations (unless `RUN_MIGRATIONS=false`), (2) re-registers persisted recurring jobs, (3) starts the notification Pub/Sub subscriber, and (4) requires `workers/job.worker.js`, which boots the in-process BullMQ worker. Global middleware is `helmet`, `cors`, `express.json`, and `morgan`. Each resource mounts a router under `/api/*`; every router except auth and health applies `middleware/auth`, which verifies the `Bearer` JWT and sets `req.user = { userId, email }`. Responses are shaped by `utilities/responseHelper` (`success`/`error` → `{ success, data }` / `{ success, error }`) for most resources; executions and health emit raw JSON.

### Scheduler (`backend/src/scheduler/`)
- **`queue.js`** — constructs the BullMQ `Queue('job-queue')` with default job options: `attempts: 3`, exponential backoff (base 2000 ms), `removeOnComplete: { count: 100 }`, `removeOnFail: { count: 50 }`.
- **`scheduler.js`** — `scheduleJob(job)` adds the job to the queue. If it has a `cron_expression` it is added as a **repeatable** job (`repeat.cron`); otherwise it is enqueued immediately (`delay: 0`). `pauseJob` removes the repeatable entry by matching its key; `resumeJob` re-schedules; `loadPersistedJobs()` re-registers all `active` cron jobs from PostgreSQL on boot so schedules survive restarts.
- **`events.js`** — a separate `QueueEvents('job-queue')` connection logging `active` / `completed` / `failed` / `stalled` transitions for observability.

### Repository layer (`backend/src/repositories/`)
The only place SQL is written. `user`, `job`, `execution`, `worker`, and `notification` repositories expose intent-named methods (e.g. `findAllByUser`, `updateStatus`, `getStats`, `upsert`, `countUnread`). All obtain the shared pool via the database singleton.

### Redis + BullMQ
Redis is the backbone of the asynchronous plane: it stores the BullMQ queue (waiting/active/delayed/completed/failed sets), holds repeatable-job schedules, and carries the `job-events` Pub/Sub channel. See **[Redis usage map](#redis-usage-map)** below.

### Workers (`backend/src/workers/`)
`job.worker.js` runs a BullMQ `Worker` over `job-queue` with `concurrency: 5`. For each job it inserts a `running` execution row, resolves a strategy via the factory, executes it, then marks the execution `success` (with duration) and bumps `jobs.last_run_at` and the worker's processed counter — or, on failure, marks the execution `failed` with the error message. It maintains a 10-second heartbeat reporting `busy`/`idle` and handles `SIGTERM`/`SIGINT` by marking the worker `offline`. The worker uses a **duplicated** Redis connection to publish completion/failure events.

### PostgreSQL
Source of truth for durable state. Schema (migrations `000`–`008`):

| Table | Key columns |
| --- | --- |
| `users` | `id` (uuid), `name`, `email` (unique), `password` (bcrypt hash), `created_at` |
| `jobs` | `id`, `user_id` (FK→users, cascade), `name`, `job_type`, `cron_expression`, `payload` (jsonb), `status` (default `active`), `retry_count`, `last_run_at`, `next_run_at`, `created_at`, `updated_at` |
| `executions` | `id`, `job_id` (FK→jobs, cascade), `status` (`running`/`success`/`failed`), `started_at`, `completed_at`, `duration_ms`, `attempt`, `error_message`, `created_at` |
| `workers` | `id`, `name` (unique), `status` (`idle`/`busy`/`offline`), `current_job` (FK→jobs), `jobs_processed`, `last_heartbeat`, `created_at` |
| `notifications` | `id`, `user_id` (FK→users, cascade), `job_id` (FK→jobs), `type`, `title`, `message`, `is_read`, `created_at` |

Indexes exist on `executions(job_id)`, `executions(status)`, `workers(status)`, `notifications(user_id)`, and `notifications(is_read)`. The `pgcrypto` extension provides `gen_random_uuid()`.

---

## Job lifecycle

```
create ─► schedule ─► enqueue ─► worker executes strategy ─► record execution
                                                          └─► publish event ─► notification
```

1. **Create** — `POST /api/jobs` → `jobService.createJob` writes a `jobs` row via the repository (status defaults to `active`).
2. **Schedule** — the service calls `scheduler.scheduleJob(job)`.
3. **Enqueue** — the scheduler adds the job to the BullMQ `job-queue`. A cron job becomes a **repeatable** entry; a job with no cron is enqueued for immediate execution. The job payload carried on the queue is `{ jobId, jobType, payload, userId, jobName }`.
4. **Worker executes strategy** — the BullMQ worker picks up the job, inserts a `running` execution (with `attempt = attemptsMade + 1`), resolves `getStrategy(jobType)` from the registry, and calls `strategy.execute(payload)`.
5. **Record execution** — on success the execution row is updated to `success` with `duration_ms`, `jobs.last_run_at` is set, and the worker's `jobs_processed` increments. On failure (`worker.on('failed')`), the execution is updated to `failed` with the error message. BullMQ retries up to 3 attempts with exponential backoff before the failure is final.
6. **Publish event** — the worker publishes a `job_completed` or `job_failed` event to the Redis `job-events` channel.
7. **Notification** — `notification.service`'s subscriber receives the event and persists a `notifications` row for the owning user, with a friendly title/message.

### Status transitions (state machine)

Pause/resume/delete go through `jobService`, which validates against `VALID_TRANSITIONS`:

```
active ──pause──► paused
active ◄─resume── paused
active ──delete─► deleted
paused ──delete─► deleted
deleted: (terminal)
```

Pausing removes the repeatable job from BullMQ and sets status `paused`; resuming re-schedules and sets status `active`; deleting removes the schedule then deletes the row.

### Retry

`POST /api/executions/:executionId/retry` re-queues the job for a single attempt (`attempts: 1`) under a `-retry` job name, but only if the target execution's status is `failed` and the caller owns the parent job.

---

## Design patterns — where and why

### Singleton — `config/database.js`, `config/redis.js`
A single lazily-initialised `pg.Pool` and a single `ioredis` client are created once and reused across the whole process. **Why:** connection pools and Redis clients are expensive and stateful; sharing one instance avoids connection exhaustion and makes the pool/client trivially injectable everywhere via `getPool()` / `getRedis()`. Components that need an exclusive Redis connection (the worker's publisher, the notification subscriber, BullMQ `QueueEvents`) call `.duplicate()` on the singleton.

### Repository — `repositories/*.repository.js`
Each table has a repository that owns its SQL. **Why:** keeps services free of query strings, centralises schema knowledge, and makes data access independently testable and swappable.

### Strategy — `workers/strategies/*.strategy.js`
`BaseStrategy` defines an `execute(payload)` contract; `EmailStrategy`, `WebhookStrategy`, `ReportStrategy`, and `DataSyncStrategy` implement it. **Why:** the worker runs one algorithm per job type without branching `if/else` on type — new job types are added by writing a new strategy class.

### Factory — `workers/workerRegistry.js`
`getStrategy(jobType)` maps a job-type string to the right strategy class and instantiates it (throwing on unknown types). **Why:** the worker depends on an abstraction (`getStrategy`) rather than knowing which concrete classes exist or how to build them.

### Observer (Pub/Sub) — worker `publishEvent` → `services/notification.service.js`
The worker publishes execution events to the Redis `job-events` channel; the notification subscriber listens and persists notifications. **Why:** execution and notification are fully decoupled — the worker has no knowledge of notifications, and additional subscribers could be added without touching the worker.

### State — `services/job.service.js`
`VALID_TRANSITIONS` defines the legal moves between `active`, `paused`, and `deleted`, and `validateTransition` rejects illegal ones. **Why:** prevents invalid states (e.g. resuming a deleted job) and keeps lifecycle rules in one authoritative place.

---

## Redis usage map

| Use | Mechanism | Location |
| --- | --- | --- |
| **Job queue** | BullMQ `Queue('job-queue')` consumed by `Worker('job-queue')` (concurrency 5) | `scheduler/queue.js`, `workers/job.worker.js` |
| **Repeatable jobs** | `queue.add(..., { repeat: { cron } })`; paused via `removeRepeatableByKey` | `scheduler/scheduler.js` |
| **Delayed / immediate jobs** | `queue.add(..., { delay: 0 })` for non-cron jobs | `scheduler/scheduler.js` |
| **Retries + exponential backoff** | default job options `attempts: 3`, `backoff: { type: 'exponential', delay: 2000 }`; manual retry uses `attempts: 1` | `scheduler/queue.js`, `services/job.service.js` |
| **Queue housekeeping** | `removeOnComplete: { count: 100 }`, `removeOnFail: { count: 50 }` | `scheduler/queue.js` |
| **Pub/Sub** | worker publishes `job-events`; notification service subscribes (each on a duplicated connection) | `workers/job.worker.js`, `services/notification.service.js` |
| **QueueEvents** | dedicated `QueueEvents('job-queue')` connection logging `active`/`completed`/`failed`/`stalled` | `scheduler/events.js` |
| **Queue stats** | `getWaitingCount` / `getActiveCount` / `getCompletedCount` / `getFailedCount` / `getDelayedCount` for the dashboard | `services/worker.service.js` |

> Because Redis is single-client by default, every component that must hold an open subscription or event stream calls `.duplicate()` on the shared `ioredis` singleton — a subscriber connection cannot run normal commands.
