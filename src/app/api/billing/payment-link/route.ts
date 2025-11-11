import { NextRequest, NextResponse } from 'next/server';

/**
 * 🔗 API: Generar Payment Link de Paddle
 * 
 * Alternativa temporal mientras se activa el checkout API
 * Usa Paddle Payment Links en lugar de transaction-checkout
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { priceId, businessId, customerEmail } = body;

    // Price ID de tu plan Enterprise
    const ENTERPRISE_PRICE_ID = process.env.NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID;

    // Base URL del payment link (obtener desde Paddle dashboard)
    // TODO: Reemplaza con tu payment link real del dashboard
    const basePaymentLink = process.env.PADDLE_PAYMENT_LINK_BASE_URL || 
      `https://buy.paddle.com/checkout`;

    // Construir payment link con parámetros
    const paymentUrl = new URL(basePaymentLink);
    paymentUrl.searchParams.set('price', priceId || ENTERPRISE_PRICE_ID || '');
    
    // Agregar custom data como parámetros
    if (customerEmail) {
      paymentUrl.searchParams.set('email', customerEmail);
    }
    
    // Custom data para identificar en webhooks
    if (businessId) {
      paymentUrl.searchParams.set('custom[businessId]', businessId);
    }

    console.log('🔗 Payment link generado:', paymentUrl.toString());

    return NextResponse.json({
      success: true,
      paymentUrl: paymentUrl.toString(),
      message: 'Redirige al usuario a este URL para completar el pago',
    });

  } catch (error) {
    console.error('❌ Error generando payment link:', error);
    return NextResponse.json(
      { success: false, error: 'Error generando payment link' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
