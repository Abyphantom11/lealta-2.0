'use client';

import { useState, useEffect } from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Componente para capturar y manejar errores en React de manera elegante
 * Evita que toda la aplicación falle cuando ocurre un error en un componente
 */
export default function ErrorBoundary({ 
  children, 
  fallback, 
  onError 
}: ErrorBoundaryProps) {
  const [errorState, setErrorState] = useState<ErrorBoundaryState>({
    hasError: false,
    error: null
  });

  useEffect(() => {
    // Función para manejar errores no capturados
    const handleError = (event: ErrorEvent) => {
      event.preventDefault();
      setErrorState({
        hasError: true,
        error: event.error
      });
      
      if (onError && event.error) {
        onError(event.error, { componentStack: '' });
      }
    };

    // Función para manejar rechazos de promesas no capturados
    const handleRejection = (event: PromiseRejectionEvent) => {
      event.preventDefault();
      const error = new Error(`Promise rejection: ${event.reason}`);
      
      setErrorState({
        hasError: true,
        error
      });
      
      if (onError) {
        onError(error, { componentStack: '' });
      }
    };

    // Suscribirse a eventos de error
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    // Limpieza al desmontar
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, [onError]);

  // Función para reintentar (reiniciar el estado de error)
  const resetError = () => {
    setErrorState({ hasError: false, error: null });
  };

  // Si hay un error, mostrar el fallback
  if (errorState.hasError) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h2 className="text-lg font-medium text-red-800 mb-2">
          Algo salió mal
        </h2>
        <p className="text-sm text-red-600 mb-4">
          {errorState.error?.message || 'Ha ocurrido un error inesperado'}
        </p>
        <button
          onClick={resetError}
          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  // Si no hay error, renderizar los hijos normalmente
  return <>{children}</>;
}
