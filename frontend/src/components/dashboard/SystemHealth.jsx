import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getSystemHealth } from '@/api/workers.api';

function formatUptime(seconds) {
  if (seconds == null) return '—';
  const total = Math.floor(Number(seconds));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}

function PingIndicator({ label, status }) {
  const ok = status === 'healthy';
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span
          className={`h-2.5 w-2.5 rounded-full ${ok ? 'bg-green-400' : 'bg-red-400'}`}
        />
        <span className={ok ? 'text-green-400' : 'text-red-400'}>
          {ok ? 'Healthy' : 'Down'}
        </span>
      </div>
    </div>
  );
}

export default function SystemHealth() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchHealth = async () => {
      try {
        const res = await getSystemHealth();
        if (mounted) setHealth(res.data);
      } catch {
        // axios interceptor toasts errors
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 10000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Health</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && !health ? (
          <div className="space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-5 w-24" />
          </div>
        ) : !health ? (
          <p className="text-sm text-muted-foreground">Unable to load health data.</p>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Overall</span>
              <div className="flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    health.status === 'healthy' ? 'bg-green-400' : 'bg-yellow-400'
                  }`}
                />
                <span
                  className={`text-sm capitalize ${
                    health.status === 'healthy' ? 'text-green-400' : 'text-yellow-400'
                  }`}
                >
                  {health.status}
                </span>
              </div>
            </div>

            <PingIndicator label="Database" status={health.database} />
            <PingIndicator label="Redis" status={health.redis} />

            <div>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Memory</span>
                <span className="text-foreground">
                  {Number(health.memory?.percentage ?? 0)}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-blue-400 transition-all"
                  style={{ width: `${Number(health.memory?.percentage ?? 0)}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">CPU</span>
              <span className="text-foreground">
                {Number(health.cpu?.percentage ?? 0)}%
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Uptime</span>
              <span className="text-foreground">{formatUptime(health.uptime)}</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
