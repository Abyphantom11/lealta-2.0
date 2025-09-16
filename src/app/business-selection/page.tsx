'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from '../../components/motion';
import { Building2, ArrowRight, AlertCircle, Shield, Home } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Link from 'next/link';

interface Business {
  id: string;
  name: string;
  subdomain: string;
  isActive: boolean;
}

function BusinessSelectionContent() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  const blockedRoute = searchParams.get('blocked_route');
  const reason = searchParams.get('reason');

  useEffect(() => {
    loadBusinesses();
  }, []);

  const loadBusinesses = async () => {
    try {
      const response = await fetch('/api/businesses/list');
      if (response.ok) {
        const data = await response.json();
        setBusinesses(data.businesses || []);
      } else {
        throw new Error('Error al cargar businesses');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('No se pudieron cargar los negocios disponibles');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBusinessSelect = (businessId: string, targetPath: string) => {
    // Construir la nueva ruta con el businessId
    const newPath = `/${businessId}${targetPath}`;
    window.location.href = newPath;
  };

  const getTargetPath = () => {
    if (blockedRoute) {
      // Extraer la ruta sin el business ID previo
      if (blockedRoute.includes('/admin')) return '/admin';
      if (blockedRoute.includes('/staff')) return '/staff';
      if (blockedRoute.includes('/cliente')) return '/cliente';
      if (blockedRoute.includes('/superadmin')) return '/superadmin';
    }
    return '/admin'; // Default
  };

  const getReasonMessage = () => {
    switch (reason) {
      case 'legacy-admin-redirect':
        return 'Ruta legacy detectada. Necesitas seleccionar un negocio para acceder al panel de administración.';
      case 'legacy-staff-redirect':
        return 'Ruta legacy detectada. Necesitas seleccionar un negocio para acceder al panel de staff.';
      case 'legacy-superadmin-redirect':
        return 'Ruta legacy detectada. Necesitas seleccionar un negocio para acceder al panel de SuperAdmin.';
      case 'invalid-business':
        return 'El negocio especificado no existe o no tienes acceso a él.';
      default:
        return 'Selecciona un negocio para continuar.';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Shield className="w-12 h-12 text-blue-600 mr-3" />
              <h1 className="text-3xl font-bold text-gray-800">Selección de Negocio</h1>
            </div>
            
            {/* Info sobre la redirección */}
            {reason && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 max-w-2xl mx-auto">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
                  <div className="text-left">
                    <p className="text-yellow-800 font-medium mb-1">Redirección de Seguridad</p>
                    <p className="text-yellow-700 text-sm">{getReasonMessage()}</p>
                    {blockedRoute && (
                      <p className="text-yellow-600 text-xs mt-2">
                        Ruta bloqueada: <code className="bg-yellow-100 px-1 rounded">{blockedRoute}</code>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <p className="text-gray-600">
              {user?.name && `Hola ${user.name}, `}
              selecciona el negocio al que deseas acceder
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-center">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Lista de Businesses */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {businesses.map((business) => (
              <motion.div
                key={business.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-200"
              >
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <Building2 className="w-8 h-8 text-blue-600 mr-3" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{business.name}</h3>
                      <p className="text-sm text-gray-500">/{business.subdomain}</p>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center mb-4">
                    <div className={`w-2 h-2 rounded-full mr-2 ${business.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className={`text-xs font-medium ${business.isActive ? 'text-green-700' : 'text-red-700'}`}>
                      {business.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>

                  {/* Botón de acceso */}
                  <button
                    onClick={() => handleBusinessSelect(business.subdomain, getTargetPath())}
                    disabled={!business.isActive}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    <span>Acceder</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* No businesses */}
          {businesses.length === 0 && !error && (
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No hay negocios disponibles</h3>
              <p className="text-gray-500 mb-6">Contacta al administrador para obtener acceso.</p>
            </div>
          )}

          {/* Botón de regreso */}
          <div className="text-center">
            <Link
              href="/"
              className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>Volver al Inicio</span>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function BusinessSelectionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-white">Cargando selección de negocio...</p>
        </div>
      </div>
    }>
      <BusinessSelectionContent />
    </Suspense>
  );
}
