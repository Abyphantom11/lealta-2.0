import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET - Listar números que han hecho opt-out
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const phoneNumber = searchParams.get('phoneNumber')

    const where: any = { 
      businessId: session.user.businessId,
      optedBackIn: false
    }

    if (phoneNumber) {
      where.phoneNumber = {
        contains: phoneNumber
      }
    }

    const [optOuts, total] = await Promise.all([
      prisma.whatsAppOptOut.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { optedOutAt: 'desc' },
        include: {
          Cliente: {
            select: {
              nombre: true,
              correo: true
            }
          }
        }
      }),
      prisma.whatsAppOptOut.count({ where })
    ])

    return NextResponse.json({
      optOuts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching opt-outs:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Agregar número a opt-out manualmente
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { phoneNumber, method = 'MANUAL', clienteId } = body

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Número de teléfono es requerido' },
        { status: 400 }
      )
    }

    // Normalizar número de teléfono
    const normalizedPhone = phoneNumber.replace(/\D/g, '')
    if (!normalizedPhone.startsWith('593')) {
      return NextResponse.json(
        { error: 'Número debe ser formato ecuatoriano (+593)' },
        { status: 400 }
      )
    }

    const formattedPhone = `+${normalizedPhone}`

    // Verificar si ya existe el opt-out
    const existingOptOut = await prisma.whatsAppOptOut.findUnique({
      where: {
        phoneNumber_businessId: {
          phoneNumber: formattedPhone,
          businessId: session.user.businessId
        }
      }
    })

    if (existingOptOut && !existingOptOut.optedBackIn) {
      return NextResponse.json(
        { error: 'Este número ya está en la lista de opt-out' },
        { status: 400 }
      )
    }

    // Crear o actualizar opt-out
    const optOut = await prisma.whatsAppOptOut.upsert({
      where: {
        phoneNumber_businessId: {
          phoneNumber: formattedPhone,
          businessId: session.user.businessId
        }
      },
      update: {
        optedBackIn: false,
        optedOutAt: new Date(),
        method
      },
      create: {
        phoneNumber: formattedPhone,
        businessId: session.user.businessId,
        method,
        clienteId
      }
    })

    return NextResponse.json({
      optOut,
      message: 'Número agregado a la lista de opt-out exitosamente'
    })
  } catch (error) {
    console.error('Error creating opt-out:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Remover opt-out (opt-in)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const phoneNumber = searchParams.get('phoneNumber')

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Número de teléfono es requerido' },
        { status: 400 }
      )
    }

    const optOut = await prisma.whatsAppOptOut.findUnique({
      where: {
        phoneNumber_businessId: {
          phoneNumber,
          businessId: session.user.businessId
        }
      }
    })

    if (!optOut) {
      return NextResponse.json(
        { error: 'Opt-out no encontrado' },
        { status: 404 }
      )
    }

    // Marcar como opted back in en lugar de eliminar para mantener historial
    await prisma.whatsAppOptOut.update({
      where: {
        phoneNumber_businessId: {
          phoneNumber,
          businessId: session.user.businessId
        }
      },
      data: {
        optedBackIn: true,
        optedBackAt: new Date()
      }
    })

    return NextResponse.json({
      message: 'Número removido de la lista de opt-out exitosamente'
    })
  } catch (error) {
    console.error('Error removing opt-out:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
