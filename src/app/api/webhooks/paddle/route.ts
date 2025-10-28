import { NextRequest, NextResponse } from 'next/server';
import { paddleUtils } from '@/lib/paddle';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

/**
 * 🔗 WEBHOOK HANDLER: Paddle Events
 * 
 * Maneja eventos de Paddle como:
 * - subscription.created
 * - subscription.updated
 * - subscription.canceled
 * - transaction.completed
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('paddle-signature') || '';

    console.log('🔗 Webhook recibido de Paddle');

    // Verificar la firma del webhook (seguridad)
    if (!verifyPaddleWebhook(signature, body)) {
      console.error('❌ Firma de webhook inválida');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const event = JSON.parse(body);
    
    console.log('📨 Evento de Paddle:', {
      type: event.event_type,
      id: event.data?.id
    });

    // Procesar según el tipo de evento
    switch (event.event_type) {
      case 'subscription.created':
        await handleSubscriptionCreated(event.data);
        break;
        
      case 'subscription.updated':
        await handleSubscriptionUpdated(event.data);
        break;
        
      case 'subscription.canceled':
        await handleSubscriptionCanceled(event.data);
        break;
        
      case 'transaction.completed':
        await handleTransactionCompleted(event.data);
        break;
        
      default:
        console.log('⚠️ Tipo de evento no manejado:', event.event_type);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ Error procesando webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Verificar firma del webhook de Paddle
 */
function verifyPaddleWebhook(signature: string, body: string): boolean {
  try {
    const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.warn('⚠️ PADDLE_WEBHOOK_SECRET no configurado');
      return false;
    }

    // Extraer el timestamp y la firma
    const [ts, v1] = signature.split(';').map(part => part.split('=')[1]);
    
    // Crear el payload para verificar
    const payload = `${ts};${body}`;
    
    // Crear la firma HMAC
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');

    // Comparar las firmas de forma segura
    return crypto.timingSafeEqual(
      Buffer.from(v1, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );

  } catch (error) {
    console.error('❌ Error verificando firma de webhook:', error);
    return false;
  }
}

/**
 * Manejar creación de suscripción
 */
async function handleSubscriptionCreated(subscription: any) {
  try {
    console.log('✅ Nueva suscripción creada:', subscription.id);

    const businessId = subscription.custom_data?.businessId;
    if (!businessId) {
      console.error('❌ No se encontró businessId en custom_data');
      return;
    }

    // Actualizar el business en la base de datos
    await prisma.business.update({
      where: { id: businessId },
      data: {
        subscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        planId: subscription.items[0]?.price?.id,
        subscriptionStartDate: new Date(subscription.started_at),
        subscriptionEndDate: subscription.next_billed_at ? new Date(subscription.next_billed_at) : null,
      }
    });

    console.log('✅ Business actualizado con nueva suscripción');

  } catch (error) {
    console.error('❌ Error manejando suscripción creada:', error);
  }
}

/**
 * Manejar actualización de suscripción
 */
async function handleSubscriptionUpdated(subscription: any) {
  try {
    console.log('🔄 Suscripción actualizada:', subscription.id);

    // Buscar el business por subscription ID
    const business = await prisma.business.findFirst({
      where: { subscriptionId: subscription.id }
    });

    if (!business) {
      console.error('❌ No se encontró business para la suscripción:', subscription.id);
      return;
    }

    // Actualizar datos de la suscripción
    await prisma.business.update({
      where: { id: business.id },
      data: {
        subscriptionStatus: subscription.status,
        planId: subscription.items[0]?.price?.id,
        subscriptionEndDate: subscription.next_billed_at ? new Date(subscription.next_billed_at) : null,
      }
    });

    console.log('✅ Suscripción actualizada en base de datos');

  } catch (error) {
    console.error('❌ Error manejando suscripción actualizada:', error);
  }
}

/**
 * Manejar cancelación de suscripción
 */
async function handleSubscriptionCanceled(subscription: any) {
  try {
    console.log('❌ Suscripción cancelada:', subscription.id);

    // Buscar el business por subscription ID
    const business = await prisma.business.findFirst({
      where: { subscriptionId: subscription.id }
    });

    if (!business) {
      console.error('❌ No se encontró business para la suscripción:', subscription.id);
      return;
    }

    // Marcar suscripción como cancelada
    await prisma.business.update({
      where: { id: business.id },
      data: {
        subscriptionStatus: 'canceled',
        subscriptionEndDate: subscription.canceled_at ? new Date(subscription.canceled_at) : new Date(),
      }
    });

    console.log('✅ Suscripción marcada como cancelada');

  } catch (error) {
    console.error('❌ Error manejando suscripción cancelada:', error);
  }
}

/**
 * Manejar transacción completada
 */
async function handleTransactionCompleted(transaction: any) {
  try {
    console.log('💰 Transacción completada:', transaction.id);

    // Guardar registro de la transacción para auditoría
    const businessId = transaction.custom_data?.businessId;
    
    if (businessId) {
      // Aquí podrías crear un modelo PaymentHistory en Prisma
      // para llevar registro de todos los pagos
      console.log('💳 Pago registrado para business:', businessId);
    }

  } catch (error) {
    console.error('❌ Error manejando transacción completada:', error);
  }
}

export const dynamic = 'force-dynamic';
