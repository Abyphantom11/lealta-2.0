import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getBusinessIdFromRequest } from '@/lib/business-utils';
import { generateId } from '@/lib/generateId';

const prisma = new PrismaClient();

// GET - Obtener favoritos del día para administración
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
    const limit = parseInt(searchParams.get('limit') || '30');

    const whereClause: any = { businessId };

    if (dateParam) {
      const targetDate = new Date(dateParam);
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      whereClause.date = {
        gte: startOfDay,
        lte: endOfDay
      };
    }

    const favoritos = await prisma.portalFavoritoDelDia.findMany({
      where: whereClause,
      orderBy: [
        { date: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit
    });

    return NextResponse.json({ favoritos });
  } catch (error) {
    console.error('Error obteniendo favoritos del día para admin:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo favorito del día (admin)
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
        { 
          error: 'Ya existe un favorito del día activo para esta fecha',
          existingFavorito: {
            id: existingFavorito.id,
            productName: existingFavorito.productName,
            date: existingFavorito.date
          }
        },
        { status: 400 }
      );
    }

    const favoritoDelDia = await prisma.portalFavoritoDelDia.create({
      data: {
        id: generateId(),
        businessId,
        productName,
        description,
        imageUrl,
        originalPrice,
        specialPrice,
        specialOffer,
        date: targetDate,
        active: true,
        updatedAt: new Date()
      }
    });

    console.log(`✅ Favorito del día creado por admin: ${favoritoDelDia.id} - ${favoritoDelDia.productName} para ${targetDate.toDateString()}`);
    return NextResponse.json({ favoritoDelDia }, { status: 201 });
  } catch (error) {
    console.error('Error creando favorito del día desde admin:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar favorito del día existente (admin)
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

    console.log(`✅ Favorito del día actualizado por admin: ${favoritoDelDia.id} - ${favoritoDelDia.productName}`);
    return NextResponse.json({ favoritoDelDia });
  } catch (error) {
    console.error('Error actualizando favorito del día desde admin:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar favorito del día (admin)
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

    console.log(`✅ Favorito del día eliminado por admin: ${id}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error eliminando favorito del día desde admin:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
