import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/jobs/StatusBadge';
import { formatRelativeTime, formatDuration } from '@/utils/formatters';

export default function ActivityFeed({ items = [] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {!items || items.length === 0 ? (
          <EmptyState title="No activity yet" />
        ) : (
          <ul className="divide-y divide-border">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">
                    {item.job_name}
                  </p>
                  {item.error_message && (
                    <p className="truncate text-xs text-red-400">
                      {item.error_message}
                    </p>
                  )}
                </div>
                <StatusBadge status={item.status} />
                <span className="w-20 text-right text-sm text-muted-foreground">
                  {formatDuration(item.duration_ms)}
                </span>
                <span className="w-20 text-right text-sm text-muted-foreground">
                  {formatRelativeTime(item.started_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
