import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const circleColor = {
  busy: 'bg-blue-600',
  idle: 'bg-green-700',
  offline: 'bg-gray-700',
};

export default function ClusterVisual({ workers = [] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Worker Cluster</CardTitle>
      </CardHeader>
      <CardContent>
        {workers.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No workers registered
          </p>
        ) : (
          <div className="flex flex-wrap items-center justify-center gap-4 py-4">
            {workers.map((worker, i) => {
              const isBusy = worker.status === 'busy';
              return (
                <motion.div
                  key={worker.id ?? i}
                  className={`flex h-16 w-16 items-center justify-center rounded-full text-sm font-semibold text-white ${
                    circleColor[worker.status] || circleColor.offline
                  }`}
                  animate={isBusy ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                  transition={
                    isBusy
                      ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' }
                      : { duration: 0.2 }
                  }
                >
                  W{i + 1}
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
