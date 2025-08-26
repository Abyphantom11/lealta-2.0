import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Obtener menú completo con categorías y productos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    
    if (!businessId) {
      return NextResponse.json(
        { error: 'BusinessId es requerido' },
        { status: 400 }
      );
    }

    const categorias = await prisma.menuCategory.findMany({
      where: { 
        businessId,
        isActive: true 
      },
      include: {
        productos: {
          where: { isAvailable: true },
          orderBy: { orden: 'asc' }
        }
      },
      orderBy: { orden: 'asc' }
    });

    return NextResponse.json({
      success: true,
      menu: categorias
    });

  } catch (error) {
    console.error('Error obteniendo menú:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear nueva categoría
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessId, nombre, descripcion, icono, orden } = body;

    if (!businessId || !nombre) {
      return NextResponse.json(
        { error: 'BusinessId y nombre son requeridos' },
        { status: 400 }
      );
    }

    const categoria = await prisma.menuCategory.create({
      data: {
        businessId,
        nombre,
        descripcion: descripcion || null,
        icono: icono || null,
        orden: orden || 0
      }
    });

    return NextResponse.json({
      success: true,
      categoria
    });

  } catch (error) {
    console.error('Error creando categoría:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
