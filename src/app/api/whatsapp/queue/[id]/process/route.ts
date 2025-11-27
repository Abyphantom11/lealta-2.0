import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { enviarMensaje } from '@/lib/whatsapp'

// POST - Procesar cola específica
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const queueId = params.id

    // Verificar que la cola existe y pertenece al negocio
    const queue = await prisma.whatsAppQueue.findFirst({
      where: {
        id: queueId,
        businessId: session.user.businessId
      },
      include: {
        WhatsAppAccount: true,
        WhatsAppTemplate: true
      }
    })

    if (!queue) {
      return NextResponse.json(
        { error: 'Cola no encontrada' },
        { status: 404 }
      )
    }

    // Verificar que la cola está lista para procesar
    if (queue.status !== 'SCHEDULED' && queue.status !== 'DRAFT') {
      return NextResponse.json(
        { error: `Cola en estado ${queue.status}, no se puede procesar` },
        { status: 400 }
      )
    }

    // Verificar que la cuenta está activa
    if (queue.WhatsAppAccount.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Cuenta de WhatsApp no está activa' },
        { status: 400 }
      )
    }

    // Generar trabajos de la cola si no existen
    await generateQueueJobs(queue)

    // Marcar cola como en procesamiento
    await prisma.whatsAppQueue.update({
      where: { id: queueId },
      data: {
        status: 'PROCESSING',
        startedAt: new Date()
      }
    })

    // Procesar trabajos en lotes
    const result = await processQueueJobs(queue)

    return NextResponse.json({
      success: true,
      result,
      message: 'Procesamiento de cola iniciado exitosamente'
    })
  } catch (error) {
    console.error('Error processing queue:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// GET - Obtener estado de procesamiento de cola
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const queueId = params.id

    const queue = await prisma.whatsAppQueue.findFirst({
      where: {
        id: queueId,
        businessId: session.user.businessId
      },
      include: {
        WhatsAppAccount: {
          select: {
            name: true,
            phoneNumber: true,
            status: true
          }
        },
        _count: {
          select: {
            QueueJobs: true
          }
        }
      }
    })

    if (!queue) {
      return NextResponse.json(
        { error: 'Cola no encontrada' },
        { status: 404 }
      )
    }

    // Obtener estadísticas de trabajos
    const jobStats = await prisma.whatsAppQueueJob.groupBy({
      by: ['status'],
      where: { queueId },
      _count: { status: true }
    })

    const stats = jobStats.reduce((acc, stat) => {
      acc[stat.status.toLowerCase()] = stat._count.status
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      success: true,
      queue: {
        ...queue,
        jobStats: {
          total: queue._count.QueueJobs,
          pending: stats.pending || 0,
          processing: stats.processing || 0,
          completed: stats.completed || 0,
          failed: stats.failed || 0,
          retrying: stats.retrying || 0
        }
      }
    })
  } catch (error) {
    console.error('Error getting queue status:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Generar trabajos de la cola basado en filtros de audiencia
async function generateQueueJobs(queue: any) {
  // Verificar si ya existen trabajos
  const existingJobsCount = await prisma.whatsAppQueueJob.count({
    where: { queueId: queue.id }
  })

  if (existingJobsCount > 0) {
    return // Ya existen trabajos
  }

  // Obtener clientes basado en filtros
  const clients = await getTargetAudience(queue.businessId, queue.audienceFilters)

  // Filtrar clientes que han hecho opt-out
  const optedOutNumbers = await prisma.whatsAppOptOut.findMany({
    where: {
      businessId: queue.businessId,
      optedBackIn: false
    },
    select: { phoneNumber: true }
  })

  const optedOutSet = new Set(
    optedOutNumbers.map(opt => opt.phoneNumber.replace(/\D/g, ''))
  )

  const validClients = clients.filter(client => {
    const phoneNormalized = client.telefono.replace(/\D/g, '')
    return !optedOutSet.has(phoneNormalized)
  })

  // Preparar mensaje
  let messageContent = queue.customMessage || ''
  if (queue.templateId && queue.WhatsAppTemplate) {
    messageContent = queue.WhatsAppTemplate.content.body || ''
  }

  // Crear trabajos en lotes
  const jobs = validClients.map(client => {
    const phoneNormalized = client.telefono.replace(/\D/g, '')
    const formattedPhone = phoneNormalized.startsWith('593')
      ? `+${phoneNormalized}`
      : `+593${phoneNormalized}`

    // Procesar variables del mensaje
    const processedMessage = processMessageVariables(messageContent, {
      ...queue.variables,
      nombre: client.nombre,
      puntos: client.puntos,
      negocio: client.businessName
    })

    return {
      queueId: queue.id,
      targetPhone: formattedPhone,
      targetClientId: client.id,
      messageContent: processedMessage,
      variables: queue.variables,
      priority: queue.priority
    }
  })

  // Insertar trabajos en lotes de 1000
  for (let i = 0; i < jobs.length; i += 1000) {
    const batch = jobs.slice(i, i + 1000)
    await prisma.whatsAppQueueJob.createMany({
      data: batch
    })
  }

  // Actualizar contador de mensajes totales en la cola
  await prisma.whatsAppQueue.update({
    where: { id: queue.id },
    data: { totalMessages: jobs.length }
  })

  return jobs.length
}

// Procesar trabajos de la cola
async function processQueueJobs(queue: any) {
  const batchSize = queue.batchSize || 50
  let processedCount = 0
  let successCount = 0
  let failedCount = 0

  // Procesar trabajos pendientes en lotes
  while (true) {
    const jobs = await prisma.whatsAppQueueJob.findMany({
      where: {
        queueId: queue.id,
        status: 'PENDING',
        processAt: {
          lte: new Date()
        }
      },
      take: batchSize,
      orderBy: [
        { priority: 'desc' },
        { scheduledAt: 'asc' }
      ]
    })

    if (jobs.length === 0) {
      break // No hay más trabajos pendientes
    }

    // Procesar cada trabajo
    for (const job of jobs) {
      try {
        // Marcar como procesando
        await prisma.whatsAppQueueJob.update({
          where: { id: job.id },
          data: {
            status: 'PROCESSING',
            startedAt: new Date(),
            attempts: job.attempts + 1,
            lastAttemptAt: new Date()
          }
        })

        // Enviar mensaje usando la cuenta específica
        const result = await enviarMensaje({
          phoneNumber: job.targetPhone,
          message: job.messageContent,
          accountSid: queue.WhatsAppAccount.twilioAccountSid,
          authToken: queue.WhatsAppAccount.twilioAuthToken
        })

        // Crear registro de mensaje
        const message = await prisma.whatsAppMessage.create({
          data: {
            businessId: queue.businessId,
            accountId: queue.accountId,
            clienteId: job.targetClientId,
            phoneNumber: job.targetPhone,
            templateId: queue.templateId,
            customMessage: job.messageContent,
            variables: job.variables,
            status: 'SENT',
            twilioSid: result.sid,
            sentAt: new Date(),
            cost: 0.055
          }
        })

        // Actualizar trabajo como completado
        await prisma.whatsAppQueueJob.update({
          where: { id: job.id },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
            twilioSid: result.sid,
            messageId: message.id
          }
        })

        successCount++
      } catch (error) {
        console.error(`Error procesando trabajo ${job.id}:`, error)

        // Determinar si reintentar
        const shouldRetry = job.attempts < queue.maxRetries
        const nextAttempt = shouldRetry
          ? new Date(Date.now() + (queue.retryDelayMinutes * 60 * 1000))
          : null

        await prisma.whatsAppQueueJob.update({
          where: { id: job.id },
          data: {
            status: shouldRetry ? 'RETRYING' : 'FAILED',
            failedAt: shouldRetry ? null : new Date(),
            nextAttemptAt: nextAttempt,
            processAt: nextAttempt || new Date(),
            lastError: error instanceof Error ? error.message : 'Error desconocido',
            errorCount: job.errorCount + 1
          }
        })

        if (!shouldRetry) {
          failedCount++
        }
      }

      processedCount++
    }

    // Actualizar progreso de la cola
    await prisma.whatsAppQueue.update({
      where: { id: queue.id },
      data: {
        sentMessages: successCount,
        failedMessages: failedCount,
        pendingMessages: Math.max(0, queue.totalMessages - processedCount)
      }
    })

    // Respetar rate limit
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  // Marcar cola como completada
  await prisma.whatsAppQueue.update({
    where: { id: queue.id },
    data: {
      status: 'COMPLETED',
      completedAt: new Date()
    }
  })

  return {
    processed: processedCount,
    successful: successCount,
    failed: failedCount
  }
}

// Obtener audiencia objetivo basada en filtros
async function getTargetAudience(businessId: string, filters: any) {
  const where: any = { businessId }

  if (filters.puntosMinimos) {
    where.puntos = { gte: Number(filters.puntosMinimos) }
  }

  if (filters.ultimaVisitaDias) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - Number(filters.ultimaVisitaDias))
    
    where.registeredAt = { gte: cutoffDate }
  }

  const clients = await prisma.cliente.findMany({
    where,
    select: {
      id: true,
      nombre: true,
      telefono: true,
      puntos: true,
      Business: {
        select: { name: true }
      }
    }
  })

  return clients.map(client => ({
    ...client,
    businessName: client.Business.name
  }))
}

// Procesar variables en el mensaje
function processMessageVariables(message: string, variables: Record<string, any>): string {
  let processedMessage = message

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{${key}}`
    processedMessage = processedMessage.replace(new RegExp(placeholder, 'g'), String(value))
  }

  return processedMessage
}
