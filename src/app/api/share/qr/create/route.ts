import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reservaId, message, businessId } = body;

    if (!reservaId || !businessId) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      );
    }

    // Verificar que la reserva existe
    const reserva = await prisma.reservation.findUnique({
      where: { id: reservaId },
    });

    if (!reserva) {
      return NextResponse.json(
        { error: 'Reserva no encontrada' },
        { status: 404 }
      );
    }

    // Generar ID único para el share link
    const shareId = nanoid(12); // Genera un ID corto pero único

    // Crear el share link en la base de datos
    await prisma.qRShareLink.create({
      data: {
        shareId,
        reservationId: reservaId,
        message: message || `Tu reserva está confirmada. Por favor presenta este QR al llegar.`,
        views: 0,
      },
    });

    // Construir la URL completa
    // Prioridad: 1) NEXT_PUBLIC_APP_URL, 2) Vercel URL, 3) Origin header, 4) localhost
    const baseUrl = 
      process.env.NEXT_PUBLIC_APP_URL || 
      process.env.NEXT_PUBLIC_VERCEL_URL || 
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
      request.headers.get('origin') || 
      'http://localhost:3001';
    
    const shareUrl = `${baseUrl}/share/qr/${shareId}`;

    return NextResponse.json({
      success: true,
      data: {
        shareId,
        shareUrl,
        expiresIn: '24 horas',
      },
    });
  } catch (error) {
    console.error('Error al crear share link:', error);
    return NextResponse.json(
      { error: 'Error al crear el link de compartir' },
      { status: 500 }
    );
  }
}
