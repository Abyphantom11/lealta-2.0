'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from './motion';
import { ChevronDown, Shield, UserCog, Users, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface RoleSwitchProps {
  readonly currentRole: 'SUPERADMIN' | 'ADMIN' | 'STAFF';
  readonly currentPath: string;
  readonly businessId?: string; // Nuevo prop para el businessId
}

export default function RoleSwitch({
  currentRole,
  currentPath,
  businessId,
}: RoleSwitchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const { user, logout } = useAuth();

  // Asegurar que el componente esté montado para React Portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Determinar el rol real del usuario desde la sesión
  const userActualRole = user?.role || currentRole;

  // Debug inicial - eliminar después
  console.log('🔍 RoleSwitch Debug:', {
    userActualRole,
    currentRole,
    currentPath,
    businessId,
    userFromAuth: user?.role
  });

  console.log('🔧 RoleSwitch está renderizando... Rol actual:', userActualRole);

  // Cerrar dropdown cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (buttonRef.current?.contains(event.target as Node)) return;
      
      // Verificar si el click es dentro del dropdown (que ahora está en portal)
      const dropdownElement = document.querySelector('[data-role-switch-dropdown]');
      if (!dropdownElement?.contains(event.target as Node)) {
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
      path: businessId ? `/${businessId}/superadmin` : '/superadmin',
      description: 'Gestión completa del sistema',
    },
    {
      role: 'ADMIN',
      label: 'Admin',
      icon: UserCog,
      path: businessId ? `/${businessId}/admin` : '/admin',
      description: 'Vista de administrador',
    },
    {
      role: 'STAFF',
      label: 'Staff',
      icon: Users,
      path: businessId ? `/${businessId}/staff` : '/staff',
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

  // Debug después de declarar roleOptions - eliminar después
  console.log('🎭 Opciones de roles disponibles:', roleOptions.map(r => r.role));

  const getCurrentRoleOption = () => {
    // Si hay businessId, verificar rutas con businessId
    if (businessId) {
      if (currentPath.includes(`/${businessId}/superadmin`)) return allRoleOptions[0];
      if (currentPath.includes(`/${businessId}/admin`)) return allRoleOptions[1];
      if (currentPath.includes(`/${businessId}/staff`)) return allRoleOptions[2];
    }
    
    // Fallback para rutas sin businessId
    if (currentPath.includes('/superadmin')) return allRoleOptions[0];
    if (currentPath.includes('/admin')) return allRoleOptions[1];
    if (currentPath.includes('/staff')) return allRoleOptions[2];
    
    // Fallback basado en el rol del usuario
    switch (userActualRole) {
      case 'SUPERADMIN': return allRoleOptions[0];
      case 'ADMIN': return allRoleOptions[1];
      default: return allRoleOptions[2];
    }
  };

  const currentOption = getCurrentRoleOption();

  // Debug completo después de todas las declaraciones
  console.log('🎭 Component rendering with:', {
    roleOptions: roleOptions.map(r => r.role),
    currentOption: currentOption?.role,
    hasUser: !!user
  });

  // Fallback si no hay currentOption
  if (!currentOption) {
    console.error('❌ No currentOption found, using Staff as fallback');
    const fallbackOption = allRoleOptions[2]; // Staff

    return (
      <div className="relative" style={{ zIndex: 99998 }}>
        <button className="flex items-center space-x-2 px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-xl text-white">
          <fallbackOption.icon className="w-4 h-4" />
          <span className="text-sm font-medium">{fallbackOption.label}</span>
        </button>
      </div>
    );
  }

  const handleToggleDropdown = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.right - 256 // 256px es el ancho del dropdown
      });
    }
    setIsOpen(!isOpen);
  };

  const handleRoleSwitch = (path: string) => {
    console.log('🚀 handleRoleSwitch called with path:', path);
    console.log('🔍 Router object:', router);
    console.log('🌐 Current window location:', window.location.href);

    try {
      router.push(path);
      console.log('✅ router.push executed successfully');
    } catch (error) {
      console.error('❌ Error en router.push:', error);
      console.log('🔄 Fallback: using window.location');
      window.location.href = path;
    }

    setIsOpen(false);
  };

  const handleLogout = () => {
    console.log('🚪 handleLogout called');
    logout();
    setIsOpen(false);
  };

  const getDropdownTitle = () => {
    switch (userActualRole) {
      case 'SUPERADMIN': return 'Cambiar vista como SuperAdmin';
      case 'ADMIN': return 'Cambiar vista como Admin';
      default: return 'Opciones de Staff';
    }
  };

  return (
    <div className="relative" style={{ zIndex: 99998 }}>
      <button
        ref={buttonRef}
        onClick={handleToggleDropdown}
        className="flex items-center space-x-2 px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-xl text-white hover:bg-gray-700/50 transition-all"
        style={{ minWidth: '120px', backgroundColor: 'rgba(55, 65, 81, 0.8)' }} // Debug visibility
      >
        <currentOption.icon className="w-4 h-4" />
        <span className="text-sm font-medium">{currentOption.label}</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown usando React Portal para garantizar z-index */}
      {isOpen && mounted && createPortal(
        <motion.div
          data-role-switch-dropdown
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="fixed bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-64"
          style={{
            zIndex: 999999,
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            pointerEvents: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-2">
            <div className="text-xs text-gray-400 px-3 py-2 border-b border-gray-700">
              {getDropdownTitle()}
            </div>
            
            {/* Opciones de roles disponibles */}
            {roleOptions.map(option => (
              <button
                key={option.role}
                onClick={() => {
                  console.log('🎯 Click en opción:', option.role, 'path:', option.path);
                  handleRoleSwitch(option.path);
                }}
                type="button"
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

            {/* Separador y opción de cerrar sesión - para usuarios staff o cuando cualquier usuario esté en vista STAFF */}
            {(userActualRole === 'STAFF' || currentPath.includes('/staff')) && (
              <>
                <div className="border-t border-gray-700 my-2"></div>
                <button
                  onClick={() => {
                    console.log('🚪 Click en logout');
                    handleLogout();
                  }}
                  type="button"
                  className="w-full text-left px-3 py-3 rounded-lg text-red-300 hover:bg-red-900/20 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <LogOut className="w-4 h-4" />
                    <div>
                      <div className="text-sm font-medium">Cerrar Sesión</div>
                      <div className="text-xs text-gray-500">
                        {userActualRole === 'STAFF' ? 'Salir del sistema' : 'Salir de vista Staff'}
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
    </div>
  );
}
