import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Indicar a Next.js que esta ruta es dinámica
export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

// GET - Obtener categorías del menú para el cliente
export async function GET(request: NextRequest) {
  try {
    console.log(
      '📋 GET /api/menu/categorias - Obteniendo categorías para cliente...'
    );

    // 🔒 BUSINESS ISOLATION: Obtener businessId desde headers del middleware
    const businessId = request.headers.get('x-business-id');
    
    if (!businessId) {
      console.error('❌ SECURITY: Falta x-business-id header');
      return NextResponse.json(
        { error: 'Business context required' },
        { status: 400 }
      );
    }

    console.log('🏢 Filtrando categorías para businessId:', businessId);

    // 🛡️ FILTRAR POR BUSINESS - Solo categorías del negocio actual
    const categorias = await prisma.menuCategory.findMany({
      where: {
        businessId: businessId, // ✅ BUSINESS ISOLATION
        activo: true,
      },
      orderBy: {
        orden: 'asc',
      },
    });

    console.log(`✅ Se encontraron ${categorias.length} categorías para business ${businessId}`);
    return NextResponse.json(categorias);
  } catch (error) {
    console.error('❌ Error obteniendo categorías:', error);
    return NextResponse.json(
      { error: 'Error obteniendo categorías de menú' },
      { status: 500 }
    );
  }
}
