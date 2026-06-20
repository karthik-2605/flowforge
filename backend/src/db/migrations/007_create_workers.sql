CREATE TABLE IF NOT EXISTS workers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(100) NOT NULL UNIQUE,

    status VARCHAR(20) DEFAULT 'idle',  -- 'idle' | 'busy' | 'offline'

    current_job UUID REFERENCES jobs(id) ON DELETE SET NULL,

    jobs_processed INTEGER DEFAULT 0,

    last_heartbeat TIMESTAMP DEFAULT NOW(),

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workers_status
ON workers(status);
