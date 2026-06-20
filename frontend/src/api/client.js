import axios from 'axios';
import { toast } from '@/components/ui/toast';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');

      // Avoid redirect loops on the auth pages themselves.
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    } else {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Something went wrong';

      toast({ title: 'Error', description: message, variant: 'destructive' });
    }

    return Promise.reject(err);
  }
);

export default client;
