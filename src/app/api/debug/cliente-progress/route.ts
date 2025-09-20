import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cedula = searchParams.get('cedula');
    const businessId = searchParams.get('businessId');

    if (!cedula || !businessId) {
      return NextResponse.json({ error: 'Cedula and businessId required' }, { status: 400 });
    }

    // Buscar cliente por cédula DENTRO del business específico
    const cliente = await prisma.cliente.findFirst({
      where: {
        cedula: cedula.toString(),
        businessId,
      },
      include: {
        tarjetaLealtad: true,
      },
    });

    if (!cliente) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    const debugInfo = {
      cliente: {
        id: cliente.id,
        cedula: cliente.cedula,
        nombre: cliente.nombre,
        puntos: cliente.puntos,
        totalVisitas: cliente.totalVisitas,
        businessId: cliente.businessId
      },
      tarjetaLealtad: cliente.tarjetaLealtad ? {
        id: cliente.tarjetaLealtad.id,
        nivel: cliente.tarjetaLealtad.nivel,
        activa: cliente.tarjetaLealtad.activa,
        fechaAsignacion: cliente.tarjetaLealtad.fechaAsignacion,
        puntosProgreso: cliente.tarjetaLealtad.puntosProgreso,
        asignacionManual: cliente.tarjetaLealtad.asignacionManual,
        clienteId: cliente.tarjetaLealtad.clienteId
      } : null,
      calculosProgreso: {
        puntosRequeridos: {
          'Bronce': 0,
          'Plata': 100,     // ✅ CORREGIDO: según admin config
          'Oro': 500,
          'Diamante': 1500, // ✅ CORREGIDO: era 15000, debe ser 1500
          'Platino': 3000   // ✅ CORREGIDO: era 25000, debe ser 3000
        },
        nivelActual: cliente.tarjetaLealtad?.nivel || 'Bronce',
        siguienteNivel: 'Oro', // Asumiendo que está en Plata
        puntosParaProximo: 500 - (cliente.puntos || 0)  // ✅ CORREGIDO
      }
    };

    return NextResponse.json(debugInfo);
  } catch (error) {
    console.error('Error en debug:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
