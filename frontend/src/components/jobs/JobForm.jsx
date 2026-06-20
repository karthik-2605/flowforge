import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import CronPreview from '@/components/jobs/CronPreview';

const JOB_TYPES = ['email', 'webhook', 'report', 'data_sync'];

const selectClass =
  'flex h-9 w-full rounded-md border border-border bg-transparent px-3 py-1 text-sm text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-ring';

export default function JobForm({ initialValues, onSubmit, submitting }) {
  const [name, setName] = useState(initialValues?.name || '');
  const [jobType, setJobType] = useState(initialValues?.jobType || 'email');
  const [cron, setCron] = useState(initialValues?.cronExpression || '');
  const [payloadText, setPayloadText] = useState(
    initialValues?.payload
      ? JSON.stringify(initialValues.payload, null, 2)
      : '{}'
  );
  const [retryCount, setRetryCount] = useState(
    initialValues?.retryCount ?? 0
  );
  const [payloadError, setPayloadError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setPayloadError('');

    let payload = {};
    const trimmed = (payloadText || '').trim();
    if (trimmed) {
      try {
        payload = JSON.parse(trimmed);
        if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
          setPayloadError('Payload must be a JSON object');
          return;
        }
      } catch {
        setPayloadError('Invalid JSON');
        return;
      }
    }

    const cronExpression = cron.trim() ? cron.trim() : null;

    onSubmit({
      name: name.trim(),
      jobType,
      cronExpression,
      payload,
      retryCount: Number(retryCount) || 0,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          Name
        </label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My scheduled job"
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          Job Type
        </label>
        <select
          className={selectClass}
          value={jobType}
          onChange={(e) => setJobType(e.target.value)}
        >
          {JOB_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          Cron Expression
        </label>
        <Input
          value={cron}
          onChange={(e) => setCron(e.target.value)}
          placeholder="*/5 * * * *"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Leave empty for a one-time job
        </p>
        <CronPreview expression={cron} />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          Payload JSON
        </label>
        <textarea
          className={`${selectClass} h-32 font-mono`}
          value={payloadText}
          onChange={(e) => setPayloadText(e.target.value)}
          spellCheck={false}
        />
        {payloadError && (
          <p className="mt-1 text-xs text-red-400">{payloadError}</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          Retry Count
        </label>
        <Input
          type="number"
          min={0}
          max={10}
          value={retryCount}
          onChange={(e) => setRetryCount(e.target.value)}
        />
      </div>

      <Button type="submit" disabled={submitting}>
        {submitting ? 'Saving…' : 'Save Job'}
      </Button>
    </form>
  );
}
