import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const { login } = useAuth();

  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();

    setError('');
    setLoading(true);

    try {
      await login(email, password);

      navigate('/');
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Invalid credentials'
      );
    }

    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-[400px]">
        <CardContent className="pt-6">
          <h1 className="text-2xl font-bold mb-6">
            Login
          </h1>

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <Input
              placeholder="Email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
            />

            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
            />

            {error && (
              <p className="text-red-500">
                {error}
              </p>
            )}

            <Button
              className="w-full"
              disabled={loading}
            >
              {loading
                ? 'Logging in...'
                : 'Login'}
            </Button>

            <p>
              Don't have an account?{' '}
              <Link
                to="/register"
                className="underline"
              >
                Register
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}