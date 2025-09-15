'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, User, CreditCard, AlertCircle } from 'lucide-react';

// Tipos de datos
// Removed unused type NivelTarjeta

interface Cliente {
  id: number;
  nombre: string;
  email: string;
  telefono?: string;
  puntos: number;
  totalGastado: number;
  totalVisitas: number;
  nivel?: string;
}

interface TarjetaConfig {
  nombrePersonalizado: string;
  textoCalidad: string;
  colores: { gradiente: string[] };
  condiciones: {
    puntosMinimos: number;
    gastosMinimos: number;
    visitasMinimas: number;
  };
  beneficio: string;
  empresa: {
    nombre: string;
  };
}

interface GeneralConfig {
  nivelesConfig: Record<string, TarjetaConfig>;
  empresa: {
    nombre: string;
  };
}

interface AsignacionTarjetasComponentProps {
  config: GeneralConfig;
  showNotification: (message: string, type: string) => void;
  clients: Cliente[];
  setClients: (clients: Cliente[]) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  calculateClientLevel: (client: Cliente) => string;
}

// Componente para asignación de tarjetas
export default function AsignacionTarjetasComponent({
  config,
  showNotification,
  clients,
  setClients,
  loading,
  setLoading,
  calculateClientLevel,
}: Readonly<AsignacionTarjetasComponentProps>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string>('Bronce');

  // Función para buscar clientes
  const searchClients = useCallback(async (term: string) => {
    if (!term.trim() || term.length < 2) {
      setClients([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/clientes/search?q=${encodeURIComponent(term)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        setClients(data);
      } else {
        console.error('Error en la respuesta:', response.status);
        setClients([]);
      }
    } catch (error) {
      console.error('Error buscando clientes:', error);
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, [setClients, setLoading]);

  // Debounce para la búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      searchClients(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, searchClients]);

  // Asignar tarjeta manualmente
  const assignCard = async () => {
    if (!selectedClient) return;

    // Mostrar notificación inmediatamente para dar retroalimentación al usuario
    showNotification(
      `Asignando tarjeta ${selectedLevel} a ${selectedClient.nombre}...`,
      'info'
    );

    try {
      const response = await fetch('/api/tarjetas/asignar/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clienteId: selectedClient.id, // ✅ CORREGIDO: Usar clienteId en lugar de customerId
          nivel: selectedLevel, // ✅ CORREGIDO: Usar nivel en lugar de level
          asignacionManual: true, // ✅ NUEVO: Marcar como asignación manual
        }),
      });

      if (response.ok) {
        showNotification(
          `Tarjeta ${selectedLevel} asignada exitosamente a ${selectedClient.nombre}`,
          'success'
        );

        // Actualizar el cliente en la lista local
        const updatedClients = clients.map((client) =>
          client.id === selectedClient.id
            ? { ...client, nivel: selectedLevel }
            : client
        );
        setClients(updatedClients);
        setSelectedClient({ ...selectedClient, nivel: selectedLevel });
      } else {
        const error = await response.json();
        showNotification(
          `Error al asignar tarjeta: ${error.error || error.message || 'Error desconocido'}`,
          'error'
        );
      }
    } catch (error) {
      console.error('Error asignando tarjeta:', error);
      showNotification(
        'Error de conexión al asignar tarjeta',
        'error'
      );
    }
  };

  // Colores para los niveles
  const getNivelColor = (nivel: string) => {
    const colores = {
      Bronce: 'from-amber-600 to-amber-700',
      Plata: 'from-gray-400 to-gray-500',
      Oro: 'from-yellow-400 to-yellow-500',
      Diamante: 'from-blue-400 to-blue-500',
      Platino: 'from-gray-300 to-gray-400',
    };
    return colores[nivel as keyof typeof colores] || 'from-gray-400 to-gray-500';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <CreditCard className="w-5 h-5 text-green-600" />
        <h3 className="text-xl font-semibold text-gray-800">
          Asignación Manual de Tarjetas
        </h3>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Panel de Búsqueda de Clientes */}
        <div className="space-y-4">
          <div>
            <label htmlFor="client-search" className="block text-sm font-medium text-gray-700 mb-2">
              Buscar Cliente
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                id="client-search"
                type="text"
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Lista de Clientes */}
          <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
            {loading && (
              <div className="p-4 text-center text-gray-500">
                <div className="inline-flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Buscando clientes...
                </div>
              </div>
            )}

            {!loading && clients.length === 0 && searchTerm.length >= 2 && (
              <div className="p-4 text-center text-gray-500">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                No se encontraron clientes
              </div>
            )}

            {!loading && clients.length === 0 && searchTerm.length < 2 && (
              <div className="p-4 text-center text-gray-500">
                Escribe al menos 2 caracteres para buscar
              </div>
            )}

            {!loading && clients.length > 0 && (
              <div className="divide-y divide-gray-200">
                {clients.map((client) => {
                  const nivelAutomatico = calculateClientLevel(client);
                  
                  return (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => setSelectedClient(client)}
                      className={`w-full text-left p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedClient?.id === client.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          <User className="w-8 h-8 text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {client.nombre}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {client.email}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-600">Nivel actual:</span>
                            <span className={`text-xs px-2 py-1 rounded bg-gradient-to-r text-white ${getNivelColor(client.nivel || nivelAutomatico)}`}>
                              {client.nivel || nivelAutomatico}
                            </span>
                            {!client.nivel && (
                              <span className="text-xs text-gray-500">(automático)</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Panel de Asignación */}
        <div className="space-y-6">
          {selectedClient ? (
            <>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-3">Cliente Seleccionado</h4>
                <div className="space-y-2">
                  <p className="text-sm"><span className="font-medium">Nombre:</span> {selectedClient.nombre}</p>
                  <p className="text-sm"><span className="font-medium">Email:</span> {selectedClient.email}</p>
                  {selectedClient.telefono && (
                    <p className="text-sm"><span className="font-medium">Teléfono:</span> {selectedClient.telefono}</p>
                  )}
                  
                  {selectedClient.nivel && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Nivel Actual:</span>
                        <span className={`text-xs px-2 py-1 rounded bg-gradient-to-r text-white ${getNivelColor(selectedClient.nivel)}`}>
                          {selectedClient.nivel}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <fieldset>
                <legend className="block text-sm font-medium text-gray-700 mb-2">
                  Asignar Nivel de Tarjeta
                </legend>
                <div className="grid grid-cols-2 gap-2">
                  {Object.keys(config.nivelesConfig || {}).length > 0 ? (
                    Object.keys(config.nivelesConfig).map((nivel) => (
                      <button
                        key={nivel}
                        onClick={() => setSelectedLevel(nivel)}
                        className={`p-2 rounded-lg border-2 transition-all ${
                          selectedLevel === nivel
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-xs font-medium text-gray-800">
                          {nivel}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {config.nivelesConfig[nivel]?.nombrePersonalizado || nivel}
                        </div>
                      </button>
                    ))
                  ) : (
                    // Fallback si no hay configuración
                    ['Bronce', 'Plata', 'Oro', 'Diamante', 'Platino'].map((nivel) => (
                      <button
                        key={nivel}
                        onClick={() => setSelectedLevel(nivel)}
                        className={`p-2 rounded-lg border-2 transition-all ${
                          selectedLevel === nivel
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-xs font-medium text-gray-800">
                          {nivel}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </fieldset>

              <button
                onClick={assignCard}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                Asignar Tarjeta {selectedLevel}
              </button>
            </>
          ) : (
            <div className="text-center text-gray-500 py-12">
              <User className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>Selecciona un cliente para asignar una tarjeta</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
