'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from './motion';
import { ChevronDown, Shield, UserCog, Users, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { createPortal } from 'react-dom';

interface RoleSwitchProps {
  readonly currentRole: 'SUPERADMIN' | 'ADMIN' | 'STAFF';
  readonly currentPath: string;
}

export default function RoleSwitch({
  currentRole,
  currentPath,
}: RoleSwitchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const { user, logout } = useAuth();

  // Determinar el rol real del usuario desde la sesión
  const userActualRole = user?.role || currentRole;

  // Calcular posición del dropdown
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.right - 256, // 256px es el ancho del dropdown (w-64)
      });
    }
  }, [isOpen]);

  // Cerrar dropdown cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

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

  // Filtrar opciones según el rol real del usuario
  const getAvailableRoles = () => {
    if (userActualRole === 'SUPERADMIN') {
      return allRoleOptions; // SUPERADMIN puede ver todas las opciones
    } else if (userActualRole === 'ADMIN') {
      return allRoleOptions.filter(option => option.role !== 'SUPERADMIN'); // ADMIN solo ve ADMIN y STAFF
    } else {
      return allRoleOptions.filter(option => option.role === 'STAFF'); // STAFF solo ve STAFF
    }
  };

  const roleOptions = getAvailableRoles();

  const getCurrentRoleOption = () => {
    if (currentPath.includes('/superadmin')) return allRoleOptions[0];
    if (currentPath.includes('/admin')) return allRoleOptions[1];
    if (currentPath.includes('/staff')) return allRoleOptions[2];
    return allRoleOptions[userActualRole === 'SUPERADMIN' ? 0 : userActualRole === 'ADMIN' ? 1 : 2];
  };

  const currentOption = getCurrentRoleOption();

  const handleRoleSwitch = (path: string) => {
    router.push(path);
    setIsOpen(false);
  };

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  return (
    <>
      <div className="relative">
        <button
          ref={buttonRef}
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-xl text-white hover:bg-gray-700/50 transition-all"
        >
          <currentOption.icon className="w-4 h-4" />
          <span className="text-sm font-medium">{currentOption.label}</span>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Portal para el dropdown */}
      {isOpen && typeof window !== 'undefined' && createPortal(
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="fixed bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-[9999] w-64"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
          }}
        >
          <div className="p-2">
            <div className="text-xs text-gray-400 px-3 py-2 border-b border-gray-700">
              {userActualRole === 'SUPERADMIN'
                ? 'Cambiar vista como SuperAdmin'
                : userActualRole === 'ADMIN'
                ? 'Cambiar vista como Admin'
                : 'Opciones de Staff'}
            </div>
            
            {/* Opciones de roles disponibles */}
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

            {/* Separador y opción de cerrar sesión - solo para STAFF o cuando esté en vista STAFF */}
            {(userActualRole === 'STAFF' || currentPath.includes('/staff')) && (
              <>
                <div className="border-t border-gray-700 my-2"></div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-3 rounded-lg text-red-300 hover:bg-red-900/20 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <LogOut className="w-4 h-4" />
                    <div>
                      <div className="text-sm font-medium">Cerrar Sesión</div>
                      <div className="text-xs text-gray-500">
                        Salir del sistema
                      </div>
                    </div>
                  </div>
                </button>
              </>
            )}
          </div>
        </motion.div>,
        document.body
      )}
    </>
  );
}
