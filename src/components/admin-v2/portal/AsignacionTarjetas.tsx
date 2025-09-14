'use client';

import { useState, useCallback, useEffect } from 'react';
import { Users, Search, X } from 'lucide-react';
import ClientListItem from './ClientListItem';
import CardAssignmentForm from './CardAssignmentForm';
import { Cliente, NivelTarjeta } from './types';

interface AsignacionTarjetasProps {
  showNotification: (message: string, type: NivelTarjeta) => void;
}

export default function AsignacionTarjetas({
  showNotification,
}: Readonly<AsignacionTarjetasProps>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [selectedLevel, setSelectedLevel] = useState('Bronce');
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Función para refrescar los clientes después de asignar una tarjeta
  const onRefreshClients = useCallback(async () => {
    if (searchTerm.trim().length > 0) {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/clientes/search?q=${encodeURIComponent(searchTerm)}`
        );
        const data = await res.json();
        setClients(data.clientes || []);
      } catch (error) {
        console.error('Error refrescando clientes:', error);
        showNotification('Error al actualizar la lista de clientes', 'error');
      } finally {
        setLoading(false);
      }
    }
  }, [searchTerm, showNotification]);

  const nivelesConfig = {
    Bronce: {
      condiciones: { puntosMinimos: 0, gastosMinimos: 0, visitasMinimas: 0 },
    },
    Plata: {
      condiciones: {
        puntosMinimos: 100,
        gastosMinimos: 500,
        visitasMinimas: 5,
      },
    },
    Oro: {
      condiciones: {
        puntosMinimos: 500,
        gastosMinimos: 1500,
        visitasMinimas: 10,
      },
    },
    Diamante: {
      condiciones: {
        puntosMinimos: 1500,
        gastosMinimos: 3000,
        visitasMinimas: 20,
      },
    },
    Platino: {
      condiciones: {
        puntosMinimos: 3000,
        gastosMinimos: 5000,
        visitasMinimas: 30,
      },
    },
  };

  // Buscar clientes
  const searchClients = useCallback(async () => {
    if (searchTerm.length < 2) {
      setClients([]);
      return;
    }

    setLoading(true);
    try {
      // Utilizamos encodeURIComponent para asegurar que la URL sea válida
      const response = await fetch(
        `/api/clientes/search?q=${encodeURIComponent(searchTerm)}`
      );
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setClients(data);
        } else {
          console.error('Formato de respuesta inesperado:', data);
          setClients([]);
        }
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
  }, [searchTerm, setClients, setLoading]);

  // Calcular nivel automático basado en historial del cliente
  const calculateClientLevel = (client: Cliente) => {
    const puntos = client.puntos || 0;
    const gastos = client.totalGastado || 0;
    const visitas = client.totalVisitas || 0;

    // Buscar el nivel más alto que cumple
    const niveles = ['Platino', 'Diamante', 'Oro', 'Plata', 'Bronce'];

    for (const nivel of niveles) {
      const condiciones =
        nivelesConfig[nivel as keyof typeof nivelesConfig].condiciones;
      if (
        puntos >= condiciones.puntosMinimos &&
        gastos >= condiciones.gastosMinimos &&
        visitas >= condiciones.visitasMinimas
      ) {
        return nivel;
      }
    }
    return 'Bronce';
  };

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteId: selectedClient.id, // ✅ CORREGIDO: Usar ID interno en lugar de cédula
          nivel: selectedLevel,
          asignacionManual: true,
          fastUpdate: true, // Indicador para procesamiento rápido
        }),
      });

      if (response.ok) {
        const result = await response.json();

        showNotification(
          `Tarjeta ${selectedLevel} asignada exitosamente a ${selectedClient.nombre}`,
          'success'
        );

        // ✅ DETECTAR ASCENSO MANUAL Y MOSTRAR NOTIFICACIÓN ESPECIAL
        if (result.mostrarAnimacion && result.esSubida) {
          console.log(`🎉 Ascenso manual detectado: ${result.nivelAnterior} → ${result.nivelNuevo}`);

          // Notificación especial para ascensos
          showNotification(
            `🎉 ¡ASCENSO! ${selectedClient.nombre} subió de ${result.nivelAnterior} a ${result.nivelNuevo}`,
            'success'
          );

          // Agregar un pequeño delay para que se note la diferencia
          setTimeout(() => {
            showNotification(
              `💡 El cliente verá el popup de ascenso al ingresar al portal`,
              'info'
            );
          }, 2000);
        }

        // Limpiar la selección y búsqueda inmediatamente para mejor UX
        setSelectedClient(null);
        setSearchTerm('');
        setClients([]);

        // Recargar la lista de clientes para reflejar los cambios
        if (typeof onRefreshClients === 'function') {
          onRefreshClients();
        }

        // Notificar a otros clientes conectados sobre el cambio (simulado)
        try {
          fetch('/api/notificaciones/actualizar-clientes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tipo: 'actualizacion_tarjeta' }),
          }).catch(e => console.log('Error enviando notificación:', e));
        } catch (e) {
          console.log('Error en notificación:', e);
        }
      } else {
        const errorData = await response.json();
        showNotification(
          `Error al asignar tarjeta: ${errorData.error || 'Error desconocido'}`,
          'error'
        );
      }
    } catch (error) {
      console.error('Error asignando tarjeta:', error);
      showNotification('Error de conexión al asignar la tarjeta', 'error');
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim().length >= 2) {
        searchClients();
      } else {
        setClients([]);
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, searchClients]);

  return (
    <div className="bg-dark-800 rounded-lg p-6">
      <div className="flex items-center mb-6">
        <Users className="w-6 h-6 mr-2 text-primary-500" />
        <h4 className="text-lg font-semibold text-white">
          Asignación Manual de Tarjetas
        </h4>
      </div>

      <p className="text-dark-400 text-sm mb-4">
        Busca clientes existentes para asignarles una tarjeta de lealtad
        manualmente, especial para casos donde el negocio considera que el
        cliente merece el nivel.
      </p>

      {/* Buscador de clientes */}
      <div className="mb-6">
        <label
          htmlFor="search-client"
          className="block text-sm font-medium text-dark-300 mb-2"
        >
          Buscar Cliente
        </label>
        <div className="relative">
          <Search
            className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${loading ? 'text-primary-500 animate-pulse' : 'text-dark-400'}`}
          />
          <input
            id="search-client"
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, email, teléfono o cédula..."
            className="w-full pl-10 pr-10 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:border-primary-500 focus:outline-none"
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

        {loading && (
          <div className="mt-2 text-primary-500 text-sm flex items-center">
            <div className="w-3 h-3 mr-2 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            Buscando clientes...
          </div>
        )}
      </div>

      {/* Lista de clientes encontrados */}
      {searchTerm.length >= 2 && (
        <div className="mb-6">
          <h6 className="text-white font-medium mb-3">
            {(() => {
              if (loading) return 'Buscando...';
              if (clients.length > 0) return 'Clientes Encontrados';
              return 'Sin resultados';
            })()}
          </h6>

          {clients.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {clients.map(client => (
                <ClientListItem
                  key={client.id}
                  client={client}
                  selectedClient={selectedClient}
                  onSelect={setSelectedClient}
                  calculateClientLevel={calculateClientLevel}
                />
              ))}
            </div>
          ) : (
            searchTerm.length >= 2 &&
            !loading && (
              <div className="py-3 text-center text-dark-400 bg-dark-800/50 rounded-lg">
                No se encontraron clientes con ese criterio de búsqueda
              </div>
            )
          )}
        </div>
      )}

      {/* Selección de nivel y asignación */}
      {selectedClient && (
        <CardAssignmentForm
          selectedClient={selectedClient}
          selectedLevel={selectedLevel}
          setSelectedLevel={setSelectedLevel}
          nivelesConfig={nivelesConfig}
          onAssign={assignCard}
          onCancel={() => setSelectedClient(null)}
        />
      )}
    </div>
  );
}
