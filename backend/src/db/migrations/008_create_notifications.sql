CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,

    type VARCHAR(50) NOT NULL,  -- job_completed | job_failed | retry_success | worker_offline

    title VARCHAR(255) NOT NULL,

    message TEXT,

    is_read BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id
ON notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_is_read
ON notifications(is_read);
