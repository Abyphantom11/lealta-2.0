// Contexto para la administración
'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useMenu, useClients, useStats, useConfig } from '../hooks';
import { MenuContextType } from '../../../types/admin/menu';
import { ClientesContextType } from '../../../types/admin/clients';
import { StatsContextType } from '../../../types/admin/stats';
import { ConfigContextType } from '../../../types/admin/config';

// Definir la interfaz para el contexto de administración
interface AdminContextType {
  menu: MenuContextType;
  clients: ClientesContextType;
  stats: StatsContextType;
  config: ConfigContextType;
}

// Crear el contexto
const AdminContext = createContext<AdminContextType | undefined>(undefined);

// Hook personalizado para usar el contexto de administración
export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}

// Proveedor del contexto de administración
export function AdminProvider({ children }: Readonly<{ children: ReactNode }>) {
  // Inicializar los hooks
  const menu = useMenu();
  const clients = useClients();
  const stats = useStats();
  const config = useConfig();

  // Valor del contexto memoizado para evitar renderizados innecesarios
  const value = React.useMemo(() => ({
    menu,
    clients,
    stats,
    config
  }), [menu, clients, stats, config]);

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
}
