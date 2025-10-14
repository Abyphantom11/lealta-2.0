import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getBusinessIdFromRequest } from '@/lib/business-utils';
import { getCurrentBusinessDay } from '@/lib/business-day-utils';

const prisma = new PrismaClient();

// GET - Obtener promociones del portal
export async function GET(request: NextRequest) {
  try {
    // 🔥 CRÍTICO: Usar exactamente el mismo patrón que branding (que funciona)
    const queryBusinessId = request.nextUrl.searchParams.get('businessId');
    const headerBusinessId = getBusinessIdFromRequest(request);
    const businessId = queryBusinessId || headerBusinessId;
    
    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID requerido' },
        { status: 400 }
      );
    }

    console.log(`🏢 [PROMOCIONES] Using businessId: ${businessId} (from: ${queryBusinessId ? 'query' : 'header'})`);

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

    // ✅ CENTRALIZADO: Filtrar promociones usando lógica de día comercial
    const currentDayName = await getCurrentBusinessDay(businessId);
    console.log(`🗓️ [PROMOCIONES] Día comercial actual: ${currentDayName}`);
    
    // Filtrar promociones por visibilidad del día comercial
    const promocionesVisibles = [];
    
    for (const promocion of promociones) {
      // ✅ Verificar si la promoción debe mostrarse hoy
      if (!promocion.dia || promocion.dia === 'todos') {
        // Sin restricción de día - siempre visible
        promocionesVisibles.push(promocion);
        console.log(`🔍 [PROMOCIONES] "${promocion.title}" (día: ${promocion.dia || 'todos'}) -> siempre visible`);
      } else {
        // Verificar si coincide con el día comercial actual
        const diaComercial = currentDayName.toLowerCase();
        const diaPromocion = promocion.dia.toLowerCase();
        
        if (diaComercial === diaPromocion) {
          promocionesVisibles.push(promocion);
          console.log(`🔍 [PROMOCIONES] "${promocion.title}" (día: ${promocion.dia}) -> visible para ${currentDayName}`);
        } else {
          console.log(`🔍 [PROMOCIONES] "${promocion.title}" (día: ${promocion.dia}) -> NO visible (hoy es ${currentDayName})`);
        }
      }
    }
    
    console.log(`✅ [PROMOCIONES] ${promocionesVisibles.length}/${promociones.length} promociones visibles para día comercial ${currentDayName}`);

    return NextResponse.json({ promociones: promocionesVisibles });
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
