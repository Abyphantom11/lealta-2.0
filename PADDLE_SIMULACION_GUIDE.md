# 🎮 GUÍA DE SIMULACIÓN DE PAGOS - PADDLE

**Fecha:** 6 de noviembre, 2025  
**Objetivo:** Simular pagos y webhooks de Paddle sin hacer transacciones reales

---

## 🎯 OPCIÓN 1: SIMULACIÓN DESDE PADDLE DASHBOARD (RECOMENDADO)

### Paso 1: Ir a Simulaciones

1. Ve a tu Paddle Dashboard: https://vendors.paddle.com
2. En el menú lateral, busca **"Developer Tools"**
3. Click en **"Simulations"**

### Paso 2: Crear una Simulación de Pago

#### A) Simular Suscripción Creada

1. En Simulations, busca **"Subscription"**
2. Click en **"subscription.created"**
3. Configura los datos:
   ```json
   {
     "customer_email": "test@lealta.app",
     "price_id": "pri_01k9d95qvht02dqzvkw0h5876p"
   }
   ```
4. Click **"Send simulation"**

#### B) Simular Transacción Completada

1. Busca **"Transaction"**
2. Click en **"transaction.completed"**
3. Configura:
   ```json
   {
     "customer_email": "test@lealta.app",
     "amount": "250.00",
     "currency": "USD"
   }
   ```
4. Click **"Send simulation"**

### Paso 3: Verificar Webhooks

Después de simular, verifica:

1. **En tu servidor (terminal):**
   ```
   🔗 Webhook recibido de Paddle
   📨 Evento de Paddle: { type: 'subscription.created', ... }
   ✅ Suscripción creada exitosamente
   ```

2. **En Paddle Dashboard > Notifications:**
   - Verás los eventos enviados
   - Status debe ser `200 OK`

---

## 🎯 OPCIÓN 2: SIMULACIÓN CON CHECKOUT DE PRUEBA

### Método A: Usar Tarjeta de Prueba (Sandbox)

Si cambiaste a sandbox en `.env.local`:

1. Ve a: `http://localhost:3001/pricing`
2. Click en **"Comenzar Suscripción"**
3. En el checkout de Paddle usa:
   - **Tarjeta:** `4242 4242 4242 4242`
   - **Fecha:** Cualquier fecha futura (ej: 12/26)
   - **CVC:** `123`
   - **Email:** `test@lealta.app`

### Método B: Crear Cliente de Prueba en Dashboard

1. Ve a Paddle Dashboard > **Customers**
2. Click **"Add Customer"**
3. Completa:
   - Name: `Test User`
   - Email: `test@lealta.app`
4. Luego ve a **Subscriptions** > **Add Subscription**
5. Selecciona el cliente y el price ID

---

## 🎯 OPCIÓN 3: SIMULACIÓN CON SCRIPT (Avanzado)

Voy a crear un script que simule webhooks directamente a tu API:

### Script: `simular-webhook-paddle.js`

```javascript
// Simular un webhook de Paddle localmente
const baseUrl = 'http://localhost:3001';

async function simularWebhook(eventType, data) {
  console.log(`\n🎮 SIMULANDO: ${eventType}`);
  console.log('📦 Data:', JSON.stringify(data, null, 2));
  
  try {
    const response = await fetch(`${baseUrl}/api/webhooks/paddle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Paddle-Signature': 'test_signature', // En testing real, Paddle firma esto
      },
      body: JSON.stringify({
        event_id: `evt_${Date.now()}`,
        event_type: eventType,
        occurred_at: new Date().toISOString(),
        data: data,
      }),
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Webhook procesado:', result);
    } else {
      console.error('❌ Error:', result);
    }
  } catch (error) {
    console.error('❌ Error de red:', error);
  }
}

// 1. Simular creación de suscripción
async function simularSubscripcionCreada() {
  await simularWebhook('subscription.created', {
    id: 'sub_test_' + Date.now(),
    status: 'active',
    customer_id: 'ctm_test_123',
    address_id: 'add_test_123',
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
    recurring_transaction_details: null,
    scheduled_change: null,
    items: [
      {
        status: 'active',
        quantity: 1,
        recurring: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        previously_billed_at: null,
        next_billed_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        trial_dates: null,
        price: {
          id: 'pri_01k9d95qvht02dqzvkw0h5876p',
          description: 'Lealta Enterprise Plan',
          product_id: 'pro_test_123',
          billing_cycle: {
            interval: 'month',
            frequency: 1,
          },
          trial_period: null,
          tax_mode: 'account_setting',
          unit_price: {
            amount: '25000',
            currency_code: 'USD',
          },
          unit_price_overrides: [],
        },
      },
    ],
    custom_data: {
      business_id: 'tu_business_id_aqui', // Reemplaza con un ID real de tu BD
    },
    management_urls: null,
  });
}

// 2. Simular transacción completada
async function simularTransaccionCompletada() {
  await simularWebhook('transaction.completed', {
    id: 'txn_test_' + Date.now(),
    status: 'completed',
    customer_id: 'ctm_test_123',
    address_id: 'add_test_123',
    business_id: null,
    custom_data: {
      business_id: 'tu_business_id_aqui', // Reemplaza con un ID real
    },
    currency_code: 'USD',
    origin: 'subscription_recurring',
    subscription_id: 'sub_test_123',
    invoice_id: 'inv_test_123',
    invoice_number: 'INV-001',
    collection_mode: 'automatic',
    discount_id: null,
    billing_details: null,
    billing_period: {
      starts_at: new Date().toISOString(),
      ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    items: [
      {
        price: {
          id: 'pri_01k9d95qvht02dqzvkw0h5876p',
          description: 'Lealta Enterprise Plan',
          product_id: 'pro_test_123',
          billing_cycle: null,
          trial_period: null,
          tax_mode: 'account_setting',
          unit_price: {
            amount: '25000',
            currency_code: 'USD',
          },
        },
        quantity: 1,
        proration: null,
      },
    ],
    details: {
      totals: {
        subtotal: '25000',
        discount: '0',
        tax: '0',
        total: '25000',
        credit: '0',
        balance: '0',
        grand_total: '25000',
        fee: null,
        earnings: null,
        currency_code: 'USD',
      },
      adjusted_totals: {
        subtotal: '25000',
        tax: '0',
        total: '25000',
        grand_total: '25000',
        fee: '0',
        earnings: '0',
        currency_code: 'USD',
      },
      payout_totals: null,
      adjusted_payout_totals: null,
      tax_rates_used: [],
      line_items: [
        {
          id: 'txnitm_test_123',
          price_id: 'pri_01k9d95qvht02dqzvkw0h5876p',
          quantity: 1,
          proration: null,
          tax_rate: '0',
          unit_totals: {
            subtotal: '25000',
            discount: '0',
            tax: '0',
            total: '25000',
          },
          totals: {
            subtotal: '25000',
            discount: '0',
            tax: '0',
            total: '25000',
          },
          product: {
            name: 'Lealta Enterprise',
            tax_category: 'standard',
            description: 'Plan Enterprise para restaurantes',
            image_url: null,
            custom_data: null,
            status: 'active',
          },
        },
      ],
    },
    payments: [
      {
        method_id: 'paymtd_test_123',
        amount: '25000',
        status: 'captured',
        captured_at: new Date().toISOString(),
        error_code: null,
        payment_attempt_id: 'c024c0e3-0e8b-4315-87c5-34ab5a2e09e9',
        stored_payment_method_id: 'ee0e61d3-2259-4888-9a08-aa32441c8925',
      },
    ],
    checkout: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    billed_at: new Date().toISOString(),
  });
}

// 3. Simular pago fallido
async function simularPagoFallido() {
  await simularWebhook('transaction.payment_failed', {
    id: 'txn_test_failed_' + Date.now(),
    status: 'past_due',
    customer_id: 'ctm_test_123',
    subscription_id: 'sub_test_123',
    custom_data: {
      business_id: 'tu_business_id_aqui',
    },
    error_code: 'card_declined',
  });
}

// Ejecutar simulaciones
(async () => {
  console.log('🎮 INICIANDO SIMULACIONES DE PADDLE\n');
  console.log('⚠️  ASEGÚRATE DE:');
  console.log('   1. Tener el servidor corriendo en localhost:3001');
  console.log('   2. Reemplazar "tu_business_id_aqui" con un ID real de tu BD\n');
  
  // Descomentar las simulaciones que quieras ejecutar:
  
  // await simularSubscripcionCreada();
  // await simularTransaccionCompletada();
  // await simularPagoFallido();
  
  console.log('\n✅ Simulaciones completadas');
})();
```

---

## 📋 CHECKLIST DE SIMULACIÓN

### ✅ Preparación
- [ ] Servidor corriendo en `localhost:3001`
- [ ] Credenciales de Paddle configuradas
- [ ] Base de datos con al menos un Business

### ✅ Simular desde Dashboard
- [ ] Ir a Developer Tools > Simulations
- [ ] Simular `subscription.created`
- [ ] Simular `transaction.completed`
- [ ] Verificar logs del servidor

### ✅ Verificar Resultados
- [ ] Logs del servidor muestran webhook recibido
- [ ] Base de datos actualizada:
  - [ ] Business tiene `subscriptionId`
  - [ ] PaymentHistory tiene nuevo registro
  - [ ] `subscriptionStatus = 'active'`

---

## 🔍 VERIFICAR RESULTADOS EN BASE DE DATOS

Después de simular, ejecuta:

```bash
npx prisma studio
```

**Verifica:**
1. **Tabla Business:**
   - `subscriptionId` poblado
   - `subscriptionStatus = 'active'`
   - `planId` correcto

2. **Tabla PaymentHistory:**
   - Nuevo registro con `transactionId`
   - `amount = 250`
   - `status = 'completed'`
   - `paddleData` con información completa

---

## 🎯 ESCENARIOS DE PRUEBA

### 1. Flujo Completo Exitoso
```
1. subscription.created → Business actualizado con subscriptionId
2. transaction.completed → PaymentHistory registro creado
3. Verificar en Prisma Studio
```

### 2. Pago Fallido
```
1. transaction.payment_failed → Business marcado como past_due
2. Verificar notificación al usuario
```

### 3. Cancelación
```
1. subscription.canceled → subscriptionStatus = 'canceled'
2. Verificar acceso del usuario
```

---

## 💡 TIPS

- **Usa businessId real:** Copia un ID de Business de tu base de datos
- **Verifica webhooks:** En Paddle Dashboard > Notifications
- **Logs en tiempo real:** Observa la terminal del servidor
- **Prisma Studio:** Mantén abierto para ver cambios en tiempo real

---

## 🐛 TROUBLESHOOTING

### Webhook no llega
- Verifica la URL en Paddle Dashboard
- Asegúrate que el servidor esté corriendo
- Revisa los logs del servidor

### Error de verificación de firma
- Normal en simulaciones locales
- La firma real solo funciona con webhooks de Paddle

### Business no se actualiza
- Verifica que el `businessId` en custom_data sea correcto
- Revisa los logs para ver errores específicos

---

**¿Quieres que ejecutemos algunas simulaciones juntos?** 🚀
