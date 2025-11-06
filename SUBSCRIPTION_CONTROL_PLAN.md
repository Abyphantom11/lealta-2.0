# 🔒 SISTEMA DE CONTROL DE SUSCRIPCIONES - GUÍA DE IMPLEMENTACIÓN

**Fecha:** 6 de noviembre, 2025  
**Estado:** Plan de implementación para control de acceso por suscripción

---

## 📋 ESTADO ACTUAL

### ✅ Lo que YA funciona:

1. **Cuentas sin suscripción:** ✅ Funcionan normalmente
2. **Sistema de pagos:** ✅ Paddle integrado y funcional
3. **Webhooks:** ✅ Reciben y procesan eventos de Paddle
4. **Base de datos:** ✅ Guarda suscripciones y pagos

### 🔓 Acceso actual:

**TODAS las cuentas tienen acceso completo** independientemente de:
- Tener o no suscripción
- Estado de pago
- Plan contratado

---

## 🎯 PLAN DE IMPLEMENTACIÓN: CONTROL POR SUSCRIPCIÓN

### FASE 1: Sistema de Verificación (Soft Launch) ⚠️

**Objetivo:** Detectar y registrar, pero NO bloquear

**Implementación:**

1. **Middleware de verificación de suscripción**
   - Verifica estado en cada request
   - Registra intentos de acceso sin suscripción
   - NO bloquea el acceso (solo logs)

2. **Banner informativo**
   - Muestra mensaje cuando la suscripción está vencida
   - "Tu suscripción ha expirado. Por favor renueva para continuar"
   - Link directo a `/pricing`

**Código ejemplo:**

```typescript
// src/middleware/subscription-check.ts
export function checkSubscriptionStatus(business: Business) {
  const hasActiveSubscription = 
    business.subscriptionStatus === 'active' &&
    business.subscriptionId;

  const isDemoAccount = business.planId === null; // Sin plan = demo

  return {
    hasAccess: true, // Por ahora SIEMPRE true
    status: hasActiveSubscription ? 'active' : 'inactive',
    shouldShowWarning: !hasActiveSubscription && !isDemoAccount,
    message: !hasActiveSubscription 
      ? 'Tu cuenta funciona en modo demo. Suscríbete para desbloquear todas las funciones.'
      : null
  };
}
```

---

### FASE 2: Restricciones Graduales (Soft Restrictions) 🟡

**Objetivo:** Limitar funciones premium, pero mantener funciones básicas

**Restricciones por estado:**

#### 1. **SIN SUSCRIPCIÓN (Demo)**
✅ **Permitido:**
- Ver dashboard básico
- Crear hasta 10 reservas/mes
- QR básicos (hasta 2)
- Ver reportes básicos (últimos 7 días)
- Máximo 2 usuarios

❌ **Bloqueado:**
- Reservas ilimitadas
- QR ilimitados
- Reportes históricos completos
- Analytics avanzados
- Exportar datos
- Más de 2 usuarios

#### 2. **SUSCRIPCIÓN ACTIVA (Pagada)**
✅ **Todo desbloqueado**

#### 3. **SUSCRIPCIÓN VENCIDA (Past Due - 1-7 días)**
⚠️ **Modo de gracia:**
- Banner de advertencia persistente
- Email diario recordatorio
- Todas las funciones ACTIVAS
- Después de 7 días → Restricciones

#### 4. **SUSCRIPCIÓN CANCELADA/EXPIRADA (>7 días)**
🔒 **Modo lectura:**
- Solo lectura de datos históricos
- No puede crear nuevas reservas
- No puede modificar configuración
- Banner: "Renueva tu suscripción para continuar"

---

### FASE 3: Bloqueo Total (Hard Restrictions) 🔴

**Objetivo:** Bloquear completamente después de período de gracia

**Implementación:**

```typescript
// src/middleware.ts
export async function middleware(request: NextRequest) {
  const session = await getToken({ req: request });
  
  if (!session?.user?.businessId) {
    return NextResponse.next();
  }

  const business = await prisma.business.findUnique({
    where: { id: session.user.businessId }
  });

  const accessControl = checkSubscriptionStatus(business);

  // Rutas que NO requieren suscripción
  const publicRoutes = ['/pricing', '/billing', '/login', '/register'];
  const isPublicRoute = publicRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Si no tiene acceso, redirigir a pricing
  if (!accessControl.hasAccess) {
    return NextResponse.redirect(new URL('/pricing', request.url));
  }

  return NextResponse.next();
}
```

---

## 🏗️ COMPONENTES A CREAR

### 1. **SubscriptionBanner.tsx**

Mostrar estado de suscripción en todas las páginas:

```tsx
export function SubscriptionBanner() {
  const { business } = useBusiness();
  
  if (business.subscriptionStatus === 'active') {
    return null; // No mostrar nada si está activa
  }

  const daysOverdue = calculateDaysOverdue(business);
  
  return (
    <div className="bg-yellow-500/10 border-l-4 border-yellow-500 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold">⚠️ Suscripción inactiva</h3>
          <p>
            {daysOverdue === 0 
              ? 'Tu suscripción ha expirado hoy.'
              : `Tu suscripción expiró hace ${daysOverdue} días.`
            }
          </p>
        </div>
        <Link href="/pricing" className="btn-primary">
          Renovar ahora
        </Link>
      </div>
    </div>
  );
}
```

### 2. **useSubscription Hook**

Para verificar acceso en cualquier componente:

```typescript
export function useSubscription() {
  const { business } = useBusiness();
  
  return {
    hasActiveSubscription: business.subscriptionStatus === 'active',
    subscriptionStatus: business.subscriptionStatus,
    planId: business.planId,
    
    // Funciones auxiliares
    canCreateReservations: () => {
      if (!business.planId) {
        // Demo: máximo 10 reservas
        return business.reservationCount < 10;
      }
      return true; // Con suscripción: ilimitado
    },
    
    canCreateQR: () => {
      if (!business.planId) {
        return business.qrCount < 2; // Demo: máximo 2 QR
      }
      return true;
    },
    
    canAccessAnalytics: () => {
      return business.subscriptionStatus === 'active';
    },
    
    canExportData: () => {
      return business.subscriptionStatus === 'active';
    }
  };
}
```

### 3. **PremiumFeature Component**

Wrapper para funciones premium:

```tsx
interface PremiumFeatureProps {
  requiredPlan?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PremiumFeature({ 
  requiredPlan, 
  children, 
  fallback 
}: PremiumFeatureProps) {
  const { hasActiveSubscription, planId } = useSubscription();
  
  if (!hasActiveSubscription) {
    return fallback || (
      <div className="text-center p-8 border-2 border-dashed rounded-lg">
        <Lock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h3 className="font-bold mb-2">Función Premium</h3>
        <p className="text-gray-600 mb-4">
          Esta función requiere una suscripción activa.
        </p>
        <Link href="/pricing" className="btn-primary">
          Ver planes
        </Link>
      </div>
    );
  }
  
  return <>{children}</>;
}
```

---

## 📊 TABLA DE CONTROL DE ACCESO

| Función | Sin Suscripción | Activa | Vencida (1-7 días) | Cancelada (>7 días) |
|---------|----------------|--------|-------------------|---------------------|
| Dashboard Básico | ✅ | ✅ | ✅ | ✅ (solo lectura) |
| Crear Reservas | ✅ (max 10) | ✅ | ✅ | ❌ |
| Ver Reservas | ✅ | ✅ | ✅ | ✅ |
| Crear QR | ✅ (max 2) | ✅ | ✅ | ❌ |
| Analytics | ❌ | ✅ | ✅ | ❌ |
| Exportar Datos | ❌ | ✅ | ⚠️ | ❌ |
| Usuarios Extra | ❌ (max 2) | ✅ | ✅ | ❌ |
| Reportes Históricos | ❌ (7 días) | ✅ | ✅ | ✅ (solo ver) |
| Configuración | ✅ | ✅ | ✅ | ❌ |

---

## 🔄 FLUJO DE ACTUALIZACIÓN DE ESTADO

### Webhook: `subscription.past_due`
```typescript
async function handleSubscriptionPastDue(subscription: any) {
  await prisma.business.update({
    where: { subscriptionId: subscription.id },
    data: {
      subscriptionStatus: 'past_due',
      paymentIssueDate: new Date(), // Marca cuando empezó el problema
    }
  });
  
  // Enviar email de recordatorio
  await sendPaymentFailedEmail(business);
}
```

### Webhook: `subscription.canceled`
```typescript
async function handleSubscriptionCanceled(subscription: any) {
  const gracePeriodEnd = addDays(new Date(), 7);
  
  await prisma.business.update({
    where: { subscriptionId: subscription.id },
    data: {
      subscriptionStatus: 'canceled',
      subscriptionEndDate: subscription.canceled_at,
      gracePeriodEnd: gracePeriodEnd,
    }
  });
  
  // Programar restricción después del período de gracia
  await scheduleAccessRestriction(business.id, gracePeriodEnd);
}
```

---

## 🚀 PLAN DE ROLLOUT

### Semana 1-2: Preparación
- ✅ Paddle configurado (YA HECHO)
- ✅ PaymentHistory implementado (YA HECHO)
- [ ] Crear componente SubscriptionBanner
- [ ] Crear hook useSubscription
- [ ] Agregar campos adicionales a Business model

### Semana 3: Soft Launch (Solo Avisos)
- [ ] Activar banner informativo
- [ ] Enviar emails recordatorios
- [ ] Monitorear métricas
- [ ] NO bloquear acceso

### Semana 4: Restricciones Graduales
- [ ] Implementar límites en demo (10 reservas, 2 QR)
- [ ] Bloquear analytics para cuentas sin pago
- [ ] Período de gracia de 7 días

### Semana 5+: Bloqueo Completo
- [ ] Modo lectura después de 7 días
- [ ] Enviar recordatorios cada 3 días
- [ ] Bloquear creación de nuevos datos

---

## 🛡️ CAMPOS ADICIONALES EN BASE DE DATOS

Actualizar el modelo `Business` en `schema.prisma`:

```prisma
model Business {
  // ...campos existentes...
  
  // Control de suscripción
  subscriptionStatus    String?   // 'active', 'past_due', 'canceled', 'paused'
  subscriptionId        String?
  planId                String?
  customerId            String?
  subscriptionStartDate DateTime?
  subscriptionEndDate   DateTime?
  
  // Nuevos campos para control de acceso
  paymentIssueDate      DateTime? // Cuando empezó el problema de pago
  gracePeriodEnd        DateTime? // Hasta cuando tienen acceso después de cancelar
  lastAccessWarning     DateTime? // Última vez que se mostró advertencia
  
  // Contadores para límites en demo
  reservationCount      Int       @default(0)
  qrCount               Int       @default(0)
  userCount             Int       @default(1)
  
  // Historial
  PaymentHistory        PaymentHistory[]
}
```

---

## 💡 RECOMENDACIONES

### 1. **Empezar suave**
- No bloquear inmediatamente
- Dar período de transición
- Comunicar claramente los cambios

### 2. **Ser generoso con los límites**
- Demo: 10 reservas/mes es generoso para probar
- 7 días de gracia es tiempo suficiente
- Modo lectura permite recuperar datos

### 3. **Comunicación clara**
- Emails automáticos antes de bloquear
- Banner siempre visible
- Botón de renovación prominente

### 4. **Tracking y analytics**
- Monitorear cuántos usuarios llegan al límite
- Tracking de conversión demo → pago
- Análisis de churn en período de gracia

---

## 📧 EMAILS AUTOMATIZADOS

### 1. **Suscripción próxima a vencer** (3 días antes)
```
Asunto: 🔔 Tu suscripción de Lealta vence pronto

Hola [Nombre],

Tu suscripción vence el [fecha]. Para evitar interrupciones:

[Renovar ahora]

¿Necesitas ayuda? Responde a este email.
```

### 2. **Pago fallido** (inmediato)
```
Asunto: ⚠️ Problema con tu pago de Lealta

Hola [Nombre],

Hubo un problema procesando tu pago. Tu cuenta sigue activa 
por 7 días más.

[Actualizar método de pago]
```

### 3. **Último día de gracia** (día 7)
```
Asunto: 🚨 Último día - Tu cuenta será restringida mañana

Hola [Nombre],

Mañana tu cuenta pasará a modo lectura. Renueva ahora para:
- Seguir creando reservas
- Acceder a analytics
- Mantener acceso completo

[Renovar ahora]
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Backend
- [ ] Actualizar schema.prisma con nuevos campos
- [ ] Crear middleware de verificación
- [ ] Implementar webhook handlers completos
- [ ] Crear funciones de chequeo de límites
- [ ] Configurar emails automáticos

### Frontend
- [ ] Crear SubscriptionBanner component
- [ ] Crear useSubscription hook
- [ ] Crear PremiumFeature wrapper
- [ ] Actualizar páginas con restricciones
- [ ] Agregar botones de upgrade

### Testing
- [ ] Probar flujo completo de pago
- [ ] Simular vencimientos
- [ ] Verificar emails
- [ ] Probar restricciones en demo
- [ ] Verificar período de gracia

---

**¿Quieres que empiece a implementar alguna de estas fases ahora?** 🚀

Por ejemplo, podríamos:
1. Crear el SubscriptionBanner component
2. Crear el useSubscription hook
3. Actualizar el schema de Business con los campos adicionales
