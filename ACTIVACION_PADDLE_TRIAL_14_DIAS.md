# 🚀 ACTIVACIÓN DE PADDLE CON TRIAL DE 14 DÍAS

## 📊 ESTADO ACTUAL DEL SISTEMA

### ✅ LO QUE YA ESTÁ IMPLEMENTADO

1. **Integración de Paddle Completa (85%)**
   - ✅ SDK de Paddle instalado y configurado
   - ✅ Webhook handlers para suscripciones
   - ✅ API de checkout funcional
   - ✅ Modelo `PaymentHistory` en base de datos
   - ✅ Campo `trialEndsAt` en modelo `Business`
   - ✅ Webhooks procesan `trial_dates` correctamente

2. **Sistema de Suscripciones**
   - ✅ Estado de suscripción se guarda en `Business.subscriptionStatus`
   - ✅ Webhook `subscription.created` actualiza `trialEndsAt`
   - ✅ Webhook `subscription.updated` actualiza `trialEndsAt`
   - ✅ Webhook `subscription.canceled` marca como cancelado
   - ✅ Webhook `transaction.completed` registra pagos

3. **Frontend**
   - ✅ Página `/pricing` con botón de suscripción
   - ✅ Hook `usePaddle` para crear checkouts
   - ✅ Hook `usePaddleSubscriptions` para listar suscripciones
   - ✅ Redirección a Paddle Checkout funcional

---

## ⚠️ LO QUE FALTA PARA ACTIVACIÓN COMPLETA

### 🔴 CRÍTICO (Necesario para funcionar)

#### 1. **Sistema de Restricciones por Trial**

**PROBLEMA:** El sistema NO verifica si el trial expiró ni bloquea acceso.

**Archivos a crear/modificar:**

**A) Crear función de verificación de acceso**
```typescript
// src/lib/subscription-control.ts

import { prisma } from '@/lib/prisma';

export interface SubscriptionAccess {
  hasAccess: boolean;
  status: 'active' | 'trial' | 'expired' | 'canceled' | 'none';
  daysRemaining: number | null;
  needsPayment: boolean;
  message: string;
}

/**
 * Verifica si un business tiene acceso activo
 * - Suscripción activa pagada
 * - Trial de 14 días no expirado
 */
export async function checkBusinessAccess(businessId: string): Promise<SubscriptionAccess> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      subscriptionStatus: true,
      subscriptionId: true,
      trialEndsAt: true,
      createdAt: true,
    },
  });

  if (!business) {
    return {
      hasAccess: false,
      status: 'none',
      daysRemaining: null,
      needsPayment: true,
      message: 'Business no encontrado',
    };
  }

  const now = new Date();

  // 1. Verificar suscripción activa y pagada
  if (business.subscriptionStatus === 'active' && business.subscriptionId) {
    return {
      hasAccess: true,
      status: 'active',
      daysRemaining: null,
      needsPayment: false,
      message: 'Suscripción activa',
    };
  }

  // 2. Verificar trial de 14 días
  let trialEnd: Date;
  
  if (business.trialEndsAt) {
    // Si tiene trialEndsAt configurado (desde Paddle o manual)
    trialEnd = business.trialEndsAt;
  } else {
    // Si no tiene, calcular 14 días desde creación
    trialEnd = new Date(business.createdAt);
    trialEnd.setDate(trialEnd.getDate() + 14);
  }

  const isTrialActive = trialEnd > now;
  const daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (isTrialActive) {
    return {
      hasAccess: true,
      status: 'trial',
      daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
      needsPayment: daysRemaining <= 3, // Mostrar aviso los últimos 3 días
      message: `Trial activo: ${daysRemaining} días restantes`,
    };
  }

  // 3. Trial expirado y sin suscripción
  return {
    hasAccess: false,
    status: 'expired',
    daysRemaining: 0,
    needsPayment: true,
    message: 'Trial expirado. Suscríbete para continuar.',
  };
}
```

**B) Crear middleware de protección**
```typescript
// src/middleware/subscription-guard.ts

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { checkBusinessAccess } from '@/lib/subscription-control';

/**
 * Middleware para proteger rutas que requieren suscripción activa
 * Solo bloquea si el trial expiró
 */
export async function subscriptionGuard(request: NextRequest) {
  const session = await getToken({ req: request });

  if (!session?.user?.businessId) {
    return NextResponse.next(); // Sin sesión, otros middlewares manejan
  }

  // Rutas que NO requieren suscripción (siempre accesibles)
  const publicRoutes = [
    '/pricing',
    '/billing',
    '/login',
    '/register',
    '/api/auth',
    '/api/webhooks/paddle', // Webhooks siempre deben funcionar
  ];

  const isPublicRoute = publicRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Verificar acceso
  const access = await checkBusinessAccess(session.user.businessId);

  // Si no tiene acceso, redirigir a pricing
  if (!access.hasAccess) {
    const url = new URL('/pricing', request.url);
    url.searchParams.set('reason', 'trial_expired');
    url.searchParams.set('message', encodeURIComponent(access.message));
    
    console.log('🚫 ACCESO DENEGADO:', {
      businessId: session.user.businessId,
      status: access.status,
      reason: access.message,
    });

    return NextResponse.redirect(url);
  }

  // Tiene acceso, continuar
  return NextResponse.next();
}
```

**C) Integrar en middleware principal**
```typescript
// src/middleware.ts

import { subscriptionGuard } from './middleware/subscription-guard';

export async function middleware(request: NextRequest) {
  // ... otros middlewares ...

  // AGREGAR: Verificación de suscripción
  const subscriptionResponse = await subscriptionGuard(request);
  if (subscriptionResponse.status === 302) {
    return subscriptionResponse; // Redirigir si no tiene acceso
  }

  return NextResponse.next();
}
```

---

#### 2. **Banner de Aviso de Trial**

**Componente para mostrar días restantes:**

```tsx
// src/components/SubscriptionBanner.tsx

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Clock } from 'lucide-react';

export function SubscriptionBanner({ businessId }: { businessId: string }) {
  const [access, setAccess] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAccess() {
      try {
        const res = await fetch(`/api/subscription/check?businessId=${businessId}`);
        const data = await res.json();
        setAccess(data);
      } catch (error) {
        console.error('Error checking subscription:', error);
      } finally {
        setLoading(false);
      }
    }

    checkAccess();
  }, [businessId]);

  if (loading || !access) return null;

  // No mostrar nada si tiene suscripción activa
  if (access.status === 'active') return null;

  // Trial activo pero cerca de expirar (últimos 3 días)
  if (access.status === 'trial' && access.daysRemaining <= 3 && access.daysRemaining > 0) {
    return (
      <div className="bg-yellow-500/10 border-l-4 border-yellow-500 p-4 mb-4">
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-yellow-600" />
          <div className="flex-1">
            <h3 className="font-semibold text-yellow-900">
              Tu periodo de prueba termina en {access.daysRemaining} día{access.daysRemaining !== 1 ? 's' : ''}
            </h3>
            <p className="text-sm text-yellow-800 mt-1">
              Suscríbete ahora para continuar sin interrupciones.
            </p>
          </div>
          <Link
            href="/pricing"
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            Ver Planes
          </Link>
        </div>
      </div>
    );
  }

  // Trial expirado
  if (access.status === 'expired') {
    return (
      <div className="bg-red-500/10 border-l-4 border-red-500 p-4 mb-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-900">
              Tu periodo de prueba ha expirado
            </h3>
            <p className="text-sm text-red-800 mt-1">
              Suscríbete para continuar usando Lealta.
            </p>
          </div>
          <Link
            href="/pricing"
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Suscribirse Ahora
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
```

**Agregar en layout principal:**
```tsx
// src/app/[businessId]/admin/layout.tsx

import { SubscriptionBanner } from '@/components/SubscriptionBanner';

export default function AdminLayout({ params }) {
  return (
    <div>
      <SubscriptionBanner businessId={params.businessId} />
      {/* Resto del layout */}
    </div>
  );
}
```

---

#### 3. **API Endpoint para Verificar Acceso**

```typescript
// src/app/api/subscription/check/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { checkBusinessAccess } from '@/lib/subscription-control';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId requerido' },
        { status: 400 }
      );
    }

    const access = await checkBusinessAccess(businessId);

    return NextResponse.json(access);

  } catch (error) {
    console.error('Error checking subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

#### 4. **Actualizar Creación de Business con Trial**

```typescript
// src/app/api/auth/register/route.ts (o donde crees businesses)

// Al crear un nuevo business
const newBusiness = await prisma.business.create({
  data: {
    // ... otros campos ...
    subscriptionStatus: 'trialing', // Estado inicial
    trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 días
  },
});
```

---

### 🟡 IMPORTANTE (Mejorar experiencia)

#### 5. **Notificaciones por Email**

**Enviar emails automáticos:**
- Día 11: "Quedan 3 días de trial"
- Día 14: "Tu trial expiró hoy"
- Día 15: "Suscríbete para reactivar"

```typescript
// src/lib/notifications/trial-notifications.ts

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendTrialExpiringEmail(
  userEmail: string,
  businessName: string,
  daysRemaining: number
) {
  await resend.emails.send({
    from: 'Lealta <no-reply@lealta.app>',
    to: userEmail,
    subject: `Tu periodo de prueba termina en ${daysRemaining} días`,
    html: `
      <h2>Hola desde Lealta</h2>
      <p>Tu periodo de prueba de <strong>${businessName}</strong> termina en <strong>${daysRemaining} días</strong>.</p>
      <p>Para continuar sin interrupciones:</p>
      <a href="https://lealta.app/pricing" style="background: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
        Ver Planes y Precios
      </a>
      <p>Gracias por usar Lealta 🚀</p>
    `,
  });
}
```

---

#### 6. **Cron Job para Verificar Trials**

```typescript
// src/app/api/cron/check-trials/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendTrialExpiringEmail } from '@/lib/notifications/trial-notifications';

export async function GET(request: NextRequest) {
  // Verificar autorización (solo Vercel Cron)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  // Buscar trials que expiran en 3 días
  const expiringTrials = await prisma.business.findMany({
    where: {
      trialEndsAt: {
        gte: now,
        lte: threeDaysFromNow,
      },
      subscriptionStatus: {
        not: 'active', // Solo los que no tienen suscripción activa
      },
    },
    include: {
      User: {
        select: { email: true },
      },
    },
  });

  console.log(`📧 Enviando notificaciones a ${expiringTrials.length} businesses`);

  for (const business of expiringTrials) {
    const daysRemaining = Math.ceil(
      (business.trialEndsAt!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    for (const user of business.User) {
      await sendTrialExpiringEmail(user.email, business.name, daysRemaining);
    }
  }

  return NextResponse.json({
    success: true,
    notified: expiringTrials.length,
  });
}
```

**Configurar en `vercel.json`:**
```json
{
  "crons": [
    {
      "path": "/api/cron/check-trials",
      "schedule": "0 9 * * *"
    }
  ]
}
```

---

## 📋 CHECKLIST DE ACTIVACIÓN

### Antes de Producción

- [ ] **Crear función `checkBusinessAccess()`** en `src/lib/subscription-control.ts`
- [ ] **Crear middleware `subscriptionGuard()`** en `src/middleware/subscription-guard.ts`
- [ ] **Integrar `subscriptionGuard` en `middleware.ts`**
- [ ] **Crear componente `SubscriptionBanner`** en `src/components/SubscriptionBanner.tsx`
- [ ] **Crear API `/api/subscription/check`** en `src/app/api/subscription/check/route.ts`
- [ ] **Agregar banner en layouts** de admin/staff
- [ ] **Actualizar registro** para asignar `trialEndsAt` automático
- [ ] **Probar flujo completo:**
  - [ ] Crear business nuevo → debe tener 14 días de trial
  - [ ] Modificar `trialEndsAt` a ayer → debe bloquear acceso
  - [ ] Suscribirse con Paddle → debe desbloquear inmediatamente
- [ ] **Configurar Resend** para emails (opcional)
- [ ] **Configurar cron job** en Vercel (opcional)

### Testing en Sandbox

1. **Crear business de prueba**
   ```sql
   UPDATE Business 
   SET trialEndsAt = NOW() + INTERVAL '2 days',
       subscriptionStatus = 'trialing'
   WHERE id = 'test_business_id';
   ```

2. **Verificar banner aparece** (últimos 3 días)

3. **Modificar trial a ayer**
   ```sql
   UPDATE Business 
   SET trialEndsAt = NOW() - INTERVAL '1 day'
   WHERE id = 'test_business_id';
   ```

4. **Verificar redirección a `/pricing`**

5. **Hacer checkout en Paddle Sandbox**

6. **Verificar acceso se restaura** después de pago

---

## 🎯 RESUMEN

**LO QUE TIENES:**
- ✅ Paddle integrado y funcionando
- ✅ Webhooks procesando suscripciones
- ✅ Campo `trialEndsAt` en base de datos
- ✅ Página de pricing funcional

**LO QUE FALTA:**
- ❌ Sistema de verificación de acceso
- ❌ Bloqueo cuando trial expira
- ❌ Banner de aviso
- ❌ Notificaciones por email (opcional)

**TIEMPO ESTIMADO:**
- Implementación básica: **4-6 horas**
- Con emails y cron: **8-10 horas**

**PRÓXIMOS PASOS:**
1. Crear los 5 archivos listados arriba
2. Probar en desarrollo
3. Hacer push y probar en producción
4. Monitorear primeras suscripciones

---

## 🚀 READY TO LAUNCH?

Cuando implementes todo esto:
- ✅ Nuevos usuarios tendrán 14 días gratis automáticamente
- ✅ Se les avisará los últimos 3 días
- ✅ Al expirar, se redirige a `/pricing`
- ✅ Al suscribirse, se desbloquea inmediatamente
- ✅ Pagos prematuros funcionan (pueden pagar antes de que expire)

**¿Necesitas que implemente alguno de estos archivos ahora?** 🔧
