import { useState } from 'react';

import {
  useNavigate,
  Link,
} from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

import { Card, CardContent } from '@/components/ui/card';

import { Input } from '@/components/ui/input';

import { Button } from '@/components/ui/button';

export default function RegisterPage() {
  const { register } = useAuth();

  const navigate = useNavigate();

  const [name, setName] = useState('');

  const [email, setEmail] = useState('');

  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();

    setLoading(true);

    setError('');

    try {
      await register(name, email, password);

      navigate('/');
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Registration failed'
      );
    }

    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-[400px]">
        <CardContent className="pt-6">
          <h1 className="text-2xl font-bold mb-6">
            Register
          </h1>

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <Input
              placeholder="Name"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
            />

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
                ? 'Registering...'
                : 'Register'}
            </Button>

            <p>
              Already have an account?{' '}
              <Link
                to="/login"
                className="underline"
              >
                Login
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}