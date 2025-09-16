import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { MenuCategoryUpdateData } from '../../../../types/api-routes';
import { validateBusinessAccess } from '../../../../utils/business-validation';

// Indicar a Next.js que esta ruta es dinámica
export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

// GET - Obtener menú completo con categorías y productos
export async function GET(request: NextRequest) {
  try {
    console.log('📋 GET /api/admin/menu - Obteniendo menú...');
    
    // Obtener business ID del middleware context
    const businessId = validateBusinessAccess(request);
    console.log('🏢 BusinessId desde middleware:', businessId);

    console.log('🔍 Consultando categorías en la base de datos...');
    const categorias = await prisma.menuCategory.findMany({
      where: {
        businessId,
      },
      include: {
        productos: {
          where: { disponible: true },
          orderBy: { orden: 'asc' },
        },
      },
      orderBy: { orden: 'asc' },
    });

    console.log('✅ Categorías encontradas:', categorias.length);

    return NextResponse.json({
      success: true,
      menu: categorias,
    });
  } catch (error) {
    console.error('❌ Error obteniendo menú:', error);
    console.error('Stack trace:', (error as Error).stack);
    return NextResponse.json(
      { error: 'Error interno del servidor: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// POST - Crear nueva categoría
export async function POST(request: NextRequest) {
  try {
    console.log('📝 POST /api/admin/menu - Iniciando creación de categoría...');
    
    const body = await request.json();
    console.log('📦 Datos recibidos:', body);
    
    const { nombre, descripcion, icono, orden, parentId } = body;

    if (!nombre) {
      console.log('❌ Falta nombre requerido:', { nombre });
      return NextResponse.json(
        { error: 'Nombre es requerido' },
        { status: 400 }
      );
    }

    // Obtener business ID del middleware context
    const businessId = validateBusinessAccess(request);
    console.log('🏢 BusinessId desde middleware:', businessId);

    console.log('✅ Validación inicial pasada, creando categoría...');
    
    const categoria = await prisma.menuCategory.create({
      data: {
        businessId,
        nombre,
        descripcion: descripcion || null,
        icono: icono || null,
        orden: orden || 0,
        parentId: parentId || null,
        activo: true, // Asegurar que se cree como activo
      },
    });

    console.log('✅ Categoría creada exitosamente:', categoria);

    return NextResponse.json({
      success: true,
      categoria,
    });
  } catch (error) {
    console.error('❌ Error creando categoría:', error);
    console.error('Stack trace:', (error as Error).stack);
    return NextResponse.json(
      { error: 'Error interno del servidor: ' + (error as Error).message },
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

    // Obtener business ID del middleware context
    const businessId = validateBusinessAccess(request);

    const updateData: MenuCategoryUpdateData = {};
    if (nombre !== undefined) updateData.nombre = nombre;
    if (descripcion !== undefined) updateData.descripcion = descripcion;
    if (icono !== undefined) updateData.icono = icono;
    if (orden !== undefined) updateData.orden = orden;
    if (activo !== undefined) updateData.activo = activo;
    if (parentId !== undefined) updateData.parentId = parentId;

    // Verificar que la categoría pertenece al business antes de actualizar
    const categoria = await prisma.menuCategory.update({
      where: { 
        id,
        businessId // Asegurar que solo se actualice si pertenece al business
      },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      categoria,
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

    // Obtener business ID del middleware context
    const businessId = validateBusinessAccess(request);

    // Verificar que la categoría pertenece al business antes de eliminar
    const categoria = await prisma.menuCategory.findFirst({
      where: { 
        id,
        businessId
      },
    });

    if (!categoria) {
      return NextResponse.json(
        { error: 'Categoría no encontrada o acceso denegado' },
        { status: 404 }
      );
    }

    // Primero eliminar todos los productos asociados a esta categoría
    await prisma.menuProduct.deleteMany({
      where: { categoryId: id },
    });

    // Luego eliminar las subcategorías (que también pertenecen al mismo business)
    await prisma.menuCategory.deleteMany({
      where: { 
        parentId: id,
        businessId
      },
    });

    // Finalmente eliminar la categoría principal
    await prisma.menuCategory.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Categoría eliminada correctamente',
    });
  } catch (error) {
    console.error('Error eliminando categoría:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
