import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { subscriptions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { paddleClient } from '@/lib/paddle';

/**
 * 🔗 GET: Obtener URL del portal de gestión de suscripción
 * 
 * Genera un link para que el cliente gestione su suscripción:
 * - Actualizar método de pago
 * - Ver historial de pagos
 * - Cancelar suscripción
 * - Cambiar plan
 */
export async function GET(req: NextRequest) {
  try {
    const subscriptionId = req.nextUrl.searchParams.get('subscriptionId');

    if (!subscriptionId) {
      return NextResponse.json(
        { success: false, error: 'subscriptionId requerido' },
        { status: 400 }
      );
    }

    console.log('🔗 Generando portal URL para:', subscriptionId);

    // Buscar suscripción en DB
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, subscriptionId))
      .limit(1);

    if (!subscription) {
      return NextResponse.json(
        { success: false, error: 'Suscripción no encontrada' },
        { status: 404 }
      );
    }

    // Obtener datos de Paddle
    const paddleSubscription = await paddleClient.subscriptions.get(
      subscription.paddleSubscriptionId
    );

    // URLs del portal de gestión
    const managementUrls = {
      updatePaymentMethod: paddleSubscription.management_urls?.update_payment_method,
      cancel: paddleSubscription.management_urls?.cancel,
    };

    console.log('✅ Portal URLs generadas');

    return NextResponse.json({
      success: true,
      portalUrls: managementUrls,
      subscription: {
        id: paddleSubscription.id,
        status: paddleSubscription.status,
        nextBilledAt: paddleSubscription.next_billed_at,
      },
    });

  } catch (error) {
    console.error('❌ Error generando portal URL:', error);
    return NextResponse.json(
      { success: false, error: 'Error generando portal URL' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
