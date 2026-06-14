import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">
        Dashboard
      </h1>

      <p className="mt-4">
        Welcome {user?.name}
      </p>

      <button
        className="mt-4 border px-4 py-2"
        onClick={logout}
      >
        Logout
      </button>
    </div>
  );
}