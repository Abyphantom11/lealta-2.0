# 🧪 Probar Paddle Frontend (Sin acceso a Dashboard)

Si no puedes acceder al dashboard de Paddle Sandbox, puedes probar tu implementación frontend con un token demo.

## ⚠️ IMPORTANTE

Esto SOLO sirve para probar que tu frontend funcione. NO podrás:
- ❌ Procesar pagos reales
- ❌ Recibir webhooks
- ❌ Ver transacciones en el dashboard

Pero SÍ podrás:
- ✅ Ver el modal de checkout de Paddle
- ✅ Verificar que tu integración frontend funcione
- ✅ Depurar errores de UI

---

## 📝 Paso 1: Usa un token de prueba temporal

Actualiza tu `.env` temporalmente:

```env
# 🧪 TOKEN DE PRUEBA TEMPORAL (solo para testing frontend)
NEXT_PUBLIC_PADDLE_ENVIRONMENT="sandbox"
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN="test_12345"  # Token dummy
NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID="pri_01hdw3q7y5a0b1c2d3e4f5g6h7"  # Price ID dummy
NEXT_PUBLIC_PADDLE_PRODUCT_ID="pro_01hdw3q7y5a0b1c2d3e4f5g6h7"  # Product ID dummy
```

---

## 📝 Paso 2: Modifica temporalmente paddle.ts

Crea una versión de prueba que maneje el error:

```typescript
// src/lib/paddle-test.ts
export const paddleConfig = {
  environment: 'sandbox',
  token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || 'test_dummy',
  eventCallback: (data: any) => {
    console.log('🎯 Paddle Event:', data);
    
    if (data.name === 'checkout.error') {
      console.warn('⚠️ Error de Paddle (esperado en modo test):', data);
      // En producción real, esto funcionará
    }
  },
};
```

---

## 🎯 Paso 3: Qué esperar

Con un token dummy verás:
- ✅ Tu botón de "Subscribe" funciona
- ✅ Se intenta abrir el checkout
- ❌ Error 403 o similar (normal sin token real)
- ✅ Puedes depurar la UI y el flujo

---

## 📧 MIENTRAS: Contacta a Paddle

**Email:** support@paddle.com

**Mensaje:**

```
Subject: 403 Error accessing Sandbox - Account Setup Issue

Hi Paddle Team,

I'm unable to access the Sandbox environment. When I try to login at:
https://sandbox-vendors.paddle.com/

I get:
- Error: sandbox-api.paddle.com/login - 403 (Forbidden)

My account details:
- Email: [tu email]
- Signed up: [fecha]
- Issue: Cannot access Sandbox to get test credentials

I want to integrate Paddle into my SaaS application but need Sandbox access to test.

Can you help me resolve this?

Thanks!
```

---

## 🔄 Una vez que tengas acceso

Cuando Paddle resuelva el problema:
1. Accede al dashboard Sandbox
2. Crea tus productos reales
3. Obtén los tokens reales
4. Reemplaza los valores dummy en `.env`
5. ¡Listo!

---

## 💡 Alternativa: Usar Stripe temporalmente

Si Paddle tarda mucho en responder, considera usar Stripe para seguir desarrollando:
- Setup más rápido
- Sandbox siempre disponible
- Puedes migrar a Paddle después

¿Te interesa que te ayude a configurar Stripe como plan B?
