import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 🧪 ENDPOINT SIMPLE PARA VERIFICAR VISITAS POR BUSINESS
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const businessId = searchParams.get('businessId') || 'cmfr2y0ia0000eyvw7ef3k20u';
    
    console.log('🧪 Verificando visitas para business:', businessId);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Contar visitas totales
    const totalVisitas = await prisma.visita.count({
      where: { businessId }
    });
    
    // Contar visitas de hoy
    const visitasHoy = await prisma.visita.count({
      where: {
        businessId,
        timestamp: { gte: today }
      }
    });
    
    // Obtener últimas 5 visitas para debug
    const ultimasVisitas = await prisma.visita.findMany({
      where: { businessId },
      orderBy: { timestamp: 'desc' },
      take: 5,
      select: {
        id: true,
        sessionId: true,
        clienteId: true,
        path: true,
        timestamp: true,
        isRegistered: true
      }
    });
    
    return NextResponse.json({
      success: true,
      businessId,
      data: {
        totalVisitas,
        visitasHoy,
        ultimasVisitas
      }
    });
    
  } catch (error: any) {
    console.error('🧪 Error verificando visitas:', error);
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }
}
