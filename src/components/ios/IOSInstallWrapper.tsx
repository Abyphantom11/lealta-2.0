'use client';

import { useState, useEffect } from 'react';
import IOSInstallGuide from './IOSInstallGuide';

interface IOSInstallWrapperProps {
  readonly businessName: string;
}

/**
 * Wrapper que detecta cuando el usuario inicia sesión
 * y muestra la guía de instalación iOS solo después del login
 * 
 * ✅ Escucha el evento personalizado 'client-logged-in'
 * ✅ Solo muestra la guía después de autenticación exitosa
 * ✅ Mantiene el estado de login en sessionStorage
 */
export default function IOSInstallWrapper({ businessName }: IOSInstallWrapperProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Verificar si ya hay una sesión activa al montar
    const checkExistingSession = () => {
      // Verificar si hay datos de cliente en sessionStorage
      const hasSession = sessionStorage.getItem('cliente-session') !== null;
      
      // O verificar si hay un cedula guardada (indicador de sesión activa)
      const hasCedula = sessionStorage.getItem('cedula') !== null;
      
      if (hasSession || hasCedula) {
        setIsLoggedIn(true);
      }
    };

    checkExistingSession();

    // Escuchar evento de login exitoso
    const handleLoginSuccess = () => {
      setIsLoggedIn(true);
    };

    // Escuchar evento de logout
    const handleLogout = () => {
      setIsLoggedIn(false);
    };

    // Agregar listeners para eventos personalizados
    window.addEventListener('client-logged-in', handleLoginSuccess);
    window.addEventListener('client-logged-out', handleLogout);

    // Cleanup
    return () => {
      window.removeEventListener('client-logged-in', handleLoginSuccess);
      window.removeEventListener('client-logged-out', handleLogout);
    };
  }, []);

  // Solo renderizar IOSInstallGuide cuando el usuario esté autenticado
  return (
    <IOSInstallGuide 
      businessName={businessName} 
      showAutomatically={true}
      isUserLoggedIn={isLoggedIn}
    />
  );
}
