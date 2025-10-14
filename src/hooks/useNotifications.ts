// Mock hook para testing
export function useNotifications() {
  return {
    notifications: [],
    addNotification: () => {},
    removeNotification: () => {},
    clearNotifications: () => {}
  };
}
