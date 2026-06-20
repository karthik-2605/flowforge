# FlowForge — API Reference

Base URL (default): `http://localhost:4000`

All endpoints below are mounted under `/api/*` (plus the bare `GET /health` liveness probe).

## Conventions

### Authentication
All `/api` routes require an `Authorization: Bearer <JWT>` header **except**:
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/health/system`
- `GET /health`

The JWT is issued by login/register, signed with `JWT_SECRET`, expires in 7 days, and encodes `{ userId, email }`. Missing/invalid tokens return `401`.

### Response shape
Two conventions coexist:

- **Wrapped** — Auth, Jobs, Workers, Dashboard, and Notifications use `utilities/responseHelper`:
  ```json
  { "success": true, "data": { ... } }      // success
  { "success": false, "error": "message" }  // error
  ```
- **Raw JSON** — Executions (list / stats / retry) and Health endpoints return their payload directly, with `{ "error": "..." }` on failure.

### Common error codes
`400` validation/bad request · `401` missing/invalid token or bad credentials · `403` Forbidden (not the owner) · `404` not found · `500` server error.

---

## Auth — `/api/auth` (wrapped)

| Method | Path | Auth | Description |
| --- | --- | :---: | --- |
| POST | `/api/auth/register` | No | Create a user and return a JWT. |
| POST | `/api/auth/login` | No | Authenticate and return a JWT. |

### POST /api/auth/register
Request:
```json
{ "name": "Aashish", "email": "aashish@example.com", "password": "secret123" }
```
Response `201`:
```json
{
  "success": true,
  "data": {
    "token": "<jwt>",
    "user": { "id": "uuid", "email": "aashish@example.com", "name": "Aashish" }
  }
}
```
Errors: `400` `"Email already registered"`.

### POST /api/auth/login
Request:
```json
{ "email": "aashish@example.com", "password": "secret123" }
```
Response `200`: same shape as register (`token` + `user`). Errors: `401` `"Invalid credentials"`.

---

## Jobs — `/api/jobs` (wrapped, auth required)

| Method | Path | Auth | Description |
| --- | --- | :---: | --- |
| GET | `/api/jobs/cron-preview?expression=<cron>` | Yes | Preview the next 5 run times for a cron expression. |
| POST | `/api/jobs` | Yes | Create a job (and schedule it). |
| GET | `/api/jobs` | Yes | List the caller's jobs (filters: `status`, `jobType`, `search`). |
| GET | `/api/jobs/:id` | Yes | Get a single job (owner only). |
| PUT | `/api/jobs/:id` | Yes | Update a job. |
| DELETE | `/api/jobs/:id` | Yes | Delete a job (unschedules first). |
| PATCH | `/api/jobs/:id/pause` | Yes | Pause a job (`active → paused`). |
| PATCH | `/api/jobs/:id/resume` | Yes | Resume a job (`paused → active`). |

### POST /api/jobs
Request:
```json
{
  "name": "Daily report",
  "jobType": "report",
  "cronExpression": "0 9 * * *",
  "payload": { "format": "pdf" },
  "retryCount": 0
}
```
`jobType` is one of `email`, `webhook`, `report`, `data_sync`. Omit `cronExpression` for a one-time immediate job.

Response `201`:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "name": "Daily report",
    "job_type": "report",
    "cron_expression": "0 9 * * *",
    "payload": { "format": "pdf" },
    "status": "active",
    "retry_count": 0,
    "last_run_at": null,
    "next_run_at": null,
    "created_at": "2026-06-20T09:00:00.000Z",
    "updated_at": "2026-06-20T09:00:00.000Z"
  }
}
```

### GET /api/jobs
Optional query params: `status`, `jobType`, `search` (name `ILIKE`). Response `200`:
```json
{ "success": true, "data": [ { "id": "uuid", "name": "Daily report", "...": "..." } ] }
```

### GET /api/jobs/:id
Response `200`: `{ "success": true, "data": { ...job } }`. Errors: `403` `"Forbidden"`, `404` `"Job not found"`.

### GET /api/jobs/cron-preview
`GET /api/jobs/cron-preview?expression=0 9 * * *` → `200`:
```json
{
  "success": true,
  "data": {
    "valid": true,
    "nextRuns": [
      "2026-06-21T09:00:00.000Z",
      "2026-06-22T09:00:00.000Z",
      "2026-06-23T09:00:00.000Z",
      "2026-06-24T09:00:00.000Z",
      "2026-06-25T09:00:00.000Z"
    ]
  }
}
```
Errors: `400` `"expression is required"` or the parser's error message for an invalid expression.

### PUT /api/jobs/:id
Request (same fields as create): `{ "name", "jobType", "cronExpression", "payload", "retryCount" }`. Response `200`: `{ "success": true, "data": { ...updated job } }`.

### DELETE /api/jobs/:id
Response `200`: `{ "success": true, "data": { "message": "Job deleted" } }`.

### PATCH /api/jobs/:id/pause · PATCH /api/jobs/:id/resume
Response `200`: `{ "success": true, "data": { ...job with new status } }`. An illegal transition returns `400` (e.g. `"Cannot transition job from 'paused' to 'paused'"`).

---

## Executions — `/api/executions` (raw JSON, auth required)

| Method | Path | Auth | Description |
| --- | --- | :---: | --- |
| GET | `/api/executions?jobId=<id>` | Yes | List executions for a job the caller owns (latest 50). |
| GET | `/api/executions/stats` | Yes | Aggregate execution counts for the caller. |
| POST | `/api/executions/:executionId/retry` | Yes | Re-queue a **failed** execution's job for one attempt. |

### GET /api/executions?jobId=...
`jobId` is required (`400` `"jobId is required"` otherwise). Ownership is enforced via the parent job (`403`/`404`). Response `200`:
```json
[
  {
    "id": "uuid",
    "job_id": "uuid",
    "status": "success",
    "started_at": "2026-06-20T09:00:00.000Z",
    "completed_at": "2026-06-20T09:00:00.300Z",
    "duration_ms": 300,
    "attempt": 1,
    "error_message": null,
    "created_at": "2026-06-20T09:00:00.000Z"
  }
]
```

### GET /api/executions/stats
Response `200`:
```json
{
  "success_count": "42",
  "failed_count": "3",
  "running_count": "1",
  "total_count": "46"
}
```
(Counts are returned as strings by PostgreSQL `COUNT`.)

### POST /api/executions/:executionId/retry
Response `200`: `{ "message": "Job queued for retry" }`. Errors: `400` `"Can only retry failed executions"`, `403` `"Forbidden"`, `404` `"Execution not found"` / `"Job not found"`.

---

## Workers — `/api/workers` (wrapped, auth required)

| Method | Path | Auth | Description |
| --- | --- | :---: | --- |
| GET | `/api/workers` | Yes | List all registered workers and their heartbeat status. |
| GET | `/api/workers/queue-stats` | Yes | Live BullMQ queue depth counters. |

### GET /api/workers
Response `200`:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "worker-12345",
      "status": "idle",
      "current_job": null,
      "jobs_processed": 17,
      "last_heartbeat": "2026-06-20T09:00:10.000Z",
      "created_at": "2026-06-20T08:00:00.000Z"
    }
  ]
}
```
`status` is `idle` | `busy` | `offline`.

### GET /api/workers/queue-stats
Response `200`:
```json
{
  "success": true,
  "data": { "waiting": 0, "active": 1, "completed": 120, "failed": 2, "delayed": 0 }
}
```

---

## Dashboard — `/api/dashboard` (wrapped, auth required)

| Method | Path | Auth | Description |
| --- | --- | :---: | --- |
| GET | `/api/dashboard` | Yes | Aggregate stats, 24h success rate, recent activity, and queue depth. |
| GET | `/api/dashboard/trends` | Yes | Hourly success/failure counts over the last 24h (for charts). |

### GET /api/dashboard
Response `200`:
```json
{
  "success": true,
  "data": {
    "jobs": { "total_jobs": "5", "active_jobs": "4", "paused_jobs": "1" },
    "executions": { "success_count": "40", "failed_count": "2", "total_count": "42" },
    "successRate": "95.2",
    "recentActivity": [
      {
        "id": "uuid", "job_id": "uuid", "status": "success",
        "started_at": "2026-06-20T09:00:00.000Z", "duration_ms": 300,
        "job_name": "Daily report", "job_type": "report"
      }
    ],
    "queue": { "waiting": 0, "active": 1, "completed": 120, "failed": 2, "delayed": 0 }
  }
}
```
`executions` counts cover the last 24 hours; `successRate` is a percentage string.

### GET /api/dashboard/trends
Response `200`:
```json
{
  "success": true,
  "data": [ { "hour": "09:00", "success": 12, "failed": 1 } ]
}
```

---

## Notifications — `/api/notifications` (wrapped, auth required)

| Method | Path | Auth | Description |
| --- | --- | :---: | --- |
| GET | `/api/notifications?limit=&offset=` | Yes | List notifications + unread count (defaults `limit=50`, `offset=0`). |
| PATCH | `/api/notifications/read-all` | Yes | Mark all the caller's notifications read. |
| PATCH | `/api/notifications/:id/read` | Yes | Mark one notification read. |

### GET /api/notifications
Response `200`:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid", "user_id": "uuid", "job_id": "uuid",
        "type": "job_completed", "title": "Job Completed",
        "message": "Job Daily report job completed",
        "is_read": false, "created_at": "2026-06-20T09:00:00.300Z"
      }
    ],
    "unreadCount": 1
  }
}
```
`type` is one of `job_completed`, `job_failed`, `retry_success`, `worker_offline`.

### PATCH /api/notifications/read-all
Response `200`: `{ "success": true, "data": { "message": "All notifications marked as read" } }`.

### PATCH /api/notifications/:id/read
Response `200`: `{ "success": true, "data": { ...notification } }`. Errors: `404` `"Notification not found"`.

---

## Health (raw JSON)

| Method | Path | Auth | Description |
| --- | --- | :---: | --- |
| GET | `/api/health/system` | No | Process/DB/Redis health for container probes. |
| GET | `/health` | No | Simple liveness check (top-level, not under `/api`). |

### GET /api/health/system
Response `200`:
```json
{
  "status": "healthy",
  "uptime": 3600,
  "database": "healthy",
  "redis": "healthy",
  "memory": { "used": 84, "total": 128, "percentage": 66 },
  "cpu": { "percentage": 18 }
}
```
`status` is `healthy` when both DB and Redis are reachable, otherwise `degraded`; `database`/`redis` are `healthy` | `unhealthy`.

### GET /health
Response `200`:
```json
{ "status": "ok", "timestamp": "2026-06-20T09:00:00.000Z" }
```
