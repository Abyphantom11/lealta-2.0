import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET - Obtener insights del negocio
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get('limit') || '10')
    const type = searchParams.get('type')
    const readOnly = searchParams.get('unread') === 'true'

    const where: any = {
      businessId: session.user.businessId
    }

    if (type) {
      where.type = type
    }

    if (readOnly) {
      where.isRead = false
    }

    const insights = await prisma.whatsAppInsight.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit
    })

    // Generar nuevos insights si es necesario
    await generateNewInsights(session.user.businessId)

    return NextResponse.json({
      success: true,
      insights,
      total: await prisma.whatsAppInsight.count({ where })
    })
  } catch (error) {
    console.error('Error fetching insights:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT - Marcar insight como leído
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { id, isRead, isActioned } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID del insight es requerido' },
        { status: 400 }
      )
    }

    const insight = await prisma.whatsAppInsight.update({
      where: { id },
      data: {
        isRead: isRead ?? undefined,
        isActioned: isActioned ?? undefined
      }
    })

    return NextResponse.json({
      success: true,
      insight
    })
  } catch (error) {
    console.error('Error updating insight:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Generar insights inteligentes basados en datos
async function generateNewInsights(businessId: string) {
  try {
    // Obtener datos recientes
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

    const [todayMetrics, yesterdayMetrics] = await Promise.all([
      prisma.whatsAppAnalytics.findUnique({
        where: { businessId_date: { businessId, date: today } }
      }),
      prisma.whatsAppAnalytics.findUnique({
        where: { businessId_date: { businessId, date: yesterday } }
      })
    ])

    const insights: any[] = []

    // Insight 1: Alerta si delivery rate baja mucho
    if (todayMetrics && yesterdayMetrics) {
      const deliveryToday = todayMetrics.totalMessagesSent > 0
        ? (todayMetrics.totalDelivered / todayMetrics.totalMessagesSent) * 100
        : 0
      const deliveryYesterday = yesterdayMetrics.totalMessagesSent > 0
        ? (yesterdayMetrics.totalDelivered / yesterdayMetrics.totalMessagesSent) * 100
        : 0

      if (deliveryToday < deliveryYesterday - 10) {
        insights.push({
          businessId,
          title: '⚠️ Tasa de entrega en descenso',
          description: `La tasa de entrega bajó de ${deliveryYesterday.toFixed(1)}% a ${deliveryToday.toFixed(1)}%`,
          type: 'ALERT',
          priority: 'HIGH',
          metric: 'deliveryRate',
          value: `${deliveryToday.toFixed(1)}%`
        })
      }
    }

    // Insight 2: Recomendación si response rate es alto
    if (todayMetrics) {
      const responseRate = todayMetrics.totalDelivered > 0
        ? (todayMetrics.totalReplied / todayMetrics.totalDelivered) * 100
        : 0

      if (responseRate > 20) {
        insights.push({
          businessId,
          title: '🎯 Excelente engagement detectado',
          description: `Tu tasa de respuesta es de ${responseRate.toFixed(1)}%. Considera aumentar el volumen de campañas.`,
          type: 'RECOMMENDATION',
          priority: 'MEDIUM',
          metric: 'responseRate',
          value: `${responseRate.toFixed(1)}%`,
          actionRecommended: 'Aumentar presupuesto de campañas',
          actionUrl: '/whatsapp/campaigns'
        })
      }
    }

    // Insight 3: Alerta si hay muchos opt-outs
    if (todayMetrics) {
      const optOutRate = todayMetrics.totalMessagesSent > 0
        ? (todayMetrics.optedOutClients / todayMetrics.totalMessagesSent) * 100
        : 0

      if (optOutRate > 5) {
        insights.push({
          businessId,
          title: '🚫 Alto rate de opt-outs',
          description: `${todayMetrics.optedOutClients} clientes se dieron de baja hoy (${optOutRate.toFixed(1)}%).`,
          type: 'ALERT',
          priority: 'CRITICAL',
          metric: 'optOutRate',
          value: `${optOutRate.toFixed(1)}%`,
          actionRecommended: 'Revisar calidad de mensajes y frecuencia'
        })
      }
    }

    // Insight 4: Tendencia de crecimiento
    const last7Days = await prisma.whatsAppAnalytics.findMany({
      where: {
        businessId,
        date: {
          gte: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
        }
      },
      orderBy: { date: 'asc' },
      take: 7
    })

    if (last7Days.length > 1) {
      const firstWeekTotal = last7Days[0].totalMessagesSent
      const lastWeekTotal = last7Days[last7Days.length - 1].totalMessagesSent
      const growth = firstWeekTotal > 0
        ? ((lastWeekTotal - firstWeekTotal) / firstWeekTotal) * 100
        : 0

      if (growth > 20) {
        insights.push({
          businessId,
          title: '📈 Tendencia de crecimiento positiva',
          description: `Has crecido ${growth.toFixed(1)}% en volumen de mensajes esta semana.`,
          type: 'TREND',
          priority: 'LOW',
          metric: 'volumeGrowth',
          value: `+${growth.toFixed(1)}%`
        })
      }
    }

    // Crear insights que no existan
    for (const insight of insights) {
      // Verificar si este insight ya existe
      const exists = await prisma.whatsAppInsight.findFirst({
        where: {
          businessId,
          title: insight.title,
          createdAt: {
            gte: new Date(Date.now() - 3600000) // En última 1 hora
          }
        }
      })

      if (!exists) {
        await prisma.whatsAppInsight.create({
          data: insight
        })
      }
    }
  } catch (error) {
    console.error('Error generating insights:', error)
  }
}
