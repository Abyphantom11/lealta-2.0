import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { ProductCreateData, ProductUpdateData } from '../../../../../types/api-routes';

// Indicar a Next.js que esta ruta es dinámica
export const dynamic = 'force-dynamic';

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
      precioBotella,
      tipoProducto,
      imagenUrl,
      destacado,
      disponible,
      opciones,
    } = body;

    if (!categoryId || !nombre) {
      return NextResponse.json(
        { error: 'CategoryId y nombre son requeridos' },
        { status: 400 }
      );
    }

    // Preparar datos del producto
    const productData: ProductCreateData = {
      categoryId,
      nombre,
      tipoProducto: tipoProducto || 'simple',
    };

    if (descripcion) productData.descripcion = descripcion;
    if (precio) productData.precio = parseFloat(precio);
    if (precioVaso) productData.precioVaso = parseFloat(precioVaso);
    if (precioBotella) productData.precioBotella = parseFloat(precioBotella);
    if (imagenUrl) productData.imagenUrl = imagenUrl;

    productData.destacado = destacado || false;
    productData.disponible = disponible !== false;
    if (opciones) productData.opciones = opciones;

    const producto = await prisma.menuProduct.create({
      data: productData,
    });

    return NextResponse.json({
      success: true,
      producto,
    });
  } catch (error) {
    console.error('Error creando producto:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// GET - Obtener productos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId es requerido' },
        { status: 400 }
      );
    }

    const productos = await prisma.menuProduct.findMany({
      where: {
        category: {
          businessId: businessId,
        },
      },
      include: {
        category: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: {
        nombre: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      productos,
    });
  } catch (error) {
    console.error('Error obteniendo productos:', error);
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
      precioBotella,
      tipoProducto,
      imagenUrl,
      disponible,
      destacado,
      opciones,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID del producto es requerido' },
        { status: 400 }
      );
    }

    // Preparar datos para actualización
    const updateData: Partial<ProductCreateData> = {};

    if (nombre !== undefined) updateData.nombre = nombre;
    if (descripcion !== undefined) updateData.descripcion = descripcion;
    if (precio !== undefined) updateData.precio = parseFloat(precio);
    if (precioVaso !== undefined)
      updateData.precioVaso = parseFloat(precioVaso);
    if (precioBotella !== undefined)
      updateData.precioBotella = parseFloat(precioBotella);
    if (tipoProducto !== undefined) updateData.tipoProducto = tipoProducto;
    if (imagenUrl !== undefined) updateData.imagenUrl = imagenUrl;
    if (disponible !== undefined) updateData.disponible = disponible;
    if (destacado !== undefined) updateData.destacado = destacado;
    if (opciones !== undefined) updateData.opciones = opciones;

    const producto = await prisma.menuProduct.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      producto,
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
      data: { disponible: false },
    });

    return NextResponse.json({
      success: true,
      message: 'Producto desactivado correctamente',
    });
  } catch (error) {
    console.error('Error eliminando producto:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
