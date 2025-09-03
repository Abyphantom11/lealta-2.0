'use client';

import React from 'react';
import { motion } from '../motion';

interface LoadingButtonProps {
  readonly isLoading: boolean;
  readonly children: React.ReactNode;
  readonly loadingText?: string;
  readonly className?: string;
  readonly type?: 'button' | 'submit' | 'reset';
  readonly disabled?: boolean;
  readonly onClick?: () => void;
}

export default function LoadingButton({
  isLoading,
  children,
  loadingText = 'Cargando...',
  className = '',
  type = 'button',
  disabled = false,
  onClick,
}: LoadingButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      type={type}
      disabled={disabled || isLoading}
      className={`w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      onClick={onClick}
    >
      {isLoading ? (
        <div className="flex items-center justify-center space-x-2">
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span>{loadingText}</span>
        </div>
      ) : (
        children
      )}
    </motion.button>
  );
}
