import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cedula, businessId } = body;

    if (!cedula) {
      return NextResponse.json({ success: false, error: 'Cédula requerida' }, { status: 400 });
    }

    // Buscar cliente
    const cliente = await prisma.cliente.findFirst({
      where: { 
        cedula,
        businessId: businessId || 'cmfr2y0ia0000eyvw7ef3k20u' // fallback al business por defecto
      },
      include: {
        TarjetaLealtad: true
      }
    });

    if (!cliente) {
      return NextResponse.json({ success: false, error: 'Cliente no encontrado' }, { status: 404 });
    }

    if (!cliente.TarjetaLealtad) {
      return NextResponse.json({ success: false, error: 'Cliente no tiene tarjeta de lealtad' }, { status: 400 });
    }

    // Obtener datos actuales
    const puntosAcumulados = cliente.puntosAcumulados || 0;
    const esAsignacionManual = cliente.TarjetaLealtad.asignacionManual;
    const puntosProgresoActual = cliente.TarjetaLealtad.puntosProgreso || 0;

    // Recalcular progreso correctamente
    let nuevoPuntosProgreso;
    
    if (esAsignacionManual) {
      // Para tarjetas manuales: si los puntos acumulados superan el progreso actual, usar acumulados
      nuevoPuntosProgreso = Math.max(puntosProgresoActual, puntosAcumulados);
    } else {
      // Para tarjetas automáticas: usar siempre puntos acumulados
      nuevoPuntosProgreso = puntosAcumulados;
    }

    // Actualizar la tarjeta
    await prisma.tarjetaLealtad.update({
      where: { clienteId: cliente.id },
      data: { puntosProgreso: nuevoPuntosProgreso }
    });

    console.log(`🔄 Progreso recalculado para ${cliente.nombre}:`);
    console.log(`   Puntos acumulados: ${puntosAcumulados}`);
    console.log(`   Progreso anterior: ${puntosProgresoActual}`);
    console.log(`   Progreso nuevo: ${nuevoPuntosProgreso}`);
    console.log(`   Asignación manual: ${esAsignacionManual}`);

    return NextResponse.json({
      success: true,
      message: 'Progreso recalculado exitosamente',
      data: {
        cliente: cliente.nombre,
        cedula: cliente.cedula,
        puntosAcumulados,
        puntosProgresoAnterior: puntosProgresoActual,
        puntosProgresoNuevo: nuevoPuntosProgreso,
        asignacionManual: esAsignacionManual,
        nivel: cliente.TarjetaLealtad.nivel
      }
    });

  } catch (error) {
    console.error('❌ Error recalculando progreso:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
