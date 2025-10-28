import { NextRequest, NextResponse } from 'next/server';

/**
 * 🧪 API SIMULADORA DE PADDLE
 * 
 * Simula las respuestas de Paddle para testing sin procesar pagos reales
 */

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  console.log('🧪 SIMULACIÓN PADDLE API:', {
    timestamp: new Date().toISOString(),
    request: body,
    endpoint: 'checkout simulation'
  });

  // Simular delay de red
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Simular respuesta exitosa de Paddle
  const simulatedResponse = {
    success: true,
    simulation: true,
    data: {
      checkoutId: `sim_checkout_${Date.now()}`,
      customerId: `sim_customer_${Date.now()}`,
      subscriptionId: `sim_sub_${Date.now()}`,
      transactionId: `sim_txn_${Date.now()}`,
      priceId: body.priceId || 'pri_lealta_enterprise_250',
      amount: body.amount || 25000, // $250 en centavos
      currency: 'USD',
      status: 'completed',
      customerEmail: body.customerEmail,
      businessName: body.businessName,
      businessCount: body.businessCount || 1,
      planName: 'Lealta Enterprise',
      billingCycle: 'monthly',
      nextBilling: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString()
    },
    simulatedEvents: [
      {
        event: 'subscription.created',
        data: {
          subscriptionId: `sim_sub_${Date.now()}`,
          status: 'active',
          plan: 'Lealta Enterprise',
          customer: body.customerEmail
        }
      },
      {
        event: 'transaction.completed',
        data: {
          transactionId: `sim_txn_${Date.now()}`,
          amount: body.amount || 25000,
          status: 'completed'
        }
      }
    ],
    webhookUrl: '/api/webhooks/paddle-simulator',
    checkoutUrl: '/test/paddle-simulator?step=processing'
  };

  // Log de la simulación
  console.log('✅ SIMULACIÓN EXITOSA:', simulatedResponse.data);

  return NextResponse.json(simulatedResponse);
}

// Simular webhook de Paddle
export async function PUT(request: NextRequest) {
  const body = await request.json();
  
  console.log('🔔 SIMULACIÓN WEBHOOK PADDLE:', {
    timestamp: new Date().toISOString(),
    event: body.event_type,
    data: body
  });

  // Simular procesamiento de webhook
  const webhookResponse = {
    success: true,
    simulation: true,
    event: body.event_type,
    processed: true,
    actions: [
      'Suscripción guardada en base de datos',
      'Usuario activado',
      'Email de confirmación enviado',
      'Analytics actualizados'
    ]
  };

  return NextResponse.json(webhookResponse);
}
