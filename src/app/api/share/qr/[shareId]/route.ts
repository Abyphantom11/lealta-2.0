import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { shareId: string } }
) {
  try {
    const { shareId } = params;

    // Buscar el share link en la base de datos
    const shareLink = await prisma.qRShareLink.findUnique({
      where: { shareId },
      include: {
        reservation: {
          include: {
            cliente: true,
            service: {
              include: {
                business: true,
              },
            },
          },
        },
      },
    });

    if (!shareLink) {
      return NextResponse.json(
        { error: 'Link no encontrado o expirado' },
        { status: 404 }
      );
    }

    // Verificar si el link ha expirado (24 horas)
    const now = new Date();
    const expiresAt = new Date(shareLink.createdAt);
    expiresAt.setHours(expiresAt.getHours() + 24);

    if (now > expiresAt) {
      return NextResponse.json(
        { error: 'Link expirado' },
        { status: 410 }
      );
    }

    // Incrementar contador de vistas
    await prisma.qRShareLink.update({
      where: { id: shareLink.id },
      data: { views: { increment: 1 } },
    });

    return NextResponse.json({
      success: true,
      data: {
        reserva: shareLink.reservation,
        message: shareLink.message,
        businessName: shareLink.reservation.service.business.name,
        qrToken: shareLink.reservation.reservationNumber,
      },
    });
  } catch (error) {
    console.error('Error al obtener share link:', error);
    return NextResponse.json(
      { error: 'Error al cargar la información' },
      { status: 500 }
    );
  }
}
