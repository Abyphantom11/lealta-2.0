interface PantallaBloqueoProps {
  mensaje?: string;
  submensaje?: string;
}

/**
 * Pantalla de bloqueo temporal para el módulo de reservas
 * Se muestra cuando RESERVAS_BLOQUEADO = true en config/bloqueo.ts
 */
export function PantallaBloqueo({ 
  mensaje = "No disponible", 
  submensaje = ""
}: PantallaBloqueoProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
          {mensaje}
        </h1>
        
        {submensaje && (
          <p className="text-gray-600 dark:text-gray-400 text-lg mt-4">
            {submensaje}
          </p>
        )}
      </div>
    </div>
  );
}
