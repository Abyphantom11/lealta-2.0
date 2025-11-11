# 🎯 ESTRATEGIA: Trial de 14 Días Sin Método de Pago

## 📋 Objetivo

Permitir que clientes conocidos:
1. Se registren SIN ingresar tarjeta
2. Usen Lealta COMPLETO por 14 días
3. Al día 15 → Sistema los bloquea automáticamente
4. Tú contactas al cliente manualmente
5. Cliente decide: pagar (vas a /pricing) o no pagar (se bloquea)

---

## ✅ IMPLEMENTACIÓN COMPLETADA

### **1. Registro con Trial Automático** ✅

**Archivo:** `src/app/api/auth/signup/route.ts`

**Cambio aplicado:**
```typescript
// ✅ TODOS los nuevos usuarios reciben 14 días gratis automáticamente
const trialEndsAt = new Date();
trialEndsAt.setDate(trialEndsAt.getDate() + 14);

business.subscriptionStatus = 'trialing';
business.trialEndsAt = trialEndsAt;
```

**Resultado:**
- ✅ Usuario se registra → Trial activo inmediatamente
- ✅ No pide tarjeta ni pago
- ✅ Tiene 14 días completos de acceso

---

## 📊 Estados del Usuario

### **Estado 1: Trial Activo (Días 1-14)**
```typescript
{
  subscriptionStatus: 'trialing',
  trialEndsAt: '2025-11-25T00:00:00Z', // 14 días desde registro
  isActive: true
}
```
✅ **Acceso:** Completo
✅ **Puede:** Usar todas las features

---

### **Estado 2: Trial Expirado (Día 15+)**
```typescript
{
  subscriptionStatus: 'trialing', // Sigue siendo 'trialing'
  trialEndsAt: '2025-11-25T00:00:00Z', // Ya pasó esta fecha
  isActive: true
}
```
❌ **Acceso:** Bloqueado
❌ **Ve:** Pantalla de "Trial Expirado"
✅ **Puede:** Ver botón para ir a /pricing

---

### **Estado 3: Pagó (Después de ir a /pricing)**
```typescript
{
  subscriptionStatus: 'active',
  subscriptionId: 'sub_xxx', // ID de Paddle
  trialEndsAt: null, // Ya no es trial
  isActive: true,
  currentPeriodEnd: '2025-12-25' // Próximo cobro
}
```
✅ **Acceso:** Completo permanente
✅ **Paddle:** Cobra $250/mes automáticamente

---

## 🔧 IMPLEMENTACIONES PENDIENTES

### **2. Middleware de Bloqueo** ⏳

**Archivo a crear:** `src/lib/middleware/trial-check.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';
import { prisma } from '@/lib/prisma';

export async function checkTrialExpiration(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return null; // No autenticado, dejar pasar (auth handle lo maneja)
  }

  // Obtener business del usuario
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { business: true }
  });

  if (!user || !user.business) {
    return null;
  }

  const business = user.business;
  const now = new Date();

  // Verificar si el trial expiró
  if (
    business.subscriptionStatus === 'trialing' &&
    business.trialEndsAt &&
    now > business.trialEndsAt
  ) {
    // Trial expirado → Redirigir a página de bloqueo
    const blockedUrl = new URL('/trial-expired', request.url);
    return NextResponse.redirect(blockedUrl);
  }

  // Verificar si la suscripción fue cancelada
  if (business.subscriptionStatus === 'canceled') {
    const blockedUrl = new URL('/subscription-canceled', request.url);
    return NextResponse.redirect(blockedUrl);
  }

  // Todo bien, dejar pasar
  return null;
}
```

---

### **3. Actualizar Middleware Principal** ⏳

**Archivo:** `middleware.ts`

Agregar al final del middleware:

```typescript
import { checkTrialExpiration } from '@/lib/middleware/trial-check';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // ... código existente ...
  
  // ✅ VERIFICAR TRIAL antes de permitir acceso
  // Solo aplicar en rutas protegidas (dashboard, admin, etc.)
  const protectedPaths = ['/dashboard', '/admin', '/cliente', '/negocio', '/staff'];
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));
  
  if (isProtectedPath) {
    const trialCheck = await checkTrialExpiration(request);
    if (trialCheck) {
      return trialCheck; // Redirige a pantalla de bloqueo
    }
  }
  
  return NextResponse.next();
}
```

---

### **4. Página de Trial Expirado** ⏳

**Archivo a crear:** `src/app/trial-expired/page.tsx`

```typescript
'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function TrialExpiredPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Icono */}
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-10 h-10 text-amber-600" />
        </div>

        {/* Título */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Tu prueba gratuita ha terminado
        </h1>

        {/* Descripción */}
        <p className="text-gray-600 mb-2">
          Has completado tus <strong>14 días gratis</strong> de Lealta.
        </p>
        <p className="text-gray-600 mb-8">
          Para continuar usando la plataforma, activa tu suscripción.
        </p>

        {/* Beneficios */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 mb-8 text-left">
          <h3 className="font-semibold text-gray-900 mb-3">
            Al activar tu suscripción obtienes:
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <span>Gestión ilimitada de clientes y reservas</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <span>Sistema de fidelización y promociones</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <span>Analytics y reportes en tiempo real</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <span>Soporte dedicado y capacitación</span>
            </li>
          </ul>
        </div>

        {/* Precio */}
        <div className="mb-6">
          <div className="text-4xl font-bold text-gray-900">
            $250 <span className="text-lg text-gray-500">USD/mes</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Sin compromiso, cancela cuando quieras
          </p>
        </div>

        {/* Botones */}
        <div className="space-y-3">
          <Button
            onClick={() => router.push('/pricing')}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            Activar Suscripción
          </Button>

          <Button
            onClick={() => router.push('/contact')}
            variant="outline"
            className="w-full py-6 text-gray-700 border-2 border-gray-200 hover:bg-gray-50 rounded-xl"
          >
            Contactar con Soporte
          </Button>
        </div>

        {/* Nota */}
        <p className="text-xs text-gray-500 mt-6">
          ¿Necesitas más tiempo? Contáctanos para una extensión.
        </p>
      </div>
    </div>
  );
}
```

---

### **5. Banner de Advertencia (Días 12-14)** ⏳

**Archivo a crear:** `src/components/trial/TrialWarningBanner.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function TrialWarningBanner() {
  const { data: session } = useSession();
  const router = useRouter();
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!session?.user?.business?.trialEndsAt) return;

    const trialEndsAt = new Date(session.user.business.trialEndsAt);
    const now = new Date();
    const diff = trialEndsAt.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    setDaysLeft(days);
  }, [session]);

  // Solo mostrar si faltan 3 días o menos
  if (!daysLeft || daysLeft > 3 || daysLeft < 0 || dismissed) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <AlertTriangle className="w-6 h-6 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-lg">
                {daysLeft === 1
                  ? '¡Tu prueba termina mañana!'
                  : `Tu prueba termina en ${daysLeft} días`}
              </h3>
              <p className="text-sm text-amber-50">
                Activa tu suscripción para seguir usando Lealta sin interrupciones.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              onClick={() => router.push('/pricing')}
              className="bg-white text-orange-600 hover:bg-amber-50 font-semibold"
            >
              Activar Ahora
            </Button>
            <button
              onClick={() => setDismissed(true)}
              className="text-white hover:text-amber-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Agregar en:** `src/app/dashboard/layout.tsx` o `src/app/layout.tsx`

```typescript
import { TrialWarningBanner } from '@/components/trial/TrialWarningBanner';

export default function Layout({ children }) {
  return (
    <>
      <TrialWarningBanner />
      {children}
    </>
  );
}
```

---

## 📧 FLUJO CON CLIENTES

### **Día 1: Cliente se registra**
```
✅ Email automático de bienvenida (opcional)
"¡Bienvenido a Lealta! Tienes 14 días gratis para probar todo."
```

### **Día 10: Recordatorio (opcional)**
```
📧 Email: "Te quedan 4 días de prueba"
💡 Mensaje: "¿Necesitas ayuda? Agenda una capacitación."
```

### **Día 13: Advertencia**
```
⚠️ Banner rojo en dashboard
📧 Email: "Tu prueba termina mañana - Activa tu suscripción"
```

### **Día 15: Bloqueo automático**
```
🔒 Sistema bloquea acceso
📄 Muestra pantalla: "Trial Expirado"
📞 TÚ contactas al cliente:
   "Hola [Cliente], tu prueba terminó. ¿Te interesa continuar?"
```

### **Si Cliente Acepta:**
```
1. Cliente va a lealta.app/pricing
2. Click en "Suscribirse"
3. Completa checkout de Paddle
4. Paga $250 (o activa trial de Paddle con cargo en 14 días)
5. Sistema actualiza: subscriptionStatus = 'active'
6. Acceso reactivado automáticamente
```

### **Si Cliente Rechaza:**
```
❌ Cuenta permanece bloqueada
📊 Datos se conservan (por si regresa en el futuro)
🗑️ Opcional: Eliminar datos después de 30 días
```

---

## 🔄 MIGRACIÓN DE PADDLE (Cuando Cliente Paga)

### **Webhook Handler** ⏳

**Archivo:** `src/app/api/paddle/webhook/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const event = await req.json();

    switch (event.event_type) {
      case 'subscription.activated':
      case 'subscription.created':
        // Cliente completó pago
        await prisma.business.update({
          where: { id: event.data.custom_data.business_id },
          data: {
            subscriptionStatus: 'active',
            subscriptionId: event.data.id,
            paddleCustomerId: event.data.customer_id,
            currentPeriodEnd: new Date(event.data.next_billed_at),
            trialEndsAt: null, // Ya no es trial
          },
        });
        break;

      case 'subscription.canceled':
        // Cliente canceló
        await prisma.business.update({
          where: { subscriptionId: event.data.id },
          data: {
            subscriptionStatus: 'canceled',
            currentPeriodEnd: new Date(event.data.ends_at),
          },
        });
        break;

      case 'subscription.past_due':
        // Pago falló
        await prisma.business.update({
          where: { subscriptionId: event.data.id },
          data: {
            subscriptionStatus: 'past_due',
          },
        });
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 400 });
  }
}
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Completado ✅
- [x] Trial automático de 14 días en registro
- [x] Campo `trialEndsAt` en database
- [x] Campo `subscriptionStatus` en database

### Pendiente ⏳
- [ ] Middleware de bloqueo automático
- [ ] Página `/trial-expired`
- [ ] Banner de advertencia (días 12-14)
- [ ] Webhook handler de Paddle
- [ ] Email de recordatorio (día 10)
- [ ] Email de aviso final (día 13)

---

## 📊 PARA TUS 3 CLIENTES INICIALES

### **Plan Sugerido:**

1. **Clientes se registran hoy**
   - Obtienen 14 días gratis automáticamente
   - No necesitan tarjeta

2. **Tú haces capacitaciones (días 1-10)**
   - Les enseñas a usar Lealta
   - Resuelves dudas
   - Demuestras valor

3. **Día 12: Envías recordatorio manual**
   - WhatsApp/Email: "Hola, tu prueba termina en 2 días"
   - "¿Te interesa continuar? Te envío el link de pago"

4. **Si están satisfechos:**
   - Les envías: `https://lealta.app/pricing`
   - Ellos completan checkout ($250/mes)
   - Trial de Paddle: otros 14 días antes del primer cobro
   - O pago inmediato (si quitas trial de Paddle)

5. **Si no están satisfechos:**
   - Día 15: Sistema los bloquea automáticamente
   - No necesitas hacer nada manual
   - Datos se conservan por si regresan

---

## 💰 RESUMEN FINANCIERO

### **Opción A: Trial de Lealta + Trial de Paddle**
```
Día 1-14:   Trial Lealta (gratis) ✅ Ya implementado
Día 15:     Cliente paga (checkout Paddle)
Día 15-29:  Trial Paddle (gratis) ⏳ Por configurar
Día 30:     Primer cobro real $250 💰
```
**Total días gratis:** 29 días

### **Opción B: Trial de Lealta + Pago Inmediato**
```
Día 1-14:   Trial Lealta (gratis) ✅ Ya implementado
Día 15:     Cliente paga $250 inmediato 💰
Día 45:     Segundo cobro $250 💰
```
**Total días gratis:** 14 días
**Primer cobro:** Día 15

---

## 🎯 RECOMENDACIÓN FINAL

Para tus 3 clientes conocidos:

✅ **Usa Opción A** (Trial doble)
- Más tiempo para que vean valor
- Menos presión para ellos
- Mayor probabilidad de conversión

Después, cuando escales:
✅ **Cambia a Opción B** (Solo trial de Lealta)
- Cobras más rápido
- Clientes más comprometidos

---

_Última actualización: 11 de noviembre, 2025_
