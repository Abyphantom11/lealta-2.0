'use client';

import React from 'react';
import { ApiProvider } from '@/contexts/ApiContext';
import ErrorBoundary from '@/components/ErrorBoundary';

interface ClienteLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout compartido para la sección de cliente
 * Proporciona contexto de API y manejo de errores
 */
export default function ClienteLayout({ children }: ClienteLayoutProps) {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Aquí podemos agregar logging a un servicio de monitoreo como Sentry
    console.error('Error en cliente:', error, errorInfo);
  };

  const ErrorFallback = (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-dark-800/70 backdrop-blur-sm border border-dark-700 rounded-xl p-8 shadow-xl">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-red-400">Algo salió mal</h2>
          <p className="text-dark-400 mt-2">
            Tuvimos un problema al procesar tu solicitud. Por favor, intenta nuevamente.
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="w-full btn-primary"
        >
          Reintentar
        </button>
      </div>
    </div>
  );

  return (
    <ErrorBoundary onError={handleError} fallback={ErrorFallback}>
      <ApiProvider>
        {children}
      </ApiProvider>
    </ErrorBoundary>
  );
}
