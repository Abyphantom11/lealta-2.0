// 🎮 SIMULADOR DE WEBHOOKS DE PADDLE
// Simula webhooks de Paddle localmente sin necesidad de hacer pagos reales

const baseUrl = 'http://localhost:3001';

// Obtén un businessId real de tu base de datos
// Puedes ejecutar: npx prisma studio y copiar un ID de Business
const BUSINESS_ID_DE_PRUEBA = 'cmgf5o37a0000eyhgultn2kbf'; // La Casa del Sabor

async function simularWebhook(eventType, data) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🎮 SIMULANDO: ${eventType}`);
  console.log(`${'='.repeat(60)}`);
  console.log('📦 Payload:', JSON.stringify(data, null, 2));
  
  try {
    const response = await fetch(`${baseUrl}/api/webhooks/paddle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Paddle-Signature': 'ts=1234567890;h1=test_signature', // Firma de prueba
      },
      body: JSON.stringify({
        event_id: `evt_${Date.now()}`,
        event_type: eventType,
        occurred_at: new Date().toISOString(),
        notification_id: `ntf_${Date.now()}`,
        data: data,
      }),
    });

    const result = await response.text();
    
    console.log(`\n📊 Respuesta del servidor (${response.status}):`);
    if (response.ok) {
      console.log('✅ Webhook procesado exitosamente');
      console.log('📄 Respuesta:', result || 'OK');
    } else {
      console.error('❌ Error procesando webhook');
      console.error('📄 Respuesta:', result);
    }
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
  }
  
  console.log(`${'='.repeat(60)}\n`);
}

// ====================================
// 1️⃣ SIMULAR SUSCRIPCIÓN CREADA
// ====================================
async function simularSubscripcionCreada() {
  const subscriptionId = `sub_test_${Date.now()}`;
  const customerId = `ctm_test_${Date.now()}`;
  
  await simularWebhook('subscription.created', {
    id: subscriptionId,
    status: 'active',
    customer_id: customerId,
    address_id: `add_test_${Date.now()}`,
    business_id: null,
    currency_code: 'USD',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    started_at: new Date().toISOString(),
    first_billed_at: new Date().toISOString(),
    next_billed_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    paused_at: null,
    canceled_at: null,
    discount: null,
    collection_mode: 'automatic',
    billing_details: null,
    current_billing_period: {
      starts_at: new Date().toISOString(),
      ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    billing_cycle: {
      interval: 'month',
      frequency: 1,
    },
    scheduled_change: null,
    items: [
      {
        status: 'active',
        quantity: 1,
        recurring: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        trial_dates: null,
        price: {
          id: 'pri_01k9d95qvht02dqzvkw0h5876p',
          description: 'Lealta Enterprise Plan',
          product_id: 'pro_lealta_enterprise',
          billing_cycle: {
            interval: 'month',
            frequency: 1,
          },
          unit_price: {
            amount: '25000', // $250.00 en centavos
            currency_code: 'USD',
          },
        },
      },
    ],
    custom_data: {
      business_id: BUSINESS_ID_DE_PRUEBA,
    },
  });
  
  return { subscriptionId, customerId };
}

// ====================================
// 2️⃣ SIMULAR TRANSACCIÓN COMPLETADA
// ====================================
async function simularTransaccionCompletada(subscriptionId = null) {
  const txnId = `txn_test_${Date.now()}`;
  
  await simularWebhook('transaction.completed', {
    id: txnId,
    status: 'completed',
    customer_id: `ctm_test_${Date.now()}`,
    address_id: `add_test_${Date.now()}`,
    business_id: null,
    custom_data: {
      business_id: BUSINESS_ID_DE_PRUEBA,
    },
    currency_code: 'USD',
    origin: subscriptionId ? 'subscription_recurring' : 'web',
    subscription_id: subscriptionId || null,
    invoice_id: `inv_test_${Date.now()}`,
    invoice_number: `INV-${Date.now()}`,
    collection_mode: 'automatic',
    billing_period: subscriptionId ? {
      starts_at: new Date().toISOString(),
      ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    } : null,
    items: [
      {
        price: {
          id: 'pri_01k9d95qvht02dqzvkw0h5876p',
          description: 'Lealta Enterprise Plan',
          product_id: 'pro_lealta_enterprise',
          unit_price: {
            amount: '25000',
            currency_code: 'USD',
          },
        },
        quantity: 1,
      },
    ],
    details: {
      totals: {
        subtotal: '25000',
        tax: '0',
        total: '25000',
        grand_total: '25000',
        currency_code: 'USD',
      },
      line_items: [
        {
          id: `txnitm_${Date.now()}`,
          price_id: 'pri_01k9d95qvht02dqzvkw0h5876p',
          quantity: 1,
          totals: {
            subtotal: '25000',
            tax: '0',
            total: '25000',
          },
          product: {
            name: 'Lealta Enterprise',
            description: 'Plan Enterprise para restaurantes',
            status: 'active',
          },
        },
      ],
    },
    payments: [
      {
        amount: '25000',
        status: 'captured',
        captured_at: new Date().toISOString(),
      },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    billed_at: new Date().toISOString(),
  });
}

// ====================================
// 3️⃣ SIMULAR PAGO FALLIDO
// ====================================
async function simularPagoFallido(subscriptionId = null) {
  await simularWebhook('transaction.payment_failed', {
    id: `txn_failed_${Date.now()}`,
    status: 'past_due',
    customer_id: `ctm_test_${Date.now()}`,
    subscription_id: subscriptionId || `sub_test_${Date.now()}`,
    custom_data: {
      business_id: BUSINESS_ID_DE_PRUEBA,
    },
    currency_code: 'USD',
    details: {
      totals: {
        grand_total: '25000',
        currency_code: 'USD',
      },
    },
  });
}

// ====================================
// 4️⃣ SIMULAR CANCELACIÓN
// ====================================
async function simularCancelacion(subscriptionId = null) {
  await simularWebhook('subscription.canceled', {
    id: subscriptionId || `sub_test_${Date.now()}`,
    status: 'canceled',
    customer_id: `ctm_test_${Date.now()}`,
    custom_data: {
      business_id: BUSINESS_ID_DE_PRUEBA,
    },
    canceled_at: new Date().toISOString(),
    scheduled_change: null,
  });
}

// ====================================
// 5️⃣ SIMULAR SUSCRIPCIÓN PAUSADA
// ====================================
async function simularPausada(subscriptionId = null) {
  await simularWebhook('subscription.paused', {
    id: subscriptionId || `sub_test_${Date.now()}`,
    status: 'paused',
    customer_id: `ctm_test_${Date.now()}`,
    custom_data: {
      business_id: BUSINESS_ID_DE_PRUEBA,
    },
    paused_at: new Date().toISOString(),
  });
}

// ====================================
// 🎬 MENÚ PRINCIPAL
// ====================================
async function mostrarMenu() {
  console.log('\n' + '='.repeat(60));
  console.log('🎮 SIMULADOR DE WEBHOOKS DE PADDLE');
  console.log('='.repeat(60));
  console.log('\n📋 OPCIONES DE SIMULACIÓN:\n');
  console.log('1. Flujo completo (Suscripción + Pago)');
  console.log('2. Solo suscripción creada');
  console.log('3. Solo transacción completada');
  console.log('4. Pago fallido');
  console.log('5. Cancelación de suscripción');
  console.log('6. Suscripción pausada');
  console.log('7. Simular todo (prueba completa)');
  console.log('\n' + '='.repeat(60));
}

// ====================================
// 🚀 EJECUTAR SIMULACIONES
// ====================================
(async () => {
  console.clear();
  
  // Verificar configuración
  if (BUSINESS_ID_DE_PRUEBA === 'reemplaza_con_id_real') {
    console.log('❌ ERROR: Debes configurar BUSINESS_ID_DE_PRUEBA');
    console.log('\n📝 INSTRUCCIONES:');
    console.log('1. Ejecuta: npx prisma studio');
    console.log('2. Abre la tabla "Business"');
    console.log('3. Copia un "id" de cualquier business');
    console.log('4. Pégalo en la línea 6 de este archivo');
    console.log('\nEjemplo: const BUSINESS_ID_DE_PRUEBA = "cm38frh5y0000l508m1kzy9xw";\n');
    return;
  }
  
  await mostrarMenu();
  
  console.log('\n⚙️  CONFIGURACIÓN:');
  console.log(`   Business ID: ${BUSINESS_ID_DE_PRUEBA}`);
  console.log(`   Servidor: ${baseUrl}\n`);
  
  // Ejecuta la simulación que necesites descomentando:
  
  // OPCIÓN 1: Flujo completo
  console.log('🎬 Ejecutando: Flujo completo de suscripción + pago\n');
  const { subscriptionId } = await simularSubscripcionCreada();
  await new Promise(resolve => setTimeout(resolve, 2000)); // Esperar 2 segundos
  await simularTransaccionCompletada(subscriptionId);
  
  // OPCIÓN 2: Solo suscripción
  // await simularSubscripcionCreada();
  
  // OPCIÓN 3: Solo transacción
  // await simularTransaccionCompletada();
  
  // OPCIÓN 4: Pago fallido
  // await simularPagoFallido();
  
  // OPCIÓN 5: Cancelación
  // await simularCancelacion();
  
  // OPCIÓN 6: Pausada
  // await simularPausada();
  
  // OPCIÓN 7: Todo
  // await simularSubscripcionCreada();
  // await new Promise(r => setTimeout(r, 1000));
  // await simularTransaccionCompletada();
  // await new Promise(r => setTimeout(r, 1000));
  // await simularPagoFallido();
  // await new Promise(r => setTimeout(r, 1000));
  // await simularCancelacion();
  
  console.log('\n✅ Simulaciones completadas');
  console.log('\n📊 PRÓXIMOS PASOS:');
  console.log('1. Revisa los logs del servidor en la terminal');
  console.log('2. Abre Prisma Studio: npx prisma studio');
  console.log('3. Verifica las tablas Business y PaymentHistory\n');
})();
