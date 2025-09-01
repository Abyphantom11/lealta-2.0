'use client';

import React from 'react';
import { motion } from '../motion';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

type AlertType = 'error' | 'success' | 'info' | 'warning';

interface AlertMessageProps {
  readonly type: AlertType;
  readonly message: string | null;
  readonly className?: string;
}

export default function AlertMessage({ type, message, className = '' }: AlertMessageProps) {
  if (!message) return null;

  const config = {
    error: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      text: 'text-red-400',
      icon: <AlertTriangle className="w-4 h-4" />
    },
    success: {
      bg: 'bg-green-500/10',
      border: 'border-green-500/20',
      text: 'text-green-400',
      icon: <CheckCircle className="w-4 h-4" />
    },
    info: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      text: 'text-blue-400',
      icon: <Info className="w-4 h-4" />
    },
    warning: {
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/20',
      text: 'text-yellow-400',
      icon: <AlertTriangle className="w-4 h-4" />
    }
  };

  const style = config[type];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`${style.bg} border ${style.border} rounded-lg p-3 ${style.text} text-sm ${className}`}
    >
      <div className="flex items-center">
        <span className="mr-2">{style.icon}</span>
        <span>{message}</span>
      </div>
    </motion.div>
  );
}
