'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useBranding } from '../branding/BrandingProvider';
import { CedulaFormProps } from './auth.types';
import { clientSession, levelStorage } from '@/utils/mobileStorage';
import { logger } from '@/utils/logger';

export const CedulaForm = ({ 
  setStep, 
  cedula, 
  setCedula, 
  setClienteData 
}: CedulaFormProps) => {
  const { brandingConfig } = useBranding();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCedulaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cedula.trim()) {
      setError('Por favor ingrese su cédula');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      // Verificar si el cliente existe
      const response = await fetch('/api/cliente/verificar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cedula: cedula.trim() })
      });
      const data = await response.json();
      if (response.ok && data.existe) {
        // Cliente existe, redirigir al dashboard
        setClienteData(data.cliente);
        
        // Guardar sesión usando la nueva utilidad
        await clientSession.save(cedula.trim());
        logger.log('💾 Sesión guardada para:', cedula.trim());
        
        // Verificar si hay un cambio de nivel de tarjeta
        const clientLevel = data.cliente.tarjetaLealtad?.nivel || 'Bronce';
        
        // Intentar recuperar el último nivel conocido
        const storedLevel = levelStorage.load(data.cliente.cedula);
        
        if (storedLevel && clientLevel !== storedLevel) {
          // Hay un ascenso de nivel - por ahora solo logging
          logger.log('🎉 Ascenso de nivel detectado:', { from: storedLevel, to: clientLevel });
          // TODO: Implementar sistema de notificación de ascenso de nivel
        }
        
        // Guardar el nivel actual
        levelStorage.save(data.cliente.cedula, clientLevel);
        
        setStep('dashboard');
      } else {
        // Cliente no existe, mostrar formulario de registro
        setStep('register');
      }
    } catch (error) {
      console.error('Error verificando cliente:', error);
      setError('Error de conexión. Por favor intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // EXACT COPY of renderCedulaForm() from original
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <motion.div 
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <span className="text-white font-bold text-xl">{brandingConfig.businessName}</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Bienvenido</h2>
          <p className="text-gray-400">Ingrese su cédula para continuar</p>
        </div>
        <form onSubmit={handleCedulaSubmit} className="space-y-6">
          <div>
            <label htmlFor="cedula" className="block text-sm font-medium text-gray-300 mb-2">
              Número de Cédula
            </label>
            <input
              id="cedula"
              type="text"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none transition-colors"
              style={{
                '--focus-color': brandingConfig.primaryColor,
              } as React.CSSProperties}
              onFocus={(e) => {
                e.target.style.borderColor = brandingConfig.primaryColor;
                e.target.style.boxShadow = `0 0 0 3px ${brandingConfig.primaryColor}33`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#374151';
                e.target.style.boxShadow = 'none';
              }}
              placeholder="Ej: 12345678"
              disabled={isLoading}
            />
          </div>
          {error && (
            <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full disabled:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            style={{ 
              backgroundColor: isLoading ? '#4B5563' : brandingConfig.primaryColor,
              boxShadow: isLoading ? 'none' : `0 4px 14px 0 ${brandingConfig.primaryColor}33`
            }}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Continuar</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};
