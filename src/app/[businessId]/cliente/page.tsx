'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * Página dinámica del portal cliente
 * Ruta: /[businessId]/cliente
 */
export default function BusinessClientePage() {
  const params = useParams();
  const businessId = params.businessId as string;
  const [isValidBusiness, setIsValidBusiness] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Validar que el businessId existe y es válido
    const validateBusiness = async () => {
      try {
        console.log(`🔍 Validating business for cliente: ${businessId}`);
        
        const response = await fetch(`/api/businesses/${businessId}/validate`);
        if (response.ok) {
          const businessData = await response.json();
          console.log(`✅ Business validated for cliente:`, businessData);
          setIsValidBusiness(true);
        } else {
          console.log(`❌ Business validation failed for cliente: ${businessId}`);
          window.location.href = `/login?error=invalid-business&businessId=${businessId}`;
        }
      } catch (error) {
        console.error('Error validating business for cliente:', error);
        setIsValidBusiness(false);
        window.location.href = '/login?error=validation-error';
      } finally {
        setIsLoading(false);
      }
    };

    if (businessId) {
      validateBusiness();
    } else {
      setIsLoading(false);
    }
  }, [businessId]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando portal cliente {businessId}...</p>
        </div>
      </div>
    );
  }

  // Business context válido
  if (isValidBusiness) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-4">Portal Cliente</h1>
              <p className="text-gray-600">Bienvenido al programa de fidelización</p>
              <p className="text-sm text-purple-600 font-medium">{businessId}</p>
            </div>

            <div className="max-w-md mx-auto">
              {/* Búsqueda de cliente */}
              <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-6 rounded-xl text-white mb-6">
                <h3 className="text-xl font-semibold mb-4">Buscar Mi Perfil</h3>
                <input
                  type="text"
                  placeholder="Número de teléfono"
                  className="w-full p-3 rounded-lg text-gray-800"
                />
                <button className="w-full bg-white text-purple-600 py-3 rounded-lg font-medium mt-3 hover:bg-gray-100">
                  Buscar
                </button>
              </div>

              {/* Info del negocio */}
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Portal Cliente:</strong> {businessId}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Consulta tus puntos y recompensas aquí
                </p>
              </div>
            </div>

            {/* TODO: Integrar con el componente de portal cliente existente */}
            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-sm">
                <strong>Próximamente:</strong> Portal cliente completo con puntos, 
                tarjetas de fidelización y historial de compras.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
      <div className="text-center p-8">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Negocio No Encontrado</h1>
        <p className="text-gray-600 mb-6">
          El negocio &quot;{businessId}&quot; no existe.
        </p>
        <button
          onClick={() => (window.location.href = '/login')}
          className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
        >
          Volver al Inicio
        </button>
      </div>
    </div>
  );
}
