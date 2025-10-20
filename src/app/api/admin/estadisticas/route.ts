import { NextRequest, NextResponse } from 'next/server';
import { TopCliente, ProductosConsumo, ProductoConsumo, GoalsConfig, ProductVentasData, EmpleadoStats } from '../../../../types/api-routes';
import { withAuth } from '../../../../middleware/requireAuth';
import { prisma } from '../../../../lib/prisma';
import { nanoid } from 'nanoid';

// Indicar a Next.js que esta ruta es dinámica
export const dynamic = 'force-dynamic';

// 🔒 GET - Estadísticas administrativas (PROTEGIDO)
export async function GET(request: NextRequest) {
  // Configuración específica para SuperAdmin
  const authConfig = {
    requiredPermission: 'read',
    allowedRoles: ['superadmin', 'admin', 'staff'] as const,
    requireBusinessOwnership: false, // SuperAdmin puede acceder a cualquier business
    logAccess: true
  };

  return withAuth(request, async (session) => {
    try {
      // SuperAdmin: Si no tiene businessId, mostrar todas las estadísticas
      // Admins normales: Solo su business
      const targetBusinessId = session.role === 'superadmin' 
        ? (request.nextUrl.searchParams.get('businessId') || session.businessId)
        : session.businessId;
      
      // Validar que tengamos un businessId válido
      if (!targetBusinessId) {
        console.error('❌ No se pudo determinar businessId para estadísticas');
        return NextResponse.json({
          success: false,
          error: 'BusinessId no encontrado',
          message: 'No se pudo determinar el negocio para las estadísticas'
        }, { status: 400 });
      }
      
      const searchParams = request.nextUrl.searchParams;
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
        businessId: targetBusinessId, // ✅ FILTRO POR BUSINESS (SuperAdmin flexible)
        registeredAt: {
          gte: fechaInicio,
        },
      },
      include: {
        Cliente: {
          select: {
            nombre: true,
            cedula: true,
            puntos: true,
          },
        },
        User: {
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

    // ✅ Log completamente desactivado para evitar spam
    // if (process.env.NODE_ENV === 'development') {
    //   console.log(`📊 Stats: ${consumos.length} consumos`);
    // }

    // ✅ Debug de primer consumo removido para reducir spam

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
        businessId: targetBusinessId, // ✅ FILTRO POR BUSINESS (SuperAdmin flexible)
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
          businessId: targetBusinessId, // ✅ FILTRO POR BUSINESS (SuperAdmin flexible)
          Consumo: {
            some: {
              registeredAt: {
                gte: fechaInicio,
                lte: fechaActual,
              },
            },
          },
        },
        include: {
          Consumo: {
            where: {
              businessId: targetBusinessId, // ✅ FILTRO POR BUSINESS AGREGADO
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
      }) as any; // Mapearemos los datos después para ajustar al tipo TopCliente
      
      // Mapear Consumo a consumos para que coincida con el tipo TopCliente
      topClientes = (topClientes as any[]).map((cliente: any) => ({
        ...cliente,
        consumos: cliente.Consumo || []
      }));
    } catch (error) {
      console.error('🚨 Error obteniendo top clientes:', error);
      topClientes = [];
    }

    // Calcular métricas de clientes activos y retención con manejo de errores
    try {
      clientesActivos = await prisma.cliente.count({
        where: {
          businessId: targetBusinessId, // ✅ FILTRO POR BUSINESS AGREGADO
          Consumo: {
            some: {
              businessId: targetBusinessId, // ✅ DOBLE FILTRO por seguridad
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
          businessId: targetBusinessId, // ✅ FILTRO POR BUSINESS (SuperAdmin flexible)
          Consumo: {
            some: {
              registeredAt: {
                gte: fechaInicio,
                lte: fechaActual,
              },
            },
          },
        },
        include: {
          Consumo: {
            where: {
              businessId: targetBusinessId, // ✅ FILTRO POR BUSINESS AGREGADO
              registeredAt: {
                gte: fechaInicio,
                lte: fechaActual,
              },
            },
          },
        },
      });
      
      // Contar cuántos tienen más de 1 consumo en el período
      clientesRecurrentes = clientesDelPeriodo.filter(cliente => cliente.Consumo.length > 1).length;
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
        where: { businessId: targetBusinessId }
      });
      
      // Si no existen metas, crear las predeterminadas
      businessGoals ??= await prisma.businessGoals.create({
        data: {
          id: nanoid(),
          businessId: targetBusinessId,
          updatedAt: new Date(),
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

    // Helper functions para reducir complejidad cognitiva
    const getRevenueTarget = (goals: GoalsConfig, periodType: string): number => {
      switch (periodType) {
        case 'daily': return goals.dailyRevenue;
        case 'weekly': return goals.weeklyRevenue;
        default: return goals.monthlyRevenue;
      }
    };

    const getClientsTarget = (goals: GoalsConfig, periodType: string): number => {
      switch (periodType) {
        case 'daily': return goals.dailyClients;
        case 'weekly': return goals.weeklyClients;
        default: return goals.monthlyClients;
      }
    };

    const getTransactionsTarget = (goals: GoalsConfig, periodType: string): number => {
      switch (periodType) {
        case 'daily': return goals.dailyTransactions;
        case 'weekly': return goals.weeklyTransactions;
        default: return goals.monthlyTransactions;
      }
    };

    // Determinar la meta apropiada según el período
    const getTargetForPeriod = (goals: GoalsConfig | null, metric: string): number => {
      if (!goals) return 0;
      
      const periodType = getPeriodType(periodo);
      
      switch (metric) {
        case 'Revenue':
          return getRevenueTarget(goals, periodType);
        case 'Clients':
          return getClientsTarget(goals, periodType);
        case 'Transactions':
          return getTransactionsTarget(goals, periodType);
        default:
          return 0;
      }
    };

    // Calcular metas dinámicas
    // ✅ BusinessGoals log removido para reducir spam
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

    // ✅ Debug de estadísticas calculadas removido para reducir spam

    // Obtener estadísticas de clientes totales con manejo de errores
    let totalClientes = 0;
    try {
      totalClientes = await prisma.cliente.count({
        where: {
          businessId: targetBusinessId // ✅ FILTRO POR BUSINESS AGREGADO
        }
      });
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

    // ✅ Debug de clientes removido para reducir spam

    // Formatear top clientes para el dashboard
    const topClientesFormatted = topClientes.map((cliente, index) => {
      let nivel = 'Bronze' as 'Gold' | 'Silver' | 'Bronze';
      if (index < 3) nivel = 'Gold';
      else if (index < 6) nivel = 'Silver';
      
      const ultimaVisita = cliente.consumos[0]?.registeredAt || new Date();
      
      return {
        id: cliente.id,
        nombre: cliente.nombre,
        cedula: cliente.cedula,
        totalGastado: cliente.totalGastado,
        ultimaVisita: ultimaVisita.toISOString(),
        nivel,
      };
    });

    // Consumos recientes (últimos 20)
    const consumosRecientes = consumos.slice(0, 20).map(consumo => ({
      id: consumo.id,
      fecha: consumo.registeredAt,
      cliente: {
        nombre: consumo.Cliente?.nombre || 'Desconocido',
        cedula: consumo.Cliente?.cedula || 'N/A',
      },
      empleado: consumo.User?.name || 'Staff',
      total: consumo.total,
      puntos: consumo.puntos,
      tipo: consumo.ocrText?.startsWith('MANUAL:') ? 'MANUAL' : 'OCR',
      productos: Array.isArray(consumo.productos) ? consumo.productos : [],
    }));

    // Estadísticas por empleado
    const estadisticasPorEmpleado = consumos.reduce(
      (acc, consumo) => {
        const empleadoId = consumo.empleadoId;
        const empleadoNombre = consumo.User?.name || 'Staff';

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

    // ✅ Top productos log removido para reducir spam

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
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor',
      message: 'Error temporal al cargar estadísticas'
    }, { status: 500 });
  }
  }, authConfig);
}
