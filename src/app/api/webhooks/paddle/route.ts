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

    // En desarrollo, permitir webhooks sin verificación si la firma es "test_signature"
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isTestSignature = signature.includes('test_signature');
    
    if (!isDevelopment || !isTestSignature) {
      // Verificar la firma del webhook (seguridad)
      if (!verifyPaddleWebhook(signature, body)) {
        console.error('❌ Firma de webhook inválida');
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    } else {
      console.log('⚠️ Modo desarrollo: Webhook de prueba aceptado sin verificación');
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

      case 'transaction.payment_failed':
        await handlePaymentFailed(event.data);
        break;
        
      case 'subscription.past_due':
        await handleSubscriptionPastDue(event.data);
        break;
        
      case 'subscription.paused':
        await handleSubscriptionPaused(event.data);
        break;
        
      default:
        console.log('⚠️ Tipo de evento no manejado:', event.event_type);
        console.log('Event data:', JSON.stringify(event, null, 2));
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
    console.log('📦 custom_data recibido:', JSON.stringify(subscription.custom_data));

    const businessId = subscription.custom_data?.business_id || subscription.custom_data?.businessId;
    if (!businessId) {
      console.error('❌ No se encontró businessId en custom_data');
      console.error('🔍 custom_data completo:', subscription.custom_data);
      return;
    }

    console.log('🏢 Actualizando business:', businessId);

    // Actualizar el business en la base de datos
    await prisma.business.update({
      where: { id: businessId },
      data: {
        subscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        planId: subscription.items[0]?.price?.id,
        customerId: subscription.customer_id,
        subscriptionStartDate: new Date(subscription.started_at),
        subscriptionEndDate: subscription.next_billed_at ? new Date(subscription.next_billed_at) : null,
        trialEndsAt: subscription.trial_dates?.ends_at 
          ? new Date(subscription.trial_dates.ends_at) 
          : null,
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
        trialEndsAt: subscription.trial_dates?.ends_at 
          ? new Date(subscription.trial_dates.ends_at) 
          : null,
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
    console.log('📦 custom_data recibido:', JSON.stringify(transaction.custom_data));

    const businessId = transaction.custom_data?.business_id || transaction.custom_data?.businessId;
    
    if (!businessId) {
      console.warn('⚠️ Transacción sin businessId:', transaction.id);
      console.warn('🔍 custom_data completo:', transaction.custom_data);
      return;
    }

    console.log('🏢 Guardando transacción para business:', businessId);

    // Guardar en historial de pagos
    await prisma.paymentHistory.create({
      data: {
        businessId: businessId,
        transactionId: transaction.id,
        subscriptionId: transaction.subscription_id || null,
        amount: transaction.details?.totals?.total ? transaction.details.totals.total / 100 : 0,
        currency: transaction.currency_code || 'USD',
        status: 'completed',
        paymentMethod: transaction.payments?.[0]?.method_details?.type || 'unknown',
        customerId: transaction.customer_id || null,
        paddleData: transaction,
      },
    });

    console.log('✅ Transacción guardada en historial:', transaction.id);

  } catch (error) {
    console.error('❌ Error manejando transacción completada:', error);
    // NO lanzar error - retornar 200 a Paddle para que no reintente
  }
}

/**
 * Manejar pago fallido
 */
async function handlePaymentFailed(transaction: any) {
  try {
    console.log('❌ Pago fallido:', transaction.id);

    const businessId = transaction.custom_data?.businessId;
    if (!businessId) return;

    // Guardar en historial con status failed
    await prisma.paymentHistory.create({
      data: {
        businessId: businessId,
        transactionId: transaction.id,
        subscriptionId: transaction.subscription_id || null,
        amount: transaction.details?.totals?.total ? transaction.details.totals.total / 100 : 0,
        currency: transaction.currency_code || 'USD',
        status: 'failed',
        paymentMethod: transaction.payments?.[0]?.method_details?.type || 'unknown',
        customerId: transaction.customer_id || null,
        paddleData: transaction,
      },
    });

    console.log('⚠️ ACCIÓN REQUERIDA: Notificar a business sobre pago fallido');

  } catch (error) {
    console.error('❌ Error manejando pago fallido:', error);
  }
}

/**
 * Manejar suscripción vencida (past_due)
 */
async function handleSubscriptionPastDue(subscription: any) {
  try {
    console.log('⚠️ Suscripción vencida:', subscription.id);

    const business = await prisma.business.findFirst({
      where: { subscriptionId: subscription.id }
    });

    if (!business) {
      console.error('❌ No se encontró business para la suscripción:', subscription.id);
      return;
    }

    await prisma.business.update({
      where: { id: business.id },
      data: {
        subscriptionStatus: 'past_due',
      }
    });

    console.log('⚠️ ACCIÓN REQUERIDA: Notificar vencimiento a business:', business.id);

  } catch (error) {
    console.error('❌ Error manejando suscripción past_due:', error);
  }
}

/**
 * Manejar suscripción pausada
 */
async function handleSubscriptionPaused(subscription: any) {
  try {
    console.log('⏸️ Suscripción pausada:', subscription.id);

    const business = await prisma.business.findFirst({
      where: { subscriptionId: subscription.id }
    });

    if (!business) {
      console.error('❌ No se encontró business para la suscripción:', subscription.id);
      return;
    }

    await prisma.business.update({
      where: { id: business.id },
      data: {
        subscriptionStatus: 'paused',
      }
    });

    console.log('✅ Suscripción marcada como pausada');

  } catch (error) {
    console.error('❌ Error manejando suscripción pausada:', error);
  }
}

export const dynamic = 'force-dynamic';
