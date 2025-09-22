import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getBusinessIdFromRequest } from '@/lib/business-utils';

const prisma = new PrismaClient();

// GET - Obtener favorito del día
export async function GET(request: NextRequest) {
  try {
    const businessId = getBusinessIdFromRequest(request);
    
    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID requerido' },
        { status: 400 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const dateParam = searchParams.get('date');
    
    // Si no se especifica fecha, usar la fecha actual
    const targetDate = dateParam ? new Date(dateParam) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const favoritoDelDia = await prisma.portalFavoritoDelDia.findFirst({
      where: {
        businessId,
        active: true,
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ favoritoDelDia });
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
