import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Indicar a Next.js que esta ruta es dinámica
export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

// GET - Obtener productos por categoría para el cliente
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const categoriaId = searchParams.get('categoriaId');

    console.log(
      `📋 GET /api/menu/productos - Obteniendo productos para categoría: ${categoriaId}`
    );

    if (!categoriaId) {
      console.log('❌ ID de categoría no proporcionado');
      return NextResponse.json(
        { error: 'ID de categoría es requerido' },
        { status: 400 }
      );
    }

    // 🔒 BUSINESS ISOLATION: Obtener businessId desde headers del middleware
    const businessId = request.headers.get('x-business-id');
    
    if (!businessId) {
      console.error('❌ SECURITY: Falta x-business-id header');
      return NextResponse.json(
        { error: 'Business context required' },
        { status: 400 }
      );
    }

    console.log('🏢 Filtrando productos para businessId:', businessId);

    // 🛡️ FILTRAR POR BUSINESS - Solo productos del negocio actual
    const productos = await prisma.menuProduct.findMany({
      where: {
        categoryId: categoriaId,
        disponible: true,
        category: {
          businessId: businessId, // ✅ BUSINESS ISOLATION
        },
      },
      orderBy: {
        orden: 'asc',
      },
    });

    console.log(
      `✅ Se encontraron ${productos.length} productos para la categoría ${categoriaId}`
    );
    return NextResponse.json(productos);
  } catch (error) {
    console.error('❌ Error obteniendo productos:', error);
    return NextResponse.json(
      { error: 'Error obteniendo productos de menú' },
      { status: 500 }
    );
  }
}
