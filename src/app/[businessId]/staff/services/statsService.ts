// Statistics API service functions

import { TodayStats, RecentTicket } from '../types/staff.types';
import { ConsumoData } from '../types/customer.types';
import { Product } from '../types/product.types';

export class StatsService {
  
  static async loadRecentTickets(): Promise<{
    stats: TodayStats;
    tickets: RecentTicket[];
  }> {
    const response = await fetch('/api/admin/estadisticas?periodo=today');
    const data = await response.json();

    if (!data.success || !data.estadisticas) {
      throw new Error('No se pudieron cargar estadísticas');
    }

    // Actualizar estadísticas del día
    const stats = data.estadisticas.resumen;
    const newStats: TodayStats = {
      ticketsProcessed: stats.totalConsumos || 0,
      totalPoints: stats.totalPuntos || 0,
      totalAmount: stats.totalMonto || 0,
    };

    // Solo actualizar tickets recientes si existen
    let ticketsFormateados: RecentTicket[] = [];
    
    if (data.estadisticas.consumosRecientes && data.estadisticas.consumosRecientes.length > 0) {
      ticketsFormateados = data.estadisticas.consumosRecientes
        .slice(0, 5)
        .map((consumo: ConsumoData) => ({
          id: consumo.id,
          cedula:
            typeof consumo.cliente === 'object'
              ? consumo.cliente.cedula
              : consumo.cedula,
          cliente:
            typeof consumo.cliente === 'object'
              ? consumo.cliente.nombre
              : consumo.cliente,
          monto: consumo.total,
          puntos: consumo.puntos,
          hora: new Date(consumo.fecha).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          items: Array.isArray(consumo.productos)
            ? consumo.productos.map((p: Product) => p.nombre)
            : ['Productos procesados'],
          tipo: consumo.tipo,
          // Agregamos campos faltantes para RecentTicket
          productos: Array.isArray(consumo.productos)
            ? consumo.productos.map((p: Product) => p.nombre)
            : ['Productos procesados'],
          total: consumo.total,
          fecha: consumo.fecha,
        }));
    }

    return {
      stats: newStats,
      tickets: ticketsFormateados
    };
  }

  static async loadPuntosConfig(): Promise<number> {
    const response = await fetch('/api/admin/puntos');
    
    if (!response.ok) {
      throw new Error('Error cargando configuración de puntos');
    }
    
    const data = await response.json();
    
    if (data.success && data.data?.puntosPorDolar) {
      return data.data.puntosPorDolar;
    }
    
    // Valor por defecto
    return 4;
  }
}
