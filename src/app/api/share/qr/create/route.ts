import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';
import crypto from 'node:crypto';

// Función para generar ID único
function generateId(): string {
  return crypto.randomBytes(16).toString('hex');
}

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
    const now = new Date();
    await prisma.qRShareLink.create({
      data: {
        id: generateId(),
        shareId,
        reservationId: reservaId,
        message: message || `Tu reserva está confirmada. Por favor presenta este QR al llegar.`,
        views: 0,
        updatedAt: now,
      },
    });

    // Construir la URL completa
    // En producción SIEMPRE usar lealta.app, en desarrollo usar el origin actual (Cloudflare/localhost)
    const isProduction = process.env.NODE_ENV === 'production';
    const baseUrl = isProduction 
      ? 'https://lealta.app'  // ✅ Siempre usar dominio principal en producción
      : request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
    
    const shareUrl = `${baseUrl}/share/qr/${shareId}`;
    
    console.log('🔗 Share URL generada:', shareUrl, '| isProduction:', isProduction);

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
