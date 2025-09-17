import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    
    console.log('🔍 DEBUG: Staff search test', { businessId });
    
    // Buscar unos pocos clientes para testing
    const whereClause: any = {};
    
    if (businessId) {
      whereClause.businessId = businessId;
    }
    
    const clientes = await prisma.cliente.findMany({
      where: whereClause,
      select: {
        id: true,
        businessId: true,
        cedula: true,
        nombre: true,
        correo: true,
        telefono: true,
        puntos: true,
        totalGastado: true,
        totalVisitas: true,
        business: {
          select: {
            name: true,
            slug: true,
          }
        },
        tarjetaLealtad: {
          select: {
            nivel: true,
            activa: true,
          }
        }
      },
      take: 5,
      orderBy: {
        nombre: 'asc'
      }
    });

    console.log(`✅ Found ${clientes.length} clients for debugging`);

    return NextResponse.json({
      success: true,
      clientCount: clientes.length,
      businessFilter: businessId,
      sampleClients: clientes.map(c => ({
        cedula: c.cedula,
        nombre: c.nombre,
        business: c.business?.name,
        puntos: c.puntos
      })),
      fullData: clientes
    });

  } catch (error) {
    console.error('❌ Debug search error:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message,
      stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
