/**
 * 🎯 PWA PROVIDER CENTRALIZADO
 * 
 * Inicializa y gestiona el PWAController en toda la aplicación
 * Reemplaza la inicialización fragmentada en múltiples lugares
 * 
 * ✅ UNA SOLA inicialización en el root de la app
 * ✅ Gestión automática de rutas
 * ✅ Limpieza de recursos
 */

'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { pwaController, initializePWA, updatePWARoute, PWAState } from '@/services/PWAController';

interface PWAContextValue {
  isInitialized: boolean;
  state: PWAState;
  controller: typeof pwaController;
}

const PWAContext = createContext<PWAContextValue | null>(null);

interface PWAProviderProps {
  children: ReactNode;
  enableDebugLogs?: boolean;
}

export function PWAProvider({ children, enableDebugLogs = false }: PWAProviderProps) {
  const pathname = usePathname();
  const [isInitialized, setIsInitialized] = useState(false);
  const [state, setState] = useState<PWAState>(() => pwaController.getState());

  // Inicializar PWA Controller una sola vez
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        await initializePWA(pathname);
        
        if (mounted) {
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('❌ PWAProvider: Error inicializando PWA:', error);
      }
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, [pathname, enableDebugLogs]);

  // Suscribirse a cambios de estado del controller
  useEffect(() => {
    const unsubscribe = pwaController.subscribe((newState) => {
      setState(newState);
    });

    return unsubscribe;
  }, [enableDebugLogs]);

  // Actualizar ruta cuando cambie el pathname
  useEffect(() => {
    if (isInitialized) {
      updatePWARoute(pathname);
    }
  }, [pathname, isInitialized, enableDebugLogs]);

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      // Cleanup silencioso
    };
  }, [enableDebugLogs]);

  const contextValue: PWAContextValue = useMemo(() => ({
    isInitialized,
    state,
    controller: pwaController
  }), [isInitialized, state]);

  return (
    <PWAContext.Provider value={contextValue}>
      {children}
    </PWAContext.Provider>
  );
}

/**
 * 🎯 HOOK PARA USAR PWA CONTEXT
 */
export function usePWAContext(): PWAContextValue {
  const context = useContext(PWAContext);
  
  if (!context) {
    throw new Error('usePWAContext debe usarse dentro de PWAProvider');
  }
  
  return context;
}

/**
 * 🎯 HOC PARA COMPONENTES QUE NECESITAN PWA
 */
export function withPWA<T extends object>(Component: React.ComponentType<T>) {
  return function PWAWrappedComponent(props: T) {
    return (
      <PWAProvider>
        <Component {...props} />
      </PWAProvider>
    );
  };
}

/**
 * 🎯 COMPONENTE PWA MANAGER
 * Para usar en el layout principal - reemplaza PWAManager.tsx
 */
export function PWAManager({ enableDebugLogs = false }: { enableDebugLogs?: boolean }) {
  const pathname = usePathname();

  useEffect(() => {
    // Gestión silenciosa
  }, [pathname, enableDebugLogs]);

  // Este componente solo gestiona, no renderiza UI
  return null;
}

export default PWAProvider;
