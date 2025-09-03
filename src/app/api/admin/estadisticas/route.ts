import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

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
    const fechaActual = new Date();

    switch (periodo) {
      case 'today':
        fechaInicio = new Date(
          fechaActual.getFullYear(),
          fechaActual.getMonth(),
          fechaActual.getDate()
        );
        break;
      case 'week':
        fechaInicio = new Date(fechaActual.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        fechaInicio = new Date(
          fechaActual.getFullYear(),
          fechaActual.getMonth(),
          1
        );
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

    // Obtener top clientes
    const topClientes = await prisma.cliente.findMany({
      where: {
        consumos: {
          some: {
            registeredAt: {
              gte: fechaInicio,
            },
          },
        },
      },
      include: {
        consumos: {
          where: {
            registeredAt: {
              gte: fechaInicio,
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

    // Calcular métricas de clientes activos y retención
    const clientesActivos = await prisma.cliente.count({
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

    const totalClientesBD = await prisma.cliente.count();
    
    // Calcular retención (clientes con más de 1 consumo en el período)
    const clientesRecurrentes = await prisma.cliente.count({
      where: {
        consumos: {
          some: {
            registeredAt: {
              gte: fechaInicio,
            },
          },
        },
        totalVisitas: {
          gt: 1,
        },
      },
    });

    const tasaRetencion = clientesUnicos > 0 ? (clientesRecurrentes / clientesUnicos) * 100 : 0;
    
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
    });

    // Obtener estadísticas de clientes totales
    const totalClientes = await prisma.cliente.count();

    console.log(`👥 Debug - Clientes:`, {
      totalClientes,
      clientesActivos,
      clientesUnicos,
    });

    // Formatear top clientes para el dashboard
    const topClientesFormatted = topClientes.map((cliente, index) => {
      let tier = 'Bronze';
      if (index < 3) tier = 'Gold';
      else if (index < 6) tier = 'Silver';
      
      return {
        id: cliente.id,
        nombre: cliente.nombre,
        cedula: cliente.cedula,
        rank: index + 1,
        tier,
        totalSpent: cliente.totalGastado,
        visits: cliente.totalVisitas,
        points: cliente.puntos,
        lastVisit: cliente.consumos[0]?.registeredAt || new Date(),
        trend: Math.random() > 0.5 ? 'up' : 'down', // Temporal
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
      {} as Record<string, any>
    );

    // Convertir a array y ordenar
    const empleadosStats = Object.values(estadisticasPorEmpleado).sort(
      (a: any, b: any) => b.totalMonto - a.totalMonto
    );

    // Calcular top productos reales
    const productosVendidos = consumos.reduce(
      (acc, consumo) => {
        if (Array.isArray(consumo.productos)) {
          consumo.productos.forEach((producto: any) => {
            const nombre = producto.nombre || 'Producto sin nombre';
            const cantidad = producto.cantidad || 1;
            const precio = producto.precio || 0;

            if (!acc[nombre]) {
              acc[nombre] = {
                nombre: nombre,
                sales: 0,
                revenue: 0,
              };
            }

            acc[nombre].sales += cantidad;
            acc[nombre].revenue += precio * cantidad;
          });
        }
        return acc;
      },
      {} as Record<string, any>
    );

    // Top 5 productos por ventas
    const topProducts = Object.values(productosVendidos)
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 5);

    console.log(`🛍️ Debug - Top productos calculados:`, topProducts);

    // Si no hay productos reales, usar datos de ejemplo
    const finalTopProducts =
      topProducts.length > 0
        ? topProducts
        : [
            { name: 'Café Americano', sales: 150, revenue: 750, trend: '+12%' },
            { name: 'Croissant', sales: 89, revenue: 445, trend: '+8%' },
            { name: 'Latte', sales: 76, revenue: 532, trend: '+15%' },
          ];

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
          revenue: {
            current: totalMonto,
            previous: totalMontoPrevio,
            change: totalMontoPrevio > 0 ? ((totalMonto - totalMontoPrevio) / totalMontoPrevio) * 100 : 0,
            target: totalMonto * 1.2, // Target 20% más
          },
          clients: {
            current: clientesUnicos,
            previous: clientesUnicosPrevios,
            change: clientesUnicosPrevios > 0 ? ((clientesUnicos - clientesUnicosPrevios) / clientesUnicosPrevios) * 100 : 0,
            target: clientesUnicos * 1.15, // Target 15% más
          },
          avgTicket: {
            current: ticketPromedio,
            previous: ticketPromedioPrevio,
            change: ticketPromedioPrevio > 0 ? ((ticketPromedio - ticketPromedioPrevio) / ticketPromedioPrevio) * 100 : 0,
            target: ticketPromedio * 1.1, // Target 10% más
          },
          transactions: {
            current: totalConsumos,
            previous: totalConsumosPrevios,
            change: totalConsumosPrevios > 0 ? ((totalConsumos - totalConsumosPrevios) / totalConsumosPrevios) * 100 : 0,
            target: totalConsumos * 1.25, // Target 25% más
          },
          retention: {
            current: tasaRetencion,
            previous: 65, // Temporal
            change: tasaRetencion - 65,
            target: 80,
          },
          conversion: {
            current: totalClientes > 0 ? (clientesActivos / totalClientes) * 100 : 0,
            previous: 45, // Temporal
            change: totalClientes > 0 ? ((clientesActivos / totalClientes) * 100) - 45 : 0,
            target: 60,
          },
          topClient: {
            current: valorClienteTop,
            previous: valorClienteTop * 0.85, // Temporal
            change: 15, // Temporal
            target: valorClienteTop * 1.2,
          },
          activeClients: {
            current: clientesActivos,
            previous: Math.round(clientesActivos * 0.9), // Temporal
            change: 10, // Temporal
            target: Math.round(clientesActivos * 1.3),
          },
        },
        topClientes: topClientesFormatted,
        consumosRecientes,
        empleadosStats,
        topProducts: finalTopProducts,
      },
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);

    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : undefined,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
