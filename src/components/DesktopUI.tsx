'use client';

import { useElectron, PlatformAware } from './ElectronProvider';
import { Minimize, Square, X, Menu } from 'lucide-react';

export function DesktopTitleBar() {
  const { isElectron, version } = useElectron();

  if (!isElectron) return null;

  return (
    <div className="flex items-center justify-between bg-dark-900 border-b border-dark-700 px-4 py-2 text-sm select-none">
      <div className="flex items-center space-x-2">
        <Menu className="w-4 h-4 text-primary-400" />
        <span className="text-white font-semibold">Lealta MVP</span>
        <span className="text-dark-400">v{version}</span>
      </div>
      
      <div className="flex items-center space-x-1">
        <button
          className="p-1 hover:bg-dark-700 rounded text-dark-400 hover:text-white transition-colors"
          title="Minimizar"
        >
          <Minimize className="w-4 h-4" />
        </button>
        <button
          className="p-1 hover:bg-dark-700 rounded text-dark-400 hover:text-white transition-colors"
          title="Maximizar"
        >
          <Square className="w-4 h-4" />
        </button>
        <button
          className="p-1 hover:bg-red-600 rounded text-dark-400 hover:text-white transition-colors"
          title="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function DesktopNavigation() {
  return (
    <PlatformAware
      desktop={
        <nav className="bg-dark-800 border-r border-dark-700 w-64 min-h-screen">
          <div className="p-4">
            <h2 className="text-white font-bold text-lg mb-4">Navegación</h2>
            <ul className="space-y-2">
              <NavItem href="/admin" label="Dashboard" />
              <NavItem href="/staff" label="Captura Consumos" />
              <NavItem href="/superadmin" label="Super Admin" />
            </ul>
          </div>
        </nav>
      }
    />
  );
}

function NavItem({ href, label }: Readonly<{ href: string; label: string }>) {
  return (
    <li>
      <a
        href={href}
        className="block px-3 py-2 text-dark-300 hover:text-white hover:bg-dark-700 rounded transition-colors"
      >
        {label}
      </a>
    </li>
  );
}
