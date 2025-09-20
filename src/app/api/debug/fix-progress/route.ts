import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { cedula, businessId } = await request.json();

    if (!cedula || !businessId) {
      return NextResponse.json({ error: 'Cedula and businessId required' }, { status: 400 });
    }

    // Buscar cliente
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

    if (!cliente.tarjetaLealtad) {
      return NextResponse.json({ error: 'Cliente sin tarjeta de lealtad' }, { status: 404 });
    }

    // 🎯 CORRECCIÓN: Para tarjetas manuales, usar el MAYOR valor entre puntos del cliente y mínimo del nivel
    const puntosCliente = cliente.puntos || 0;
    const puntosMinimos = {
      'Bronce': 0,
      'Plata': 100,
      'Oro': 500,
      'Diamante': 1500,
      'Platino': 3000
    };

    const minimoNivel = puntosMinimos[cliente.tarjetaLealtad.nivel as keyof typeof puntosMinimos] || 0;
    const nuevoPuntosProgreso = Math.max(puntosCliente, minimoNivel);

    // Actualizar puntosProgreso
    const tarjetaActualizada = await prisma.tarjetaLealtad.update({
      where: { id: cliente.tarjetaLealtad.id },
      data: { puntosProgreso: nuevoPuntosProgreso }
    });

    return NextResponse.json({
      success: true,
      cliente: {
        nombre: cliente.nombre,
        cedula: cliente.cedula,
        puntos: cliente.puntos,
        nivel: cliente.tarjetaLealtad.nivel,
        asignacionManual: cliente.tarjetaLealtad.asignacionManual
      },
      progreso: {
        anterior: cliente.tarjetaLealtad.puntosProgreso,
        nuevo: nuevoPuntosProgreso,
        razon: puntosCliente > minimoNivel ? 'puntos_cliente_mayor' : 'minimo_nivel'
      }
    });

  } catch (error) {
    console.error('Error fixing progress:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
