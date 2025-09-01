import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { tipo } = await request.json();
    
    if (!tipo) {
      return NextResponse.json(
        { error: 'El tipo de notificación es requerido' },
        { status: 400 }
      );
    }
    
    // Aquí normalmente implementaríamos una conexión a un servicio de websockets
    // como Pusher, Socket.io o similar para notificación en tiempo real.
    // Por ahora, simularemos que la notificación se envió exitosamente.
    
    return NextResponse.json({
      success: true,
      message: 'Notificación enviada a todos los clientes conectados',
      tipo: tipo,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error al enviar notificación:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al enviar notificación' },
      { status: 500 }
    );
  }
}
