import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getBusinessIdFromRequest } from '@/lib/business-utils';

const prisma = new PrismaClient();

// GET - Obtener todas las recompensas (incluyendo inactivas) para administración
export async function GET(request: NextRequest) {
  try {
    const businessId = getBusinessIdFromRequest(request);
    
    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID requerido' },
        { status: 400 }
      );
    }

    const recompensas = await prisma.portalRecompensa.findMany({
      where: {
        businessId
      },
      orderBy: [
        { orden: 'asc' },
        { pointsCost: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json({ recompensas });
  } catch (error) {
    console.error('Error obteniendo recompensas para admin:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear nueva recompensa (admin)
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
      title, 
      description, 
      imageUrl, 
      pointsCost, 
      category, 
      stock, 
      unlimited = false, 
      orden = 0 
    } = body;

    if (!title || pointsCost === undefined) {
      return NextResponse.json(
        { error: 'Título y costo en puntos son requeridos' },
        { status: 400 }
      );
    }

    if (pointsCost < 0) {
      return NextResponse.json(
        { error: 'El costo en puntos debe ser mayor o igual a 0' },
        { status: 400 }
      );
    }

    const recompensa = await prisma.portalRecompensa.create({
      data: {
        businessId,
        title,
        description,
        imageUrl,
        pointsCost,
        category,
        stock: unlimited ? null : stock,
        unlimited,
        orden,
        active: true
      }
    });

    console.log(`✅ Recompensa creada por admin: ${recompensa.id} - ${recompensa.title} (${recompensa.pointsCost} pts)`);
    return NextResponse.json({ recompensa }, { status: 201 });
  } catch (error) {
    console.error('Error creando recompensa desde admin:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar recompensa existente (admin)
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
      title, 
      description, 
      imageUrl, 
      pointsCost, 
      category, 
      stock, 
      unlimited, 
      active, 
      orden 
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID de la recompensa es requerido' },
        { status: 400 }
      );
    }

    const recompensa = await prisma.portalRecompensa.update({
      where: {
        id,
        businessId // Verificar que pertenece al business
      },
      data: {
        title,
        description,
        imageUrl,
        pointsCost,
        category,
        stock: unlimited ? null : stock,
        unlimited,
        active,
        orden
      }
    });

    console.log(`✅ Recompensa actualizada por admin: ${recompensa.id} - ${recompensa.title}`);
    return NextResponse.json({ recompensa });
  } catch (error) {
    console.error('Error actualizando recompensa desde admin:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar recompensa (admin)
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
        { error: 'ID de la recompensa es requerido' },
        { status: 400 }
      );
    }

    await prisma.portalRecompensa.delete({
      where: {
        id,
        businessId // Verificar que pertenece al business
      }
    });

    console.log(`✅ Recompensa eliminada por admin: ${id}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error eliminando recompensa desde admin:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
