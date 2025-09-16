import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { validateBusinessAccess } from '../../../../utils/business-validation';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Obtener business ID del middleware context
    const businessId = validateBusinessAccess(request);
    
    const { cedula } = await request.json();

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
      return NextResponse.json({
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
                puntosProgreso: cliente.tarjetaLealtad.puntosProgreso, // ✅ NUEVO: Puntos de progreso de tarjeta
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
      });
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
