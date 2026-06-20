import { useState, useEffect } from 'react';
import { getCronPreview } from '@/api/jobs.api';
import { formatDateTime } from '@/utils/formatters';

export default function CronPreview({ expression }) {
  const [debounced, setDebounced] = useState(expression || '');
  const [runs, setRuns] = useState([]);
  const [invalid, setInvalid] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced((expression || '').trim()), 400);
    return () => clearTimeout(t);
  }, [expression]);

  useEffect(() => {
    let active = true;

    if (!debounced) {
      setRuns([]);
      setInvalid(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setInvalid(false);

    getCronPreview(debounced)
      .then(({ data }) => {
        if (!active) return;
        setRuns((data?.data?.nextRuns || []).slice(0, 5));
        setInvalid(false);
      })
      .catch(() => {
        if (!active) return;
        setRuns([]);
        setInvalid(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [debounced]);

  if (!debounced) {
    return (
      <p className="mt-2 text-xs text-muted-foreground">
        Enter a cron expression to preview the schedule.
      </p>
    );
  }

  return (
    <div className="mt-2 rounded-md border border-border bg-card p-3 text-sm">
      {loading && <p className="text-muted-foreground">Checking…</p>}

      {!loading && invalid && (
        <p className="text-red-400">Invalid cron expression</p>
      )}

      {!loading && !invalid && runs.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">
            Next 5 runs:
          </p>
          <ul className="space-y-0.5">
            {runs.map((r, i) => (
              <li key={i} className="text-foreground">
                {formatDateTime(r)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
