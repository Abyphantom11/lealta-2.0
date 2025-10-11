import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Marcar como ruta dinámica
export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId es requerido' },
        { status: 400 }
      );
    }

    const clientes = await prisma.cliente.findMany({
      where: {
        businessId: businessId
      },
      include: {
        tarjetaLealtad: true
      },
      orderBy: {
        id: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      data: clientes
    });

  } catch (error) {
    console.error('Error obteniendo lista de clientes:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}