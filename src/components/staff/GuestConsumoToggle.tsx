import React from 'react';
import { Users, X } from 'lucide-react';
import type { HostSearchResult } from '@/types/host-tracking';

interface GuestConsumoToggleProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  selectedHost: HostSearchResult | null;
  onClearHost: () => void;
  onOpenSearch: () => void;
}

export default function GuestConsumoToggle({
  isEnabled,
  onToggle,
  selectedHost,
  onClearHost,
  onOpenSearch,
}: GuestConsumoToggleProps) {
  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg p-4">
      {/* Toggle principal */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users size={20} className="text-purple-600" />
          <span className="font-semibold text-gray-900">
            ¿Es invitado de un anfitrión?
          </span>
        </div>
        <button
          onClick={() => onToggle(!isEnabled)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            isEnabled ? 'bg-purple-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isEnabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Sección expandida cuando está habilitado */}
      {isEnabled && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          {!selectedHost ? (
            <>
              <p className="text-sm text-gray-600">
                Busca por mesa o nombre para vincular este consumo
              </p>
              <button
                onClick={onOpenSearch}
                className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
              >
                🔍 Buscar Anfitrión
              </button>
            </>
          ) : (
            <div className="bg-white border-2 border-purple-300 rounded-lg p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {selectedHost.tableNumber && (
                      <span className="inline-flex items-center px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-xs font-semibold">
                        {selectedHost.tableNumber}
                      </span>
                    )}
                    <span className="font-bold text-gray-900">
                      {selectedHost.reservationName}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <div>{selectedHost.guestCount} invitados</div>
                    <div className="text-xs text-gray-500">
                      Reserva #{selectedHost.reservationNumber}
                    </div>
                  </div>
                </div>
                <button
                  onClick={onClearHost}
                  className="ml-2 p-1 text-gray-400 hover:text-red-600 transition-colors"
                  title="Desvincular"
                >
                  <X size={18} />
                </button>
              </div>
              
              <div className="mt-3 pt-3 border-t border-purple-200">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-green-600">✓</span>
                  <span className="text-gray-700">
                    Este consumo se vinculará al anfitrión <strong>{selectedHost.reservationName}</strong>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Ayuda */}
          <div className="text-xs text-gray-500 flex items-start gap-2">
            <span>💡</span>
            <span>
              Los consumos de invitados se acumulan en el perfil del anfitrión para análisis y recompensas
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
