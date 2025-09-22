import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import { join } from 'path';

const PORTAL_CONFIG_PATH = join(process.cwd(), 'portal-config.json');

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
// Función para validar los datos de entrada
function validateRequestData(body: any) {
  const { cedula, empleadoVenta, productos, totalManual } = body;

  if (!cedula || !empleadoVenta || !productos || !totalManual) {
    return {
      error: 'Faltan campos requeridos: cedula, empleadoVenta, productos, totalManual',
      status: 400
    };
  }

  if (!Array.isArray(productos) || productos.length === 0) {
    return {
      error: 'Debe incluir al menos un producto',
      status: 400
    };
  }

  const total = parseFloat(totalManual);
  if (isNaN(total) || total <= 0) {
    return {
      error: 'El total debe ser un número válido mayor a 0',
      status: 400
    };
  }

  return null; // Sin errores
}

// Función para validar productos
function validateProducts(productos: any[]) {
  for (const producto of productos) {
    if (!producto.nombre || typeof producto.nombre !== 'string') {
      return {
        error: 'Todos los productos deben tener un nombre válido',
        status: 400
      };
    }

    if (
      !producto.cantidad ||
      typeof producto.cantidad !== 'number' ||
      producto.cantidad <= 0
    ) {
      return {
        error: 'Todos los productos deben tener una cantidad válida mayor a 0',
        status: 400
      };
    }
  }

  return null; // Sin errores
}

export async function POST(request: NextRequest) {
  try {
    // ✅ AUTENTICACIÓN RESTAURADA - Usar middleware unificado
    const { requireAuth } = await import('../../../../../lib/auth/unified-middleware');
    
    const auth = await requireAuth(request, {
      role: 'STAFF',
      permission: 'consumos.create',
      allowSuperAdmin: true
    });

    if (auth.error) {
      return auth.error;
    }

    const { user } = auth;
    console.log('✅ Usuario autenticado:', {
      userId: user.id,
      userRole: user.role,
      businessId: user.businessId,
    });

    const body = await request.json();
    const { cedula, empleadoVenta, productos, totalManual, ocrText, ticketImageUrl } = body;

    // Validar datos de entrada
    const validationError = validateRequestData(body);
    if (validationError) {
      return NextResponse.json({ error: validationError.error }, { status: validationError.status });
    }

    // Validar productos
    const productValidationError = validateProducts(productos);
    if (productValidationError) {
      return NextResponse.json({ error: productValidationError.error }, { status: productValidationError.status });
    }

    const total = parseFloat(totalManual);

    // Buscar cliente (filtrado por business del usuario autenticado)
    const cliente = await prisma.cliente.findFirst({
      where: { 
        cedula: cedula.toString(),
        businessId: user.businessId // ✅ Filtrar por business del usuario
      },
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

    // 🔧 Obtener configuración de puntos dinámica
    let puntosPorDolar = 4; // Valor por defecto actualizado para coincidir con config actual
    try {
      const configContent = await fs.readFile(PORTAL_CONFIG_PATH, 'utf-8');
      const config = JSON.parse(configContent);
      puntosPorDolar = config.configuracionPuntos?.puntosPorDolar || 4;
      console.log('✅ Configuración de puntos cargada:', {
        puntosPorDolar,
        configPath: PORTAL_CONFIG_PATH,
        fullConfig: config.configuracionPuntos
      });
    } catch (error) {
      console.warn('⚠️ No se pudo cargar configuración de puntos, usando valor por defecto:', error);
    }

    // Calcular puntos dinámicos por cada $1 gastado
    const puntosGanados = Math.floor(total * puntosPorDolar); // ✅ Puntos dinámicos

    // Crear transacción para consistencia
    const result = await prisma.$transaction(async tx => {
      // Obtener configuración por defecto  
      const { businessId, locationId } = await getDefaultIds(
        user.businessId, // ✅ Usar business del usuario autenticado
        tx
      );

      // 1. Crear el registro de consumo
      const consumo = await tx.consumo.create({
        data: {
          clienteId: cliente.id,
          locationId: locationId,
          productos: productos.map((p: any) => ({
            nombre: p.nombre.trim(),
            cantidad: p.cantidad,
          })),
          total: total,
          puntos: puntosGanados,
          empleadoId: user.id, // ID del usuario que registra
          registeredAt: new Date(),
          ocrText: ocrText || `MANUAL: Empleado POS: ${empleadoVenta}`,
          ticketImageUrl: ticketImageUrl,
          businessId: businessId,
        },
      });

      // 2. Actualizar puntos del cliente (disponibles y acumulados)
      const clienteActualizado = await tx.cliente.update({
        where: { id: cliente.id },
        data: {
          puntos: { increment: puntosGanados },
          puntosAcumulados: { increment: puntosGanados },
          totalGastado: { increment: total },
          totalVisitas: { increment: 1 },
        },
        include: {
          tarjetaLealtad: true
        }
      });

      // ✅ SINCRONIZAR: Actualizar también puntosProgreso en tarjeta (SIEMPRE - tanto automáticas como manuales)
      if (clienteActualizado.tarjetaLealtad) {
        await tx.tarjetaLealtad.update({
          where: { clienteId: cliente.id },
          data: {
            puntosProgreso: clienteActualizado.puntosAcumulados
          }
        });
        console.log(`📊 PuntosProgreso actualizados a ${clienteActualizado.puntosAcumulados} (tarjeta ${clienteActualizado.tarjetaLealtad.asignacionManual ? 'manual' : 'automática'})`);
      }

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

    // Disparar evaluación automática de nivel después de la transacción
    try {
      const evaluacionResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/api/admin/evaluar-nivel-cliente`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clienteId: cliente.id })
      });

      if (evaluacionResponse.ok) {
        const evaluacionData = await evaluacionResponse.json();
        
        if (evaluacionData.actualizado) {
          console.log(`🆙 ¡Cliente ascendió automáticamente de ${evaluacionData.nivelAnterior} a ${evaluacionData.nivelNuevo}!`);
        }
      }
    } catch (error) {
      console.warn('⚠️ Error en evaluación automática de nivel:', error);
    }

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

    const searchParams = request.nextUrl.searchParams;
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
