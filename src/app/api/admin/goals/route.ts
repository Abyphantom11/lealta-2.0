import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Indicar a Next.js que esta ruta es dinámica
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // TEMPORAL: Sin autenticación para simplificar
    const businessId = 'business_1'; 

    console.log('✅ Getting goals for business:', businessId);

    // Obtener las metas del negocio
    let goals = await prisma.businessGoals.findUnique({
      where: { businessId: businessId }
    });

    // Si no existen metas, crear las predeterminadas
    goals ??= await prisma.businessGoals.create({
      data: {
        businessId: businessId,
        // Los valores por defecto ya están definidos en el schema
      }
    });

    return NextResponse.json({ goals });
  } catch (error) {
    console.error('Error al obtener metas:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(request: NextRequest) {
  try {
    // TEMPORAL: Sin autenticación para simplificar
    const businessId = 'business_1';

    const body = await request.json();
    
    console.log('✅ Updating goals for business:', businessId, body);

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
      where: { businessId: businessId },
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
        businessId: businessId,
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
      }
    });

    return NextResponse.json({ 
      success: true, 
      goals,
      message: 'Metas actualizadas correctamente' 
    });
  } catch (error) {
    console.error('Error al actualizar metas:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
