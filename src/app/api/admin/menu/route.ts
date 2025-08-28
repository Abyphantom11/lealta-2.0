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
        businessId
      },
      include: {
        productos: {
          where: { disponible: true } as any,
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
    const { businessId, nombre, descripcion, icono, orden, parentId } = body;

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
        orden: orden || 0,
        parentId: parentId || null
      } as any // Casting temporal para resolver el problema de tipos de Prisma
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

// PUT - Actualizar categoría
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, nombre, descripcion, icono, orden, activo, parentId } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID de la categoría es requerido' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (nombre !== undefined) updateData.nombre = nombre;
    if (descripcion !== undefined) updateData.descripcion = descripcion;
    if (icono !== undefined) updateData.icono = icono;
    if (orden !== undefined) updateData.orden = orden;
    if (activo !== undefined) updateData.activo = activo;
    if (parentId !== undefined) updateData.parentId = parentId;

    const categoria = await prisma.menuCategory.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      categoria
    });

  } catch (error) {
    console.error('Error actualizando categoría:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar categoría
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID de la categoría es requerido' },
        { status: 400 }
      );
    }

    // Primero eliminar todos los productos asociados a esta categoría
    await prisma.menuProduct.deleteMany({
      where: { categoryId: id }
    });

    // Luego eliminar las subcategorías
    await prisma.menuCategory.deleteMany({
      where: { parentId: id }
    });

    // Finalmente eliminar la categoría principal
    await prisma.menuCategory.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Categoría eliminada correctamente'
    });

  } catch (error) {
    console.error('Error eliminando categoría:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
