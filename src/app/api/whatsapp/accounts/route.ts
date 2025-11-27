import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET - Listar cuentas de WhatsApp del negocio
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const accounts = await prisma.whatsAppAccount.findMany({
      where: {
        businessId: session.user.businessId
      },
      orderBy: [
        { isPrimary: 'desc' },
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ],
      include: {
        WhatsAppQueue: {
          select: {
            id: true,
            name: true,
            status: true
          }
        },
        _count: {
          select: {
            WhatsAppMessage: true,
            WhatsAppQueue: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      accounts,
      total: accounts.length
    })
  } catch (error) {
    console.error('Error fetching WhatsApp accounts:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Crear nueva cuenta de WhatsApp
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      phoneNumber,
      twilioAccountSid,
      twilioAuthToken,
      whatsappBusinessId,
      wabaAccessToken,
      isDefault = false,
      isPrimary = false,
      maxDailyMessages = 1000
    } = body

    // Validaciones
    if (!name || !phoneNumber) {
      return NextResponse.json(
        { error: 'Nombre y número de teléfono son requeridos' },
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

    // Verificar si el número ya existe
    const existingAccount = await prisma.whatsAppAccount.findUnique({
      where: { phoneNumber: formattedPhone }
    })

    if (existingAccount) {
      return NextResponse.json(
        { error: 'Este número ya está registrado en el sistema' },
        { status: 400 }
      )
    }

    // Si se marca como primary, quitar primary de otras cuentas
    if (isPrimary) {
      await prisma.whatsAppAccount.updateMany({
        where: {
          businessId: session.user.businessId,
          isPrimary: true
        },
        data: { isPrimary: false }
      })
    }

    // Si se marca como default, quitar default de otras cuentas
    if (isDefault) {
      await prisma.whatsAppAccount.updateMany({
        where: {
          businessId: session.user.businessId,
          isDefault: true
        },
        data: { isDefault: false }
      })
    }

    // Crear la cuenta
    const account = await prisma.whatsAppAccount.create({
      data: {
        businessId: session.user.businessId,
        name,
        phoneNumber: formattedPhone,
        twilioAccountSid,
        twilioAuthToken,
        whatsappBusinessId,
        wabaAccessToken,
        isDefault,
        isPrimary,
        maxDailyMessages,
        status: 'PENDING'
      }
    })

    return NextResponse.json({
      success: true,
      account,
      message: 'Cuenta de WhatsApp creada exitosamente'
    })
  } catch (error) {
    console.error('Error creating WhatsApp account:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar cuenta de WhatsApp
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      id, 
      name,
      twilioAccountSid,
      twilioAuthToken,
      whatsappBusinessId,
      wabaAccessToken,
      isDefault,
      isPrimary,
      maxDailyMessages,
      status
    } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID de la cuenta es requerido' },
        { status: 400 }
      )
    }

    // Verificar que la cuenta pertenece al negocio
    const existingAccount = await prisma.whatsAppAccount.findFirst({
      where: {
        id,
        businessId: session.user.businessId
      }
    })

    if (!existingAccount) {
      return NextResponse.json(
        { error: 'Cuenta no encontrada' },
        { status: 404 }
      )
    }

    // Si se marca como primary, quitar primary de otras cuentas
    if (isPrimary && !existingAccount.isPrimary) {
      await prisma.whatsAppAccount.updateMany({
        where: {
          businessId: session.user.businessId,
          isPrimary: true
        },
        data: { isPrimary: false }
      })
    }

    // Si se marca como default, quitar default de otras cuentas
    if (isDefault && !existingAccount.isDefault) {
      await prisma.whatsAppAccount.updateMany({
        where: {
          businessId: session.user.businessId,
          isDefault: true
        },
        data: { isDefault: false }
      })
    }

    // Actualizar la cuenta
    const account = await prisma.whatsAppAccount.update({
      where: { id },
      data: {
        name: name ?? existingAccount.name,
        twilioAccountSid: twilioAccountSid ?? existingAccount.twilioAccountSid,
        twilioAuthToken: twilioAuthToken ?? existingAccount.twilioAuthToken,
        whatsappBusinessId: whatsappBusinessId ?? existingAccount.whatsappBusinessId,
        wabaAccessToken: wabaAccessToken ?? existingAccount.wabaAccessToken,
        isDefault: isDefault ?? existingAccount.isDefault,
        isPrimary: isPrimary ?? existingAccount.isPrimary,
        maxDailyMessages: maxDailyMessages ?? existingAccount.maxDailyMessages,
        status: status ?? existingAccount.status,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      account,
      message: 'Cuenta actualizada exitosamente'
    })
  } catch (error) {
    console.error('Error updating WhatsApp account:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar cuenta de WhatsApp
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
        { error: 'ID de la cuenta es requerido' },
        { status: 400 }
      )
    }

    // Verificar que la cuenta pertenece al negocio
    const account = await prisma.whatsAppAccount.findFirst({
      where: {
        id,
        businessId: session.user.businessId
      }
    })

    if (!account) {
      return NextResponse.json(
        { error: 'Cuenta no encontrada' },
        { status: 404 }
      )
    }

    // No permitir eliminar la cuenta primaria si hay otras cuentas
    if (account.isPrimary) {
      const otherAccounts = await prisma.whatsAppAccount.count({
        where: {
          businessId: session.user.businessId,
          id: { not: id }
        }
      })

      if (otherAccounts > 0) {
        return NextResponse.json(
          { error: 'No se puede eliminar la cuenta primaria. Asigna otra cuenta como primaria primero.' },
          { status: 400 }
        )
      }
    }

    await prisma.whatsAppAccount.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Cuenta eliminada exitosamente'
    })
  } catch (error) {
    console.error('Error deleting WhatsApp account:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
