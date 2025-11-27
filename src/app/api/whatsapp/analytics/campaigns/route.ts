import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET - Obtener analytics de campañas
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaignId')
    const sortBy = searchParams.get('sortBy') || 'startDate'

    let where: any = { businessId: session.user.businessId }
    if (campaignId) {
      where.campaignId = campaignId
    }

    const campaigns = await prisma.whatsAppCampaignAnalytics.findMany({
      where,
      orderBy: { [sortBy]: 'desc' }
    })

    // Si es una campaña específica, obtener más detalles
    if (campaignId) {
      const campaign = campaigns[0]
      if (!campaign) {
        return NextResponse.json(
          { error: 'Campaña no encontrada' },
          { status: 404 }
        )
      }

      // Obtener clientes que respondieron
      const respondedClients = await prisma.whatsAppMessage.findMany({
        where: {
          campaignId,
          hasResponse: true
        },
        select: {
          Cliente: {
            select: {
              nombre: true,
              telefono: true
            }
          },
          responseText: true,
          responseAt: true
        },
        take: 20
      })

      return NextResponse.json({
        success: true,
        campaign: {
          ...campaign,
          respondedClients
        }
      })
    }

    return NextResponse.json({
      success: true,
      campaigns,
      total: campaigns.length
    })
  } catch (error) {
    console.error('Error fetching campaign analytics:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Crear analytics para campaña (usado después de completar campaña)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { campaignId, name } = body

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID es requerido' },
        { status: 400 }
      )
    }

    // Obtener datos de la campaña
    const campaign = await prisma.whatsAppCampaign.findUnique({
      where: { id: campaignId },
      include: {
        WhatsAppMessage: {
          select: {
            status: true,
            readAt: true,
            responseAt: true,
            cost: true
          }
        }
      }
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaña no encontrada' },
        { status: 404 }
      )
    }

    // Calcular métricas
    const totalSent = campaign.totalSent
    const totalDelivered = campaign.totalDelivered
    const totalRead = campaign.WhatsAppMessage.filter(m => m.readAt).length
    const totalReplied = campaign.WhatsAppMessage.filter(m => m.responseAt).length
    const totalCost = campaign.WhatsAppMessage.reduce((sum, m) => sum + (m.cost || 0), 0)

    const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0
    const readRate = totalDelivered > 0 ? (totalRead / totalDelivered) * 100 : 0
    const responseRate = totalDelivered > 0 ? (totalReplied / totalDelivered) * 100 : 0

    // Crear o actualizar analytics
    const analytics = await prisma.whatsAppCampaignAnalytics.upsert({
      where: { campaignId },
      update: {
        totalTargeted: campaign.totalTargeted,
        totalSent,
        totalDelivered,
        totalRead,
        totalReplied,
        totalFailed: campaign.totalFailed,
        totalOptedOut: campaign.totalOptedOut,
        deliveryRate,
        readRate,
        responseRate,
        actualCost: totalCost
      },
      create: {
        campaignId,
        businessId: session.user.businessId,
        name: name || `Campaña ${new Date().toLocaleDateString()}`,
        startDate: campaign.createdAt,
        endDate: campaign.completedAt,
        totalTargeted: campaign.totalTargeted,
        totalSent,
        totalDelivered,
        totalRead,
        totalReplied,
        totalFailed: campaign.totalFailed,
        totalOptedOut: campaign.totalOptedOut,
        deliveryRate,
        readRate,
        responseRate,
        actualCost: totalCost,
        estimatedCost: campaign.estimatedCost
      }
    })

    return NextResponse.json({
      success: true,
      analytics
    })
  } catch (error) {
    console.error('Error creating campaign analytics:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
