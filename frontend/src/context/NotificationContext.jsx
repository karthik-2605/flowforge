import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import {
  getNotifications,
  markRead as apiMarkRead,
  markAllRead as apiMarkAllRead,
} from '../api/notifications.api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const refetch = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await getNotifications();
      setItems(data.data.items);
      setUnreadCount(data.data.unreadCount);
    } catch {
      // interceptor surfaces the error
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setItems([]);
      setUnreadCount(0);
      return;
    }

    refetch();
    const interval = setInterval(refetch, 15000);
    return () => clearInterval(interval);
  }, [user, refetch]);

  const markRead = async (id) => {
    await apiMarkRead(id);
    await refetch();
  };

  const markAllRead = async () => {
    await apiMarkAllRead();
    await refetch();
  };

  return (
    <NotificationContext.Provider
      value={{ items, unreadCount, refetch, markRead, markAllRead }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
