'use client';

import { Cliente } from './types';

interface ClientListItemProps {
  readonly client: Cliente;
  readonly selectedClient: Cliente | null;
  readonly onSelect: (client: Cliente) => void;
  readonly calculateClientLevel: (client: Cliente) => string;
}

export default function ClientListItem({
  client,
  selectedClient,
  onSelect,
  calculateClientLevel,
}: ClientListItemProps) {
  const nivelAutomatico = calculateClientLevel(client);
  const cumpleCondiciones = nivelAutomatico !== 'Bronce';
  const tieneTarjeta = client.tarjetaLealtad !== null;

  return (
    <button
      onClick={() => onSelect(client)}
      className={`w-full p-3 rounded-lg cursor-pointer transition-colors text-left ${
        selectedClient?.id === client.id
          ? 'bg-primary-600 text-white'
          : 'bg-dark-700 hover:bg-dark-600 text-dark-300'
      }`}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="font-medium">{client.nombre}</p>
          <p className="text-sm opacity-75">{client.cedula}</p>
          <p className="text-sm opacity-75">{client.correo}</p>
        </div>
        <div className="text-right text-sm">
          <p>Puntos: {client.puntos || 0}</p>
          <p>Gastos: ${client.totalGastado || 0}</p>
          <p>Visitas: {client.totalVisitas || 0}</p>

          {tieneTarjeta && client.tarjetaLealtad ? (
            <div className="mt-1">
              <p
                className={`font-medium ${client.tarjetaLealtad.activa ? 'text-success-400' : 'text-red-400'}`}
              >
                Tarjeta {client.tarjetaLealtad.nivel}{' '}
                {!client.tarjetaLealtad.activa && '(Inactiva)'}
              </p>
              <p className="text-xs opacity-75">
                {client.tarjetaLealtad.asignacionManual
                  ? 'Asignación manual'
                  : 'Asignación automática'}
              </p>
            </div>
          ) : (
            <p
              className={`font-medium ${cumpleCondiciones ? 'text-success-400' : 'text-yellow-400'}`}
            >
              Nivel sugerido: {nivelAutomatico}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
