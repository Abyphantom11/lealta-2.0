'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion } from '../../components/motion';
import { Mail, Lock, Eye, EyeOff, UserPlus, Sparkles, ArrowRight, AlertCircle, Shield } from 'lucide-react';
import Link from 'next/link';
import { LealtaLogo } from '../../components/LealtaLogo';
import { useSearchParams } from 'next/navigation';
import PWAInstallPrompt from '../../components/ui/PWAInstallPrompt';

function LoginContent() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [businessError, setBusinessError] = useState<{
    type: string;
    business?: string;
    reason?: string;
  } | null>(null);

  const searchParams = useSearchParams();

  useEffect(() => {
    // Verificar errores de business en los parámetros de URL
    const urlError = searchParams.get('error');
    const business = searchParams.get('business');
    const reason = searchParams.get('reason');

    if (urlError) {
      switch (urlError) {
        case 'business-not-found':
          setBusinessError({
            type: 'not-found',
            business: searchParams.get('subdomain') || business || undefined
          });
          break;
        case 'access-denied':
          setBusinessError({
            type: 'access-denied',
            business: business || undefined,
            reason: reason || undefined
          });
          break;
        case 'business-error':
          setBusinessError({
            type: 'error'
          });
          break;
      }
    }
  }, [searchParams]);

  const getBusinessErrorMessage = () => {
    if (!businessError) return null;

    switch (businessError.type) {
      case 'not-found':
        return (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <div>
                <h3 className="text-red-800 font-semibold">Business no encontrado</h3>
                <p className="text-red-700 text-sm">
                  El business "{businessError.business}" no existe o está inactivo.
                </p>
              </div>
            </div>
          </div>
        );
      case 'access-denied':
        return (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <Shield className="h-5 w-5 text-orange-500 mr-2" />
              <div>
                <h3 className="text-orange-800 font-semibold">Acceso denegado</h3>
                <p className="text-orange-700 text-sm">
                  No tienes permisos para acceder al business "{businessError.business}".
                </p>
                {businessError.reason && (
                  <p className="text-orange-600 text-xs mt-1">
                    Razón: {businessError.reason}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      case 'error':
        return (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <div>
                <h3 className="text-red-800 font-semibold">Error del sistema</h3>
                <p className="text-red-700 text-sm">
                  Ocurrió un error al validar el business. Intenta de nuevo.
                </p>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // For MVP, we'll use a simple API call instead of next-auth client-side
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Redirect based on role with business context
        const businessId = data.businessId || data.user?.businessId;
        
        if (!businessId) {
          console.error('No se pudo obtener businessId en login');
          window.location.href = '/business-selection';
          return;
        }

        const roleRedirect: Record<string, string> = {
          SUPERADMIN: `/${businessId}/superadmin`,
          ADMIN: `/${businessId}/admin`,
          STAFF: `/${businessId}/staff`,
        };

        window.location.href = roleRedirect[data.role] || `/${businessId}/staff`;
      } else {
        setError(data.error || 'Credenciales inválidas');
      }
    } catch (error) {
      console.error('Error de conexión:', error);
      setError('Error de conexión: No se pudo procesar la solicitud');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex items-center justify-center p-4">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="mb-6"
          >
            <LealtaLogo size={60} className="mx-auto" animated />
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-2">
            <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              lealta
            </span>
          </h1>
          <p className="text-gray-400">Panel de administración</p>
        </div>

        {/* Login Form */}
        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          onSubmit={handleSubmit}
          className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 space-y-6 shadow-2xl"
        >
          {/* Business Error Messages */}
          {getBusinessErrorMessage()}

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm text-center"
            >
              {error}
            </motion.div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Mail className="w-4 h-4 inline mr-2" />
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="admin@lealta.com"
              value={formData.email}
              onChange={e =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>

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
                value={formData.password}
                onChange={e =>
                  setFormData({ ...formData, password: e.target.value })
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
                <span>Iniciando sesión...</span>
              </div>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Iniciar Sesión
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </motion.button>
        </motion.form>

        {/* Register Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-center"
        >
          <p className="text-gray-400 mb-4">¿No tienes una cuenta?</p>
          <Link
            href="/signup"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            Registrar Empresa
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <>
      {/* PWA Install Prompt para Login */}
      <PWAInstallPrompt 
        variant="auto" 
        showOnLogin={true} 
        position="top" 
      />
      
      <Suspense fallback={
        <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-white">Cargando...</p>
          </div>
        </div>
      }>
        <LoginContent />
      </Suspense>
    </>
  );
}
