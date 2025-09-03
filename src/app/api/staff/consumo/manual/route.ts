import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Indicar a Next.js que esta ruta es dinámica
export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

// Helper function para obtener configuración por defecto
async function getDefaultIds(
  businessId?: string | null,
  tx?: any
): Promise<{ businessId: string; locationId: string }> {
  const dbClient = tx ?? prisma;

  // Si no tenemos businessId, usar el primero disponible
  let validBusinessId = businessId;
  if (!validBusinessId) {
    const firstBusiness = await dbClient.business.findFirst();
    validBusinessId = firstBusiness?.id ?? '1';
  }

  // Obtener la primera ubicación del negocio
  let location = await dbClient.location.findFirst({
    where: { businessId: validBusinessId },
  });

  // Si no hay ubicación, crear una por defecto
  if (!location) {
    location = await dbClient.location.create({
      data: {
        businessId: validBusinessId,
        name: 'Ubicación Principal',
      },
    });
  }

  return {
    businessId: validBusinessId!,
    locationId: location.id,
  };
}
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 API Manual Consumption - TEMPORARILY NO AUTH FOR TESTING');

    // TEMPORAL: Usar valores reales de la base de datos para pruebas
    const userId = 'cmex9vqod0001ey0cvofcnanr'; // ID real del usuario staff@lealta.com
    const userRole = 'STAFF';
    const businessId = 'business_1'; // Business ID del usuario staff

    console.log('✅ Using hardcoded auth for testing:', {
      userId,
      userRole,
      businessId,
    });

    const body = await request.json();
    const { cedula, empleadoVenta, productos, totalManual } = body;

    // Validaciones básicas
    if (!cedula || !empleadoVenta || !productos || !totalManual) {
      return NextResponse.json(
        {
          error:
            'Faltan campos requeridos: cedula, empleadoVenta, productos, totalManual',
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(productos) || productos.length === 0) {
      return NextResponse.json(
        { error: 'Debe incluir al menos un producto' },
        { status: 400 }
      );
    }

    const total = parseFloat(totalManual);
    if (isNaN(total) || total <= 0) {
      return NextResponse.json(
        { error: 'El total debe ser un número válido mayor a 0' },
        { status: 400 }
      );
    }

    // Validar productos
    for (const producto of productos) {
      if (!producto.nombre || typeof producto.nombre !== 'string') {
        return NextResponse.json(
          { error: 'Todos los productos deben tener un nombre válido' },
          { status: 400 }
        );
      }

      if (
        !producto.cantidad ||
        typeof producto.cantidad !== 'number' ||
        producto.cantidad <= 0
      ) {
        return NextResponse.json(
          {
            error:
              'Todos los productos deben tener una cantidad válida mayor a 0',
          },
          { status: 400 }
        );
      }
    }

    // Buscar cliente
    const cliente = await prisma.cliente.findUnique({
      where: { cedula: cedula.toString() },
    });

    if (!cliente) {
      return NextResponse.json(
        {
          error:
            'Cliente no encontrado. Debe existir en el sistema antes de registrar consumo.',
        },
        { status: 404 }
      );
    }

    // Calcular puntos (2 puntos por cada $1 gastado)
    const puntosGanados = Math.floor(total * 2);

    // Crear transacción para consistencia
    const result = await prisma.$transaction(async tx => {
      // Obtener configuración por defecto
      const { businessId, locationId } = await getDefaultIds(
        cliente.businessId,
        tx
      );

      // 1. Crear el registro de consumo
      const consumo = await tx.consumo.create({
        data: {
          clienteId: cliente.id,
          locationId: locationId,
          productos: productos.map(p => ({
            nombre: p.nombre.trim(),
            cantidad: p.cantidad,
          })),
          total: total,
          puntos: puntosGanados,
          empleadoId: userId, // ID del usuario que registra
          registeredAt: new Date(),
          ocrText: `MANUAL: Empleado POS: ${empleadoVenta}`,
          businessId: businessId,
        },
      });

      // 2. Actualizar puntos del cliente
      const clienteActualizado = await tx.cliente.update({
        where: { id: cliente.id },
        data: {
          puntos: { increment: puntosGanados },
          totalGastado: { increment: total },
          totalVisitas: { increment: 1 },
        },
      });

      // 3. Buscar o crear productos en MenuProduct (opcional)
      for (const producto of productos) {
        const nombreProducto = producto.nombre.trim().toLowerCase();

        // Buscar si el producto ya existe en alguna categoría
        const productoExistente = await tx.menuProduct.findFirst({
          where: {
            nombre: {
              contains: nombreProducto,
            },
          },
        });

        // Si no existe, lo agregamos a una categoría "Sin Categoría"
        if (!productoExistente) {
          // Buscar o crear categoría "Sin Categoría"
          let categoria = await tx.menuCategory.findFirst({
            where: {
              nombre: 'Sin Categoría',
              businessId: businessId,
            },
          });

          categoria ??= await tx.menuCategory.create({
            data: {
              businessId: businessId,
              nombre: 'Sin Categoría',
              descripcion: 'Productos agregados automáticamente',
              orden: 999,
            },
          });

          // Crear nuevo producto
          await tx.menuProduct.create({
            data: {
              categoryId: categoria.id,
              nombre: producto.nombre.trim(),
              descripcion: `Producto agregado automáticamente desde consumo manual`,
              disponible: true,
              tipoProducto: 'simple',
            },
          });
        }
      }

      return {
        consumo,
        cliente: clienteActualizado,
        puntosGanados,
      };
    });

    // Respuesta exitosa
    return NextResponse.json({
      success: true,
      message: 'Consumo registrado exitosamente',
      data: {
        consumoId: result.consumo.id,
        cliente: {
          nombre: result.cliente.nombre,
          puntosNuevos: puntosGanados,
          puntosTotal: result.cliente.puntos,
          totalGastado: result.cliente.totalGastado,
        },
        productos: productos,
        total: total,
        empleadoVenta,
      },
    });
  } catch (error) {
    console.error('Error al registrar consumo manual:', error);

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

// Método GET para obtener estadísticas de consumos manuales (opcional)
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación usando headers del middleware
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userId || !userRole) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo admins pueden ver estadísticas
    if (!['ADMIN', 'SUPERADMIN'].includes(userRole.toUpperCase())) {
      return NextResponse.json(
        { error: 'Sin permisos para ver estadísticas' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const dias = parseInt(searchParams.get('dias') || '30');

    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - dias);

    const estadisticas = await prisma.consumo.findMany({
      where: {
        registeredAt: {
          gte: fechaInicio,
        },
        ocrText: {
          startsWith: 'MANUAL:',
        },
      },
      include: {
        cliente: {
          select: {
            nombre: true,
            cedula: true,
          },
        },
      },
      orderBy: {
        registeredAt: 'desc',
      },
    });

    const resumen = {
      totalConsumos: estadisticas.length,
      totalMonto: estadisticas.reduce((sum, c) => sum + c.total, 0),
      totalPuntos: estadisticas.reduce((sum, c) => sum + c.puntos, 0),
      clientesUnicos: new Set(estadisticas.map(c => c.clienteId)).size,
      promedioVenta:
        estadisticas.length > 0
          ? estadisticas.reduce((sum, c) => sum + c.total, 0) /
            estadisticas.length
          : 0,
    };

    return NextResponse.json({
      success: true,
      resumen,
      consumos: estadisticas,
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
