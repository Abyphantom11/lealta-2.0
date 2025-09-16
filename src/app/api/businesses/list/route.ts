// src/app/api/businesses/list/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET - Listar todos los businesses activos
 * Para selección de business en caso de rutas legacy bloqueadas
 */
export async function GET(request: NextRequest) {
  try {
    // Obtener todos los businesses activos
    const businesses = await prisma.business.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        name: true,
        subdomain: true,
        subscriptionPlan: true,
        createdAt: true,
        _count: {
          select: {
            users: true,
            clientes: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      businesses: businesses.map(business => ({
        slug: business.subdomain, // Usar subdomain como identificador público
        name: business.name,
        subdomain: business.subdomain,
        subscriptionPlan: business.subscriptionPlan,
        isActive: true, // Todos los filtrados son activos
        userCount: business._count.users,
        clientCount: business._count.clientes,
        createdAt: business.createdAt
      }))
    });

  } catch (error) {
    console.error('Error listing businesses:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        businesses: []
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
