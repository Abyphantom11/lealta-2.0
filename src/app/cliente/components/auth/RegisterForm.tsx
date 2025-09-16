'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus } from 'lucide-react';
import { useBranding } from '../branding/BrandingProvider';
import { RegisterFormProps } from './auth.types';
import { clientSession } from '@/utils/mobileStorage';
import { logger } from '@/utils/logger';

export const RegisterForm = ({ 
  setStep, 
  cedula, 
  formData, 
  setFormData, 
  setClienteData 
}: RegisterFormProps) => {
  const { brandingConfig, businessId } = useBranding(); // ✅ OBTENER BUSINESS ID
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre.trim() || !formData.telefono.trim() || !formData.email.trim()) {
      setError('Por favor complete todos los campos');
      return;
    }

    if (!acceptTerms) {
      setError('Debe aceptar los términos y condiciones para continuar');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/cliente/registro', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-business-id': businessId || '' // ✅ AGREGAR BUSINESS ID HEADER
        },
        body: JSON.stringify({
          cedula: cedula.trim(),
          nombre: formData.nombre.trim(),
          telefono: formData.telefono.trim(),
          correo: formData.email.trim()
        })
      });
      const data = await response.json();
      if (response.ok) {
        setClienteData(data.cliente);
        
        // Guardar sesión para cliente recién registrado usando la nueva utilidad
        await clientSession.save(cedula.trim());
        logger.log('💾 Sesión guardada para nuevo cliente:', cedula.trim());
        
        setStep('dashboard');
      } else {
        setError(data.error || 'Error al registrar el cliente');
      }
    } catch (error) {
      console.error('Error registrando cliente:', error);
      setError('Error de conexión. Por favor intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // EXACT COPY of renderRegisterForm() from original
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
          <UserPlus className="w-8 h-8 mx-auto mb-3" style={{ color: brandingConfig.primaryColor }} />
          <h2 className="text-2xl font-bold text-white mb-2">Registro</h2>
          <p className="text-gray-400">Complete sus datos para crear su cuenta</p>
        </div>
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          <div>
            <label htmlFor="reg-cedula" className="block text-sm font-medium text-gray-300 mb-2">
              Cédula
            </label>
            <input
              id="reg-cedula"
              type="text"
              value={cedula}
              disabled
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-gray-400"
            />
          </div>
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-300 mb-2">
              Nombre Completo
            </label>
            <input
              id="nombre"
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData((prev: any) => ({ ...prev, nombre: e.target.value }))}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="Ej: Juan Pérez"
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="telefono" className="block text-sm font-medium text-gray-300 mb-2">
              Teléfono
            </label>
            <input
              id="telefono"
              type="tel"
              value={formData.telefono}
              onChange={(e) => setFormData((prev: any) => ({ ...prev, telefono: e.target.value }))}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="Ej: +1 234 567 8900"
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Correo Electrónico
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData((prev: any) => ({ ...prev, email: e.target.value }))}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="Ej: juan@correo.com"
              disabled={isLoading}
            />
          </div>

          {/* Mensaje informativo sobre uso de datos */}
          <div className="p-4 bg-blue-900/30 border border-blue-700/50 rounded-lg">
            <p className="text-blue-200 text-sm text-center">
              📋 Sus datos serán utilizados para generar factura, premios y notificaciones de eventos!
            </p>
          </div>

          {/* Checkbox de términos y condiciones */}
          <div className="flex items-start space-x-3">
            <input
              id="accept-terms"
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="mt-1 w-4 h-4 text-blue-600 bg-gray-900 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
              disabled={isLoading}
            />
            <label htmlFor="accept-terms" className="text-sm text-gray-300 leading-5">
              Acepto los términos y condiciones
            </label>
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
                <UserPlus className="w-4 h-4" />
                <span>Crear Cuenta</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => setStep('cedula')}
            className="w-full text-gray-400 hover:text-white transition-colors"
          >
            ← Volver
          </button>
        </form>
      </motion.div>
    </div>
  );
};
