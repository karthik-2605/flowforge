import { Link } from 'react-router-dom';

export default function Sidebar() {
  return (
    <aside className="w-64 border-r p-4">
      <nav className="space-y-4">
        <Link to="/">Dashboard</Link>

        <Link to="/jobs">Jobs</Link>

        <Link to="/workers">Workers</Link>

        <Link to="/notifications">
          Notifications
        </Link>
      </nav>
    </aside>
  );
}