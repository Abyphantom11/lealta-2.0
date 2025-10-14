'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

interface NotificationProps {
  notification: {
    type: 'success' | 'error' | 'info';
    message: string;
  } | null;
  onClose: () => void;
}

export const NotificationBar = ({ notification, onClose }: NotificationProps) => {
  if (!notification) return null;

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'error':
        return <AlertCircle className="w-5 h-5" />;
      case 'info':
        return <Info className="w-5 h-5" />;
    }
  };

  const getClasses = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-900/90 border-green-600 text-green-200';
      case 'error':
        return 'bg-red-900/90 border-red-600 text-red-200';
      case 'info':
        return 'bg-blue-900/90 border-blue-600 text-blue-200';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className={`fixed top-4 right-4 z-50 p-4 border-l-4 rounded-lg shadow-lg backdrop-blur-sm ${getClasses()}`}
      >
        <div className="flex items-center space-x-3">
          {getIcon()}
          <p className="font-medium">{notification.message}</p>
          <button
            onClick={onClose}
            className="ml-4 opacity-70 hover:opacity-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
