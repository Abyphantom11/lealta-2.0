'use client';

import { useState, useEffect, Suspense } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';

function LoginContent() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const searchParams = useSearchParams();
  const router = useRouter();

  // Auto-login: verificar si ya hay una sesión activa
  useEffect(() => {
    const checkExistingAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        
        if (response.ok) {
          const userData = await response.json();
          
          // 🎯 TODOS los usuarios van directo a RESERVAS (sin importar rol)
          const businessSlug = userData.user.business?.slug || userData.user.business?.subdomain;
          
          if (businessSlug) {
            router.push(`/${businessSlug}/reservas`);
            return;
          }
        }
      } catch {
        // Silenciar error de verificación
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkExistingAuth();
  }, [router]);

  useEffect(() => {
    // Verificar errores en los parámetros de URL
    const urlError = searchParams?.get('error');
    const message = searchParams?.get('message');

    if (urlError && message) {
      setError(message);
    } else if (urlError) {
      switch (urlError) {
        case 'invalid-business':
          setError('El negocio solicitado no existe o no está disponible.');
          break;
        case 'access-denied':
          setError('No tienes permisos para acceder a este negocio.');
          break;
        case 'session-required':
          setError('Debes iniciar sesión para continuar.');
          break;
        case 'business-error':
          setError('Error en la configuración del negocio. Contacta al administrador.');
          break;
        default:
          setError('Error de autenticación. Inicia sesión nuevamente.');
      }
    }
  }, [searchParams]);

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
        // 🎯 TODOS los usuarios van directo a RESERVAS (sin importar rol)
        const businessSlug = data.businessSlug || data.user?.business?.slug;
        
        if (!businessSlug) {
          console.error('No se pudo obtener businessSlug en login');
          setError('Error: No se pudo determinar el negocio asociado. Contacta al administrador.');
          return;
        }

        // 🚀 Redirección única: TODOS a /reservas
        window.location.href = `/${businessSlug}/reservas`;
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

  // Mostrar loading mientras se verifica la sesión existente
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Contenido principal */}
      <div className="flex items-center justify-center p-4 min-h-screen">
        <div className="w-full max-w-md">
          {/* Logo y título */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              lealta
            </h1>
            <p className="text-gray-600">
              Accede a tu cuenta
            </p>
          </div>

        {/* Login Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4"
        >
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              data-testid="email-input"
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="admin@lealta.com"
              value={formData.email}
              onChange={e =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                data-testid="password-input"
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12"
                placeholder="••••••••"
                value={formData.password}
                onChange={e =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            data-testid="login-button"
            className="w-full px-6 py-3 bg-black hover:bg-gray-800 text-white font-medium rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Iniciando sesión...</span>
              </div>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
