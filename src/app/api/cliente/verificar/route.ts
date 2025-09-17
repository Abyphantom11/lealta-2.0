import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { validateBusinessAccess } from '../../../../utils/business-validation';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Primero obtener el cuerpo de la petición
    const body = await request.json();
    const { cedula, businessId: bodyBusinessId } = body;
    
    // Obtener business ID del middleware context o desde el cuerpo/headers de la petición
    let businessId: string;
    
    try {
      // Intentar obtener business ID desde el middleware (rutas autenticadas)
      businessId = validateBusinessAccess(request);
    } catch {
      // Si no hay context del middleware, intentar obtener desde headers
      const headerBusinessId = request.headers.get('x-business-id');
      if (headerBusinessId) {
        businessId = headerBusinessId;
      } else if (bodyBusinessId) {
        // Como último recurso, usar el businessId del cuerpo de la petición
        businessId = bodyBusinessId;
      } else {
        console.error('❌ No business ID found in request:', {
          headers: Object.fromEntries(request.headers.entries()),
          url: request.url,
          body
        });
        return NextResponse.json(
          { error: 'Business ID required for client verification' },
          { status: 400 }
        );
      }
    }

    if (!cedula) {
      return NextResponse.json(
        { error: 'Cédula es requerida' },
        { status: 400 }
      );
    }

    // Buscar cliente por cédula DENTRO del business específico
    const cliente = await prisma.cliente.findFirst({
      where: {
        cedula: cedula.toString(),
        businessId, // ✅ FILTRAR POR BUSINESS ID
      },
      include: {
        tarjetaLealtad: true, // Incluir información de la tarjeta
      },
    });

    if (cliente) {
      // Cliente existe
      const clienteResponse = {
        existe: true,
        cliente: {
          id: cliente.id,
          cedula: cliente.cedula,
          nombre: cliente.nombre,
          puntos: cliente.puntos,
          visitas: cliente.totalVisitas,
          tarjetaLealtad: cliente.tarjetaLealtad
            ? {
                nivel: cliente.tarjetaLealtad.nivel,
                activa: cliente.tarjetaLealtad.activa,
                fechaAsignacion: cliente.tarjetaLealtad.fechaAsignacion,
                puntos: cliente.puntos, // Los puntos canjeables del cliente
                puntosProgreso: cliente.tarjetaLealtad.puntosProgreso || cliente.puntos, // ✅ FALLBACK: Usar puntos del cliente si puntosProgreso es null
                asignacionManual: cliente.tarjetaLealtad.asignacionManual || false, // ✅ AGREGAR CAMPO MANUAL
              }
            : {
                nivel: 'Bronce',
                activa: true,
                fechaAsignacion: new Date(),
                puntos: cliente.puntos, // Los puntos canjeables del cliente
                puntosProgreso: cliente.puntos, // ✅ NUEVO: Inicializar con puntos del cliente
                asignacionManual: false, // ✅ AGREGAR CAMPO MANUAL
              },
        },
      };
      
      return NextResponse.json(clienteResponse);
    } else {
      // Cliente no existe
      return NextResponse.json({
        existe: false,
      });
    }
  } catch (error) {
    console.error('Error verificando cliente:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
