import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { clienteId } = await request.json();

    if (!clienteId) {
      return NextResponse.json(
        { error: 'clienteId es requerido' },
        { status: 400 }
      );
    }

    // Buscar al cliente con su tarjeta de lealtad
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      include: {
        tarjetaLealtad: true
      }
    });

    if (!cliente) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    // Solo verificar ascensos para tarjetas asignadas manualmente
    if (!cliente.tarjetaLealtad?.asignacionManual) {
      return NextResponse.json({
        hasManualLevelUp: false,
        message: 'Tarjeta no es asignación manual'
      });
    }

    // Verificar si ya se notificó este nivel
    const cacheKey = `lastNotifiedLevel_${cliente.cedula}`;
    
    // Verificar localStorage del servidor (simulado con base de datos temporal o cache)
    // Para simplificar, usamos el updatedAt de la tarjeta como indicador
    const lastUpdate = cliente.tarjetaLealtad.updatedAt;
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    // Si la tarjeta fue actualizada en los últimos 5 minutos, probablemente fue un ascenso manual
    const isRecentManualUpdate = lastUpdate > fiveMinutesAgo;
    
    if (isRecentManualUpdate) {
      // Determinar el nivel anterior basado en la lógica de niveles
      const niveles = ['Bronce', 'Plata', 'Oro', 'Diamante', 'Platino'];
      const nivelActualIndex = niveles.indexOf(cliente.tarjetaLealtad.nivel);
      
      if (nivelActualIndex > 0) {
        const nivelAnterior = niveles[nivelActualIndex - 1];
        
        return NextResponse.json({
          hasManualLevelUp: true,
          nivelAnterior,
          nivelNuevo: cliente.tarjetaLealtad.nivel,
          cliente: {
            id: cliente.id,
            nombre: cliente.nombre,
            cedula: cliente.cedula
          },
          cacheKey
        });
      }
    }

    return NextResponse.json({
      hasManualLevelUp: false,
      message: 'No hay ascensos manuales recientes'
    });

  } catch (error) {
    console.error('Error verificando ascenso manual:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
