# 📋 TO-DO: Completar Integración de Paddle

## ✅ YA HECHO (Frontend):
- [x] Hook usePaddle con inicialización
- [x] Función createCheckout
- [x] UI PricingTable con botones
- [x] Manejo de loading states
- [x] Configuración de environment variables
- [x] TypeScript types

---

## 🔴 PENDIENTE (Backend - CRÍTICO):

### 1. Webhook Handler
**Archivo:** `src/app/api/paddle/webhook/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { paddleClient } from '@/lib/paddle';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  // 1. Verificar signature de Paddle
  // 2. Parsear evento
  // 3. Según el evento:
  //    - checkout.completed → Activar suscripción en DB
  //    - subscription.updated → Actualizar status
  //    - payment.succeeded → Registrar pago
  //    - subscription.canceled → Desactivar features
  
  return NextResponse.json({ received: true });
}
```

**Prioridad:** 🔴 ALTA

---

### 2. API Endpoint: Get Subscriptions
**Archivo:** `src/app/api/billing/subscriptions/route.ts`

```typescript
export async function GET(req: NextRequest) {
  const businessId = req.nextUrl.searchParams.get('businessId');
  
  // 1. Buscar suscripciones en tu DB por businessId
  // 2. O consultar Paddle API con paddleClient.subscriptions.list()
  // 3. Retornar lista de suscripciones
  
  return NextResponse.json({ 
    success: true, 
    subscriptions: [] 
  });
}
```

**Prioridad:** 🟡 MEDIA

---

### 3. API Endpoint: Cancel Subscription
**Archivo:** `src/app/api/billing/subscriptions/route.ts`

```typescript
export async function DELETE(req: NextRequest) {
  const subscriptionId = req.nextUrl.searchParams.get('subscriptionId');
  
  // 1. Cancelar en Paddle
  await paddleClient.subscriptions.cancel(subscriptionId, {
    effectiveFrom: 'next_billing_period'
  });
  
  // 2. Actualizar en tu DB
  
  return NextResponse.json({ success: true });
}
```

**Prioridad:** 🟡 MEDIA

---

### 4. Subscription Portal URL
**Archivo:** `src/app/api/billing/portal/route.ts`

```typescript
export async function GET(req: NextRequest) {
  const subscriptionId = req.nextUrl.searchParams.get('subscriptionId');
  
  // Generar URL del portal de Paddle para que el cliente gestione su suscripción
  const transaction = await paddleClient.subscriptions.getTransaction(subscriptionId);
  
  return NextResponse.json({ 
    success: true, 
    portalUrl: transaction.management_urls?.update_payment_method 
  });
}
```

**Prioridad:** 🟢 BAJA

---

## 🟡 MEJORAS OPCIONALES:

### 5. Mejorar error handling en el hook
```typescript
// En usePaddle.ts
const createCheckout = async (options: CheckoutOptions) => {
  // ...
  
  const checkout = paddle.Checkout.open({ /* ... */ });
  
  // Escuchar eventos
  checkout?.on('checkout.completed', (data) => {
    console.log('✅ Pago completado:', data);
    // Opcional: Mostrar mensaje de éxito
    // Opcional: Redirigir
  });
  
  checkout?.on('checkout.error', (error) => {
    console.error('❌ Error en checkout:', error);
    throw new Error(error.detail || 'Error en el pago');
  });
  
  checkout?.on('checkout.closed', () => {
    console.log('👋 Usuario cerró el checkout');
  });
};
```

**Prioridad:** 🟢 BAJA

---

### 6. Middleware de verificación
**Archivo:** `src/middleware.ts`

```typescript
// Verificar si el business tiene suscripción activa
// antes de acceder a rutas premium

export function middleware(request: NextRequest) {
  const businessId = request.nextUrl.pathname.split('/')[1];
  
  // Verificar suscripción en DB
  const hasActiveSubscription = await checkSubscription(businessId);
  
  if (!hasActiveSubscription) {
    return NextResponse.redirect('/billing');
  }
  
  return NextResponse.next();
}
```

**Prioridad:** 🟢 BAJA

---

### 7. Agregar tests
```typescript
// tests/paddle.test.ts
describe('usePaddle', () => {
  it('should initialize paddle correctly', async () => {
    // ...
  });
  
  it('should open checkout with correct params', async () => {
    // ...
  });
});
```

**Prioridad:** 🟢 BAJA

---

## 📊 ESTIMACIÓN DE TIEMPO:

| Tarea | Tiempo | Dificultad |
|-------|--------|------------|
| Webhook Handler | 2-3 horas | 🟡 Media |
| Get Subscriptions API | 1 hora | 🟢 Fácil |
| Cancel Subscription API | 30 min | 🟢 Fácil |
| Portal URL API | 30 min | 🟢 Fácil |
| Event listeners | 1 hora | 🟢 Fácil |
| Middleware | 1-2 horas | 🟡 Media |
| Tests | 2-3 horas | 🟡 Media |

**TOTAL:** 8-12 horas de desarrollo

---

## 🎯 PLAN DE ACCIÓN (Cuando Paddle esté activo):

### Fase 1: Crítico (Día 1)
1. ✅ Implementar Webhook Handler
2. ✅ Probar con Paddle Webhook Simulator
3. ✅ Verificar que se guarden suscripciones en DB

### Fase 2: Importante (Día 2)
1. ✅ Implementar GET subscriptions
2. ✅ Implementar DELETE subscription
3. ✅ Probar flujo completo de suscripción

### Fase 3: Nice to have (Día 3)
1. ✅ Mejorar error handling
2. ✅ Agregar event listeners
3. ✅ Crear middleware de verificación

### Fase 4: Testing (Día 4)
1. ✅ Testing manual con tarjetas de prueba
2. ✅ Testing de webhooks
3. ✅ Testing de cancelaciones

---

## 🔗 RECURSOS:

- Paddle Webhooks: https://developer.paddle.com/webhooks/overview
- Paddle Node SDK: https://github.com/PaddleHQ/paddle-node-sdk
- Webhook Signature Verification: https://developer.paddle.com/webhooks/signature-verification
- Test Webhook Events: https://developer.paddle.com/webhooks/test-webhooks

---

## ✅ CHECKLIST FINAL:

- [ ] Paddle Support aprobó mi cuenta
- [ ] Webhook handler implementado
- [ ] Webhook URL configurada en Paddle dashboard
- [ ] API endpoints de billing creados
- [ ] Probado flujo completo en sandbox
- [ ] Verificado que webhooks llegan correctamente
- [ ] Probado cancelación de suscripción
- [ ] Migrado a producción
- [ ] Primera suscripción real completada 🎉
