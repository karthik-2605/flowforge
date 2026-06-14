import { createContext, useContext, useState, useEffect } from 'react';
import client from '../api/client';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('user');

    if (stored) {
      setUser(JSON.parse(stored));
    }

    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { data } = await client.post('/auth/login', {
      email,
      password,
    });

    localStorage.setItem('token', data.data.token);

    localStorage.setItem(
      'user',
      JSON.stringify(data.data.user)
    );

    setUser(data.data.user);

    return data.data;
  };

  const register = async (name, email, password) => {
    const { data } = await client.post('/auth/register', {
      name,
      email,
      password,
    });

    localStorage.setItem('token', data.data.token);

    localStorage.setItem(
      'user',
      JSON.stringify(data.data.user)
    );

    setUser(data.data.user);

    return data.data;
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);