import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { ProductoHistorial, EstadisticasMensual } from '../../../../../../types/api-routes';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { cedula: string } }
) {
  try {
    console.log('🔍 API Historial Cliente - TEMPORARILY NO AUTH FOR TESTING');

    // TEMPORAL: Usar valores reales de la base de datos para pruebas
    const userId = 'cmes3ga7g0002eygg8blcebct'; // ID real del superadmin
    const userRole = 'SUPERADMIN';
    const businessId = 'cmes3g9wd0000eyggpbqfl9r6'; // Business ID del superadmin

    console.log('✅ Using hardcoded auth for testing:', {
      userId,
      userRole,
      businessId,
      cedula: params.cedula,
    });

    const { cedula } = params;

    if (!cedula) {
      return NextResponse.json({ error: 'Cédula requerida' }, { status: 400 });
    }

    // Buscar cliente
    const cliente = await prisma.cliente.findUnique({
      where: { cedula },
      include: {
        consumos: {
          include: {
            empleado: {
              select: {
                name: true,
                email: true,
              },
            },
            location: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            registeredAt: 'desc',
          },
        },
      },
    });

    if (!cliente) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    // Calcular estadísticas del cliente
    const totalConsumos = cliente.consumos.length;
    const totalGastadoCalculado = cliente.consumos.reduce(
      (sum, c) => sum + c.total,
      0
    );
    const totalPuntosGanados = cliente.consumos.reduce(
      (sum, c) => sum + c.puntos,
      0
    );

    // Último consumo
    const ultimoConsumo = cliente.consumos[0];

    // Productos más consumidos
    const productosConsumidos = cliente.consumos.reduce(
      (acc, consumo) => {
        if (Array.isArray(consumo.productos)) {
          (consumo.productos as unknown as ProductoHistorial[]).forEach((producto: ProductoHistorial) => {
            const nombre = producto.nombre || 'Producto sin nombre';
            const cantidad = producto.cantidad || 1;

            if (!acc[nombre]) {
              acc[nombre] = 0;
            }
            acc[nombre] += cantidad;
          });
        }
        return acc;
      },
      {} as Record<string, number>
    );

    // Top 5 productos
    const topProductos = Object.entries(productosConsumidos)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([nombre, cantidad]) => ({ nombre, cantidad }));

    // Historial formateado
    const historial = cliente.consumos.map(consumo => ({
      id: consumo.id,
      fecha: consumo.registeredAt,
      total: consumo.total,
      puntos: consumo.puntos,
      empleado: consumo.empleado.name || 'Staff',
      ubicacion: consumo.location?.name || 'Ubicación principal',
      tipo: consumo.ocrText?.startsWith('MANUAL:') ? 'MANUAL' : 'OCR',
      productos: Array.isArray(consumo.productos) ? consumo.productos : [],
      pagado: consumo.pagado,
      metodoPago: consumo.metodoPago,
    }));

    // Estadísticas por mes (últimos 6 meses)
    const seiseMesesAtras = new Date();
    seiseMesesAtras.setMonth(seiseMesesAtras.getMonth() - 6);

    const consumosPorMes = cliente.consumos
      .filter(c => c.registeredAt >= seiseMesesAtras)
      .reduce(
        (acc, consumo) => {
          const mes = consumo.registeredAt.toISOString().substring(0, 7); // YYYY-MM
          if (!acc[mes]) {
            acc[mes] = { consumos: 0, total: 0, transacciones: 0, puntos: 0 };
          }
          acc[mes].consumos++;
          acc[mes].total += consumo.total;
          acc[mes].puntos += consumo.puntos;
          return acc;
        },
        {} as Record<string, EstadisticasMensual>
      );

    return NextResponse.json({
      success: true,
      cliente: {
        id: cliente.id,
        cedula: cliente.cedula,
        nombre: cliente.nombre,
        correo: cliente.correo,
        telefono: cliente.telefono,
        puntos: cliente.puntos,
        totalVisitas: cliente.totalVisitas,
        totalGastado: cliente.totalGastado,
        defaultCount: cliente.defaultCount,
        riskLevel: cliente.riskLevel,
        registeredAt: cliente.registeredAt,
      },
      estadisticas: {
        totalConsumos,
        totalGastadoCalculado,
        totalPuntosGanados,
        promedioGasto:
          totalConsumos > 0 ? totalGastadoCalculado / totalConsumos : 0,
        ultimoConsumo: ultimoConsumo
          ? {
              fecha: ultimoConsumo.registeredAt,
              total: ultimoConsumo.total,
              puntos: ultimoConsumo.puntos,
            }
          : null,
        topProductos,
        consumosPorMes,
      },
      historial,
    });
  } catch (error) {
    console.error('Error al obtener historial del cliente:', error);

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
