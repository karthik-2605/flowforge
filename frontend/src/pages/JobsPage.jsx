import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useJobs } from '@/hooks/useJobs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import EmptyState from '@/components/ui/EmptyState';
import JobTable from '@/components/jobs/JobTable';
import { pauseJob, resumeJob, deleteJob } from '@/api/jobs.api';
import { toast } from '@/components/ui/toast';

const selectClass =
  'flex h-9 rounded-md border border-border bg-transparent px-3 py-1 text-sm text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-ring';

export default function JobsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');

  const { jobs, loading, refetch } = useJobs({
    search: search || undefined,
    status: status === 'all' ? undefined : status,
  });

  const handlePause = async (id) => {
    try {
      await pauseJob(id);
      toast({ title: 'Job paused', variant: 'success' });
      refetch();
    } catch {
      /* interceptor surfaces error */
    }
  };

  const handleResume = async (id) => {
    try {
      await resumeJob(id);
      toast({ title: 'Job resumed', variant: 'success' });
      refetch();
    } catch {
      /* interceptor surfaces error */
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this job? This cannot be undone.')) return;
    try {
      await deleteJob(id);
      toast({ title: 'Job deleted', variant: 'success' });
      refetch();
    } catch {
      /* interceptor surfaces error */
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Jobs</h1>
        <Button asChild>
          <Link to="/jobs/new">Create Job</Link>
        </Button>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Input
          className="max-w-xs"
          placeholder="Search by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className={selectClass}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState
          title="No jobs yet"
          subtitle="Create your first scheduled job"
        />
      ) : (
        <JobTable
          jobs={jobs}
          onPause={handlePause}
          onResume={handleResume}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
