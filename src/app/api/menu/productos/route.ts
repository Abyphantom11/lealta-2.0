import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Indicar a Next.js que esta ruta es dinámica
export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

// GET - Obtener productos del menú (público)
export async function GET(request: NextRequest) {
  try {
    console.log('🍽️ Menu-productos público GET');
    
    // Obtener business ID del header
    const businessId = request.headers.get('x-business-id');
    
    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID es requerido' },
        { status: 400 }
      );
    }
    
    console.log('🏢 BusinessId:', businessId);

    // 🔍 Obtener categoriaId del query string
    const { searchParams } = new URL(request.url);
    const categoriaId = searchParams.get('categoriaId');
    
    console.log('📂 CategoriaId solicitada:', categoriaId);

    // Construir filtro dinámico
    const whereFilter: any = {
      category: {
        businessId: businessId,
      },
      disponible: true, // Solo productos disponibles para clientes
    };
    
    // 🎯 FILTRO POR CATEGORÍA: Si se especifica categoriaId, filtrar por ella
    if (categoriaId) {
      whereFilter.categoryId = categoriaId;
      console.log('🔍 Filtrando productos por categoría:', categoriaId);
    } else {
      console.log('📋 Obteniendo TODOS los productos del business');
    }

    const productos = await prisma.menuProduct.findMany({
      where: whereFilter,
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

    console.log(`✅ Encontrados ${productos.length} productos`);

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
}
