import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { MESSAGE_TEMPLATES } from '@/lib/whatsapp'

/**
 * 📋 GET /api/whatsapp/templates
 * Obtener templates de mensajes disponibles (legacy + templates de base de datos)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.businessId) {
      // Si no hay sesión, devolver solo templates legacy
      return NextResponse.json({
        success: true,
        templates: MESSAGE_TEMPLATES,
        dbTemplates: []
      });
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: any = { 
      businessId: session.user.businessId 
    }

    if (status) {
      where.status = status.toUpperCase()
    }

    const dbTemplates = await prisma.whatsAppTemplate.findMany({
      where,
      orderBy: { submittedAt: 'desc' },
      include: {
        WhatsAppCampaign: {
          select: {
            id: true,
            name: true,
            status: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      templates: MESSAGE_TEMPLATES, // Templates legacy
      dbTemplates, // Templates de base de datos
      total: MESSAGE_TEMPLATES.length + dbTemplates.length
    });
  } catch (error) {
    console.error('Error fetching WhatsApp templates:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { name, category, language = 'es', content } = body

    // Validaciones
    if (!name || !category || !content) {
      return NextResponse.json(
        { error: 'Nombre, categoría y contenido son requeridos' },
        { status: 400 }
      )
    }

    const validCategories = ['MARKETING', 'UTILITY', 'AUTHENTICATION']
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Categoría inválida' },
        { status: 400 }
      )
    }

    // Verificar contenido del template
    if (!content.body) {
      return NextResponse.json(
        { error: 'El template debe tener al menos un cuerpo (body)' },
        { status: 400 }
      )
    }

    const template = await prisma.whatsAppTemplate.create({
      data: {
        businessId: session.user.businessId,
        name,
        category,
        language,
        content,
        status: 'PENDING'
      }
    })

    return NextResponse.json({ 
      success: true,
      template,
      message: 'Template creado exitosamente. Se enviará para aprobación de WhatsApp Business.'
    })
  } catch (error) {
    console.error('Error creating WhatsApp template:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar template
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { id, name, category, language, content } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID del template es requerido' },
        { status: 400 }
      )
    }

    // Verificar que el template pertenece al negocio
    const existingTemplate = await prisma.whatsAppTemplate.findFirst({
      where: {
        id,
        businessId: session.user.businessId
      }
    })

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Template no encontrado' },
        { status: 404 }
      )
    }

    // No se puede editar un template aprobado
    if (existingTemplate.status === 'APPROVED') {
      return NextResponse.json(
        { error: 'No se puede modificar un template aprobado' },
        { status: 400 }
      )
    }

    const template = await prisma.whatsAppTemplate.update({
      where: { id },
      data: {
        name: name || existingTemplate.name,
        category: category || existingTemplate.category,
        language: language || existingTemplate.language,
        content: content || existingTemplate.content,
        status: 'PENDING', // Reset status on update
        submittedAt: new Date()
      }
    })

    return NextResponse.json({ 
      success: true,
      template,
      message: 'Template actualizado exitosamente'
    })
  } catch (error) {
    console.error('Error updating WhatsApp template:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
