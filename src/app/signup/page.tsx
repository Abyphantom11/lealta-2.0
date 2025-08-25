'use client';

import { useState } from 'react';
import { motion } from '../../components/motion';
import { Building, Mail, Lock, Eye, EyeOff, User, Phone, Globe, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    // Datos de la empresa
    businessName: '',
    subdomain: '',
    contactEmail: '',
    contactPhone: '',
    
    // Datos del SuperAdmin
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validaciones básicas
    if (formData.adminPassword !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (response.ok) {
        // Redirigir al login con mensaje de éxito
        window.location.href = '/login?message=Empresa registrada exitosamente';
      } else {
        setError(data.error || 'Error al registrar la empresa');
      }
    } catch (error) {
      console.error('Error de conexión:', error);
      setError('Error de conexión: No se pudo procesar la solicitud');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center text-dark-400 hover:text-white mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al inicio
          </Link>
          
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full flex items-center justify-center"
          >
            <Building className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Registrar <span className="gradient-primary bg-clip-text text-transparent">Empresa</span>
          </h1>
          <p className="text-dark-400">
            Crea tu cuenta y comienza a gestionar tu negocio
          </p>
        </div>

        {/* Signup Form */}
        <motion.form 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          onSubmit={handleSubmit}
          className="premium-card space-y-6"
        >
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm text-center"
            >
              {error}
            </motion.div>
          )}

          {/* Sección: Datos de la Empresa */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-dark-700 pb-2">
              Información de la Empresa
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  <Building className="w-4 h-4 inline mr-2" />
                  Nombre de la Empresa
                </label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="Mi Restaurante"
                  value={formData.businessName}
                  onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  <Globe className="w-4 h-4 inline mr-2" />
                  Subdominio
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    className="form-input pl-4 pr-32"
                    placeholder="mi-restaurante"
                    value={formData.subdomain}
                    onChange={(e) => setFormData({...formData, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})}
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-400 text-sm">
                    .lealta.com
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email de Contacto
                </label>
                <input
                  type="email"
                  required
                  className="form-input"
                  placeholder="contacto@mirestaurante.com"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Teléfono
                </label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="+1234567890"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({...formData, contactPhone: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Sección: Datos del SuperAdmin */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-dark-700 pb-2">
              Datos del Administrador
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="Juan Pérez"
                  value={formData.adminName}
                  onChange={(e) => setFormData({...formData, adminName: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email del Admin
                </label>
                <input
                  type="email"
                  required
                  className="form-input"
                  placeholder="admin@mirestaurante.com"
                  value={formData.adminEmail}
                  onChange={(e) => setFormData({...formData, adminEmail: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  <Lock className="w-4 h-4 inline mr-2" />
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="form-input pr-12"
                    placeholder="••••••••"
                    value={formData.adminPassword}
                    onChange={(e) => setFormData({...formData, adminPassword: e.target.value})}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-400 hover:text-dark-300"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  <Lock className="w-4 h-4 inline mr-2" />
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    className="form-input pr-12"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-400 hover:text-dark-300"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Registrando empresa...</span>
              </div>
            ) : (
              'Registrar Empresa'
            )}
          </motion.button>
        </motion.form>

        {/* Login Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 text-center"
        >
          <p className="text-dark-400">
            ¿Ya tienes una cuenta?{' '}
            <Link href="/login" className="text-primary-400 hover:text-primary-300 font-medium">
              Inicia sesión aquí
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
