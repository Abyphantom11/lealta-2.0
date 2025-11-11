# 🔗 SOLUCIÓN ALTERNATIVA: Payment Links (Sin 403)

## 🎯 EL PROBLEMA

El error 403 "Transaction checkout creation is blocked" bloquea `Paddle.Checkout.open()`.

## ✅ LA SOLUCIÓN: Payment Links

En lugar de usar la API de Paddle, usa **Payment Links** (enlaces directos de pago).

**Ventajas:**
- ✅ **No requiere aprobación** de hosted checkouts
- ✅ **Funciona inmediatamente**
- ✅ **Evita el 403** por completo
- ✅ **Mismo resultado** - el cliente paga igual

**Desventajas:**
- 🟡 Sale de tu sitio (redirige a Paddle)
- 🟡 Menos customizable que el overlay

---

## 🚀 IMPLEMENTACIÓN (3 PASOS)

### **PASO 1: Obtén tu Payment Link de Paddle**

1. Ve a: https://vendors.paddle.com/
2. **Catalog → Prices**
3. Encuentra tu plan: `pri_01k9d95qvht02dqzvkw0h5876p`
4. Click en **"Actions"** → **"Get checkout link"** o **"Create payment link"**
5. **Copia el link completo**

Ejemplo:
```
https://buy.paddle.com/checkout?product=pro_01k9d940v6ppjbh0cknn5xz4t3&price=pri_01k9d95qvht02dqzvkw0h5876p
```

---

### **PASO 2: Agrega el link a tu `.env`**

```env
# Payment Link temporal (mientras se activa API)
PADDLE_PAYMENT_LINK_BASE_URL="https://buy.paddle.com/checkout?price=pri_01k9d95qvht02dqzvkw0h5876p"
```

O simplemente úsalo directamente en el código.

---

### **PASO 3: Usa el nuevo método en tu UI**

#### **Opción A: Actualizar PricingTable**

```typescript
// src/components/billing/PricingTable.tsx

import { usePaddle } from '@/hooks/usePaddle';

export default function PricingTable({ businessId, customerEmail }: Props) {
  const { createCheckoutWithLink, isLoading } = usePaddle(); // ← Nuevo método

  const handleSelectPlan = async (planId: string) => {
    try {
      // Usar Payment Link en lugar de API
      await createCheckoutWithLink({
        priceId: planId,
        businessId,
        customerEmail,
      });
    } catch (error) {
      console.error('Error:', error);
      alert('Error al procesar el pago');
    }
  };

  return (
    <button onClick={() => handleSelectPlan('pri_xxx')}>
      Subscribe Now
    </button>
  );
}
```

#### **Opción B: Link Directo (Más simple)**

Si quieres algo súper rápido sin API:

```typescript
// src/components/billing/PricingTable.tsx

const PADDLE_PAYMENT_LINK = "https://buy.paddle.com/checkout?price=pri_01k9d95qvht02dqzvkw0h5876p";

export default function PricingTable({ businessId, customerEmail }: Props) {
  const handleSubscribe = () => {
    // Agregar custom data al link
    const url = new URL(PADDLE_PAYMENT_LINK);
    url.searchParams.set('email', customerEmail);
    url.searchParams.set('custom[businessId]', businessId);
    
    // Redirigir
    window.location.href = url.toString();
  };

  return (
    <button onClick={handleSubscribe}>
      Subscribe to Enterprise - $250/month
    </button>
  );
}
```

---

## 🎨 FLUJO DEL USUARIO

### Antes (con API - da 403):
```
1. Usuario → Click "Subscribe"
2. Tu app → paddle.Checkout.open()
3. Paddle → 403 Forbidden ❌
4. Usuario → Ve error
```

### Ahora (con Payment Link):
```
1. Usuario → Click "Subscribe"
2. Tu app → Redirige a buy.paddle.com
3. Paddle → Muestra checkout ✅
4. Usuario → Paga
5. Paddle → Envía webhook a tu servidor
6. Tu servidor → Activa suscripción
7. Usuario → Regresa a success URL
```

---

## 🔧 CONFIGURACIÓN AVANZADA

### Personalizar el Payment Link:

```typescript
const paymentUrl = new URL('https://buy.paddle.com/checkout');

// Parámetros disponibles:
paymentUrl.searchParams.set('price', 'pri_xxx'); // Precio
paymentUrl.searchParams.set('email', 'user@example.com'); // Pre-fill email
paymentUrl.searchParams.set('quantity', '1'); // Cantidad
paymentUrl.searchParams.set('custom[businessId]', businessId); // Custom data
paymentUrl.searchParams.set('successUrl', 'https://tuapp.com/success'); // Success redirect
paymentUrl.searchParams.set('cancelUrl', 'https://tuapp.com/cancel'); // Cancel redirect

window.location.href = paymentUrl.toString();
```

---

## 📋 SUCCESS URL

Después del pago, Paddle redirige a tu success URL:

```typescript
// src/app/billing/success/page.tsx

export default function BillingSuccessPage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const transactionId = params.get('_ptxn');
    const businessId = params.get('businessId');

    if (transactionId) {
      console.log('✅ Pago completado:', transactionId);
      // Mostrar mensaje de éxito
      // Redirigir al dashboard
    }
  }, []);

  return (
    <div>
      <h1>¡Pago Exitoso!</h1>
      <p>Tu suscripción está activa</p>
      <Link href="/dashboard">Ir al Dashboard</Link>
    </div>
  );
}
```

---

## 🎣 WEBHOOKS (Importante)

Aunque uses Payment Links, **DEBES** tener el webhook configurado:

1. **Ve a:** Developer Tools → Webhooks
2. **Agrega URL:** `https://tudominio.com/api/paddle/webhook`
3. **Selecciona eventos:**
   - transaction.completed
   - subscription.created
   - subscription.updated

El webhook ya está implementado en:
```
src/app/api/paddle/webhook/route.ts
```

---

## ✅ CHECKLIST

- [ ] Obtuve mi Payment Link del dashboard de Paddle
- [ ] Lo agregué a `.env` o directamente en el código
- [ ] Actualicé mi componente para usar `createCheckoutWithLink()`
- [ ] Probé que el link redirige correctamente
- [ ] Configuré success URL y cancel URL
- [ ] Configuré webhook en Paddle dashboard
- [ ] Probé el flujo completo con una tarjeta de prueba

---

## 🧪 TARJETAS DE PRUEBA

Para probar en LIVE (o cuando tengas Sandbox):

```
✅ Pago exitoso:
Card: 4242 4242 4242 4242
Expiry: 12/26
CVV: 123

❌ Pago rechazado:
Card: 4000 0000 0000 0002
```

---

## 🔄 CUANDO PADDLE TE DÉ ACCESO

Una vez que Paddle apruebe tu cuenta:

1. **Podrás volver a usar** `paddle.Checkout.open()` (overlay)
2. **Mejor experiencia** (no sale de tu sitio)
3. **Más personalizable**

Pero por ahora, Payment Links te permiten **empezar a vender HOY** 🚀

---

## 🆘 TROUBLESHOOTING

### "El link no funciona"
- Verifica que el price ID sea correcto
- Asegúrate de estar en modo LIVE si usas credenciales LIVE

### "El pago se completa pero no veo la suscripción"
- Verifica que el webhook esté configurado
- Revisa los logs del webhook en tu servidor
- Asegúrate de pasar `custom[businessId]` en el link

### "Quiero personalizar más el checkout"
- Espera a que Paddle apruebe tu cuenta
- Entonces podrás usar el overlay con más opciones

---

## 📊 COMPARACIÓN

| Feature | Payment Link | API Overlay |
|---------|-------------|-------------|
| Funciona ahora | ✅ Sí | ❌ No (403) |
| Requiere aprobación | ❌ No | ✅ Sí |
| Sale del sitio | ✅ Sí | ❌ No |
| Customizable | 🟡 Poco | ✅ Mucho |
| Webhooks | ✅ Sí | ✅ Sí |
| Recomendado para | MVP/Temporal | Producción |

---

## 🎯 PRÓXIMOS PASOS

1. **Ahora:** Implementa Payment Links para empezar a vender
2. **Mientras:** Espera respuesta de Paddle Support
3. **Después:** Migra al checkout overlay cuando te den acceso

---

**¡Con Payment Links puedes empezar a cobrar HOY!** 🎉

¿Listo para implementarlo?
