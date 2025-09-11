import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Indicar a Next.js que esta ruta es dinámica
export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

// GET - Obtener categorías del menú para el cliente
export async function GET() {
  try {
    console.log(
      '📋 GET /api/menu/categorias - Obteniendo categorías para cliente...'
    );

    // Obtener todas las categorías disponibles (no filtramos por business porque es app cliente)
    // En un entorno real con múltiples negocios, se requeriría un identificador de negocio
    const categorias = await prisma.menuCategory.findMany({
      where: {
        activo: true,
      },
      orderBy: {
        orden: 'asc',
      },
    });

    console.log(`✅ Se encontraron ${categorias.length} categorías`);
    return NextResponse.json(categorias);
  } catch (error) {
    console.error('❌ Error obteniendo categorías:', error);
    return NextResponse.json(
      { error: 'Error obteniendo categorías de menú' },
      { status: 500 }
    );
  }
}
