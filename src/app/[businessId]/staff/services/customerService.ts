// Customer API service functions

import { CustomerInfo } from '../types/customer.types';

export interface RegisterData {
  cedula: string;
  nombre: string;
  telefono: string;
  email: string;
}

export interface SearchClient {
  id?: string;
  cedula: string;
  nombre: string;
  email?: string;
  correo?: string;
  telefono?: string;
  puntos?: number;
  tarjetaFidelizacion?: { nivel?: string };
  tarjetaLealtad?: { nivel?: string };
  totalGastado?: number;
  visitas?: number;
  totalVisitas?: number;
}

export class CustomerService {
  
  static async searchClients(searchTerm: string): Promise<{
    success: boolean;
    clients: SearchClient[];
  }> {
    const response = await fetch('/api/admin/clients/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        searchTerm: searchTerm
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Search failed: ${response.status} - ${errorData.error || 'Unknown error'}`);
    }
    
    return await response.json();
  }

  static async verifyCustomer(cedula: string): Promise<{
    existe: boolean;
    cliente?: any;
  }> {
    const response = await fetch('/api/cliente/verificar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cedula }),
    });

    if (!response.ok) {
      throw new Error('Error al consultar cliente');
    }

    return await response.json();
  }

  static async registerCustomer(registerData: RegisterData, businessId: string): Promise<{
    success: boolean;
    cliente: any;
  }> {
    const response = await fetch('/api/cliente/registro', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-business-id': businessId,
      },
      body: JSON.stringify({
        cedula: registerData.cedula,
        nombre: registerData.nombre,
        telefono: registerData.telefono,
        correo: registerData.email, // Cambiar email a correo para la API
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al registrar cliente');
    }

    return await response.json();
  }

  static mapSearchClientToCustomerInfo(client: SearchClient): CustomerInfo {
    return {
      id: client.id || client.cedula,
      cedula: client.cedula,
      nombre: client.nombre,
      email: client.email || client.correo,
      telefono: client.telefono,
      puntos: client.puntos || 0,
      nivel: client.tarjetaFidelizacion?.nivel || client.tarjetaLealtad?.nivel || 'Sin tarjeta',
      ultimaVisita: null,
      totalGastado: client.totalGastado || 0,
      frecuencia: `${client.visitas || client.totalVisitas || 0} visitas registradas`,
    };
  }
}
