'use client';

import { Cliente } from './types';

interface CardAssignmentFormProps {
  readonly selectedClient: Cliente | null;
  readonly selectedLevel: string;
  readonly setSelectedLevel: (level: string) => void;
  readonly nivelesConfig: Record<string, any>;
  readonly onAssign: () => void;
  readonly onCancel: () => void;
}

export default function CardAssignmentForm({
  selectedClient,
  selectedLevel,
  setSelectedLevel,
  nivelesConfig,
  onAssign,
  onCancel,
}: CardAssignmentFormProps) {
  return (
    <div className="bg-dark-700 rounded-lg p-4">
      <h6 className="text-white font-medium mb-3">
        Asignar Tarjeta a: {selectedClient?.nombre || 'Cliente no seleccionado'}
      </h6>

      {!selectedClient ? (
        <p className="text-red-400">Error: No se ha seleccionado ningún cliente</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 mb-4">
            <div>
              <p className="text-dark-400 text-sm">Puntos Actuales</p>
              <p className="text-yellow-400 font-medium">{selectedClient.puntos || 0}</p>
            </div>
          </div>

          <div className="mb-4">
            <label
              htmlFor="nivel-select"
              className="block text-sm font-medium text-dark-300 mb-2"
            >
              Seleccionar Nivel de Tarjeta
            </label>
            <select
              id="nivel-select"
              value={selectedLevel}
              onChange={e => setSelectedLevel(e.target.value)}
              className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-lg text-white focus:border-primary-500 focus:outline-none"
            >
              {Object.entries(nivelesConfig).map(([nivel, config]: [string, any]) => {
                return (
                  <option key={nivel} value={nivel}>
                    {nivel} {config.descripcion ? `- ${config.descripcion}` : ''}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={onAssign}
              className="px-4 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 transition-colors"
            >
              Asignar Tarjeta
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-dark-600 text-white rounded-lg hover:bg-dark-500 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </>
      )}
    </div>
  );
}
