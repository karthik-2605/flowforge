import { motion } from 'framer-motion';
import { CheckCheck, Bell, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/ui/EmptyState';
import { formatRelativeTime } from '@/utils/formatters';
import { useNotifications } from '../context/NotificationContext';

function NotificationIcon({ type }) {
  if (type === 'job_failed') {
    return <XCircle className="size-5 text-red-500" />;
  }
  if (type === 'job_completed' || type === 'retry_success') {
    return <CheckCircle className="size-5 text-green-500" />;
  }
  return <Bell className="size-5 text-muted-foreground" />;
}

export default function NotificationsPage() {
  const { items, unreadCount, markRead, markAllRead } = useNotifications();

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-foreground">Notifications</h1>
        <Button
          variant="outline"
          onClick={markAllRead}
          disabled={unreadCount === 0}
        >
          <CheckCheck className="size-4" />
          Mark all as read
        </Button>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon="🔔"
          title="No notifications"
          subtitle="You'll see job updates here"
        />
      ) : (
        <ul className="space-y-3">
          {items.map((n, i) => (
            <motion.li
              key={n.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.04 }}
            >
              <Card
                size="sm"
                className={
                  n.is_read
                    ? 'opacity-60'
                    : 'border-l-2 border-l-primary bg-muted/40'
                }
              >
                <CardContent className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    <NotificationIcon type={n.type} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{n.title}</p>
                    <p className="text-sm text-muted-foreground">{n.message}</p>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatRelativeTime(n.created_at)}
                    </span>
                    {!n.is_read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markRead(n.id)}
                      >
                        Mark read
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}
