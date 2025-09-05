import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { TopCliente, ProductosConsumo, ProductoConsumo, GoalsConfig, ProductVentasData, EmpleadoStats } from '../../../../types/api-routes';

const prisma = new PrismaClient();

// Indicar a Next.js que esta ruta es dinámica
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API Estadísticas - TEMPORARILY NO AUTH FOR TESTING');

    // TEMPORAL: Usar valores reales de la base de datos para pruebas
    const userId = 'cmes3ga7g0002eygg8blcebct'; // ID real del superadmin arepa@gmail.com
    const userRole = 'SUPERADMIN';
    const businessId = 'cmes3g9wd0000eyggpbqfl9r6'; // Business ID del superadmin

    console.log('✅ Using hardcoded auth for testing:', {
      userId,
      userRole,
      businessId,
    });

    const { searchParams } = new URL(request.url);
    const periodo = searchParams.get('periodo') || 'today'; // today, week, month, all

    let fechaInicio: Date;
    let fechaActual = new Date();

    switch (periodo) {
      case 'today':
        fechaInicio = new Date(
          fechaActual.getFullYear(),
          fechaActual.getMonth(),
          fechaActual.getDate()
        );
        break;
      case 'yesterday': {
        const ayer = new Date(fechaActual);
        ayer.setDate(ayer.getDate() - 1);
        ayer.setHours(0, 0, 0, 0);
        fechaInicio = ayer;
        
        const ayerFin = new Date(ayer);
        ayerFin.setHours(23, 59, 59, 999);
        fechaActual = ayerFin;
        break;
      }
      case 'week':
      case '7days':
        fechaInicio = new Date(fechaActual.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30days':
        fechaInicio = new Date(fechaActual.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        fechaInicio = new Date(
          fechaActual.getFullYear(),
          fechaActual.getMonth(),
          1
        );
        break;
      case 'quarter': {
        const quarterStart = Math.floor(fechaActual.getMonth() / 3) * 3;
        fechaInicio = new Date(fechaActual.getFullYear(), quarterStart, 1);
        break;
      }
      case 'year':
        fechaInicio = new Date(fechaActual.getFullYear(), 0, 1);
        break;
      default: // 'all'
        fechaInicio = new Date(0); // Desde el inicio de los tiempos
    }

    // Obtener consumos del período
    const consumos = await prisma.consumo.findMany({
      where: {
        registeredAt: {
          gte: fechaInicio,
        },
      },
      include: {
        cliente: {
          select: {
            nombre: true,
            cedula: true,
            puntos: true,
          },
        },
        empleado: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        registeredAt: 'desc',
      },
    });

    console.log(
      `📊 Debug - Período: ${periodo}, Fecha inicio: ${fechaInicio.toISOString()}`
    );
    console.log(`📊 Debug - Consumos encontrados: ${consumos.length}`);

    if (consumos.length > 0) {
      console.log('📊 Debug - Primer consumo:', {
        id: consumos[0].id,
        fecha: consumos[0].registeredAt,
        total: consumos[0].total,
        cliente: consumos[0].cliente.nombre,
        cedula: consumos[0].cliente.cedula,
      });
    }

    // Calcular estadísticas avanzadas
    const totalConsumos = consumos.length;
    const totalMonto = consumos.reduce((sum, c) => sum + c.total, 0);
    const totalPuntos = consumos.reduce((sum, c) => sum + c.puntos, 0);
    const clientesUnicos = new Set(consumos.map(c => c.clienteId)).size;

    // Calcular ticket promedio
    const ticketPromedio = totalConsumos > 0 ? totalMonto / totalConsumos : 0;

    // Obtener estadísticas del período anterior para comparación
    const fechaInicioPrevio = new Date(fechaInicio.getTime() - (fechaActual.getTime() - fechaInicio.getTime()));
    const consumosPrevios = await prisma.consumo.findMany({
      where: {
        registeredAt: {
          gte: fechaInicioPrevio,
          lt: fechaInicio,
        },
      },
    });

    const totalMontoPrevio = consumosPrevios.reduce((sum, c) => sum + c.total, 0);
    const totalConsumosPrevios = consumosPrevios.length;
    const clientesUnicosPrevios = new Set(consumosPrevios.map(c => c.clienteId)).size;
    const ticketPromedioPrevio = totalConsumosPrevios > 0 ? totalMontoPrevio / totalConsumosPrevios : 0;

    // Obtener top clientes con manejo de errores
    let topClientes: TopCliente[] = [];
    let clientesActivos = 0;
    let clientesRecurrentes = 0;
    
    try {
      topClientes = await prisma.cliente.findMany({
        where: {
          consumos: {
            some: {
              registeredAt: {
                gte: fechaInicio,
                lte: fechaActual,
              },
            },
          },
        },
        include: {
          consumos: {
            where: {
              registeredAt: {
                gte: fechaInicio,
                lte: fechaActual,
              },
            },
            orderBy: {
              registeredAt: 'desc',
            },
            take: 1,
          },
        },
        orderBy: {
          totalGastado: 'desc',
        },
        take: 10,
      });
    } catch (error) {
      console.error('🚨 Error obteniendo top clientes:', error);
      topClientes = [];
    }

    // Calcular métricas de clientes activos y retención con manejo de errores
    try {
      clientesActivos = await prisma.cliente.count({
        where: {
          consumos: {
            some: {
              registeredAt: {
                gte: new Date(fechaActual.getTime() - 30 * 24 * 60 * 60 * 1000), // Últimos 30 días
              },
            },
          },
        },
      });
    } catch (error) {
      console.error('🚨 Error obteniendo clientes activos:', error);
      clientesActivos = clientesUnicos; // Fallback conservador
    }

    try {
      // Para calcular retención, necesitamos una consulta más simple
      // Obtener todos los clientes que compraron en el período
      const clientesDelPeriodo = await prisma.cliente.findMany({
        where: {
          consumos: {
            some: {
              registeredAt: {
                gte: fechaInicio,
                lte: fechaActual,
              },
            },
          },
        },
        include: {
          consumos: {
            where: {
              registeredAt: {
                gte: fechaInicio,
                lte: fechaActual,
              },
            },
          },
        },
      });
      
      // Contar cuántos tienen más de 1 consumo en el período
      clientesRecurrentes = clientesDelPeriodo.filter(cliente => cliente.consumos.length > 1).length;
    } catch (error) {
      console.error('🚨 Error obteniendo clientes recurrentes:', error);
      // Fallback: calcular manualmente desde los consumos obtenidos
      const clientesCompras = consumos.reduce((acc, consumo) => {
        acc[consumo.clienteId] = (acc[consumo.clienteId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      clientesRecurrentes = Object.values(clientesCompras).filter(count => count > 1).length;
    }

    const tasaRetencion = clientesUnicos > 0 ? (clientesRecurrentes / clientesUnicos) * 100 : 0;
    
    // Obtener las metas configurables del negocio
    let businessGoals = null;
    try {
      businessGoals = await prisma.businessGoals.findUnique({
        where: { businessId: businessId }
      });
      
      // Si no existen metas, crear las predeterminadas
      businessGoals ??= await prisma.businessGoals.create({
        data: {
          businessId: businessId,
          // Los valores por defecto ya están definidos en el schema
        }
      });
    } catch (error) {
      console.error('🚨 Error obteniendo metas del negocio:', error);
    }

    // Helper para determinar tipo de período
    const getPeriodType = (period: string) => {
      if (period === 'today' || period === 'yesterday') return 'daily';
      if (period === 'week' || period === '7days') return 'weekly';
      return 'monthly';
    };

    // Determinar la meta apropiada según el período
    const getTargetForPeriod = (goals: GoalsConfig | null, metric: string): number => {
      if (!goals) return 0;
      
      const periodType = getPeriodType(periodo);
      
      if (metric === 'Revenue') {
        if (periodType === 'daily') return goals.dailyRevenue;
        if (periodType === 'weekly') return goals.weeklyRevenue;
        return goals.monthlyRevenue;
      }
      if (metric === 'Clients') {
        if (periodType === 'daily') return goals.dailyClients;
        if (periodType === 'weekly') return goals.weeklyClients;
        return goals.monthlyClients;
      }
      if (metric === 'Transactions') {
        if (periodType === 'daily') return goals.dailyTransactions;
        if (periodType === 'weekly') return goals.weeklyTransactions;
        return goals.monthlyTransactions;
      }
      return 0;
    };

    // Calcular metas dinámicas
    const targetRevenue = getTargetForPeriod(businessGoals, 'Revenue');
    const targetClients = getTargetForPeriod(businessGoals, 'Clients');
    const targetTransactions = getTargetForPeriod(businessGoals, 'Transactions');
    const targetTicketAverage = businessGoals?.targetTicketAverage || 20;
    const targetRetentionRate = businessGoals?.targetRetentionRate || 70;
    const targetConversionRate = businessGoals?.targetConversionRate || 80;
    const targetTopClient = businessGoals?.targetTopClient || 150;
    const targetActiveClients = businessGoals?.targetActiveClients || 50;

    // Cliente top (mayor gastador del período)
    const clienteTop = topClientes[0];
    const valorClienteTop = clienteTop ? clienteTop.totalGastado : 0;

    console.log(`📊 Debug - Estadísticas calculadas:`, {
      totalConsumos,
      totalMonto,
      totalPuntos,
      clientesUnicos,
      ticketPromedio,
      tasaRetencion,
      clientesActivos,
      clientesRecurrentes,
    });

    // Obtener estadísticas de clientes totales con manejo de errores
    let totalClientes = 0;
    try {
      totalClientes = await prisma.cliente.count();
    } catch (error) {
      console.error('🚨 Error obteniendo total de clientes:', error);
      totalClientes = clientesUnicos; // Fallback conservador
    }

    // Calcular tasa de conversión más realista
    // Si tienes datos de visitas reales en el futuro, úsalos aquí
    // Para una métrica más realista, asumimos que cada compra representa una conversión exitosa
    // y que hay aproximadamente 20% más visitas que compras (métrica estándar e-commerce)
    const visitasEstimadas = Math.round(totalConsumos * 1.2);
    const tasaConversionVisitas = visitasEstimadas > 0 ? (totalConsumos / visitasEstimadas) * 100 : 0;

    console.log(`👥 Debug - Clientes:`, {
      totalClientes,
      clientesActivos,
      clientesUnicos,
    });

    // Formatear top clientes para el dashboard
    const topClientesFormatted = topClientes.map((cliente, index) => {
      let nivel = 'Bronze' as 'Gold' | 'Silver' | 'Bronze';
      if (index < 3) nivel = 'Gold';
      else if (index < 6) nivel = 'Silver';
      
      const ultimaVisita = cliente.consumos[0]?.registeredAt || new Date();
      const promedioPorVisita = cliente.totalVisitas > 0 ? cliente.totalGastado / cliente.totalVisitas : 0;
      
      return {
        id: cliente.id,
        nombre: cliente.nombre,
        cedula: cliente.cedula,
        totalGastado: cliente.totalGastado,
        totalVisitas: cliente.totalVisitas,
        ultimaVisita: ultimaVisita.toISOString(),
        promedioPorVisita: Math.round(promedioPorVisita * 100) / 100,
        nivel,
        puntos: cliente.puntos,
        tendencia: Math.random() > 0.5 ? 'up' : 'down' as 'up' | 'down' | 'stable', // Temporal
        crecimiento: Math.floor(Math.random() * 20) + 5, // Temporal, porcentaje entre 5-25%
      };
    });

    // Consumos recientes (últimos 20)
    const consumosRecientes = consumos.slice(0, 20).map(consumo => ({
      id: consumo.id,
      fecha: consumo.registeredAt,
      cliente: {
        nombre: consumo.cliente.nombre,
        cedula: consumo.cliente.cedula,
      },
      empleado: consumo.empleado.name || 'Staff',
      total: consumo.total,
      puntos: consumo.puntos,
      tipo: consumo.ocrText?.startsWith('MANUAL:') ? 'MANUAL' : 'OCR',
      productos: Array.isArray(consumo.productos) ? consumo.productos : [],
    }));

    // Estadísticas por empleado
    const estadisticasPorEmpleado = consumos.reduce(
      (acc, consumo) => {
        const empleadoId = consumo.empleadoId;
        const empleadoNombre = consumo.empleado.name || 'Staff';

        if (!acc[empleadoId]) {
          acc[empleadoId] = {
            id: empleadoId,
            nombre: empleadoNombre,
            consumos: 0,
            totalMonto: 0,
            totalPuntos: 0,
          };
        }

        acc[empleadoId].consumos++;
        acc[empleadoId].totalMonto += consumo.total;
        acc[empleadoId].totalPuntos += consumo.puntos;

        return acc;
      },
      {} as Record<string, EmpleadoStats>
    );

    // Convertir a array y ordenar
    const empleadosStats = Object.values(estadisticasPorEmpleado).sort(
      (a: EmpleadoStats, b: EmpleadoStats) => b.totalMonto - a.totalMonto
    );

    // Calcular top productos reales
    const productosVendidos = consumos.reduce(
      (acc, consumo) => {
        // Verificar que productos tiene la estructura correcta
        if (consumo.productos && typeof consumo.productos === 'object') {
          const productos = consumo.productos as unknown as ProductosConsumo;
          if (Array.isArray(productos.items)) {
            productos.items.forEach((producto: ProductoConsumo) => {
              const nombre = producto.nombre || 'Producto sin nombre';
              const cantidad = producto.cantidad || 1;
              const precio = producto.precio || 0;

              if (!acc[nombre]) {
                acc[nombre] = {
                  id: producto.id || nombre, // usar nombre como fallback si no hay id
                  nombre: nombre,
                  sales: 0,
                  revenue: 0,
                };
              }

              acc[nombre].sales += cantidad;
              acc[nombre].revenue += precio * cantidad;
            });
          }
        }
        return acc;
      },
      {} as ProductVentasData
    );

    // Top 5 productos por cantidad vendida (no por revenue)
    const topProducts = Object.values(productosVendidos)
      .sort((a, b) => b.sales - a.sales) // Ordenar por cantidad
      .slice(0, 5)
      .map((producto) => ({
        name: producto.nombre,
        sales: producto.sales,
        revenue: producto.revenue,
        trend: '+0%' // Por ahora sin cálculo de tendencia
      }));

    console.log(`🛍️ Top productos reales encontrados:`, topProducts.map(p => `${p.name} (${p.sales} unidades)`));

    return NextResponse.json({
      success: true,
      periodo,
      fechaInicio,
      estadisticas: {
        resumen: {
          totalConsumos,
          totalMonto,
          totalPuntos,
          clientesUnicos,
          totalClientes,
          clientesActivos,
          promedioVenta: totalConsumos > 0 ? totalMonto / totalConsumos : 0,
        },
        metricas: {
          totalRevenue: {
            current: totalMonto,
            previous: totalMontoPrevio,
            target: targetRevenue,
            format: 'currency' as const,
          },
          totalClients: {
            current: clientesUnicos,
            previous: clientesUnicosPrevios,
            target: targetClients,
            format: 'number' as const,
          },
          avgTicket: {
            current: ticketPromedio,
            previous: ticketPromedioPrevio,
            target: targetTicketAverage,
            format: 'currency' as const,
          },
          totalTransactions: {
            current: totalConsumos,
            previous: totalConsumosPrevios,
            target: targetTransactions,
            format: 'number' as const,
          },
          clientRetention: {
            current: tasaRetencion,
            previous: 65, // Temporal - podrías calcular esto también
            target: targetRetentionRate,
            format: 'percentage' as const,
          },
          conversionRate: {
            current: tasaConversionVisitas,
            previous: 45, // Temporal - podrías calcular esto también
            target: targetConversionRate,
            format: 'percentage' as const,
          },
          topClientValue: {
            current: valorClienteTop,
            previous: valorClienteTop * 0.85, // Temporal
            target: targetTopClient,
            format: 'currency' as const,
          },
          activeClients: {
            current: clientesActivos,
            previous: Math.round(clientesActivos * 0.9), // Temporal
            target: targetActiveClients,
            format: 'number' as const,
          },
        },
        topClientes: topClientesFormatted,
        consumosRecientes,
        empleadosStats,
        topProducts: topProducts,
      },
    });
  } catch (error) {
    console.error('❌ Error al obtener estadísticas:', error);

    // En lugar de datos fallback ficticios, devolver estructura vacía pero real
    return NextResponse.json({
      success: false,
      error: 'Error temporal de conexión - reintentar',
      periodo: 'today',
      fechaInicio: new Date(),
      estadisticas: {
        resumen: {
          totalConsumos: 0,
          totalMonto: 0,
          totalPuntos: 0,
          clientesUnicos: 0,
          totalClientes: 0,
          clientesActivos: 0,
          promedioVenta: 0,
        },
        metricas: {
          totalRevenue: { current: 0, previous: 0, target: 100, format: 'currency' as const },
          totalClients: { current: 0, previous: 0, target: 5, format: 'number' as const },
          avgTicket: { current: 0, previous: 0, target: 20, format: 'currency' as const },
          totalTransactions: { current: 0, previous: 0, target: 8, format: 'number' as const },
          clientRetention: { current: 0, previous: 0, target: 70, format: 'percentage' as const },
          conversionRate: { current: 0, previous: 0, target: 80, format: 'percentage' as const },
          topClientValue: { current: 0, previous: 0, target: 150, format: 'currency' as const },
          activeClients: { current: 0, previous: 0, target: 50, format: 'number' as const },
        },
        topClientes: [],
        consumosRecientes: [],
        empleadosStats: [],
        topProducts: [],
      },
    });
  } finally {
    await prisma.$disconnect();
  }
}
