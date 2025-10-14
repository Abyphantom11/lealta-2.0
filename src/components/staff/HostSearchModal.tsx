import React, { useState, useEffect, useCallback } from 'react';
import { Search, Users, Calendar, X } from 'lucide-react';
import type { HostSearchResult } from '@/types/host-tracking';

interface HostSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (host: HostSearchResult) => void;
  businessId: string;
}

export default function HostSearchModal({
  isOpen,
  onClose,
  onSelect,
  businessId,
}: HostSearchModalProps) {
  const [searchMode, setSearchMode] = useState<'table' | 'name'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<HostSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        businessId,
        query: searchQuery.trim(),
        searchMode,
      });

      const response = await fetch(`/api/staff/host-tracking/search?${params}`);
      const data = await response.json();

      if (data.success) {
        setResults(data.results || []);
        if (data.results.length === 0) {
          setError('No se encontraron anfitriones activos');
        }
      } else {
        setError(data.error || 'Error al buscar');
        setResults([]);
      }
    } catch (err) {
      console.error('Error buscando anfitriones:', err);
      setError('Error de conexión');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [businessId, searchMode, searchQuery]);

  // Búsqueda automática cuando cambia el query (con debounce)
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setResults([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      handleSearch();
    }, 300); // Debounce de 300ms

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchMode, handleSearch]);

  const handleSelectHost = (host: HostSearchResult) => {
    onSelect(host);
    onClose();
    // Reset
    setSearchQuery('');
    setResults([]);
  };

  const handleClose = () => {
    setSearchQuery('');
    setResults([]);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              🏠 Buscar Anfitrión
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Busca por mesa o nombre para vincular este consumo a un anfitrión
          </p>

          {/* Modo de búsqueda */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setSearchMode('table')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                searchMode === 'table'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🔢 Por Mesa
            </button>
            <button
              onClick={() => setSearchMode('name')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                searchMode === 'name'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              👤 Por Nombre
            </button>
          </div>

          {/* Buscador */}
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                searchMode === 'table'
                  ? 'Ej: 5, Mesa 5, VIP 2...'
                  : 'Ej: Juan Pérez, María González...'
              }
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>
        </div>

        {/* Resultados */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {error && !isSearching && (
            <div className="text-center py-8 text-gray-500">
              <Search size={48} className="mx-auto mb-2 opacity-30" />
              <p>{error}</p>
            </div>
          )}

          {!error && results.length === 0 && !isSearching && searchQuery.trim() === '' && (
            <div className="text-center py-8 text-gray-500">
              <Search size={48} className="mx-auto mb-2 opacity-30" />
              <p>Escribe para buscar anfitriones activos</p>
              <p className="text-sm mt-1">
                {searchMode === 'table' ? 'Por número de mesa' : 'Por nombre del anfitrión'}
              </p>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-3">
              {results.map((host) => (
                <button
                  key={host.id}
                  onClick={() => handleSelectHost(host)}
                  className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Mesa y nombre */}
                      <div className="flex items-center gap-2 mb-2">
                        {host.tableNumber && (
                          <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                            🔢 {host.tableNumber}
                          </span>
                        )}
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600">
                          {host.reservationName}
                        </h3>
                      </div>

                      {/* Detalles */}
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Users size={14} />
                          <span>
                            {host.guestCount} invitados
                            {host.consumosVinculados !== undefined &&
                              host.consumosVinculados > 0 && (
                                <span className="ml-1 text-green-600 font-medium">
                                  ({host.consumosVinculados} consumos registrados)
                                </span>
                              )}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar size={14} />
                          <span>
                            {new Date(host.reservationDate).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Reserva #{host.reservationNumber}
                        </div>
                      </div>
                    </div>

                    {/* Badge de estado */}
                    <div className="ml-4">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          host.reservationStatus === 'CHECKED_IN'
                            ? 'bg-green-100 text-green-800'
                            : host.reservationStatus === 'CONFIRMED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {host.reservationStatus === 'CHECKED_IN'
                          ? '✓ En local'
                          : host.reservationStatus === 'CONFIRMED'
                          ? '→ Confirmada'
                          : '⏳ Pendiente'}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>💡</span>
            <span>
              <strong>Tip:</strong> Solo se muestran anfitriones con reservas activas del día de hoy
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
