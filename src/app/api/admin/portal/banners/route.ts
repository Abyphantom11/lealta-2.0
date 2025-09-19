import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getBusinessIdFromRequest } from '@/lib/business-utils';

const prisma = new PrismaClient();

// GET - Obtener todos los banners (incluyendo inactivos) para administración
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
        businessId
      },
      orderBy: [
        { orden: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json({ banners });
  } catch (error) {
    console.error('Error obteniendo banners para admin:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo banner (admin)
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

    console.log(`✅ Banner creado por admin: ${banner.id} - ${banner.title}`);
    return NextResponse.json({ banner }, { status: 201 });
  } catch (error) {
    console.error('Error creando banner desde admin:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar banner existente (admin)
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

    console.log(`✅ Banner actualizado por admin: ${banner.id} - ${banner.title}`);
    return NextResponse.json({ banner });
  } catch (error) {
    console.error('Error actualizando banner desde admin:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar banner (admin)
export async function DELETE(request: NextRequest) {
  try {
    const businessId = getBusinessIdFromRequest(request);
    
    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID requerido' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
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

    console.log(`✅ Banner eliminado por admin: ${id}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error eliminando banner desde admin:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
