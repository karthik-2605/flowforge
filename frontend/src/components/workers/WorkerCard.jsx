import { motion } from 'framer-motion';
import { formatRelativeTime } from '@/utils/formatters';

const statusStyles = {
  busy: 'border-blue-500 bg-blue-950',
  idle: 'border-green-500 bg-green-950',
  offline: 'border-gray-600 bg-gray-900',
};

export default function WorkerCard({ worker }) {
  const isOnline =
    Date.now() - new Date(worker.last_heartbeat).getTime() < 30000;
  const displayStatus = isOnline ? worker.status : 'offline';
  const isOffline = displayStatus === 'offline';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`rounded-xl border p-4 ${
        statusStyles[displayStatus] || statusStyles.offline
      }`}
    >
      <div className="mb-3 flex items-center gap-2">
        <span
          className={`inline-block h-2.5 w-2.5 rounded-full ${
            isOffline ? 'bg-gray-500' : 'animate-pulse bg-green-400'
          }`}
        />
        <h3 className="font-medium text-white">{worker.name}</h3>
      </div>

      <dl className="space-y-1 text-sm text-gray-300">
        <div>Status: {displayStatus}</div>
        <div>Jobs processed: {worker.jobs_processed}</div>
        <div>Heartbeat: {formatRelativeTime(worker.last_heartbeat)}</div>
      </dl>
    </motion.div>
  );
}
