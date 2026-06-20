import { useEffect, useState } from 'react';
import { Briefcase, Activity, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import StatCard from '@/components/dashboard/StatCard';
import ExecutionTrendChart from '@/components/dashboard/ExecutionTrendChart';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import SystemHealth from '@/components/dashboard/SystemHealth';
import { getDashboard, getTrends } from '@/api/dashboard.api';

const QUEUE_KEYS = ['waiting', 'active', 'completed', 'failed', 'delayed'];

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      // allSettled so one failing widget can't blank the whole dashboard.
      const [dashRes, trendsRes] = await Promise.allSettled([
        getDashboard(),
        getTrends(),
      ]);
      if (!mounted) return;
      if (dashRes.status === 'fulfilled') {
        setData(dashRes.value.data?.data ?? null);
      }
      if (trendsRes.status === 'fulfilled') {
        setTrends(trendsRes.value.data?.data ?? []);
      }
      setLoading(false);
    };

    load();

    // Auto-refresh so new jobs/executions show up without a manual reload.
    const interval = setInterval(load, 5000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 p-8">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="h-[330px] rounded-xl lg:col-span-2" />
          <Skeleton className="h-[330px] rounded-xl" />
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  const jobs = data?.jobs ?? {};
  const executions = data?.executions ?? {};
  const queue = data?.queue ?? {};

  return (
    <div className="space-y-6 p-8">
      <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Jobs"
          value={Number(jobs.total_jobs ?? 0)}
          icon={Briefcase}
          color="text-blue-400"
        />
        <StatCard
          title="Active Jobs"
          value={Number(jobs.active_jobs ?? 0)}
          icon={Activity}
          color="text-green-400"
        />
        <StatCard
          title="Success Rate"
          value={`${data?.successRate ?? '0'}%`}
          icon={CheckCircle}
          color="text-green-400"
        />
        <StatCard
          title="Failed (24h)"
          value={Number(executions.failed_count ?? 0)}
          icon={XCircle}
          color="text-red-400"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ExecutionTrendChart data={trends} />
        </div>
        <SystemHealth />
      </div>

      <ActivityFeed items={data?.recentActivity ?? []} />

      <Card>
        <CardHeader>
          <CardTitle>Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {QUEUE_KEYS.map((key) => (
              <div
                key={key}
                className="rounded-lg border border-border bg-background/40 p-4 text-center"
              >
                <p className="text-2xl font-bold text-foreground">
                  {Number(queue[key] ?? 0)}
                </p>
                <p className="mt-1 text-xs capitalize text-muted-foreground">
                  {key}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
