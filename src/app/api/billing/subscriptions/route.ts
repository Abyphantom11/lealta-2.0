import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { subscriptions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { paddleClient } from '@/lib/paddle';

/**
 * � GET: Obtener suscripciones de un negocio
 */
export async function GET(req: NextRequest) {
  try {
    const businessId = req.nextUrl.searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: 'businessId requerido' },
        { status: 400 }
      );
    }

    console.log('📋 Obteniendo suscripciones para business:', businessId);

    // Obtener suscripciones de la DB
    const businessSubscriptions = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.businessId, businessId));

    // Enriquecer con datos de Paddle si es necesario
    const enrichedSubscriptions = await Promise.all(
      businessSubscriptions.map(async (sub) => {
        try {
          // Obtener datos frescos de Paddle
          const paddleSub = await paddleClient.subscriptions.get(sub.paddleSubscriptionId);
          
          return {
            ...sub,
            paddleData: {
              nextBilledAt: paddleSub.next_billed_at,
              managementUrls: paddleSub.management_urls,
              items: paddleSub.items,
            },
          };
        } catch (error) {
          console.error('Error obteniendo datos de Paddle:', error);
          return sub;
        }
      })
    );

    console.log(`✅ Encontradas ${enrichedSubscriptions.length} suscripciones`);

    return NextResponse.json({
      success: true,
      subscriptions: enrichedSubscriptions,
    });

  } catch (error) {
    console.error('❌ Error obteniendo suscripciones:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * ❌ DELETE: Cancelar suscripción
 */
export async function DELETE(req: NextRequest) {
  try {
    const subscriptionId = req.nextUrl.searchParams.get('subscriptionId');
    const immediately = req.nextUrl.searchParams.get('immediately') === 'true';

    if (!subscriptionId) {
      return NextResponse.json(
        { success: false, error: 'subscriptionId requerido' },
        { status: 400 }
      );
    }

    console.log('❌ Cancelando suscripción:', subscriptionId);

    // Buscar en DB
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

    // Cancelar en Paddle
    const canceledSubscription = await paddleClient.subscriptions.cancel(
      subscription.paddleSubscriptionId,
      {
        effective_from: immediately ? 'immediately' : 'next_billing_period',
      }
    );

    // Actualizar en DB
    await db.update(subscriptions)
      .set({
        status: immediately ? 'canceled' : 'active',
        cancelAtPeriodEnd: !immediately,
        canceledAt: immediately ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, subscriptionId));

    console.log('✅ Suscripción cancelada exitosamente');

    return NextResponse.json({
      success: true,
      subscription: canceledSubscription,
      message: immediately 
        ? 'Suscripción cancelada inmediatamente' 
        : 'Suscripción se cancelará al final del periodo',
    });

  } catch (error) {
    console.error('❌ Error cancelando suscripción:', error);
    return NextResponse.json(
      { success: false, error: 'Error cancelando suscripción' },
      { status: 500 }
    );
  }
}

/**
 * 🔄 PATCH: Actualizar suscripción (cambiar plan, etc)
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { subscriptionId, newPriceId, prorationBilling } = body;

    if (!subscriptionId || !newPriceId) {
      return NextResponse.json(
        { success: false, error: 'subscriptionId y newPriceId requeridos' },
        { status: 400 }
      );
    }

    console.log('🔄 Actualizando suscripción:', subscriptionId);

    // Buscar en DB
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

    // Actualizar en Paddle
    const updatedSubscription = await paddleClient.subscriptions.update(
      subscription.paddleSubscriptionId,
      {
        items: [{
          priceId: newPriceId,
          quantity: 1,
        }],
        prorationBillingMode: prorationBilling || 'prorated_immediately',
      }
    );

    // Actualizar en DB
    await db.update(subscriptions)
      .set({
        planId: newPriceId,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, subscriptionId));

    console.log('✅ Suscripción actualizada exitosamente');

    return NextResponse.json({
      success: true,
      subscription: updatedSubscription,
      message: 'Suscripción actualizada exitosamente',
    });

  } catch (error) {
    console.error('❌ Error actualizando suscripción:', error);
    return NextResponse.json(
      { success: false, error: 'Error actualizando suscripción' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
