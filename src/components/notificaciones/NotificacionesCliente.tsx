import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, RefreshCw } from 'lucide-react';

/**
 * Componente que muestra notificaciones en tiempo real para el cliente
 * y permite actualizar la información cuando es necesario
 */
export default function NotificacionesCliente() {
  const [mostrarNotificacion, setMostrarNotificacion] = useState(false);
  const router = useRouter();

  // Función para simular la recepción de una notificación
  // En producción, esto se conectaría a un sistema de websockets
  // const simularRecepcionNotificacion = (tipo: string) => {
  //   switch (tipo) {
  //     case TipoNotificacion.PUNTOS_ACTUALIZADOS:
  //       setMensaje(
  //         '¡Tus puntos han sido actualizados! Refresca para ver los cambios.'
  //       );
  //       break;
  //     case TipoNotificacion.TARJETA_ASIGNADA:
  //       setMensaje(
  //         '¡Se ha asignado o actualizado tu tarjeta de fidelidad! Refresca para ver los cambios.'
  //       );
  //       break;
  //     case TipoNotificacion.NIVEL_CAMBIADO:
  //       setMensaje(
  //         '¡Has cambiado de nivel! Refresca para ver tu nuevo status.'
  //       );
  //       break;
  //     case TipoNotificacion.PROMOCION_DISPONIBLE:
  //       setMensaje(
  //         '¡Hay nuevas promociones disponibles para ti! Revisa la sección de promociones.'
  //       );
  //       break;
  //     case TipoNotificacion.MENU_ACTUALIZADO:
  //       setMensaje('¡El menú ha sido actualizado! Revisa las novedades.');
  //       break;
  //     default:
  //       setMensaje(
  //         'Hay una actualización disponible. Refresca para ver los cambios.'
  //       );
  //   }
  //
  //   setMostrarNotificacion(true);
  //
  //   // Ocultar la notificación después de 10 segundos si el usuario no interactúa
  //   setTimeout(() => {
  //     setMostrarNotificacion(false);
  //   }, 10000);
  // };

  // En una implementación real, aquí se conectaría a un servicio de websockets
  useEffect(() => {
    // Para demo: Simulamos recibir notificaciones cada cierto tiempo
    const interval = setInterval(() => {
      // Aquí normalmente habría un socket.on('notificacion', (data) => {})
      // Por ahora simulamos recibir notificaciones aleatorias cada 30 segundos
      // const tiposDisponibles = Object.values(TipoNotificacion);
      // const tipoAleatorio = tiposDisponibles[Math.floor(Math.random() * tiposDisponibles.length)]; // Comentado: variable no utilizada

      // Descomenta para probar:
      // simularRecepcionNotificacion(tipoAleatorio);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Función para refrescar la página y ver los cambios
  const refrescarPagina = () => {
    router.refresh();
    setMostrarNotificacion(false);
  };

  // Función para cerrar la notificación
  const cerrarNotificacion = () => {
    setMostrarNotificacion(false);
  };

  if (!mostrarNotificacion) return null;

  return (
    <div className="fixed bottom-20 right-4 md:right-8 z-50 max-w-sm bg-dark-800/95 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-700/30 overflow-hidden transform transition-all">
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 animate-pulse"></div>
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className="text-sm font-medium text-white">
              Notificación
            </p>
            <p className="mt-1 text-sm text-gray-300">
              Hay una actualización disponible. Refresca para ver los cambios.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={refrescarPagina}
                className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xs font-medium rounded-lg transition-all duration-200"
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Refrescar
              </button>
              <button
                onClick={cerrarNotificacion}
                className="inline-flex items-center px-3 py-2 bg-gray-700/70 hover:bg-gray-600/70 text-gray-200 text-xs font-medium rounded-lg transition-all duration-200"
              >
                <CheckCircle className="mr-2 h-4 w-4" /> Entendido
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
