import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * 🔄 POST /api/whatsapp/webhook
 * Webhook para recibir actualizaciones de estado de WhatsApp
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('📨 Webhook WhatsApp recibido:', JSON.stringify(body, null, 2))

    // Validar que es un webhook de Twilio
    const messageSid = body.MessageSid || body.SmsSid
    if (!messageSid) {
      return NextResponse.json({ error: 'SID de mensaje no encontrado' }, { status: 400 })
    }

    // Procesar diferentes tipos de webhook
    const webhookType = determineWebhookType(body)
    
    // Guardar webhook en base de datos
    const webhook = await prisma.whatsAppWebhook.create({
      data: {
        twilioSid: messageSid,
        webhookType,
        status: body.MessageStatus || body.SmsStatus,
        errorCode: body.ErrorCode,
        errorMessage: body.ErrorMessage,
        rawPayload: body,
        processed: false
      }
    })

    // Procesar webhook según tipo
    await processWebhook(webhook, body)

    return NextResponse.json({ 
      success: true,
      message: 'Webhook procesado exitosamente'
    })
  } catch (error) {
    console.error('❌ Error procesando webhook:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Determinar tipo de webhook
function determineWebhookType(body: any): string {
  if (body.MessageStatus || body.SmsStatus) {
    return 'status'
  }
  if (body.Body && body.From) {
    return 'message'
  }
  if (body.ErrorCode) {
    return 'error'
  }
  return 'unknown'
}

// Procesar webhook según tipo
async function processWebhook(webhook: any, body: any) {
  try {
    const messageSid = body.MessageSid || body.SmsSid
    const status = body.MessageStatus || body.SmsStatus
    const fromNumber = body.From
    const messageBody = body.Body

    // Buscar mensaje en nuestra base de datos
    const message = await prisma.whatsAppMessage.findFirst({
      where: {
        twilioSid: messageSid
      }
    })

    if (message) {
      // Actualizar estado del mensaje
      await updateMessageStatus(message.id, status, body)
    }

    // Procesar respuesta del cliente si es un mensaje entrante
    if (webhook.webhookType === 'message' && messageBody && fromNumber) {
      await processIncomingMessage(fromNumber, messageBody)
    }

    // Marcar webhook como procesado
    await prisma.whatsAppWebhook.update({
      where: { id: webhook.id },
      data: { processed: true, processedAt: new Date() }
    })

  } catch (error) {
    console.error('Error procesando webhook:', error)
    // No relanzar el error para evitar que Twilio reintente
  }
}

// Actualizar estado del mensaje
async function updateMessageStatus(messageId: string, status: string, body: any) {
  const updateData: any = {
    twilioStatus: status,
    updatedAt: new Date()
  }

  switch (status?.toLowerCase()) {
    case 'sent':
      updateData.status = 'SENT'
      updateData.sentAt = new Date()
      break
    case 'delivered':
      updateData.status = 'DELIVERED'
      updateData.deliveredAt = new Date()
      break
    case 'read':
      updateData.status = 'READ'
      updateData.readAt = new Date()
      break
    case 'failed':
    case 'undelivered':
      updateData.status = 'FAILED'
      updateData.failedAt = new Date()
      updateData.twilioError = body.ErrorMessage || 'Error desconocido'
      break
  }

  await prisma.whatsAppMessage.update({
    where: { id: messageId },
    data: updateData
  })
}

// Procesar mensaje entrante del cliente
async function processIncomingMessage(fromNumber: string, messageBody: string) {
  const normalizedPhone = fromNumber.replace(/\D/g, '')
  const formattedPhone = normalizedPhone.startsWith('593') 
    ? `+${normalizedPhone}` 
    : `+593${normalizedPhone.substring(1)}`

  // Detectar palabras clave de opt-out
  const optOutKeywords = ['stop', 'baja', 'cancelar', 'no mas', 'no más', 'salir']
  const isOptOut = optOutKeywords.some(keyword => 
    messageBody.toLowerCase().includes(keyword)
  )

  if (isOptOut) {
    await handleOptOut(formattedPhone, messageBody)
    return
  }

  // Buscar mensaje original para marcar como respondido
  const originalMessage = await prisma.whatsAppMessage.findFirst({
    where: {
      phoneNumber: formattedPhone,
      status: {
        in: ['SENT', 'DELIVERED', 'READ']
      }
    },
    orderBy: { sentAt: 'desc' }
  })

  if (originalMessage) {
    await prisma.whatsAppMessage.update({
      where: { id: originalMessage.id },
      data: {
        hasResponse: true,
        responseText: messageBody,
        responseAt: new Date()
      }
    })

    // Actualizar métricas de campaña si existe
    if (originalMessage.campaignId) {
      await prisma.whatsAppCampaign.update({
        where: { id: originalMessage.campaignId },
        data: {
          totalReplied: {
            increment: 1
          }
        }
      })
    }
  }
}

// Manejar opt-out automático
async function handleOptOut(phoneNumber: string, _message: string) {
  try {
    // Buscar cliente por teléfono
    const cliente = await prisma.cliente.findFirst({
      where: {
        telefono: {
          contains: phoneNumber.replace(/\D/g, '').substring(3) // Remove +593
        }
      }
    })

    if (cliente) {
      // Crear registro de opt-out
      await prisma.whatsAppOptOut.upsert({
        where: {
          phoneNumber_businessId: {
            phoneNumber,
            businessId: cliente.businessId
          }
        },
        update: {
          optedBackIn: false,
          optedOutAt: new Date(),
          method: 'STOP_KEYWORD'
        },
        create: {
          phoneNumber,
          businessId: cliente.businessId,
          clienteId: cliente.id,
          method: 'STOP_KEYWORD'
        }
      })

      // Incrementar contador de opt-outs en campañas activas
      await prisma.whatsAppCampaign.updateMany({
        where: {
          businessId: cliente.businessId,
          status: 'PROCESSING'
        },
        data: {
          totalOptedOut: {
            increment: 1
          }
        }
      })

      console.log(`✋ Opt-out automático procesado para ${phoneNumber}`)
    }
  } catch (error) {
    console.error('Error procesando opt-out:', error)
  }
}
