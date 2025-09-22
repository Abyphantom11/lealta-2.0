'use client';

/**
 * Componente de contenido de Staff COMPLETO
 * Recibe businessId como prop para contexto
 * Contiene toda la funcionalidad del staff original
 */

import { useRequireAuth } from '../../../hooks/useAuth';
import RoleSwitch from '../../../components/RoleSwitch';
import { Zap, Users, History } from 'lucide-react';

interface StaffPageContentProps {
  businessId: string;
}

// Por ahora, vamos a crear un componente básico
// TODO: Migrar toda la funcionalidad del staff page original
export default function StaffPageContent({ businessId }: StaffPageContentProps) {
  const { user, loading } = useRequireAuth('STAFF');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-xl p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Panel de Staff</h1>
              <p className="text-gray-600">Negocio: {businessId}</p>
            </div>
            <RoleSwitch 
              currentRole={'STAFF'}
              currentPath={`/${businessId}/staff`}
              businessId={businessId}
            />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Registrar Consumo */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl text-white">
              <div className="flex items-center mb-4">
                <Zap className="mr-3" size={24} />
                <h3 className="text-xl font-semibold">Registrar Consumo</h3>
              </div>
              <p className="mb-4">Procesar consumos de clientes</p>
              <button className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50">
                Procesar
              </button>
            </div>

            {/* Buscar Cliente */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-xl text-white">
              <div className="flex items-center mb-4">
                <Users className="mr-3" size={24} />
                <h3 className="text-xl font-semibold">Buscar Cliente</h3>
              </div>
              <p className="mb-4">Encontrar información del cliente</p>
              <button className="bg-white text-green-600 px-4 py-2 rounded-lg font-medium hover:bg-green-50">
                Buscar
              </button>
            </div>

            {/* Historial */}
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-xl text-white">
              <div className="flex items-center mb-4">
                <History className="mr-3" size={24} />
                <h3 className="text-xl font-semibold">Historial</h3>
              </div>
              <p className="mb-4">Ver transacciones recientes</p>
              <button className="bg-white text-purple-600 px-4 py-2 rounded-lg font-medium hover:bg-purple-50">
                Ver
              </button>
            </div>
          </div>

          {/* Información del Business */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Contexto de Negocio:</strong> {businessId}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Staff: {user?.name || 'Usuario'} | Rol: {user?.role}
            </p>
          </div>

          {/* TODO: Migrar funcionalidades completas del staff page original */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm">
              <strong>Nota:</strong> Este es el componente básico de Staff. 
              La funcionalidad completa se migrará del componente original.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
