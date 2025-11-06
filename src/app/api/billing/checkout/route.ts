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
  let priceId = '';
  
  try {
    const body = await request.json();
    const validatedData = createCheckoutSchema.parse(body);

    const {
      priceId: validatedPriceId,
      businessId,
      customerEmail,
      customerName,
      successUrl,
      cancelUrl
    } = validatedData;
    
    priceId = validatedPriceId;

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

    // Manejo de errores de validación Zod
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

    // Manejo específico de errores de Paddle
    if (error && typeof error === 'object' && 'code' in error) {
      const paddleError = error as any;
      
      // Credenciales inválidas
      if (paddleError.code === 'invalid_credentials' || paddleError.code === 'unauthorized') {
        console.error('🚨 PADDLE CREDENTIALS INVÁLIDAS - REVISAR .ENV');
        return NextResponse.json(
          { 
            success: false, 
            error: 'Servicio de pagos temporalmente no disponible',
            code: 'PAYMENT_CONFIG_ERROR'
          },
          { status: 503 }
        );
      }
      
      // Rate limit
      if (paddleError.code === 'rate_limit_exceeded') {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Demasiadas solicitudes, por favor intenta de nuevo en unos minutos',
            code: 'RATE_LIMIT'
          },
          { status: 429 }
        );
      }

      // Price ID inválido
      if (paddleError.code === 'invalid_field' && paddleError.field === 'priceId') {
        console.error('🚨 PRICE ID INVÁLIDO:', priceId);
        return NextResponse.json(
          { 
            success: false, 
            error: 'Plan no disponible',
            code: 'INVALID_PLAN'
          },
          { status: 400 }
        );
      }

      // Log error desconocido de Paddle para debugging
      console.error('❌ Error desconocido de Paddle:', {
        code: paddleError.code,
        message: paddleError.message,
        details: paddleError
      });
    }

    // Error genérico
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error procesando el pago. Por favor intenta de nuevo.',
        code: 'CHECKOUT_ERROR'
      },
      { status: 500 }
    );
  }
}

export { POST };
