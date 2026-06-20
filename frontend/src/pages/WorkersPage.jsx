import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import EmptyState from '@/components/ui/EmptyState';
import WorkerCard from '@/components/workers/WorkerCard';
import ClusterVisual from '@/components/workers/ClusterVisual';
import { getWorkers, getQueueStats } from '@/api/workers.api';

const QUEUE_FIELDS = [
  { key: 'waiting', label: 'Waiting', className: 'text-yellow-400' },
  { key: 'active', label: 'Active', className: 'text-blue-400' },
  { key: 'completed', label: 'Completed', className: 'text-green-400' },
  { key: 'failed', label: 'Failed', className: 'text-red-400' },
  { key: 'delayed', label: 'Delayed', className: 'text-purple-400' },
];

export default function WorkersPage() {
  const [workers, setWorkers] = useState(null);
  const [queue, setQueue] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const [workersRes, queueRes] = await Promise.all([
          getWorkers(),
          getQueueStats(),
        ]);
        if (!active) return;
        setWorkers(workersRes.data?.data ?? []);
        setQueue(queueRes.data?.data ?? null);
      } catch {
        /* interceptor surfaces error */
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    const interval = setInterval(load, 5000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="p-8">
      <h1 className="mb-6 text-3xl font-bold text-foreground">Workers</h1>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {QUEUE_FIELDS.map(({ key, label, className }) => (
          <Card key={key}>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading && queue === null ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <span className={`text-2xl font-bold ${className}`}>
                  {queue?.[key] ?? 0}
                </span>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {loading && workers === null ? (
        <div className="space-y-6">
          <Skeleton className="h-40 w-full" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <ClusterVisual workers={workers ?? []} />

          {(workers ?? []).length === 0 ? (
            <EmptyState
              title="No workers online yet"
              subtitle="Start the backend worker to see heartbeats"
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {workers.map((worker) => (
                <WorkerCard key={worker.id} worker={worker} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
