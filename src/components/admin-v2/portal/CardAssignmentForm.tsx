'use client';

import { Cliente } from './types';

interface CardAssignmentFormProps {
  selectedClient: Cliente | null;
  selectedLevel: string;
  setSelectedLevel: (level: string) => void;
  nivelesConfig: Record<string, any>;
  onAssign: () => void;
  onCancel: () => void;
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
              {Object.entries(nivelesConfig).map(([nivel, conf]: [string, any]) => {
                return (
                  <option key={nivel} value={nivel}>
                    {conf.nombrePersonalizado || nivel}
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
