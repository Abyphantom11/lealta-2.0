// Clipboard utilities for staff module

export const copyToClipboard = async (text: string, successMessage: string): Promise<{
  success: boolean;
  message: string;
}> => {
  if (!text || text.trim() === '') {
    return {
      success: false,
      message: 'No hay datos para copiar'
    };
  }

  try {
    await navigator.clipboard.writeText(text);
    return {
      success: true,
      message: successMessage
    };
  } catch (error) {
    console.error('Error copiando al portapapeles:', error);
    return {
      success: false,
      message: 'Error al copiar'
    };
  }
};

export const copyFullCustomerData = async (customerData: any): Promise<{
  success: boolean;
  message: string;
}> => {
  if (!customerData) {
    return {
      success: false,
      message: 'No hay datos del cliente para copiar'
    };
  }

  const customerText = `Datos del Cliente:
Nombre: ${customerData.nombre}
Cédula: ${customerData.cedula}
Teléfono: ${customerData.telefono || 'No registrado'}
Email: ${customerData.email || 'No registrado'}
Puntos: ${customerData.puntos}
Nivel: ${customerData.nivel}`;

  try {
    await navigator.clipboard.writeText(customerText);
    return {
      success: true,
      message: 'Datos del cliente copiados al portapapeles'
    };
  } catch (error) {
    console.error('Error copiando datos del cliente:', error);
    return {
      success: false,
      message: 'Error al copiar datos del cliente'
    };
  }
};
