import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/jobs/StatusBadge';
import { getJob, getExecutions, retryExecution } from '@/api/jobs.api';
import {
  formatDateTime,
  formatRelativeTime,
  formatDuration,
} from '@/utils/formatters';
import { toast } from '@/components/ui/toast';

const dotColor = {
  success: 'bg-green-400',
  failed: 'bg-red-400',
  running: 'bg-blue-400',
};

function MetaRow({ label, children }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border py-2 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground">{children}</span>
    </div>
  );
}

export default function JobDetailPage() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchExecutions = useCallback(async () => {
    try {
      const { data } = await getExecutions(id);
      setExecutions(Array.isArray(data) ? data : []);
    } catch {
      // interceptor surfaces error
    }
  }, [id]);

  useEffect(() => {
    let active = true;
    setLoading(true);

    Promise.all([getJob(id), getExecutions(id)])
      .then(([jobRes, execRes]) => {
        if (!active) return;
        setJob(jobRes.data?.data || null);
        setExecutions(Array.isArray(execRes.data) ? execRes.data : []);
      })
      .catch(() => {
        // interceptor surfaces error
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  const handleRetry = async (execId) => {
    try {
      await retryExecution(execId);
      toast({ title: 'Retry triggered', variant: 'success' });
      setTimeout(() => {
        fetchExecutions();
      }, 1000);
    } catch {
      // interceptor surfaces error
    }
  };

  return (
    <div className="p-8">
      <Link
        to="/jobs"
        className="mb-4 inline-block text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to jobs
      </Link>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : !job ? (
        <EmptyState title="Job not found" subtitle="This job may have been deleted" />
      ) : (
        <>
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{job.name}</CardTitle>
                <StatusBadge status={job.status} />
              </div>
              <CardDescription>{job.job_type}</CardDescription>
            </CardHeader>
            <CardContent>
              <MetaRow label="Schedule">
                <span className="font-mono text-xs">
                  {job.cron_expression || 'one-time'}
                </span>
              </MetaRow>
              <MetaRow label="Retry count">{job.retry_count}</MetaRow>
              <MetaRow label="Last run">
                {formatRelativeTime(job.last_run_at)}
              </MetaRow>
              <MetaRow label="Next run">
                {formatDateTime(job.next_run_at)}
              </MetaRow>
              <MetaRow label="Created">{formatDateTime(job.created_at)}</MetaRow>
            </CardContent>
          </Card>

          <h2 className="mb-4 text-xl font-semibold text-foreground">
            Execution History
          </h2>

          {executions.length === 0 ? (
            <EmptyState
              title="No executions yet"
              subtitle="This job has not run yet"
            />
          ) : (
            <div className="relative space-y-4 border-l border-border pl-6">
              {executions.map((exec, i) => (
                <motion.div
                  key={exec.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="relative"
                >
                  <span
                    className={`absolute -left-[1.6rem] top-3 h-3 w-3 rounded-full ${
                      dotColor[exec.status] || 'bg-gray-500'
                    }`}
                  />
                  <Card>
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <StatusBadge status={exec.status} />
                          <p className="text-sm text-foreground">
                            {formatDateTime(exec.started_at)}
                          </p>
                          {exec.attempt != null && (
                            <p className="text-xs text-muted-foreground">
                              Attempt {exec.attempt}
                            </p>
                          )}
                          {exec.error_message && (
                            <p className="text-xs text-red-400">
                              {exec.error_message}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="text-sm text-muted-foreground">
                            {formatDuration(exec.duration_ms)}
                          </span>
                          {exec.status === 'failed' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRetry(exec.id)}
                            >
                              Retry
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
