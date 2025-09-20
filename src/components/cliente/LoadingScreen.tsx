'use client';

import React from 'react';

interface LoadingScreenProps {
  show: boolean;
  message?: string;
}

/**
 * Pantalla de carga optimizada que solo aparece cuando no hay configuración
 * Evita el "flash" de contenido por defecto antes de cargar datos reales
 */
export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  show, 
  message = 'Cargando configuración...' 
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-300 text-lg font-medium">{message}</p>
        <p className="text-gray-500 text-sm mt-2">Preparando tu experiencia personalizada</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
