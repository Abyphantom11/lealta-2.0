/**
 * Funciones para la gestión de notificaciones en tiempo real
 */

/**
 * Envía una notificación a todos los clientes conectados
 * @param tipo - El tipo de notificación a enviar
 * @returns Promise con el resultado de la operación
 */
export const enviarNotificacionClientes = async (
  tipo: string
): Promise<boolean> => {
  try {
    // Usar URL completa para requests desde el servidor
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';
    const response = await fetch(`${baseUrl}/api/notificaciones/actualizar-clientes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tipo }),
    });

    if (!response.ok) {
      console.error('Error al enviar notificación:', await response.text());
      return false;
    }

    const data = await response.json();
    console.log('Notificación enviada correctamente:', data);
    return true;
  } catch (error) {
    console.error('Error al enviar notificación:', error);
    return false;
  }
};

/**
 * Tipos de notificaciones disponibles en el sistema
 */
export const TipoNotificacion = {
  PUNTOS_ACTUALIZADOS: 'puntos_actualizados',
  TARJETA_ASIGNADA: 'tarjeta_asignada',
  NIVEL_CAMBIADO: 'nivel_cambiado',
  PROMOCION_DISPONIBLE: 'promocion_disponible',
  MENU_ACTUALIZADO: 'menu_actualizado',
};
