# 🎨 PADDLE - SNIPPETS Y MEJORAS OPCIONALES

Estos son snippets adicionales que puedes implementar después de que todo esté funcionando en producción.

---

## 🔍 1. VERIFICAR STATUS DE SUSCRIPCIÓN

Útil para mostrar en el dashboard del cliente si su suscripción está activa.

**Archivo:** `src/lib/utils/subscription-checker.ts`

```typescript
import { prisma } from '@/lib/prisma';

export type SubscriptionStatus = 
  | 'active' 
  | 'past_due' 
  | 'canceled' 
  | 'paused' 
  | 'none';

export interface SubscriptionInfo {
  status: SubscriptionStatus;
  planName: string;
  nextBillDate: Date | null;
  trialEndsAt: Date | null;
  daysUntilExpiry: number | null;
  isActive: boolean;
  canAccess: boolean;
}

/**
 * Verifica el status de suscripción de un business
 */
export async function checkSubscriptionStatus(
  businessId: string
): Promise<SubscriptionInfo> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      subscriptionStatus: true,
      subscriptionEndDate: true,
      trialEndsAt: true,
      planId: true,
    },
  });

  if (!business) {
    throw new Error('Business no encontrado');
  }

  const now = new Date();
  const status = (business.subscriptionStatus as SubscriptionStatus) || 'none';
  
  // Calcular días hasta expiración
  let daysUntilExpiry = null;
  if (business.subscriptionEndDate) {
    const diffTime = business.subscriptionEndDate.getTime() - now.getTime();
    daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Determinar si tiene acceso
  const canAccess = status === 'active' || (
    business.trialEndsAt && business.trialEndsAt > now
  );

  return {
    status,
    planName: getPlanName(business.planId),
    nextBillDate: business.subscriptionEndDate,
    trialEndsAt: business.trialEndsAt,
    daysUntilExpiry,
    isActive: status === 'active',
    canAccess,
  };
}

function getPlanName(planId: string | null): string {
  if (!planId) return 'Sin Plan';
  if (planId.includes('enterprise')) return 'Enterprise';
  if (planId.includes('professional')) return 'Professional';
  if (planId.includes('starter')) return 'Starter';
  return 'Plan Personalizado';
}
```

**Uso en componente:**

```tsx
import { checkSubscriptionStatus } from '@/lib/utils/subscription-checker';

export default async function DashboardPage({ params }: { params: { businessId: string } }) {
  const subscription = await checkSubscriptionStatus(params.businessId);

  return (
    <div>
      {!subscription.canAccess && (
        <Alert variant="destructive">
          <AlertTitle>Suscripción Inactiva</AlertTitle>
          <AlertDescription>
            Tu suscripción ha expirado. Por favor actualiza tu plan.
          </AlertDescription>
        </Alert>
      )}
      
      {subscription.isActive && (
        <div className="bg-green-100 p-4 rounded">
          <p>Plan {subscription.planName} activo</p>
          <p>Próxima factura: {subscription.nextBillDate?.toLocaleDateString()}</p>
        </div>
      )}
    </div>
  );
}
```

---

## 💳 2. COMPONENTE DE BILLING DASHBOARD

Muestra información de facturación al cliente.

**Archivo:** `src/components/billing/BillingDashboard.tsx`

```tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Download, AlertCircle } from 'lucide-react';

interface BillingDashboardProps {
  businessId: string;
}

export default function BillingDashboard({ businessId }: BillingDashboardProps) {
  const [subscription, setSubscription] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBillingData();
  }, [businessId]);

  const loadBillingData = async () => {
    try {
      // Cargar info de suscripción
      const subRes = await fetch(`/api/billing/subscriptions?businessId=${businessId}`);
      const subData = await subRes.json();
      
      if (subData.success && subData.subscriptions.length > 0) {
        setSubscription(subData.subscriptions[0]);
      }

      // Cargar historial de pagos
      const payRes = await fetch(`/api/billing/history?businessId=${businessId}`);
      const payData = await payRes.json();
      
      if (payData.success) {
        setPayments(payData.payments);
      }
    } catch (error) {
      console.error('Error cargando datos de billing:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Cargando información de facturación...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Suscripción Actual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Suscripción Actual
          </CardTitle>
        </CardHeader>
        <CardContent>
          {subscription ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-lg">Plan Enterprise</p>
                  <p className="text-sm text-gray-500">$250 USD / mes</p>
                </div>
                <Badge variant={subscription.status === 'active' ? 'default' : 'destructive'}>
                  {subscription.status === 'active' ? 'Activa' : subscription.status}
                </Badge>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm">
                  <span className="text-gray-500">Próxima factura:</span>{' '}
                  <span className="font-medium">
                    {new Date(subscription.nextBillDate).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </p>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => window.open(subscription.updateUrl, '_blank')}
                >
                  Actualizar Método de Pago
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    if (confirm('¿Estás seguro de que quieres cancelar tu suscripción?')) {
                      window.open(subscription.cancelUrl, '_blank');
                    }
                  }}
                >
                  Cancelar Suscripción
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">No tienes una suscripción activa</p>
              <Button onClick={() => window.location.href = '/pricing'}>
                Ver Planes
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historial de Pagos */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Pagos</CardTitle>
          <CardDescription>Últimas transacciones y facturas</CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length > 0 ? (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div 
                  key={payment.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      ${payment.amount.toFixed(2)} {payment.currency}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(payment.createdAt).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'}>
                      {payment.status === 'completed' ? 'Completado' : payment.status}
                    </Badge>
                    {payment.status === 'completed' && (
                      <Button size="sm" variant="ghost">
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">
              No hay pagos registrados
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 📊 3. API PARA HISTORIAL DE PAGOS

**Archivo:** `src/app/api/billing/history/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: 'Business ID requerido' },
        { status: 400 }
      );
    }

    // Obtener historial de pagos
    const payments = await prisma.paymentHistory.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      take: 50, // Últimos 50 pagos
    });

    return NextResponse.json({
      success: true,
      payments: payments.map(p => ({
        id: p.id,
        transactionId: p.transactionId,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        paymentMethod: p.paymentMethod,
        createdAt: p.createdAt,
      })),
    });

  } catch (error) {
    console.error('❌ Error obteniendo historial:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
```

---

## 🔔 4. SISTEMA DE NOTIFICACIONES

Envía emails automáticos cuando ocurren eventos importantes.

**Archivo:** `src/lib/notifications/billing-notifications.ts`

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Notificar pago exitoso
 */
export async function notifyPaymentSuccess(
  customerEmail: string,
  amount: number,
  currency: string
) {
  try {
    await resend.emails.send({
      from: 'Lealta <no-reply@lealta.app>',
      to: customerEmail,
      subject: '¡Pago Recibido Exitosamente!',
      html: `
        <h2>¡Gracias por tu pago!</h2>
        <p>Hemos recibido tu pago de <strong>${amount} ${currency}</strong>.</p>
        <p>Tu suscripción está activa y puedes seguir usando todos los servicios.</p>
        <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
      `,
    });
    
    console.log('✅ Email de confirmación enviado a:', customerEmail);
  } catch (error) {
    console.error('❌ Error enviando email:', error);
  }
}

/**
 * Notificar pago fallido
 */
export async function notifyPaymentFailed(
  customerEmail: string,
  retryDate?: Date
) {
  try {
    await resend.emails.send({
      from: 'Lealta <no-reply@lealta.app>',
      to: customerEmail,
      subject: 'Problema con tu Pago',
      html: `
        <h2>No pudimos procesar tu pago</h2>
        <p>Hubo un problema al procesar tu pago más reciente.</p>
        <p>Por favor, actualiza tu método de pago para evitar la interrupción del servicio.</p>
        ${retryDate ? `<p>Intentaremos nuevamente el: ${retryDate.toLocaleDateString()}</p>` : ''}
        <a href="https://tudominio.com/billing" style="background: #0070f3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Actualizar Método de Pago
        </a>
      `,
    });
    
    console.log('✅ Email de pago fallido enviado a:', customerEmail);
  } catch (error) {
    console.error('❌ Error enviando email:', error);
  }
}

/**
 * Notificar fin de trial
 */
export async function notifyTrialEnding(
  customerEmail: string,
  daysLeft: number
) {
  try {
    await resend.emails.send({
      from: 'Lealta <no-reply@lealta.app>',
      to: customerEmail,
      subject: `Tu periodo de prueba termina en ${daysLeft} días`,
      html: `
        <h2>Tu trial está por terminar</h2>
        <p>Te quedan <strong>${daysLeft} días</strong> de tu periodo de prueba gratuito.</p>
        <p>Para seguir usando Lealta sin interrupciones, configura tu método de pago.</p>
        <a href="https://tudominio.com/pricing" style="background: #0070f3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Activar Suscripción
        </a>
      `,
    });
    
    console.log('✅ Email de trial ending enviado a:', customerEmail);
  } catch (error) {
    console.error('❌ Error enviando email:', error);
  }
}

/**
 * Notificar al admin sobre evento importante
 */
export async function notifyAdmin(
  subject: string,
  message: string,
  data?: any
) {
  try {
    await resend.emails.send({
      from: 'Lealta System <system@lealta.app>',
      to: 'admin@lealta.app', // Tu email
      subject: `[LEALTA ADMIN] ${subject}`,
      html: `
        <h2>${subject}</h2>
        <p>${message}</p>
        ${data ? `<pre>${JSON.stringify(data, null, 2)}</pre>` : ''}
      `,
    });
    
    console.log('✅ Notificación enviada al admin');
  } catch (error) {
    console.error('❌ Error enviando notificación al admin:', error);
  }
}
```

**Uso en webhooks:**

```typescript
// En handlePaymentFailed
import { notifyPaymentFailed, notifyAdmin } from '@/lib/notifications/billing-notifications';

async function handlePaymentFailed(transaction: any) {
  // ...código existente...
  
  // Notificar al cliente
  await notifyPaymentFailed(transaction.customer.email);
  
  // Notificar al admin
  await notifyAdmin(
    'Pago Fallido',
    `Pago fallido para business ${businessId}`,
    { transactionId: transaction.id, amount: transaction.details.totals.total }
  );
}
```

---

## 📈 5. ANALYTICS DE FACTURACIÓN

Track métricas importantes.

**Archivo:** `src/lib/analytics/billing-analytics.ts`

```typescript
import { prisma } from '@/lib/prisma';

export interface BillingMetrics {
  mrr: number; // Monthly Recurring Revenue
  arr: number; // Annual Recurring Revenue
  activeSubscriptions: number;
  churnRate: number;
  totalRevenue: number;
  avgRevenuePerUser: number;
}

/**
 * Calcular métricas de facturación
 */
export async function calculateBillingMetrics(): Promise<BillingMetrics> {
  // Suscripciones activas
  const activeSubscriptions = await prisma.business.count({
    where: { subscriptionStatus: 'active' }
  });

  // MRR (asumiendo $250/mes por business)
  const mrr = activeSubscriptions * 250;
  const arr = mrr * 12;

  // Revenue total de pagos completados
  const payments = await prisma.paymentHistory.aggregate({
    where: { status: 'completed' },
    _sum: { amount: true },
  });
  const totalRevenue = payments._sum.amount || 0;

  // ARPU (Average Revenue Per User)
  const avgRevenuePerUser = activeSubscriptions > 0 
    ? totalRevenue / activeSubscriptions 
    : 0;

  // Churn rate (último mes)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const canceledLastMonth = await prisma.business.count({
    where: {
      subscriptionStatus: 'canceled',
      subscriptionEndDate: {
        gte: thirtyDaysAgo,
      },
    },
  });

  const churnRate = activeSubscriptions > 0 
    ? (canceledLastMonth / activeSubscriptions) * 100 
    : 0;

  return {
    mrr,
    arr,
    activeSubscriptions,
    churnRate,
    totalRevenue,
    avgRevenuePerUser,
  };
}
```

---

## 🛡️ 6. MIDDLEWARE PARA VERIFICAR SUSCRIPCIÓN

Protege rutas premium automáticamente.

**Archivo:** `src/middleware/subscription-guard.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';
import { checkSubscriptionStatus } from '@/lib/utils/subscription-checker';

/**
 * Middleware para proteger rutas que requieren suscripción activa
 */
export async function requireActiveSubscription(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.businessId) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const subscription = await checkSubscriptionStatus(session.user.businessId);

  if (!subscription.canAccess) {
    return NextResponse.redirect(new URL('/pricing', request.url));
  }

  return NextResponse.next();
}
```

**Uso en `middleware.ts`:**

```typescript
import { NextRequest } from 'next/server';
import { requireActiveSubscription } from '@/middleware/subscription-guard';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Proteger rutas premium
  const premiumRoutes = [
    '/dashboard/analytics',
    '/dashboard/reports',
    '/dashboard/advanced',
  ];

  if (premiumRoutes.some(route => pathname.startsWith(route))) {
    return requireActiveSubscription(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
```

---

## 🎯 7. CRON JOB PARA TRIALS EXPIRANDO

Notifica automáticamente cuando un trial está por expirar.

**Archivo:** `src/app/api/cron/check-trials/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { notifyTrialEnding } from '@/lib/notifications/billing-notifications';

/**
 * Cron job para verificar trials próximos a expirar
 * Configurar en Vercel Cron o similar para ejecutar diariamente
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar auth (solo permitir desde cron o con API key)
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
          not: 'active',
        },
      },
      include: {
        User: {
          select: {
            email: true,
          },
        },
      },
    });

    console.log(`🔍 Encontrados ${expiringTrials.length} trials expirando`);

    // Notificar a cada uno
    for (const business of expiringTrials) {
      const daysLeft = Math.ceil(
        (business.trialEndsAt!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      for (const user of business.User) {
        await notifyTrialEnding(user.email, daysLeft);
      }
    }

    return NextResponse.json({
      success: true,
      notified: expiringTrials.length,
    });

  } catch (error) {
    console.error('❌ Error en cron job:', error);
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    );
  }
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

## 💡 BONUS: MEJORES PRÁCTICAS

### 1. **Idempotencia en Webhooks**
```typescript
// Guardar eventId para evitar procesamiento duplicado
const existingEvent = await prisma.webhookEvent.findUnique({
  where: { eventId: event.id }
});

if (existingEvent) {
  console.log('⚠️ Evento ya procesado:', event.id);
  return NextResponse.json({ success: true }); // 200 OK
}

// Procesar y guardar
await prisma.webhookEvent.create({
  data: { eventId: event.id, processed: true }
});
```

### 2. **Retry Logic con Exponential Backoff**
```typescript
async function retryWebhookProcessing(fn: () => Promise<void>, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await fn();
      return; // Éxito
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

### 3. **Logging Estructurado**
```typescript
const log = {
  timestamp: new Date().toISOString(),
  service: 'paddle-webhook',
  event: event.event_type,
  businessId: event.custom_data?.businessId,
  success: true,
};

console.log(JSON.stringify(log));
```

---

Estos snippets te darán un sistema de billing mucho más robusto y profesional. Impleméntalos gradualmente después de que todo esté funcionando en producción. 🚀
