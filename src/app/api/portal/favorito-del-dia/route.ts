import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getBusinessIdFromRequest } from '@/lib/business-utils';
import { getCurrentBusinessDay } from '@/lib/business-day-utils';

const prisma = new PrismaClient();

// GET - Obtener favorito del día
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

    console.log(`🏢 [FAVORITO] Using businessId: ${businessId} (from: ${queryBusinessId ? 'query' : 'header'})`);

    // ✅ CENTRALIZADO: Usar día comercial en lugar de fecha natural
    const currentDayName = await getCurrentBusinessDay(businessId);
    console.log(`🗓️ [FAVORITO] Día comercial actual: ${currentDayName}`);

    // Buscar favoritos activos y filtrar por día comercial
    const favoritos = await prisma.portalFavoritoDelDia.findMany({
      where: {
        businessId,
        active: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`🔍 [FAVORITO] Encontrados ${favoritos.length} favoritos activos`);

    // Filtrar por día comercial
    let favoritoDelDia = null;
    
    for (const favorito of favoritos) {
      // ✅ Verificar si el favorito debe mostrarse hoy
      if (!favorito.dia || favorito.dia === 'todos') {
        // Sin restricción de día - usar el más reciente
        favoritoDelDia = favorito;
        console.log(`🔍 [FAVORITO] "${favorito.productName}" (día: ${favorito.dia || 'todos'}) -> siempre visible`);
        break;
      } else {
        // Verificar si coincide con el día comercial actual
        const diaComercial = currentDayName.toLowerCase();
        const diaFavorito = favorito.dia.toLowerCase();
        
        if (diaComercial === diaFavorito) {
          favoritoDelDia = favorito;
          console.log(`🔍 [FAVORITO] "${favorito.productName}" (día: ${favorito.dia}) -> visible para ${currentDayName}`);
          break;
        } else {
          console.log(`🔍 [FAVORITO] "${favorito.productName}" (día: ${favorito.dia}) -> NO visible (hoy es ${currentDayName})`);
        }
      }
    }

    if (favoritoDelDia) {
      console.log(`✅ [FAVORITO] Favorito seleccionado: "${favoritoDelDia.productName}" para día comercial ${currentDayName}`);
      
      // ✅ ARREGLO: Transformar a formato compatible con cliente (igual que banners)
      const favoritoFormatted = {
        id: favoritoDelDia.id,
        productName: favoritoDelDia.productName,
        description: favoritoDelDia.description || '',
        imageUrl: favoritoDelDia.imageUrl || '',
        originalPrice: favoritoDelDia.originalPrice,
        specialPrice: favoritoDelDia.specialPrice,
        specialOffer: favoritoDelDia.specialOffer,
        activo: favoritoDelDia.active, // ✅ Transformar active → activo
        active: favoritoDelDia.active,
        dia: favoritoDelDia.dia || 'todos',
        createdAt: favoritoDelDia.createdAt
      };
      
      return NextResponse.json({ favoritoDelDia: favoritoFormatted });
    } else {
      console.log(`⚠️ [FAVORITO] No hay favorito disponible para día comercial ${currentDayName}`);
      return NextResponse.json({ favoritoDelDia: null });
    }
  } catch (error) {
    console.error('Error obteniendo favorito del día:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo favorito del día (solo admin)
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
    const { 
      productName, 
      description, 
      imageUrl, 
      originalPrice, 
      specialPrice, 
      specialOffer,
      date 
    } = body;

    if (!productName) {
      return NextResponse.json(
        { error: 'Nombre del producto es requerido' },
        { status: 400 }
      );
    }

    // Si se especifica una fecha, usarla; si no, usar la fecha actual
    const targetDate = date ? new Date(date) : new Date();

    // Verificar si ya existe un favorito activo para esa fecha
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingFavorito = await prisma.portalFavoritoDelDia.findFirst({
      where: {
        businessId,
        active: true,
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    if (existingFavorito) {
      return NextResponse.json(
        { error: 'Ya existe un favorito del día activo para esta fecha' },
        { status: 400 }
      );
    }

    const favoritoDelDia = await prisma.portalFavoritoDelDia.create({
      data: {
        businessId,
        productName,
        description,
        imageUrl,
        originalPrice,
        specialPrice,
        specialOffer,
        date: targetDate,
        active: true
      }
    });

    return NextResponse.json({ favoritoDelDia }, { status: 201 });
  } catch (error) {
    console.error('Error creando favorito del día:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar favorito del día existente (solo admin)
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
    const { 
      id, 
      productName, 
      description, 
      imageUrl, 
      originalPrice, 
      specialPrice, 
      specialOffer,
      date,
      active 
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID del favorito del día es requerido' },
        { status: 400 }
      );
    }

    const updateData: any = {
      productName,
      description,
      imageUrl,
      originalPrice,
      specialPrice,
      specialOffer,
      active
    };

    if (date) {
      updateData.date = new Date(date);
    }

    const favoritoDelDia = await prisma.portalFavoritoDelDia.update({
      where: {
        id,
        businessId // Verificar que pertenece al business
      },
      data: updateData
    });

    return NextResponse.json({ favoritoDelDia });
  } catch (error) {
    console.error('Error actualizando favorito del día:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar favorito del día (solo admin)
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
        { error: 'ID del favorito del día es requerido' },
        { status: 400 }
      );
    }

    await prisma.portalFavoritoDelDia.delete({
      where: {
        id,
        businessId // Verificar que pertenece al business
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error eliminando favorito del día:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
