import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

import Layout from './components/layout/Layout';
import { Toaster } from '@/components/ui/toast';
import PageTransition from '@/components/ui/PageTransition';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import JobsPage from './pages/JobsPage';
import CreateJobPage from './pages/CreateJobPage';
import JobDetailPage from './pages/JobDetailPage';
import WorkersPage from './pages/WorkersPage';
import NotificationsPage from './pages/NotificationsPage';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

function AppShell({ children }) {
  return (
    <Layout>
      <PageTransition>{children}</PageTransition>
    </Layout>
  );
}

function protectedPage(element) {
  return (
    <ProtectedRoute>
      <AppShell>{element}</AppShell>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route path="/" element={protectedPage(<DashboardPage />)} />
            <Route path="/jobs" element={protectedPage(<JobsPage />)} />
            <Route
              path="/jobs/new"
              element={protectedPage(<CreateJobPage />)}
            />
            <Route
              path="/jobs/:id"
              element={protectedPage(<JobDetailPage />)}
            />
            <Route path="/workers" element={protectedPage(<WorkersPage />)} />
            <Route
              path="/notifications"
              element={protectedPage(<NotificationsPage />)}
            />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
