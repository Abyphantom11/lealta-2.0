import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
      businessId
    });

    const { searchParams } = new URL(request.url);
    const periodo = searchParams.get('periodo') || 'today'; // today, week, month, all

    let fechaInicio: Date;
    const fechaActual = new Date();

    switch (periodo) {
      case 'today':
        fechaInicio = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), fechaActual.getDate());
        break;
      case 'week':
        fechaInicio = new Date(fechaActual.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        fechaInicio = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);
        break;
      default: // 'all'
        fechaInicio = new Date(0); // Desde el inicio de los tiempos
    }

    // Obtener consumos del período
    const consumos = await prisma.consumo.findMany({
      where: {
        registeredAt: {
          gte: fechaInicio
        }
      },
      include: {
        cliente: {
          select: {
            nombre: true,
            cedula: true,
            puntos: true
          }
        },
        empleado: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        registeredAt: 'desc'
      }
    });

    console.log(`📊 Debug - Período: ${periodo}, Fecha inicio: ${fechaInicio.toISOString()}`);
    console.log(`📊 Debug - Consumos encontrados: ${consumos.length}`);
    
    if (consumos.length > 0) {
      console.log('📊 Debug - Primer consumo:', {
        id: consumos[0].id,
        fecha: consumos[0].registeredAt,
        total: consumos[0].total,
        cliente: consumos[0].cliente.nombre,
        cedula: consumos[0].cliente.cedula
      });
    }

    // Calcular estadísticas
    const totalConsumos = consumos.length;
    const totalMonto = consumos.reduce((sum, c) => sum + c.total, 0);
    const totalPuntos = consumos.reduce((sum, c) => sum + c.puntos, 0);
    const clientesUnicos = new Set(consumos.map(c => c.clienteId)).size;

    console.log(`📊 Debug - Estadísticas calculadas:`, {
      totalConsumos,
      totalMonto,
      totalPuntos,
      clientesUnicos
    });

    // Obtener estadísticas de clientes
    const totalClientes = await prisma.cliente.count();
    const clientesActivos = await prisma.cliente.count({
      where: {
        totalVisitas: {
          gt: 0
        }
      }
    });

    console.log(`👥 Debug - Clientes:`, {
      totalClientes,
      clientesActivos
    });

    // Top clientes por puntos
    const topClientes = await prisma.cliente.findMany({
      orderBy: {
        puntos: 'desc'
      },
      take: 10,
      select: {
        id: true,
        nombre: true,
        cedula: true,
        puntos: true,
        totalGastado: true,
        totalVisitas: true
      }
    });

    // Consumos recientes (últimos 20)
    const consumosRecientes = consumos.slice(0, 20).map(consumo => ({
      id: consumo.id,
      fecha: consumo.registeredAt,
      cliente: {
        nombre: consumo.cliente.nombre,
        cedula: consumo.cliente.cedula
      },
      empleado: consumo.empleado.name || 'Staff',
      total: consumo.total,
      puntos: consumo.puntos,
      tipo: consumo.ocrText?.startsWith('MANUAL:') ? 'MANUAL' : 'OCR',
      productos: Array.isArray(consumo.productos) ? consumo.productos : []
    }));

    // Estadísticas por empleado
    const estadisticasPorEmpleado = consumos.reduce((acc, consumo) => {
      const empleadoId = consumo.empleadoId;
      const empleadoNombre = consumo.empleado.name || 'Staff';
      
      if (!acc[empleadoId]) {
        acc[empleadoId] = {
          nombre: empleadoNombre,
          consumos: 0,
          totalMonto: 0,
          totalPuntos: 0
        };
      }
      
      acc[empleadoId].consumos++;
      acc[empleadoId].totalMonto += consumo.total;
      acc[empleadoId].totalPuntos += consumo.puntos;
      
      return acc;
    }, {} as Record<string, any>);

    // Convertir a array y ordenar
    const empleadosStats = Object.values(estadisticasPorEmpleado)
      .sort((a: any, b: any) => b.totalMonto - a.totalMonto);

    // Calcular top productos reales
    const productosVendidos = consumos.reduce((acc, consumo) => {
      if (Array.isArray(consumo.productos)) {
        consumo.productos.forEach((producto: any) => {
          const nombre = producto.nombre || 'Producto sin nombre';
          const cantidad = producto.cantidad || 1;
          const precio = producto.precio || 0;
          
          if (!acc[nombre]) {
            acc[nombre] = {
              nombre: nombre,
              sales: 0,
              revenue: 0
            };
          }
          
          acc[nombre].sales += cantidad;
          acc[nombre].revenue += precio * cantidad;
        });
      }
      return acc;
    }, {} as Record<string, any>);

    // Top 5 productos por ventas
    const topProducts = Object.values(productosVendidos)
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 5);

    console.log(`🛍️ Debug - Top productos calculados:`, topProducts);

    // Si no hay productos reales, usar datos de ejemplo
    const finalTopProducts = topProducts.length > 0 ? topProducts : [
      { name: 'Café Americano', sales: 150, revenue: 750, trend: '+12%' },
      { name: 'Croissant', sales: 89, revenue: 445, trend: '+8%' },
      { name: 'Latte', sales: 76, revenue: 532, trend: '+15%' }
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
          promedioVenta: totalConsumos > 0 ? totalMonto / totalConsumos : 0
        },
        topClientes,
        consumosRecientes,
        empleadosStats,
        topProducts: finalTopProducts
      }
    });

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
