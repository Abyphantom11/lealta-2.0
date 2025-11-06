# 🔧 FIXES CRÍTICOS PARA PADDLE - IMPLEMENTAR ANTES DE PRODUCCIÓN

## 🚨 PRIORIDAD ALTA

### 1. Agregar Modelo PaymentHistory

**Archivo:** `prisma/schema.prisma`

Agregar después del modelo `Business`:

```prisma
model PaymentHistory {
  id              String   @id @default(cuid())
  businessId      String
  transactionId   String   @unique
  subscriptionId  String?
  amount          Float
  currency        String   @default("USD")
  status          String   // completed, pending, failed, refunded
  paymentMethod   String?
  customerId      String?
  paddleData      Json?    // Guardar data completa de Paddle
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  business        Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
  
  @@index([businessId])
  @@index([transactionId])
  @@index([subscriptionId])
  @@index([createdAt])
  @@map("PaymentHistory")
}
```

Luego agregar la relación en el modelo `Business`:

```prisma
model Business {
  // ...campos existentes...
  PaymentHistory    PaymentHistory[]
  // ...resto de relaciones...
}
```

**Comandos a ejecutar:**
```bash
npx prisma format
npx prisma generate
npx prisma migrate dev --name add-payment-history
```

---

### 2. Actualizar Webhook para Guardar Transacciones

**Archivo:** `src/app/api/webhooks/paddle/route.ts`

Reemplazar la función `handleTransactionCompleted`:

```typescript
/**
 * Manejar transacción completada
 */
async function handleTransactionCompleted(transaction: any) {
  try {
    console.log('💰 Transacción completada:', transaction.id);

    const businessId = transaction.custom_data?.businessId;
    
    if (!businessId) {
      console.warn('⚠️ Transacción sin businessId:', transaction.id);
      return;
    }

    // Guardar en historial de pagos
    await prisma.paymentHistory.create({
      data: {
        businessId: businessId,
        transactionId: transaction.id,
        subscriptionId: transaction.subscription_id || null,
        amount: transaction.details.totals.total / 100, // Convertir de centavos
        currency: transaction.currency_code || 'USD',
        status: 'completed',
        paymentMethod: transaction.payments?.[0]?.method_details?.type || 'unknown',
        customerId: transaction.customer_id || null,
        paddleData: transaction, // Guardar data completa para auditoría
      },
    });

    console.log('✅ Transacción guardada en historial:', transaction.id);

    // Opcional: Enviar email de confirmación, actualizar analytics, etc.

  } catch (error) {
    console.error('❌ Error manejando transacción completada:', error);
    // NO lanzar error - retornar 200 a Paddle para que no reintente
  }
}
```

---

### 3. Validar Variables de Entorno

**Archivo:** `src/lib/paddle.ts`

Reemplazar las primeras líneas (después de imports):

```typescript
import { Environment, Paddle } from '@paddle/paddle-node-sdk';

// ===== VALIDACIÓN DE VARIABLES DE ENTORNO =====
const requiredEnvVars = {
  PADDLE_API_KEY: process.env.PADDLE_API_KEY,
  PADDLE_CLIENT_TOKEN: process.env.PADDLE_CLIENT_TOKEN,
  PADDLE_WEBHOOK_SECRET: process.env.PADDLE_WEBHOOK_SECRET,
  NEXT_PUBLIC_PADDLE_ENVIRONMENT: process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT,
};

// Validar en producción
if (process.env.NODE_ENV === 'production') {
  Object.entries(requiredEnvVars).forEach(([key, value]) => {
    if (!value) {
      console.error(`❌ Variable de entorno requerida faltante: ${key}`);
      throw new Error(`Missing required environment variable: ${key}`);
    }
  });
}

// Validar en desarrollo (warnings)
if (process.env.NODE_ENV === 'development') {
  Object.entries(requiredEnvVars).forEach(([key, value]) => {
    if (!value) {
      console.warn(`⚠️ Variable de entorno faltante: ${key} - usando valor por defecto`);
    }
  });
}

// Configuración del entorno
const paddleEnvironment = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT === 'production' 
  ? Environment.production 
  : Environment.sandbox;

// Cliente de Paddle (Backend) - ahora con validación
export const paddleClient = new Paddle(
  process.env.PADDLE_API_KEY || 'sandbox_default_key',
  {
    environment: paddleEnvironment,
  }
);
```

---

### 4. Actualizar Handler de Suscripciones con Trial

**Archivo:** `src/app/api/webhooks/paddle/route.ts`

Actualizar la función `handleSubscriptionCreated`:

```typescript
/**
 * Manejar creación de suscripción
 */
async function handleSubscriptionCreated(subscription: any) {
  try {
    console.log('✅ Nueva suscripción creada:', subscription.id);

    const businessId = subscription.custom_data?.businessId;
    if (!businessId) {
      console.error('❌ No se encontró businessId en custom_data');
      return;
    }

    // Actualizar el business en la base de datos
    await prisma.business.update({
      where: { id: businessId },
      data: {
        subscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        planId: subscription.items[0]?.price?.id,
        customerId: subscription.customer_id,
        subscriptionStartDate: new Date(subscription.started_at),
        subscriptionEndDate: subscription.next_billed_at 
          ? new Date(subscription.next_billed_at) 
          : null,
        // AGREGAR MANEJO DE TRIAL
        trialEndsAt: subscription.trial_dates?.ends_at 
          ? new Date(subscription.trial_dates.ends_at) 
          : null,
      }
    });

    console.log('✅ Business actualizado con nueva suscripción');

  } catch (error) {
    console.error('❌ Error manejando suscripción creada:', error);
  }
}
```

Y también en `handleSubscriptionUpdated`:

```typescript
/**
 * Manejar actualización de suscripción
 */
async function handleSubscriptionUpdated(subscription: any) {
  try {
    console.log('🔄 Suscripción actualizada:', subscription.id);

    const business = await prisma.business.findFirst({
      where: { subscriptionId: subscription.id }
    });

    if (!business) {
      console.error('❌ No se encontró business para la suscripción:', subscription.id);
      return;
    }

    await prisma.business.update({
      where: { id: business.id },
      data: {
        subscriptionStatus: subscription.status,
        planId: subscription.items[0]?.price?.id,
        subscriptionEndDate: subscription.next_billed_at 
          ? new Date(subscription.next_billed_at) 
          : null,
        // ACTUALIZAR TRIAL SI CAMBIÓ
        trialEndsAt: subscription.trial_dates?.ends_at 
          ? new Date(subscription.trial_dates.ends_at) 
          : null,
      }
    });

    console.log('✅ Suscripción actualizada en base de datos');

  } catch (error) {
    console.error('❌ Error manejando suscripción actualizada:', error);
  }
}
```

---

### 5. Mejorar Manejo de Errores en Checkout API

**Archivo:** `src/app/api/billing/checkout/route.ts`

Reemplazar el bloque catch al final:

```typescript
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
```

---

### 6. Eliminar Código Muerto

**Archivo:** `src/lib/paddle.ts`

Eliminar o actualizar la función `verifyWebhook` en `paddleUtils`:

```typescript
export const paddleUtils = {
  /**
   * Formatea un precio de Paddle a formato local
   */
  formatPrice: (amount: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: currency
    }).format(amount / 100);
  },

  /**
   * Convierte precio local a formato Paddle (centavos)
   */
  toPaddleAmount: (amount: number): number => {
    return Math.round(amount * 100);
  },

  // NOTA: La verificación real de webhooks está en 
  // src/app/api/webhooks/paddle/route.ts - función verifyPaddleWebhook()
  // Esta función está deprecada y no debe usarse
};
```

---

### 7. Agregar Handlers para Eventos Adicionales

**Archivo:** `src/app/api/webhooks/paddle/route.ts`

Agregar al switch statement:

```typescript
    // Procesar según el tipo de evento
    switch (event.event_type) {
      case 'subscription.created':
        await handleSubscriptionCreated(event.data);
        break;
        
      case 'subscription.updated':
        await handleSubscriptionUpdated(event.data);
        break;
        
      case 'subscription.canceled':
        await handleSubscriptionCanceled(event.data);
        break;
        
      case 'transaction.completed':
        await handleTransactionCompleted(event.data);
        break;

      // NUEVOS HANDLERS
      case 'transaction.payment_failed':
        await handlePaymentFailed(event.data);
        break;
        
      case 'subscription.past_due':
        await handleSubscriptionPastDue(event.data);
        break;
        
      case 'subscription.paused':
        await handleSubscriptionPaused(event.data);
        break;
        
      default:
        console.log('⚠️ Tipo de evento no manejado:', event.event_type);
        // Log para tracking de eventos no implementados
        console.log('Event data:', JSON.stringify(event, null, 2));
    }
```

Y agregar las nuevas funciones al final del archivo:

```typescript
/**
 * Manejar pago fallido
 */
async function handlePaymentFailed(transaction: any) {
  try {
    console.log('❌ Pago fallido:', transaction.id);

    const businessId = transaction.custom_data?.businessId;
    if (!businessId) return;

    // Guardar en historial con status failed
    await prisma.paymentHistory.create({
      data: {
        businessId: businessId,
        transactionId: transaction.id,
        subscriptionId: transaction.subscription_id || null,
        amount: transaction.details?.totals?.total / 100 || 0,
        currency: transaction.currency_code || 'USD',
        status: 'failed',
        paymentMethod: transaction.payments?.[0]?.method_details?.type || 'unknown',
        customerId: transaction.customer_id || null,
        paddleData: transaction,
      },
    });

    // TODO: Enviar notificación al cliente y al admin
    console.log('⚠️ ACCIÓN REQUERIDA: Notificar a business sobre pago fallido');

  } catch (error) {
    console.error('❌ Error manejando pago fallido:', error);
  }
}

/**
 * Manejar suscripción vencida (past_due)
 */
async function handleSubscriptionPastDue(subscription: any) {
  try {
    console.log('⚠️ Suscripción vencida:', subscription.id);

    const business = await prisma.business.findFirst({
      where: { subscriptionId: subscription.id }
    });

    if (!business) {
      console.error('❌ No se encontró business para la suscripción:', subscription.id);
      return;
    }

    // Actualizar status a past_due
    await prisma.business.update({
      where: { id: business.id },
      data: {
        subscriptionStatus: 'past_due',
      }
    });

    // TODO: Notificar al cliente que su pago está vencido
    console.log('⚠️ ACCIÓN REQUERIDA: Notificar vencimiento a business:', business.id);

  } catch (error) {
    console.error('❌ Error manejando suscripción past_due:', error);
  }
}

/**
 * Manejar suscripción pausada
 */
async function handleSubscriptionPaused(subscription: any) {
  try {
    console.log('⏸️ Suscripción pausada:', subscription.id);

    const business = await prisma.business.findFirst({
      where: { subscriptionId: subscription.id }
    });

    if (!business) {
      console.error('❌ No se encontró business para la suscripción:', subscription.id);
      return;
    }

    await prisma.business.update({
      where: { id: business.id },
      data: {
        subscriptionStatus: 'paused',
      }
    });

    console.log('✅ Suscripción marcada como pausada');

  } catch (error) {
    console.error('❌ Error manejando suscripción pausada:', error);
  }
}
```

---

## 📋 ORDEN DE IMPLEMENTACIÓN

1. **Primero:** Modelo PaymentHistory (requiere migración de BD)
2. **Segundo:** Validación de variables de entorno
3. **Tercero:** Actualizar webhooks (transaction, trial, nuevos eventos)
4. **Cuarto:** Mejorar manejo de errores en checkout
5. **Quinto:** Limpiar código muerto

---

## ✅ TESTING DESPUÉS DE IMPLEMENTAR

```bash
# 1. Aplicar migración
npx prisma migrate dev --name add-payment-history

# 2. Generar cliente
npx prisma generate

# 3. Reiniciar servidor
npm run dev

# 4. Probar en sandbox:
# - Crear checkout
# - Simular pago exitoso
# - Verificar que se guarde en PaymentHistory
# - Simular pago fallido
# - Verificar que se actualice el status
```

---

## 🚨 IMPORTANTE

Después de implementar estos fixes:
- ✅ Tu sistema estará production-ready
- ✅ Tendrás auditoría completa de transacciones
- ✅ Mejor manejo de errores
- ✅ Más eventos de Paddle cubiertos
- ✅ Código más limpio y mantenible

**Tiempo estimado de implementación:** 2-3 horas

¿Necesitas ayuda con alguno de estos fixes en particular?
