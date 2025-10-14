// Custom hook for notifications management

import { useState, useCallback } from 'react';
import { NotificationType } from '../types/staff.types';

export const useNotifications = () => {
  const [notification, setNotification] = useState<NotificationType>(null);

  const showNotification = useCallback(
    (type: 'success' | 'error' | 'info', message: string) => {
      setNotification({ type, message });
      setTimeout(() => setNotification(null), 5000);
    },
    []
  );

  const hideNotification = useCallback(() => {
    setNotification(null);
  }, []);

  return {
    notification,
    showNotification,
    hideNotification,
  };
};
