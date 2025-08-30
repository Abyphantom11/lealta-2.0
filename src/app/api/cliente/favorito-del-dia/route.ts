import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Obtener favorito del día del portal
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId') || 'business_1';

    const portalConfig = await prisma.portalConfig.findUnique({
      where: { businessId }
    });

    // Cast portalConfig to access favoritoDelDia field
    const config = portalConfig as { favoritoDelDia?: unknown };

    if (!config?.favoritoDelDia) {
      return NextResponse.json({
        success: false,
        favorito: null,
        message: 'No hay favorito del día configurado'
      });
    }

    return NextResponse.json({
      success: true,
      favorito: config.favoritoDelDia
    });

  } catch (error) {
    console.error('Error obteniendo favorito del día:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
