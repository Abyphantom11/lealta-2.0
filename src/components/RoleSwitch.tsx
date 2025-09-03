'use client';

import { useState } from 'react';
import { motion } from './motion';
import { ChevronDown, Shield, UserCog, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface RoleSwitchProps {
  readonly currentRole: 'SUPERADMIN' | 'ADMIN' | 'STAFF';
  readonly currentPath: string;
}

export default function RoleSwitch({
  currentRole,
  currentPath,
}: RoleSwitchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  // Solo mostrar el switch si es SUPERADMIN o ADMIN
  if (currentRole === 'STAFF') {
    return null;
  }

  const allRoleOptions = [
    {
      role: 'SUPERADMIN',
      label: 'Super Admin',
      icon: Shield,
      path: '/superadmin',
      description: 'Gestión completa del sistema',
    },
    {
      role: 'ADMIN',
      label: 'Admin',
      icon: UserCog,
      path: '/admin',
      description: 'Vista de administrador',
    },
    {
      role: 'STAFF',
      label: 'Staff',
      icon: Users,
      path: '/staff',
      description: 'Vista de personal',
    },
  ];

  // Filtrar opciones según el rol actual
  const roleOptions =
    currentRole === 'SUPERADMIN'
      ? allRoleOptions // SUPERADMIN puede ver todas las opciones
      : allRoleOptions.filter(option => option.role !== 'SUPERADMIN'); // ADMIN solo ve ADMIN y STAFF

  const getCurrentRoleOption = () => {
    if (currentPath.includes('/superadmin')) return allRoleOptions[0];
    if (currentPath.includes('/admin')) return allRoleOptions[1];
    if (currentPath.includes('/staff')) return allRoleOptions[2];
    return allRoleOptions[currentRole === 'SUPERADMIN' ? 0 : 1];
  };

  const currentOption = getCurrentRoleOption();

  const handleRoleSwitch = (path: string) => {
    router.push(path);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-xl text-white hover:bg-gray-700/50 transition-all"
      >
        <currentOption.icon className="w-4 h-4" />
        <span className="text-sm font-medium">{currentOption.label}</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-full right-0 mt-2 w-64 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50"
        >
          <div className="p-2">
            <div className="text-xs text-gray-400 px-3 py-2 border-b border-gray-700">
              {currentRole === 'SUPERADMIN'
                ? 'Cambiar vista como SuperAdmin'
                : 'Cambiar vista como Admin'}
            </div>
            {roleOptions.map(option => (
              <button
                key={option.role}
                onClick={() => handleRoleSwitch(option.path)}
                className={`w-full text-left px-3 py-3 rounded-lg transition-colors ${
                  currentOption.role === option.role
                    ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <option.icon className="w-4 h-4" />
                  <div>
                    <div className="text-sm font-medium">{option.label}</div>
                    <div className="text-xs text-gray-500">
                      {option.description}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
