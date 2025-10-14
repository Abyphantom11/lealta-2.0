// Consumo API service functions

export interface ManualConsumoData {
  cedula: string;
  empleadoVenta: string;
  productos: Array<{ id: string; nombre: string; cantidad: number }>;
  totalManual: number;
}

export interface ConfirmationData {
  clienteId: string;
  businessId: string;
  empleadoId: string;
  productos: Array<{
    nombre: string;
    cantidad: number;
    precio: number;
    categoria: string;
  }>;
  total: number;
  puntos: number;
  empleadoDetectado: string;
  confianza: number;
  imagenUrl: string;
  metodoPago: string;
  notas: string;
}

export class ConsumoService {
  
  static async submitManualConsumo(consumoData: ManualConsumoData): Promise<{
    success: boolean;
    data: any;
    error?: string;
  }> {
    const response = await fetch('/api/staff/consumo/manual', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(consumoData),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Error al registrar consumo');
    }

    return data;
  }

  static async confirmAIData(confirmationData: ConfirmationData): Promise<{
    success: boolean;
    data: any;
    error?: string;
  }> {
    const response = await fetch('/api/staff/consumo/confirm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(confirmationData),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Error al confirmar datos');
    }

    return data;
  }

  static async processImageTicket(formData: FormData, isMultiple: boolean = false): Promise<{
    requiresConfirmation: boolean;
    data: any;
    isBatchProcess?: boolean;
    error?: string;
  }> {
    // Aumentar timeout para procesamiento con IA
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minutos

    try {
      // Usar el endpoint apropiado según el número de imágenes
      const endpoint = isMultiple ? '/api/staff/consumo/analyze-multi' : '/api/staff/consumo/analyze';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(data.error || 'Cliente no encontrado. Verifica la cédula y que el cliente esté registrado.');
        }
        throw new Error(data.error || 'Error al procesar imagen');
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
}
