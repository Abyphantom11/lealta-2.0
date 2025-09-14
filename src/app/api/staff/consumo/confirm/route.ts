import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { z } from 'zod';

// Forzar renderizado dinámico para esta ruta que usa autenticación
export const dynamic = 'force-dynamic';

// Helper function to get or create default location
async function getOrCreateDefaultLocation(businessId?: string): Promise<string> {
  let location = await prisma.location.findFirst({
    where: businessId ? { businessId } : {},
  });

  if (!location) {
    let business;
    if (businessId) {
      business = await prisma.business.findUnique({
        where: { id: businessId },
      });
    } else {
      business = await prisma.business.findFirst();
    }

    if (!business) {
      throw new Error('No se encontró un negocio válido');
    }

    location = await prisma.location.create({
      data: {
        name: 'Ubicación Principal',
        businessId: business.id,
      },
    });
  }

  return location.id;
}

// Esquema de validación para confirmar consumo
const confirmConsumoSchema = z.object({
  clienteId: z.string().min(1, 'ID del cliente es requerido'),
  businessId: z.string().optional(),
  empleadoId: z.string().optional(),
  productos: z.array(z.object({
    nombre: z.string(),
    cantidad: z.number(),
    precio: z.number(),
    categoria: z.string().optional(),
  })),
  total: z.number().min(0, 'Total debe ser mayor a 0'),
  puntos: z.number().min(0, 'Puntos deben ser mayor a 0'),
  empleadoDetectado: z.string().nullable(),
  confianza: z.number(),
  imagenUrl: z.string(),
  metodoPago: z.string().optional().default('efectivo'),
  notas: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = confirmConsumoSchema.parse(body);

    console.log('📝 Confirmando consumo para cliente:', validatedData.clienteId);

    // Verificar que el cliente existe
    const cliente = await prisma.cliente.findUnique({
      where: { id: validatedData.clienteId }
    });

    if (!cliente) {
      return NextResponse.json(
        { success: false, error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    // Obtener ubicación por defecto
    const locationId = await getOrCreateDefaultLocation(validatedData.businessId);

    // Crear registro de consumo
    const consumo = await prisma.consumo.create({
      data: {
        clienteId: cliente.id,
        businessId: validatedData.businessId || cliente.businessId,
        locationId: locationId,
        empleadoId: validatedData.empleadoId || '',
        productos: {
          items: validatedData.productos,
          total: validatedData.total,
          empleado: validatedData.empleadoDetectado,
          confianza: validatedData.confianza,
          notas: validatedData.notas || undefined,
        },
        total: validatedData.total,
        puntos: validatedData.puntos,
        pagado: true,
        metodoPago: validatedData.metodoPago,
        ticketImageUrl: validatedData.imagenUrl,
        ocrText: `Procesado con IA - Confianza: ${(validatedData.confianza * 100).toFixed(1)}% - Empleado: ${validatedData.empleadoDetectado || 'No detectado'}`,
      },
    });

    // Actualizar puntos del cliente (disponibles y acumulados)
    const clienteActualizado = await prisma.cliente.update({
      where: { id: cliente.id },
      data: {
        puntos: {
          increment: validatedData.puntos
        },
        puntosAcumulados: {
          increment: validatedData.puntos
        },
        totalGastado: {
          increment: validatedData.total
        },
        totalVisitas: {
          increment: 1
        }
      },
      include: {
        tarjetaLealtad: true
      }
    });

    // ✅ SINCRONIZAR: Actualizar también puntosProgreso en tarjeta (SIEMPRE - tanto automáticas como manuales)
    if (clienteActualizado.tarjetaLealtad) {
      await prisma.tarjetaLealtad.update({
        where: { clienteId: cliente.id },
        data: {
          puntosProgreso: clienteActualizado.puntosAcumulados
        }
      });
      console.log(`📊 PuntosProgreso actualizados a ${clienteActualizado.puntosAcumulados} (tarjeta ${clienteActualizado.tarjetaLealtad.asignacionManual ? 'manual' : 'automática'})`);
    }

    // Disparar evaluación automática de nivel
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

    console.log('✅ Consumo confirmado y guardado:', {
      consumoId: consumo.id,
      cliente: cliente.cedula,
      puntos: validatedData.puntos,
      total: validatedData.total,
      confianza: validatedData.confianza
    });

    return NextResponse.json({
      success: true,
      message: 'Consumo registrado exitosamente',
      data: {
        consumoId: consumo.id,
        clienteNombre: cliente.nombre,
        clienteCedula: cliente.cedula,
        puntosGenerados: validatedData.puntos,
        totalRegistrado: validatedData.total,
        puntosAcumulados: cliente.puntos + validatedData.puntos,
        procesadoConIA: true,
        confianza: Math.round(validatedData.confianza * 100),
        empleadoDetectado: validatedData.empleadoDetectado,
        productos: validatedData.productos,
        timestamp: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('Error al confirmar consumo:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Datos de confirmación inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
