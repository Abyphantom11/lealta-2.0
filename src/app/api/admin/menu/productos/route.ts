import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { ProductCreateData } from '../../../../../types/api-routes';
import { withAuth, AuthConfigs } from '../../../../../middleware/requireAuth';
import { nanoid } from 'nanoid';

// Indicar a Next.js que esta ruta es dinámica
export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

// POST - Crear nuevo producto
export async function POST(request: NextRequest) {
  return withAuth(request, async (session) => {
  try {
    console.log(`🍽️ Menu-productos POST by: ${session.role} (${session.userId}) - Business: ${session.businessId}`);
    
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
      data: {
        id: nanoid(),
        ...productData,
        updatedAt: new Date(),
      },
      include: {
        MenuCategory: {
          select: {
            id: true,
            nombre: true,
          }
        }
      }
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
  }, AuthConfigs.WRITE);
}

// GET - Obtener productos
export async function GET(request: NextRequest) {
  return withAuth(request, async (session) => {
  try {
    console.log(`🍽️ Menu-productos GET by: ${session.role} (${session.userId}) - Business: ${session.businessId}`);
    
    // Obtener business ID del middleware context
    const businessId = session.businessId; // ✅ FILTRO POR BUSINESS (actualizado)
    console.log('🏢 BusinessId desde middleware:', businessId);

    const productos = await prisma.menuProduct.findMany({
      where: {
        MenuCategory: {
          businessId: businessId,
        },
      },
      include: {
        MenuCategory: {
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
    console.error('❌ Error obteniendo productos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
  }, AuthConfigs.READ_ONLY);
}

// PUT - Actualizar producto
export async function PUT(request: NextRequest) {
  return withAuth(request, async (session) => {
  try {
    console.log(`🍽️ Menu-productos PUT by: ${session.role} (${session.userId}) - Business: ${session.businessId}`);
    
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
      include: {
        MenuCategory: {
          select: {
            id: true,
            nombre: true,
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      producto,
    });
  } catch (error) {
    console.error('❌ Error actualizando producto:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
  }, AuthConfigs.WRITE);
}

// DELETE - Eliminar producto (soft delete)
export async function DELETE(request: NextRequest) {
  return withAuth(request, async (session) => {
  try {
    console.log(`🗑️ Menu-productos DELETE by: ${session.role} (${session.userId}) - Business: ${session.businessId}`);
    
    const searchParams = request.nextUrl.searchParams;
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
    console.error('❌ Error eliminando producto:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
  }, AuthConfigs.ADMIN_ONLY);
}
