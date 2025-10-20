import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { clienteId } = await request.json();

    if (!clienteId) {
      return NextResponse.json(
        { success: false, error: 'ID de cliente requerido' },
        { status: 400 }
      );
    }

    // Buscar el cliente con su tarjeta de lealtad
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      include: {
        TarjetaLealtad: true
      }
    });

    if (!cliente) {
      return NextResponse.json(
        { success: false, error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    // Verificar si hay un ascenso manual pendiente de notificar
    const tarjeta = cliente.TarjetaLealtad;
    const notifications = [];

    if (tarjeta?.asignacionManual) {
      // Verificar si ya se notificó este ascenso
      const lastNotifiedLevel = typeof window !== 'undefined' ? 
        localStorage.getItem(`lastNotifiedLevel_${cliente.cedula}`) : null;

      if (lastNotifiedLevel !== tarjeta.nivel) {
        // Determinar el nivel anterior basado en la lógica de niveles
        const niveles = ['Bronce', 'Plata', 'Oro', 'Diamante', 'Platino'];
        const nivelActualIndex = niveles.indexOf(tarjeta.nivel);
        
        if (nivelActualIndex > 0) {
          const nivelAnterior = niveles[nivelActualIndex - 1];
          
          notifications.push({
            tipo: 'ascenso_manual',
            nivelAnterior,
            nivelNuevo: tarjeta.nivel,
            clienteId: cliente.id,
            clienteCedula: cliente.cedula
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      notifications,
      clienteCliente: {
        id: cliente.id,
        cedula: cliente.cedula,
        nombre: cliente.nombre,
        tarjetaLealtad: tarjeta
      }
    });

  } catch (error) {
    console.error('Error verificando notificaciones del cliente:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
