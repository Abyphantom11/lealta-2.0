import { NextRequest, NextResponse } from 'next/server';
import { paddleClient } from '@/lib/paddle';
import { z } from 'zod';

/**
 * 💳 API ROUTE: Crear Checkout de Paddle
 * 
 * Esta ruta crea una sesión de checkout para que los usuarios
 * puedan suscribirse a planes o comprar productos
 */

const createCheckoutSchema = z.object({
  priceId: z.string().min(1, 'Price ID es requerido'),
  businessId: z.string().min(1, 'Business ID es requerido'),
  customerEmail: z.string().email('Email inválido'),
  customerName: z.string().optional(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createCheckoutSchema.parse(body);

    const {
      priceId,
      businessId,
      customerEmail,
      customerName,
      successUrl,
      cancelUrl
    } = validatedData;

    console.log('🛒 Creando checkout de Paddle:', {
      priceId,
      businessId,
      customerEmail
    });

    // Crear el checkout con Paddle
    const checkoutRequest = {
      items: [
        {
          priceId: priceId,
          quantity: 1,
        },
      ],
      customer: {
        email: customerEmail,
        name: customerName,
      },
      customData: {
        businessId,
        source: 'lealta-dashboard'
      },
      successUrl: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/billing/success`,
      cancelUrl: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/billing/cancel`,
    };

    const checkout = await paddleClient.transactions.create(checkoutRequest);

    console.log('✅ Checkout creado:', checkout.id);

    return NextResponse.json({
      success: true,
      checkoutId: checkout.id,
      checkoutUrl: checkout.checkout?.url || '#',
      message: 'Checkout creado exitosamente'
    });

  } catch (error) {
    console.error('❌ Error creando checkout:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Datos inválidos',
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor' 
      },
      { status: 500 }
    );
  }
}

export { POST };
