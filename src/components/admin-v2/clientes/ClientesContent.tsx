'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search,
  Filter,
  X,
  MoreVertical,
  Edit,
  Trash2
} from 'lucide-react';
import { Cliente } from '@/types/admin';
import EditClientModal from './EditClientModal';

// ✅ OPTIMIZACIÓN: Componente memoizado para items individuales de clientes
interface ClienteItemProps {
  cliente: Cliente;
  getClientInitials: (nombre: string) => string;
  getColorNivel: (nivel: string) => string;
  onEdit: (cliente: Cliente) => void;
  onDelete: (cliente: Cliente) => void;
}

const ClienteItem = React.memo<ClienteItemProps>(({ 
  cliente, 
  getClientInitials, 
  getColorNivel,
  onEdit,
  onDelete 
}) => {
  const [showMenu, setShowMenu] = useState(false);
  // Función para calcular nivel automático
  const calcularNivelAutomatico = (client: Cliente) => {
    const { puntos, totalGastado = 0, totalVisitas = 0 } = client;

    if (puntos >= 5000 && totalGastado >= 8000 && totalVisitas >= 50) {
      return 'Diamante';
    } else if (puntos >= 3000 && totalGastado >= 5000 && totalVisitas >= 30) {
      return 'Platino';
    } else if (puntos >= 500 && totalGastado >= 1500 && totalVisitas >= 10) {
      return 'Oro';
    } else if (puntos >= 100 && totalGastado >= 500 && totalVisitas >= 5) {
      return 'Plata';
    } else {
      return 'Bronce';
    }
  };

  return (
    <tr
      key={cliente.id}
      className="border-b border-dark-800/50 hover:bg-dark-800/30 transition-colors"
    >
      <td className="py-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-xs">
              {getClientInitials(cliente.nombre)}
            </span>
          </div>
          <span className="text-white">{cliente.nombre}</span>
        </div>
      </td>
      <td className="py-4 text-dark-300">{cliente.cedula}</td>
      <td className="py-4">
        <div className="text-dark-300 text-sm">
          <div>{cliente.telefono}</div>
          <div className="text-dark-500">{cliente.correo}</div>
        </div>
      </td>
      <td className="py-4 text-success-400 font-semibold">
        {cliente.puntos} pts
      </td>
      <td className="py-4 text-dark-300">
        {new Date(cliente.registeredAt).toLocaleDateString('es-ES')}
      </td>
      <td className="py-4">
        {cliente.tarjetaLealtad ? (
          <div className="flex flex-col">
            <span
              className={`text-sm font-medium ${
                cliente.tarjetaLealtad.activa
                  ? getColorNivel(cliente.tarjetaLealtad.nivel)
                  : 'text-red-400'
              }`}
            >
              {cliente.tarjetaLealtad.nivel}
            </span>
            <span className="text-xs text-dark-400">
              {cliente.tarjetaLealtad.asignacionManual
                ? 'Manual'
                : 'Automático'}
            </span>
          </div>
        ) : (
          <div className="flex flex-col">
            <span className={`text-sm font-medium ${getColorNivel(calcularNivelAutomatico(cliente))}`}>
              {calcularNivelAutomatico(cliente)}
            </span>
            <span className="text-xs text-dark-500">
              Calculado
            </span>
          </div>
        )}
      </td>
      <td className="py-4">
        <span className="px-2 py-1 rounded-full text-xs bg-success-500/20 text-success-400">
          Activo
        </span>
      </td>
      <td className="py-4 relative">
        <button 
          onClick={() => setShowMenu(!showMenu)}
          className="text-dark-400 hover:text-white transition-colors"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
        
        {/* Menú desplegable */}
        {showMenu && (
          <>
            {/* Overlay para cerrar el menú */}
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setShowMenu(false)}
            />
            
            {/* Menú de opciones */}
            <div className="absolute right-0 top-8 z-20 bg-dark-800 border border-dark-600 rounded-lg shadow-xl py-1 min-w-[150px]">
              <button
                onClick={() => {
                  onEdit(cliente);
                  setShowMenu(false);
                }}
                className="w-full flex items-center space-x-2 px-4 py-2 hover:bg-dark-700 transition-colors text-white text-sm"
              >
                <Edit className="w-4 h-4" />
                <span>Editar</span>
              </button>
              <button
                onClick={() => {
                  onDelete(cliente);
                  setShowMenu(false);
                }}
                className="w-full flex items-center space-x-2 px-4 py-2 hover:bg-dark-700 transition-colors text-red-400 text-sm"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar</span>
              </button>
            </div>
          </>
        )}
      </td>
    </tr>
  );
});

ClienteItem.displayName = 'ClienteItem';

interface ClientesContentProps {
  className?: string;
  businessId?: string; // Agregar businessId como prop
}

/**
 * Componente principal de gestión de clientes
 */
const ClientesContent: React.FC<ClientesContentProps> = ({ className = '', businessId }) => {
  // Estados principales
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  
  // Estado para las pestañas
  const [activeTab, setActiveTab] = useState<'clientes' | 'historial'>('clientes');
  
  // Estados para historial de canjes
  const [historialCanjes, setHistorialCanjes] = useState<any[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);

  // Estados para el modal de edición
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);

  // Cargar clientes al montar el componente
  useEffect(() => {
    const fetchClientes = async () => {
      try {
        console.log('🔍 ClientesContent: Fetching clientes...');
        
        // ✅ SIMPLIFICADO: La API usa session.businessId automáticamente
        // No necesitamos pasar businessId como parámetro
        const response = await fetch('/api/cliente/lista', { 
          credentials: 'include', // ✅ CRÍTICO: Incluir cookies de sesión
          cache: 'no-store', // ✅ No cachear para obtener datos frescos
        });
        
        const data = await response.json();
        
        if (data.success) {
          console.log('✅ Clientes cargados:', data.clientes.length);
          setClientes(data.clientes);
          setFilteredClientes(data.clientes);
        } else {
          console.error('❌ CLIENTES: Error en respuesta:', data.error);
        }
      } catch (error) {
        console.error('❌ CLIENTES: Error cargando clientes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClientes();
  }, []); // ✅ Sin dependencias - solo cargar una vez al montar

  // Cargar historial de canjes cuando se active esa pestaña
  useEffect(() => {
    const fetchHistorialCanjes = async () => {
      if (activeTab !== 'historial') return;
      
      setLoadingHistorial(true);
      try {
        const response = await fetch('/api/admin/canjes');
        const data = await response.json();
        if (data.success) {
          setHistorialCanjes(data.canjes);
        }
      } catch (error) {
        console.error('Error cargando historial de canjes:', error);
      } finally {
        setLoadingHistorial(false);
      }
    };

    fetchHistorialCanjes();
  }, [activeTab]);

  // Función para abrir el modal de edición
  const handleEditCliente = useCallback((cliente: Cliente) => {
    setSelectedCliente(cliente);
    setIsEditModalOpen(true);
  }, []);

  // Función para eliminar un cliente
  const handleDeleteCliente = useCallback(async (cliente: Cliente) => {
    if (!confirm(`¿Estás seguro de eliminar al cliente ${cliente.nombre}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/clientes/${cliente.cedula}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        // Remover el cliente de la lista
        setClientes(prev => prev.filter(c => c.id !== cliente.id));
        setFilteredClientes(prev => prev.filter(c => c.id !== cliente.id));
        alert('Cliente eliminado exitosamente');
      } else {
        alert(data.error || 'Error al eliminar el cliente');
      }
    } catch (error) {
      console.error('Error eliminando cliente:', error);
      alert('Error de conexión al eliminar el cliente');
    }
  }, []);

  // Función para actualizar un cliente después de editar
  const handleClienteUpdated = useCallback((clienteActualizado: Cliente) => {
    setClientes(prev =>
      prev.map(c => (c.id === clienteActualizado.id ? clienteActualizado : c))
    );
    setFilteredClientes(prev =>
      prev.map(c => (c.id === clienteActualizado.id ? clienteActualizado : c))
    );
  }, []);

  // Función para filtrar clientes localmente
  const filterClientsLocally = useCallback(
    (query: string) => {
      if (!query.trim()) {
        setFilteredClientes(clientes);
        return;
      }

      const searchLower = query.toLowerCase();
      const filtered = clientes.filter(
        client =>
          client.nombre.toLowerCase().includes(searchLower) ||
          client.cedula?.toLowerCase().includes(searchLower) ||
          client.telefono?.toLowerCase().includes(searchLower) ||
          client.correo?.toLowerCase().includes(searchLower)
      );

      setFilteredClientes(filtered);
    },
    [clientes]
  );

  // Función para buscar clientes en el servidor
  const searchClientesAPI = useCallback(async (query: string) => {
    if (!query || query.length < 2) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/clientes/search?q=${encodeURIComponent(query)}`
      );
      const data = await response.json();

      if (Array.isArray(data)) {
        // Si tenemos resultados de la API, actualizar la lista filtrada
        setFilteredClientes(data);
      }
    } catch (error) {
      console.error('Error buscando clientes:', error);
      // En caso de error, volver a la búsqueda local
      filterClientsLocally(query);
    } finally {
      setIsSearching(false);
    }
  }, [filterClientsLocally]);

  // Efecto para manejar la búsqueda con debounce
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchTerm.length >= 3) {
        // Para búsquedas más específicas, usar la API
        searchClientesAPI(searchTerm);
      } else {
        // Para búsquedas cortas o vacías, filtrar localmente
        filterClientsLocally(searchTerm);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, filterClientsLocally, searchClientesAPI]);

  // ✅ OPTIMIZACIÓN: Memoizar funciones para evitar re-renders
  const getClientInitials = useCallback((nombre: string) => {
    return nombre
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .slice(0, 2);
  }, []);

  // ✅ OPTIMIZACIÓN: Memoizar función de colores
  const getColorNivel = useCallback((nivel: string) => {
    switch (nivel) {
      case 'Diamante':
        return 'text-cyan-400';
      case 'Platino':
        return 'text-gray-300';
      case 'Oro':
        return 'text-yellow-400';
      case 'Plata':
        return 'text-gray-400';
      case 'Bronce':
        return 'text-orange-400';
      default:
        return 'text-dark-400';
    }
  }, []);

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">
          Gestión de Clientes
        </h3>
        {/* Pestañas */}
        <div className="flex space-x-1 bg-dark-700 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('clientes')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'clientes'
                ? 'bg-primary-600 text-white'
                : 'text-dark-300 hover:text-white hover:bg-dark-600'
            }`}
          >
            Clientes
          </button>
          <button
            onClick={() => setActiveTab('historial')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'historial'
                ? 'bg-primary-600 text-white'
                : 'text-dark-300 hover:text-white hover:bg-dark-600'
            }`}
          >
            Historial de Canjes
          </button>
        </div>
      </div>

      <div className="premium-card">
        {activeTab === 'clientes' ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                {/* Barra de búsqueda */}
                <div className="relative">
                  <Search
                    className={`w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 ${
                      isSearching ? 'text-primary-500 animate-pulse' : 'text-dark-400'
                    }`}
                  />
                  <input
                    type="text"
                    placeholder="Buscar clientes..."
                    className="pl-10 pr-10 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:border-primary-500"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
                
              <div className="flex items-center space-x-4">
                {/* Botón de filtros */}
                <button className="p-2 bg-dark-800 hover:bg-dark-700 rounded-lg transition-colors">
                  <Filter className="w-4 h-4 text-dark-400" />
                </button>
              </div>
              
              {/* Contador */}
              <div className="text-dark-400 text-sm">
                {(() => {
                  if (isLoading) return 'Cargando...';
                  return `${filteredClientes.length} cliente${
                    filteredClientes.length !== 1 ? 's' : ''
                  }`;
                })()}
              </div>
            </div>

            {/* Tabla de clientes */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-700">
                    <th className="text-left py-3 text-dark-300 font-medium">
                      Cliente
                    </th>
                    <th className="text-left py-3 text-dark-300 font-medium">
                      Cédula
                    </th>
                    <th className="text-left py-3 text-dark-300 font-medium">
                      Contacto
                    </th>
                    <th className="text-left py-3 text-dark-300 font-medium">
                      Puntos
                    </th>
                    <th className="text-left py-3 text-dark-300 font-medium">
                      Registro
                    </th>
                    <th className="text-left py-3 text-dark-300 font-medium">
                      Tarjeta
                    </th>
                    <th className="text-left py-3 text-dark-300 font-medium">
                      Estado
                    </th>
                    <th className="text-left py-3 text-dark-300 font-medium">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // Loading state
                    if (isLoading) {
                      return (
                        <tr>
                          <td
                            colSpan={8}
                            className="py-8 text-center text-dark-400"
                          >
                            <div className="flex items-center justify-center space-x-2">
                              <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                              <span>Cargando clientes...</span>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    // Empty state
                    if (filteredClientes.length === 0) {
                      return (
                        <tr>
                          <td
                            colSpan={8}
                            className="py-8 text-center text-dark-400"
                          >
                            {clientes.length > 0
                              ? 'No se encontraron clientes con ese criterio de búsqueda'
                              : 'No hay clientes registrados aún'}
                          </td>
                        </tr>
                      );
                    }

                    // ✅ OPTIMIZACIÓN: Usar componente memoizado para cada cliente
                    return filteredClientes.map(client => (
                      <ClienteItem
                        key={client.id}
                        cliente={client}
                        getClientInitials={getClientInitials}
                        getColorNivel={getColorNivel}
                        onEdit={handleEditCliente}
                        onDelete={handleDeleteCliente}
                      />
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-lg font-medium text-white">Historial de Canjes</h4>
              <div className="text-dark-400 text-sm">
                {(() => {
                  if (loadingHistorial) return 'Cargando...';
                  return `${historialCanjes.length} canje${historialCanjes.length !== 1 ? 's' : ''}`;
                })()}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-600">
                    <th className="text-left py-3 px-4 font-medium text-dark-300">Cliente</th>
                    <th className="text-left py-3 px-4 font-medium text-dark-300">Recompensa</th>
                    <th className="text-left py-3 px-4 font-medium text-dark-300">Puntos</th>
                    <th className="text-left py-3 px-4 font-medium text-dark-300">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    if (loadingHistorial) {
                      return (
                        <tr>
                          <td colSpan={4} className="text-center py-8 text-dark-400">
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500 mr-3"></div>
                              Cargando historial...
                            </div>
                          </td>
                        </tr>
                      );
                    }
                    
                    if (historialCanjes.length === 0) {
                      return (
                        <tr>
                          <td colSpan={4} className="text-center py-8 text-dark-400">
                            No hay canjes registrados
                          </td>
                        </tr>
                      );
                    }
                    
                    return historialCanjes.map((canje) => (
                      <tr key={canje.id} className="border-b border-dark-700/50 hover:bg-dark-700/30">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                              {canje.clienteNombre.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                            </div>
                            <span className="text-white font-medium">{canje.clienteNombre}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-white">{canje.recompensaNombre}</td>
                        <td className="py-3 px-4">
                          <span className="text-red-400 font-medium">-{canje.puntosDescontados} pts</span>
                        </td>
                        <td className="py-3 px-4 text-dark-300">
                          {new Date(canje.fecha).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Modal de Edición */}
      <EditClientModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        cliente={selectedCliente}
        onClienteUpdated={handleClienteUpdated}
      />
    </div>
  );
};

export default ClientesContent;
