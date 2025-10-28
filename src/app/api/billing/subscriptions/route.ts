import { NextRequest, NextResponse } from 'next/server';
import { paddleClient } from '@/lib/paddle';

/**
 * 💳 API ROUTE: Obtener Suscripciones Activas
 * 
 * Obtiene las suscripciones activas de un business
 */

async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: 'Business ID requerido' },
        { status: 400 }
      );
    }

    console.log('📋 Obteniendo suscripciones para business:', businessId);

    // Por ahora retornamos datos mock hasta configurar Paddle completamente
    // TODO: Implementar llamada real a Paddle cuando tengas las credenciales
    const mockSubscriptions = [
      {
        id: 'sub_mock_123',
        status: 'active',
        planId: 'pri_professional_plan',
        nextBillDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancelUrl: 'https://checkout.paddle.com/subscription/cancel',
        updateUrl: 'https://checkout.paddle.com/subscription/update',
        createdAt: new Date().toISOString(),
      }
    ];

    console.log(`✅ Encontradas ${mockSubscriptions.length} suscripciones activas`);

    return NextResponse.json({
      success: true,
      subscriptions: mockSubscriptions,
      note: 'Datos mock - configurar credenciales reales de Paddle'
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
 * 💳 API ROUTE: Cancelar Suscripción
 */
async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subscriptionId = searchParams.get('subscriptionId');

    if (!subscriptionId) {
      return NextResponse.json(
        { success: false, error: 'Subscription ID requerido' },
        { status: 400 }
      );
    }

    console.log('❌ Cancelando suscripción:', subscriptionId);

    // Cancelar suscripción en Paddle
    const canceledSubscription = await paddleClient.subscriptions.cancel(
      subscriptionId,
      {
        effectiveFrom: 'next_billing_period', // Cancelar al final del período actual
      }
    );

    console.log('✅ Suscripción cancelada:', canceledSubscription.id);

    return NextResponse.json({
      success: true,
      subscription: {
        id: canceledSubscription.id,
        status: canceledSubscription.status,
        canceledAt: canceledSubscription.canceledAt,
      },
      message: 'Suscripción cancelada exitosamente'
    });

  } catch (error) {
    console.error('❌ Error cancelando suscripción:', error);

    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export { GET, DELETE };
export const dynamic = 'force-dynamic';
