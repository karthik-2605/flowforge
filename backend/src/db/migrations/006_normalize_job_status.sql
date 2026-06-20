-- Normalise job status to lowercase and align the column default.
ALTER TABLE jobs
ALTER COLUMN status SET DEFAULT 'active';

UPDATE jobs
SET status = lower(status)
WHERE status <> lower(status);
