import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST - Crear nuevo producto
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      categoryId, 
      nombre, 
      descripcion, 
      precio, 
      precioVaso, 
      imagen, 
      isDestacado, 
      opciones 
    } = body;

    if (!categoryId || !nombre || !precio) {
      return NextResponse.json(
        { error: 'CategoryId, nombre y precio son requeridos' },
        { status: 400 }
      );
    }

    const producto = await prisma.menuProduct.create({
      data: {
        categoryId,
        nombre,
        descripcion: descripcion || null,
        precio: parseFloat(precio),
        precioVaso: precioVaso ? parseFloat(precioVaso) : null,
        imagen: imagen || null,
        isDestacado: isDestacado || false,
        opciones: opciones || null
      }
    });

    return NextResponse.json({
      success: true,
      producto
    });

  } catch (error) {
    console.error('Error creando producto:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar producto
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      id,
      nombre, 
      descripcion, 
      precio, 
      precioVaso, 
      imagen, 
      isAvailable,
      isDestacado, 
      opciones 
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID del producto es requerido' },
        { status: 400 }
      );
    }

    const producto = await prisma.menuProduct.update({
      where: { id },
      data: {
        nombre: nombre || undefined,
        descripcion: descripcion || undefined,
        precio: precio ? parseFloat(precio) : undefined,
        precioVaso: precioVaso ? parseFloat(precioVaso) : undefined,
        imagen: imagen || undefined,
        isAvailable: isAvailable !== undefined ? isAvailable : undefined,
        isDestacado: isDestacado !== undefined ? isDestacado : undefined,
        opciones: opciones || undefined
      }
    });

    return NextResponse.json({
      success: true,
      producto
    });

  } catch (error) {
    console.error('Error actualizando producto:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar producto (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID del producto es requerido' },
        { status: 400 }
      );
    }

    await prisma.menuProduct.update({
      where: { id },
      data: { isAvailable: false }
    });

    return NextResponse.json({
      success: true,
      message: 'Producto desactivado correctamente'
    });

  } catch (error) {
    console.error('Error eliminando producto:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
