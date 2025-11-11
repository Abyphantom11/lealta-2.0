/**
 * 🛒 API Route: Crear Transacción en Paddle (Server-Side)
 * 
 * Crea una transacción usando el API de Paddle directamente
 * Esto debería funcionar incluso sin aprobación de checkouts
 */

import { NextRequest, NextResponse } from 'next/server';
import Paddle from '@paddle/paddle-node-sdk';

const paddle = new Paddle(process.env.PADDLE_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { priceId, businessId, customerEmail, customerName } = body;

    // Validación
    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID es requerido' },
        { status: 400 }
      );
    }

    console.log('🚀 Creando transacción en Paddle...');
    console.log('Price ID:', priceId);
    console.log('Customer:', customerEmail);

    // Crear transacción con el API de Paddle
    // Esto crea la transacción pero NO abre el checkout todavía
    const transactionPayload: any = {
      items: [
        {
          price_id: priceId,
          quantity: 1,
        },
      ],
    };

    // Agregar custom data si existe
    if (businessId) {
      transactionPayload.custom_data = { businessId };
    }

    // Agregar customer email si existe
    if (customerEmail) {
      transactionPayload.customer_email = customerEmail;
    }

    // Agregar billing details si tenemos nombre
    if (customerName && customerEmail) {
      transactionPayload.billing_details = {
        enable_checkout: true, // 🔑 Importante: habilitar checkout para esta transacción
      };
      transactionPayload.customer_email = customerEmail;
    }

    const transaction = await paddle.transactions.create(transactionPayload);

    console.log('✅ Transacción creada:', transaction.id);
    console.log('📋 Detalles:', {
      id: transaction.id,
      status: transaction.status,
      checkout: transaction.checkout
    });

    // La transacción debe incluir checkout.url si enable_checkout = true
    if (transaction.checkout?.url) {
      console.log('🔗 Checkout URL:', transaction.checkout.url);
      return NextResponse.json({ 
        checkoutUrl: transaction.checkout.url,
        transactionId: transaction.id 
      });
    }

    // Si no hay checkout URL, hay un problema
    throw new Error('Paddle no devolvió un checkout URL. Verifica que enable_checkout esté habilitado.');

  } catch (error: any) {
    console.error('❌ Error creando transacción:', error);
    
    // Si es un error de Paddle, extraer más detalles
    if (error.code) {
      return NextResponse.json(
        { 
          error: 'Error de Paddle',
          code: error.code,
          details: error.message,
          type: error.type
        },
        { status: error.statusCode || 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Error al crear transacción',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
