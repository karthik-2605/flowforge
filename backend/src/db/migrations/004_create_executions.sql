CREATE TABLE IF NOT EXISTS executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,

    status VARCHAR(20) NOT NULL,

    started_at TIMESTAMP,

    completed_at TIMESTAMP,

    duration_ms INTEGER,

    attempt INTEGER DEFAULT 1,

    error_message TEXT,

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_executions_job_id
ON executions(job_id);

CREATE INDEX IF NOT EXISTS idx_executions_status
ON executions(status);