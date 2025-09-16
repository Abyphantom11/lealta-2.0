'use client';

import { useState } from 'react';
import { motion } from '../../components/motion';
import {
  Building,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  Globe,
  ArrowLeft,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Star,
  Zap,
  Shield,
} from 'lucide-react';
import Link from 'next/link';
import { LealtaLogo } from '../../components/LealtaLogo';
import { EmailVerificationModal } from '../../components/EmailVerificationModal';

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
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Estados para verificación de email
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [verificationId, setVerificationId] = useState('');
  const [requireVerification] = useState(false); // 🚫 TEMPORALMENTE DESACTIVADO - Reactivar después del lanzamiento

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

    // Verificar email si está activada la verificación
    if (requireVerification && !emailVerified) {
      setError('');
      setShowVerificationModal(true);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          emailVerified,
          verificationId,
        }),
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

  const handleEmailVerified = (verificationIdFromModal: string) => {
    setEmailVerified(true);
    setVerificationId(verificationIdFromModal);
    setShowVerificationModal(false);
    
    // Auto-submit el formulario después de verificar
    setTimeout(() => {
      const form = document.querySelector('form');
      if (form) {
        const event = new Event('submit', { bubbles: true, cancelable: true });
        form.dispatchEvent(event);
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex items-center justify-center p-4">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2" />
      </div>

      <div className="relative w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left Column - Benefits */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-8"
        >
          <div>
            <LealtaLogo size={60} className="mb-6" animated />
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                lealta
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Transforma
              </span>
              <br />
              tu negocio hoy
            </h1>
            <p className="text-xl text-gray-400 mb-8">
              Plataforma de inteligencia comercial diseñada para escalar sin límites
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <span className="text-gray-300">14 días gratis, sin tarjeta de crédito</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-gray-300">Setup en 24 horas</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center">
                <Star className="w-5 h-5 text-white" />
              </div>
              <span className="text-gray-300">IA y análisis predictivo incluido</span>
            </div>
          </div>
        </motion.div>

        {/* Right Column - Form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="text-center mb-6">
            <Link
              href="/"
              className="inline-flex items-center text-gray-400 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al inicio
            </Link>
            <h2 className="text-2xl font-bold text-white mb-2">Registrar</h2>
            <p className="text-gray-400">Crea tu cuenta y comienza a gestionar tu negocio</p>
          </div>

          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            onSubmit={handleSubmit}
            className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 space-y-6 shadow-2xl"
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
            <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">
              Información de la Empresa
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Building className="w-4 h-4 inline mr-2" />
                  Nombre de la Empresa
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Mi Restaurante"
                  value={formData.businessName}
                  onChange={e =>
                    setFormData({ ...formData, businessName: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Globe className="w-4 h-4 inline mr-2" />
                  Subdominio
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 pr-32"
                    placeholder="mi-restaurante"
                    value={formData.subdomain}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        subdomain: e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]/g, ''),
                      })
                    }
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                    .lealta.com
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email de Contacto
                </label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="contacto@mirestaurante.com"
                  value={formData.contactEmail}
                  onChange={e =>
                    setFormData({ ...formData, contactEmail: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Teléfono
                </label>
                <input
                  type="tel"
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="09xxxxxxxx"
                  value={formData.contactPhone}
                  onChange={e => {
                    // Solo permitir números y algunos caracteres especiales como +, -, (, ), espacios
                    const phoneValue = e.target.value.replace(/[^0-9+\-() ]/g, '');
                    setFormData({ ...formData, contactPhone: phoneValue });
                  }}
                  maxLength={15}
                />
              </div>
            </div>
          </div>

          {/* Sección: Datos del SuperAdmin */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">
              Datos del Administrador
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Juan Pérez"
                  value={formData.adminName}
                  onChange={e =>
                    setFormData({ ...formData, adminName: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email del Admin
                </label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="admin@mirestaurante.com"
                  value={formData.adminEmail}
                  onChange={e =>
                    setFormData({ ...formData, adminEmail: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Lock className="w-4 h-4 inline mr-2" />
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 pr-12"
                    placeholder="••••••••"
                    value={formData.adminPassword}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        adminPassword: e.target.value,
                      })
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Lock className="w-4 h-4 inline mr-2" />
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 pr-12"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
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
            className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Creando tu cuenta...</span>
              </div>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Comenzar Prueba Gratuita de 14 Días
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </motion.button>

          {/* Trust indicators */}
          <div className="text-center mt-4">
            <p className="text-xs text-gray-400">
              Sin tarjeta de crédito • Configuración automática • Acceso inmediato
            </p>
            
            {/* Email verification status */}
            {requireVerification && (
              <div className="flex items-center justify-center mt-2 text-xs">
                {emailVerified ? (
                  <div className="flex items-center text-green-400">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Email verificado
                  </div>
                ) : (
                  <div className="flex items-center text-blue-400">
                    <Shield className="w-3 h-3 mr-1" />
                    Verificación de email requerida
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.form>

        {/* Login Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 text-center"
        >
          <p className="text-gray-400">
            ¿Ya tienes una cuenta?{' '}
            <Link
              href="/login"
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              Inicia sesión aquí
            </Link>
          </p>
        </motion.div>
        </motion.div>
      </div>
      
      {/* Email Verification Modal */}
      <EmailVerificationModal
        isOpen={showVerificationModal}
        email={formData.adminEmail}
        businessName={formData.businessName}
        onClose={() => setShowVerificationModal(false)}
        onVerified={handleEmailVerified}
      />
    </div>
  );
}
