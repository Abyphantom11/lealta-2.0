import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Obtener títulos de secciones
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

    const config = await prisma.portalConfig.findUnique({
      where: { businessId },
      select: {
        promocionesTitle: true,
        recompensasTitle: true,
      },
    });

    return NextResponse.json({
      promocionesTitle: config?.promocionesTitle || 'Promociones Especiales',
      recompensasTitle: config?.recompensasTitle || 'Recompensas',
    });
  } catch (error) {
    console.error('Error al obtener títulos de secciones:', error);
    return NextResponse.json(
      { error: 'Error al obtener títulos de secciones' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar títulos de secciones
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessId, promocionesTitle, recompensasTitle } = body;

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId es requerido' },
        { status: 400 }
      );
    }

    // Preparar datos de actualización
    const updateData: any = {};
    if (promocionesTitle !== undefined) {
      updateData.promocionesTitle = promocionesTitle;
    }
    if (recompensasTitle !== undefined) {
      updateData.recompensasTitle = recompensasTitle;
    }

    // Actualizar o crear config si no existe
    const config = await prisma.portalConfig.upsert({
      where: { businessId },
      update: updateData,
      create: {
        businessId,
        promocionesTitle: promocionesTitle || 'Promociones Especiales',
        recompensasTitle: recompensasTitle || 'Recompensas',
        banners: [],
        promociones: [],
        eventos: [],
        recompensas: [],
        updatedBy: 'system',
      },
    });

    return NextResponse.json({
      success: true,
      promocionesTitle: config.promocionesTitle,
      recompensasTitle: config.recompensasTitle,
    });
  } catch (error) {
    console.error('Error al actualizar títulos de secciones:', error);
    return NextResponse.json(
      { error: 'Error al actualizar títulos de secciones' },
      { status: 500 }
    );
  }
}
