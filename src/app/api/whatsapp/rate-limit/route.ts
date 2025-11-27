import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

interface RateLimitCheck {
  canSend: boolean
  dailyUsed: number
  dailyLimit: number
  monthlyUsed: number
  monthlyLimit: number
  tier: string
  waitTime?: number
}

// GET - Verificar límites de envío
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const count = Number.parseInt(searchParams.get('count') || '1')

    const rateLimitCheck = await checkRateLimit(session.user.businessId, count)

    return NextResponse.json({
      success: true,
      ...rateLimitCheck
    })
  } catch (error) {
    console.error('Error checking rate limit:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Registrar uso de mensajes
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { messageCount = 1, conversationCount = 0 } = body

    const usage = await recordMessageUsage(
      session.user.businessId,
      messageCount,
      conversationCount
    )

    return NextResponse.json({
      success: true,
      usage,
      message: 'Uso registrado exitosamente'
    })
  } catch (error) {
    console.error('Error recording usage:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Función para verificar límites de envío
export async function checkRateLimit(businessId: string, messageCount: number = 1): Promise<RateLimitCheck> {
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  const currentMonth = new Date().toISOString().substr(0, 7) // YYYY-MM

  // Obtener o crear registro de rate limit para hoy
  const todayLimit = await prisma.whatsAppRateLimit.upsert({
    where: {
      businessId_date: {
        businessId,
        date: today
      }
    },
    update: {},
    create: {
      businessId,
      date: today,
      tier: 'TIER_1', // Por defecto
      dailyLimit: 1000,
      monthlyLimit: 1000,
      messagesCount: 0,
      conversationsCount: 0
    }
  })

  // Calcular uso mensual
  const monthlyUsage = await prisma.whatsAppRateLimit.aggregate({
    where: {
      businessId,
      date: {
        startsWith: currentMonth
      }
    },
    _sum: {
      messagesCount: true,
      conversationsCount: true
    }
  })

  const dailyUsed = todayLimit.messagesCount
  const monthlyUsed = monthlyUsage._sum.messagesCount || 0

  // Determinar tier basado en uso histórico
  const tier = await determineTier(businessId, monthlyUsed)
  const limits = getTierLimits(tier)

  // Verificar si puede enviar
  const canSendDaily = (dailyUsed + messageCount) <= limits.dailyLimit
  const canSendMonthly = (monthlyUsed + messageCount) <= limits.monthlyLimit

  return {
    canSend: canSendDaily && canSendMonthly,
    dailyUsed,
    dailyLimit: limits.dailyLimit,
    monthlyUsed,
    monthlyLimit: limits.monthlyLimit,
    tier,
    waitTime: canSendDaily ? undefined : getWaitTime()
  }
}

// Función para registrar uso
export async function recordMessageUsage(
  businessId: string,
  messageCount: number,
  conversationCount: number
) {
  const today = new Date().toISOString().split('T')[0]

  return await prisma.whatsAppRateLimit.upsert({
    where: {
      businessId_date: {
        businessId,
        date: today
      }
    },
    update: {
      messagesCount: {
        increment: messageCount
      },
      conversationsCount: {
        increment: conversationCount
      },
      lastMessageAt: new Date()
    },
    create: {
      businessId,
      date: today,
      messagesCount: messageCount,
      conversationsCount: conversationCount,
      lastMessageAt: new Date()
    }
  })
}

// Determinar tier basado en uso histórico
async function determineTier(businessId: string, monthlyUsage: number): Promise<string> {
  // Tier 1: 0-1,000 mensajes/mes
  if (monthlyUsage < 1000) return 'TIER_1'
  
  // Tier 2: 1,000-10,000 mensajes/mes  
  if (monthlyUsage < 10000) return 'TIER_2'
  
  // Tier 3: 10,000+ mensajes/mes
  return 'TIER_3'
}

// Obtener límites por tier
function getTierLimits(tier: string) {
  const limits = {
    TIER_1: { dailyLimit: 1000, monthlyLimit: 1000 },
    TIER_2: { dailyLimit: 10000, monthlyLimit: 10000 },
    TIER_3: { dailyLimit: 100000, monthlyLimit: 100000 }
  }
  
  return limits[tier as keyof typeof limits] || limits.TIER_1
}

// Calcular tiempo de espera para rate limiting
function getWaitTime(): number {
  // Calcular tiempo hasta medianoche (reset diario)
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)
  
  return tomorrow.getTime() - now.getTime() // milisegundos hasta reset
}
