'use client';

import { useState, useEffect, createContext, useContext, useCallback, ReactNode, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// Tipos de notificación
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  success: (title: string, message?: string) => string;
  error: (title: string, message?: string) => string;
  warning: (title: string, message?: string) => string;
  info: (title: string, message?: string) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Generador de IDs únicos
let toastId = 0;
const generateId = () => `toast-${++toastId}-${Date.now()}`;

// Iconos por tipo
const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

// Estilos por tipo
const styles = {
  success: {
    bg: 'bg-gradient-to-r from-green-500/20 to-emerald-500/20',
    border: 'border-green-500/50',
    icon: 'text-green-400',
    title: 'text-green-300',
  },
  error: {
    bg: 'bg-gradient-to-r from-red-500/20 to-rose-500/20',
    border: 'border-red-500/50',
    icon: 'text-red-400',
    title: 'text-red-300',
  },
  warning: {
    bg: 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20',
    border: 'border-yellow-500/50',
    icon: 'text-yellow-400',
    title: 'text-yellow-300',
  },
  info: {
    bg: 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20',
    border: 'border-blue-500/50',
    icon: 'text-blue-400',
    title: 'text-blue-300',
  },
};

// Componente individual de Toast con forwardRef para AnimatePresence
const ToastItem = forwardRef<HTMLDivElement, { toast: Toast; onRemove: () => void }>(
  function ToastItem({ toast, onRemove }, ref) {
    const style = styles[toast.type];
    const Icon = icons[toast.type];

    useEffect(() => {
      if (toast.duration !== 0) {
        const timer = setTimeout(onRemove, toast.duration || 5000);
        return () => clearTimeout(timer);
      }
    }, [toast.duration, onRemove]);

    return (
      <motion.div
        ref={ref}
        layout
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, x: 100, scale: 0.95 }}
        className={`
          relative flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-2xl
          ${style.bg} ${style.border}
          min-w-[320px] max-w-[420px]
        `}
      >
        <div className={`flex-shrink-0 ${style.icon}`}>
          <Icon className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm ${style.title}`}>
            {toast.title}
          </p>
          {toast.message && (
            <p className="text-slate-300 text-sm mt-1 leading-relaxed">
              {toast.message}
            </p>
          )}
          {toast.action && (
            <button
              onClick={() => {
                toast.action?.onClick();
                onRemove();
              }}
              className="mt-2 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
            >
              {toast.action.label}
            </button>
          )}
        </div>

        <button
          onClick={onRemove}
          className="flex-shrink-0 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </motion.div>
    );
  }
);

// Provider del contexto de Toast
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = generateId();
    setToasts((prev) => [...prev, { ...toast, id }]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((title: string, message?: string) => {
    return addToast({ type: 'success', title, message });
  }, [addToast]);

  const error = useCallback((title: string, message?: string) => {
    return addToast({ type: 'error', title, message, duration: 7000 });
  }, [addToast]);

  const warning = useCallback((title: string, message?: string) => {
    return addToast({ type: 'warning', title, message, duration: 6000 });
  }, [addToast]);

  const info = useCallback((title: string, message?: string) => {
    return addToast({ type: 'info', title, message });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
      {children}
      
      {/* Container de Toasts */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <ToastItem
              key={toast.id}
              toast={toast}
              onRemove={() => removeToast(toast.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

// Hook para usar el toast
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe ser usado dentro de un ToastProvider');
  }
  return context;
}

// Exportar para uso standalone (sin provider)
export const toast = {
  _toasts: [] as Toast[],
  _listeners: new Set<(toasts: Toast[]) => void>(),

  _notify() {
    this._listeners.forEach((listener) => listener([...this._toasts]));
  },

  success(title: string, message?: string) {
    const id = generateId();
    this._toasts.push({ id, type: 'success', title, message });
    this._notify();
    setTimeout(() => this.dismiss(id), 5000);
    return id;
  },

  error(title: string, message?: string) {
    const id = generateId();
    this._toasts.push({ id, type: 'error', title, message });
    this._notify();
    setTimeout(() => this.dismiss(id), 7000);
    return id;
  },

  warning(title: string, message?: string) {
    const id = generateId();
    this._toasts.push({ id, type: 'warning', title, message });
    this._notify();
    setTimeout(() => this.dismiss(id), 6000);
    return id;
  },

  info(title: string, message?: string) {
    const id = generateId();
    this._toasts.push({ id, type: 'info', title, message });
    this._notify();
    setTimeout(() => this.dismiss(id), 5000);
    return id;
  },

  dismiss(id: string) {
    this._toasts = this._toasts.filter((t) => t.id !== id);
    this._notify();
  },

  subscribe(listener: (toasts: Toast[]) => void) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  },
};
