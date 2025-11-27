import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET - Listar colas de mensajes
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: any = {
      businessId: session.user.businessId
    }

    if (status) {
      where.status = status.toUpperCase()
    }

    const queues = await prisma.whatsAppQueue.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { scheduledAt: 'desc' }
      ],
      include: {
        WhatsAppAccount: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
            status: true
          }
        },
        WhatsAppTemplate: {
          select: {
            id: true,
            name: true,
            category: true,
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

    return NextResponse.json({
      success: true,
      queues,
      total: queues.length
    })
  } catch (error) {
    console.error('Error fetching queues:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Crear nueva cola de mensajes
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      description,
      accountId,
      templateId,
      customMessage,
      variables = {},
      audienceFilters = {},
      priority = 5,
      maxRetries = 3,
      retryDelayMinutes = 5,
      batchSize = 50,
      rateLimitPerHour = 100,
      scheduledAt,
      startTime = "09:00",
      endTime = "18:00",
      timezone = "America/Guayaquil"
    } = body

    // Validaciones
    if (!name || !accountId) {
      return NextResponse.json(
        { error: 'Nombre y cuenta de WhatsApp son requeridos' },
        { status: 400 }
      )
    }

    if (!templateId && !customMessage) {
      return NextResponse.json(
        { error: 'Se requiere templateId o customMessage' },
        { status: 400 }
      )
    }

    // Verificar que la cuenta pertenece al negocio
    const account = await prisma.whatsAppAccount.findFirst({
      where: {
        id: accountId,
        businessId: session.user.businessId,
        status: 'ACTIVE'
      }
    })

    if (!account) {
      return NextResponse.json(
        { error: 'Cuenta de WhatsApp no encontrada o inactiva' },
        { status: 400 }
      )
    }

    // Crear la cola
    const queue = await prisma.whatsAppQueue.create({
      data: {
        businessId: session.user.businessId,
        accountId,
        name,
        description,
        templateId,
        customMessage,
        variables,
        audienceFilters,
        priority,
        maxRetries,
        retryDelayMinutes,
        batchSize,
        rateLimitPerHour,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        startTime,
        endTime,
        timezone,
        status: scheduledAt ? 'SCHEDULED' : 'DRAFT'
      }
    })

    return NextResponse.json({
      success: true,
      queue,
      message: 'Cola creada exitosamente'
    })
  } catch (error) {
    console.error('Error creating queue:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar cola
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID de la cola es requerido' },
        { status: 400 }
      )
    }

    // Verificar que la cola pertenece al negocio
    const existingQueue = await prisma.whatsAppQueue.findFirst({
      where: {
        id,
        businessId: session.user.businessId
      }
    })

    if (!existingQueue) {
      return NextResponse.json(
        { error: 'Cola no encontrada' },
        { status: 404 }
      )
    }

    // No permitir modificar colas en procesamiento
    if (existingQueue.status === 'PROCESSING') {
      return NextResponse.json(
        { error: 'No se puede modificar una cola en procesamiento' },
        { status: 400 }
      )
    }

    const queue = await prisma.whatsAppQueue.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      queue,
      message: 'Cola actualizada exitosamente'
    })
  } catch (error) {
    console.error('Error updating queue:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar cola
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID de la cola es requerido' },
        { status: 400 }
      )
    }

    // Verificar que la cola pertenece al negocio
    const queue = await prisma.whatsAppQueue.findFirst({
      where: {
        id,
        businessId: session.user.businessId
      }
    })

    if (!queue) {
      return NextResponse.json(
        { error: 'Cola no encontrada' },
        { status: 404 }
      )
    }

    // No permitir eliminar colas en procesamiento
    if (queue.status === 'PROCESSING') {
      return NextResponse.json(
        { error: 'No se puede eliminar una cola en procesamiento' },
        { status: 400 }
      )
    }

    await prisma.whatsAppQueue.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Cola eliminada exitosamente'
    })
  } catch (error) {
    console.error('Error deleting queue:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
