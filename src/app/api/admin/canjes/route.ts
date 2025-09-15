import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Obtener el historial real de canjes desde la base de datos
    const canjes = await prisma.historialCanje.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Limitar a los últimos 50 canjes
    });

    // Transformar los datos para el frontend
    const canjesFormateados = canjes.map(canje => ({
      id: canje.id,
      clienteId: canje.clienteId,
      clienteNombre: canje.clienteNombre,
      clienteCedula: canje.clienteCedula,
      recompensaId: canje.recompensaId,
      recompensaNombre: canje.recompensaNombre,
      puntosDescontados: canje.puntosDescontados,
      fecha: canje.createdAt,
    }));

    return NextResponse.json({
      success: true,
      canjes: canjesFormateados,
      total: canjesFormateados.length,
    });

  } catch (error) {
    console.error('Error obteniendo historial de canjes:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
