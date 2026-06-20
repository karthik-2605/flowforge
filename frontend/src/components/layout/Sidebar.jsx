import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ListChecks,
  Server,
  Bell,
} from 'lucide-react';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/jobs', label: 'Jobs', icon: ListChecks },
  { to: '/workers', label: 'Workers', icon: Server },
  { to: '/notifications', label: 'Notifications', icon: Bell },
];

export default function Sidebar() {
  return (
    <aside className="flex w-60 flex-col border-r border-border bg-card/40 p-4">
      <div className="mb-8 flex items-center gap-2 px-2">
        <span className="text-2xl">⚡</span>
        <span className="text-lg font-bold">FlowForge</span>
      </div>

      <nav className="space-y-1">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
