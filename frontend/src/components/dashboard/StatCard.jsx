import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';

export function StatCard({ title, value, icon: Icon, color = 'text-foreground', change }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardContent>
          <div className="flex items-start justify-between">
            <p className="text-sm text-muted-foreground">{title}</p>
            {Icon && <Icon className={`h-5 w-5 ${color}`} />}
          </div>
          <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
          {change && (
            <p className="mt-1 text-xs text-muted-foreground">{change}</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default StatCard;
