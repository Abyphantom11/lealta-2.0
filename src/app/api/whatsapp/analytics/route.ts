import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET - Obtener analytics del negocio
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '7' // días
    const periodDays = Number.parseInt(period)

    // Calcular fechas
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - periodDays)

    // Obtener datos de analytics diarios
    const dailyAnalytics = await prisma.whatsAppAnalytics.findMany({
      where: {
        businessId: session.user.businessId,
        date: {
          gte: startDate.toISOString().split('T')[0],
          lte: endDate.toISOString().split('T')[0]
        }
      },
      orderBy: { date: 'asc' }
    })

    // Calcular totales
    const totals = dailyAnalytics.reduce(
      (acc, curr) => ({
        totalSent: acc.totalSent + curr.totalMessagesSent,
        totalDelivered: acc.totalDelivered + curr.totalDelivered,
        totalFailed: acc.totalFailed + curr.totalFailed,
        totalReplied: acc.totalReplied + curr.totalReplied,
        totalCost: acc.totalCost + curr.totalCost,
        activeClients: Math.max(acc.activeClients, curr.activeClients),
        newClients: acc.newClients + curr.newClients
      }),
      {
        totalSent: 0,
        totalDelivered: 0,
        totalFailed: 0,
        totalReplied: 0,
        totalCost: 0,
        activeClients: 0,
        newClients: 0
      }
    )

    // Calcular tasas
    const deliveryRate = totals.totalSent > 0 
      ? ((totals.totalDelivered / totals.totalSent) * 100).toFixed(2)
      : 0
    const responseRate = totals.totalDelivered > 0
      ? ((totals.totalReplied / totals.totalDelivered) * 100).toFixed(2)
      : 0

    return NextResponse.json({
      success: true,
      period: `${periodDays} días`,
      summary: {
        totalSent: totals.totalSent,
        totalDelivered: totals.totalDelivered,
        totalFailed: totals.totalFailed,
        totalReplied: totals.totalReplied,
        deliveryRate: parseFloat(deliveryRate as string),
        responseRate: parseFloat(responseRate as string),
        totalCost: totals.totalCost.toFixed(2),
        activeClients: totals.activeClients,
        newClients: totals.newClients
      },
      dailyData: dailyAnalytics
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
