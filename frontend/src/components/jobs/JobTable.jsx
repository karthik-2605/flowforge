import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/jobs/StatusBadge';
import { formatRelativeTime } from '@/utils/formatters';

export default function JobTable({ jobs, onPause, onResume, onDelete }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Type</th>
            <th className="px-4 py-3 font-medium">Schedule</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Last Run</th>
            <th className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr
              key={job.id}
              className="border-b border-border last:border-0 hover:bg-card/50"
            >
              <td className="px-4 py-3">
                <Link
                  to={`/jobs/${job.id}`}
                  className="font-medium text-foreground hover:underline"
                >
                  {job.name}
                </Link>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{job.job_type}</td>
              <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                {job.cron_expression || 'one-time'}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={job.status} />
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {formatRelativeTime(job.last_run_at)}
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  {job.status === 'active' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPause(job.id)}
                    >
                      Pause
                    </Button>
                  )}
                  {job.status === 'paused' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onResume(job.id)}
                    >
                      Resume
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onDelete(job.id)}
                  >
                    Delete
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
