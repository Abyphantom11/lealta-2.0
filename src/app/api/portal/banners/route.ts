import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getBusinessIdFromRequest } from '@/lib/business-utils';

const prisma = new PrismaClient();

// GET - Obtener banners del portal
export async function GET(request: NextRequest) {
  try {
    const businessId = getBusinessIdFromRequest(request);
    
    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID requerido' },
        { status: 400 }
      );
    }

    const banners = await prisma.portalBanner.findMany({
      where: {
        businessId,
        active: true
      },
      orderBy: {
        orden: 'asc'
      }
    });

    return NextResponse.json({ banners });
  } catch (error) {
    console.error('Error obteniendo banners:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo banner (solo admin)
export async function POST(request: NextRequest) {
  try {
    const businessId = getBusinessIdFromRequest(request);
    
    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID requerido' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { title, description, imageUrl, linkUrl, orden = 0 } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Título es requerido' },
        { status: 400 }
      );
    }

    const banner = await prisma.portalBanner.create({
      data: {
        businessId,
        title,
        description,
        imageUrl,
        linkUrl,
        orden,
        active: true
      }
    });

    return NextResponse.json({ banner }, { status: 201 });
  } catch (error) {
    console.error('Error creando banner:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar banner existente (solo admin)
export async function PUT(request: NextRequest) {
  try {
    const businessId = getBusinessIdFromRequest(request);
    
    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID requerido' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { id, title, description, imageUrl, linkUrl, active, orden } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID del banner es requerido' },
        { status: 400 }
      );
    }

    const banner = await prisma.portalBanner.update({
      where: {
        id,
        businessId // Verificar que pertenece al business
      },
      data: {
        title,
        description,
        imageUrl,
        linkUrl,
        active,
        orden
      }
    });

    return NextResponse.json({ banner });
  } catch (error) {
    console.error('Error actualizando banner:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar banner (solo admin)
export async function DELETE(request: NextRequest) {
  try {
    const businessId = getBusinessIdFromRequest(request);
    
    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID requerido' },
        { status: 400 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID del banner es requerido' },
        { status: 400 }
      );
    }

    await prisma.portalBanner.delete({
      where: {
        id,
        businessId // Verificar que pertenece al business
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error eliminando banner:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
