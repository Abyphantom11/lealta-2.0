import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { EstadisticasMensual } from '../../../../../../types/api-routes';
import { withAuth } from '../../../../../../middleware/requireAuth';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { cedula: string } }
) {
  // Configuración específica para SuperAdmin
  const authConfig = {
    requiredPermission: 'read',
    allowedRoles: ['superadmin', 'admin', 'staff'] as const,
    requireBusinessOwnership: false, // SuperAdmin puede acceder a cualquier business
    logAccess: true
  };

  return withAuth(request, async (session) => {
    try {
      console.log('✅ Usuario autenticado:', {
        userId: session.userId,
        userRole: session.role,
        businessId: session.businessId,
        cedula: params.cedula,
      });

      const { cedula } = params;

      // SuperAdmin: Si no tiene businessId, usar el especificado en query params
      // Admins normales: Solo su business
      const targetBusinessId = session.role === 'superadmin' 
        ? (request.nextUrl.searchParams.get('businessId') || session.businessId)
        : session.businessId;

      if (!cedula) {
        return NextResponse.json({ error: 'Cédula requerida' }, { status: 400 });
      }

      // Construir filtros de búsqueda - SIEMPRE incluir businessId para isolation
      const whereCondition: any = { 
        cedula,
        businessId: targetBusinessId // ✅ SIEMPRE filtrar por business para isolation
      };

      console.log('🔍 Condiciones de búsqueda:', whereCondition);

    // Buscar cliente
    const cliente = await prisma.cliente.findFirst({
      where: whereCondition,
      include: {
        TarjetaLealtad: true, // ✨ Agregar información de tarjeta de lealtad
        Consumo: {
          include: {
            User: {
              select: {
                name: true,
                email: true,
              },
            },
            Location: {
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
    const totalConsumos = cliente.Consumo.length;
    const totalGastadoCalculado = cliente.Consumo.reduce(
      (sum, c) => sum + c.total,
      0
    );
    const totalPuntosGanados = cliente.Consumo.reduce(
      (sum, c) => sum + c.puntos,
      0
    );

    // Último consumo
    const ultimoConsumo = cliente.Consumo[0];

    // Productos más consumidos
    const productosConsumidos = cliente.Consumo.reduce(
      (acc, consumo) => {
        // ✨ Extraer productos del objeto anidado
        let productos = [];
        if (consumo.productos && typeof consumo.productos === 'object') {
          // Si productos tiene estructura { items: [...] }
          if ((consumo.productos as any).items && Array.isArray((consumo.productos as any).items)) {
            productos = (consumo.productos as any).items;
          }
          // Si productos es directamente un array (legacy)
          else if (Array.isArray(consumo.productos)) {
            productos = consumo.productos;
          }
        }

        productos.forEach((producto: any) => {
          const nombre = producto.nombre || producto.name || 'Producto sin nombre';
          const cantidad = producto.cantidad || 1;

          if (!acc[nombre]) {
            acc[nombre] = 0;
          }
          acc[nombre] += cantidad;
        });
        
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
    const historial = cliente.Consumo.map(consumo => {
      // ✨ Extraer productos del objeto anidado usando la misma lógica
      let productos = [];
      if (consumo.productos && typeof consumo.productos === 'object') {
        // Si productos tiene estructura { items: [...] }
        if ((consumo.productos as any).items && Array.isArray((consumo.productos as any).items)) {
          productos = (consumo.productos as any).items;
        }
        // Si productos es directamente un array (legacy)
        else if (Array.isArray(consumo.productos)) {
          productos = consumo.productos;
        }
      }

      return {
        id: consumo.id,
        fecha: consumo.registeredAt,
        total: consumo.total,
        puntos: consumo.puntos,
        empleado: consumo.User.name || 'Staff',
        ubicacion: consumo.Location?.name || 'Ubicación principal',
        tipo: consumo.ocrText?.startsWith('MANUAL:') ? 'MANUAL' : 'OCR',
        productos: productos,
        pagado: consumo.pagado,
        metodoPago: consumo.metodoPago,
      };
    });

    // Estadísticas por mes (últimos 6 meses)
    const seiseMesesAtras = new Date();
    seiseMesesAtras.setMonth(seiseMesesAtras.getMonth() - 6);

    const consumosPorMes = cliente.Consumo
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
        // ✨ Agregar información de tarjeta de lealtad
        tarjetaLealtad: cliente.TarjetaLealtad ? {
          id: cliente.TarjetaLealtad.id,
          nivel: cliente.TarjetaLealtad.nivel,
          fechaAsignacion: cliente.TarjetaLealtad.fechaAsignacion,
          asignacionManual: cliente.TarjetaLealtad.asignacionManual,
          activa: cliente.TarjetaLealtad.activa,
        } : null,
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
  }, authConfig);
}
