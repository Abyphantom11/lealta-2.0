import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getBusinessIdFromRequest } from '@/lib/business-utils';

const prisma = new PrismaClient();

// GET - Obtener promociones del portal
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 🔧 FIX: Priorizar query parameter para producción
    const businessIdFromQuery = searchParams.get('businessId');
    const businessIdFromHeader = getBusinessIdFromRequest(request);
    const businessId = businessIdFromQuery || businessIdFromHeader;
    
    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID requerido' },
        { status: 400 }
      );
    }

    console.log(`🏢 [PROMOCIONES] Using businessId: ${businessId} (from: ${businessIdFromQuery ? 'query' : 'header'})`);

    const promociones = await prisma.portalPromocion.findMany({
      where: {
        businessId,
        active: true,
        OR: [
          { validUntil: null }, // Sin fecha de vencimiento
          { validUntil: { gte: new Date() } } // Vigentes
        ]
      },
      orderBy: {
        orden: 'asc'
      }
    });

    return NextResponse.json({ promociones });
  } catch (error) {
    console.error('Error obteniendo promociones:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear nueva promoción (solo admin)
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
    const { title, description, imageUrl, discount, validUntil, orden = 0 } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Título es requerido' },
        { status: 400 }
      );
    }

    const promocion = await prisma.portalPromocion.create({
      data: {
        businessId,
        title,
        description,
        imageUrl,
        discount,
        validUntil: validUntil ? new Date(validUntil) : null,
        orden,
        active: true
      }
    });

    return NextResponse.json({ promocion }, { status: 201 });
  } catch (error) {
    console.error('Error creando promoción:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar promoción existente (solo admin)
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
    const { id, title, description, imageUrl, discount, validUntil, active, orden } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID de la promoción es requerido' },
        { status: 400 }
      );
    }

    const promocion = await prisma.portalPromocion.update({
      where: {
        id,
        businessId // Verificar que pertenece al business
      },
      data: {
        title,
        description,
        imageUrl,
        discount,
        validUntil: validUntil ? new Date(validUntil) : null,
        active,
        orden
      }
    });

    return NextResponse.json({ promocion });
  } catch (error) {
    console.error('Error actualizando promoción:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar promoción (solo admin)
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
        { error: 'ID de la promoción es requerido' },
        { status: 400 }
      );
    }

    await prisma.portalPromocion.delete({
      where: {
        id,
        businessId // Verificar que pertenece al business
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error eliminando promoción:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
