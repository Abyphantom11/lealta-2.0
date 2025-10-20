import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withAuth, AuthConfigs } from '../../../../middleware/requireAuth';
import { generateId } from '@/lib/generateId';

const prisma = new PrismaClient();

// Indicar a Next.js que esta ruta es dinámica
export const dynamic = 'force-dynamic';

// 🔒 GET - Obtener objetivos (PROTEGIDO - ADMIN_ONLY)
export async function GET(request: NextRequest) {
  return withAuth(request, async (session) => {
    try {
      console.log(`🎯 Goals GET by: ${session.role} (${session.userId}) - Business: ${session.businessId}`);

      // 🔒 Obtener las metas del negocio con filtro de seguridad
      let goals = await prisma.businessGoals.findUnique({
        where: { businessId: session.businessId } // ✅ SECURITY FILTER
      });

      console.log('📊 Goals encontradas en DB:', goals);

      // Si no existen metas, crear las predeterminadas
      if (!goals) {
        console.log('🆕 Creando metas por defecto...');
        goals = await prisma.businessGoals.create({
          data: {
            id: generateId(),
            businessId: session.businessId, // ✅ SECURITY FILTER
            updatedAt: new Date()
            // Los valores por defecto ya están definidos en el schema
          }
      });
      console.log('✅ Metas creadas:', goals);
    }

    return NextResponse.json({ 
      goals,
      accessedBy: session.userId, // ✅ AUDITORÍA
      businessId: session.businessId 
    });
  } catch (error) {
    console.error('❌ Error al obtener metas:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
  }, AuthConfigs.ADMIN_ONLY);
}

// 🔒 PUT - Actualizar objetivos (PROTEGIDO - ADMIN_ONLY)
export async function PUT(request: NextRequest) {
  return withAuth(request, async (session) => {
    try {
      console.log(`🔧 Goals UPDATE by: ${session.role} (${session.userId})`);

      const body = await request.json();
    
    console.log('✅ Updating goals for business:', session.businessId, body);

    // Validar los datos recibidos
    const {
      dailyRevenue,
      weeklyRevenue,
      monthlyRevenue,
      dailyClients,
      weeklyClients,
      monthlyClients,
      dailyTransactions,
      weeklyTransactions,
      monthlyTransactions,
      targetTicketAverage,
      targetRetentionRate,
      targetConversionRate,
      targetTopClient,
      targetActiveClients
    } = body;

    // Actualizar o crear las metas
    const goals = await prisma.businessGoals.upsert({
      where: { businessId: session.businessId }, // ✅ SECURITY FILTER
      update: {
        dailyRevenue: dailyRevenue || undefined,
        weeklyRevenue: weeklyRevenue || undefined,
        monthlyRevenue: monthlyRevenue || undefined,
        dailyClients: dailyClients || undefined,
        weeklyClients: weeklyClients || undefined,
        monthlyClients: monthlyClients || undefined,
        dailyTransactions: dailyTransactions || undefined,
        weeklyTransactions: weeklyTransactions || undefined,
        monthlyTransactions: monthlyTransactions || undefined,
        targetTicketAverage: targetTicketAverage || undefined,
        targetRetentionRate: targetRetentionRate || undefined,
        targetConversionRate: targetConversionRate || undefined,
        targetTopClient: targetTopClient || undefined,
        targetActiveClients: targetActiveClients || undefined,
      },
      create: {
        id: generateId(),
        businessId: session.businessId, // ✅ SECURITY FILTER
        dailyRevenue: dailyRevenue || 100,
        weeklyRevenue: weeklyRevenue || 700,
        monthlyRevenue: monthlyRevenue || 3000,
        dailyClients: dailyClients || 5,
        weeklyClients: weeklyClients || 25,
        monthlyClients: monthlyClients || 100,
        dailyTransactions: dailyTransactions || 8,
        weeklyTransactions: weeklyTransactions || 50,
        monthlyTransactions: monthlyTransactions || 200,
        targetTicketAverage: targetTicketAverage || 20,
        targetRetentionRate: targetRetentionRate || 70,
        targetConversionRate: targetConversionRate || 80,
        targetTopClient: targetTopClient || 150,
        targetActiveClients: targetActiveClients || 50,
        updatedAt: new Date()
      }
    });

    console.log('✅ Metas actualizadas exitosamente:', goals);

    return NextResponse.json({ 
      success: true, 
      goals,
      message: 'Metas actualizadas correctamente',
      updatedBy: session.userId, // ✅ AUDITORÍA
      businessId: session.businessId
    });
  } catch (error) {
    console.error('❌ Error al actualizar metas:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
  }, AuthConfigs.ADMIN_ONLY);
}
