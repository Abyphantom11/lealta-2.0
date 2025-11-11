# 🔍 Verificar Price ID en Paddle

## ❌ Problema Actual

El link `https://buy.paddle.com/checkout?price_id=pri_01k9d95qvht02dqzvkw0h5876p` muestra **"Page Not Found"**

## 🎯 Por qué sucede esto

Paddle muestra "Page Not Found" cuando:

1. ❌ **El Price ID no existe** en tu cuenta
2. ❌ **El Price ID está en Sandbox** pero intentas acceder desde URL de producción
3. ❌ **El precio no está publicado/activo**
4. ❌ **El producto padre no está activo**
5. ❌ **Tu cuenta LIVE no tiene acceso a checkouts** (tu caso)

## ✅ Pasos para Verificar

### 1️⃣ Ir a tu Dashboard de Paddle

🔗 https://vendors.paddle.com/products

### 2️⃣ Buscar tu producto "Lealta Enterprise"

- Product ID: `pro_01k9d940v6ppjbh0cknn5xz4t3`
- Price ID: `pri_01k9d95qvht02dqzvkw0h5876p`

### 3️⃣ Verificar el estado

Debe estar:
- ✅ **Status: Active** (no "Draft" ni "Archived")
- ✅ **Published** 
- ✅ **Pricing visible**

### 4️⃣ Verificar el Price

Dentro del producto, busca el precio:
- Price ID debe ser: `pri_01k9d95qvht02dqzvkw0h5876p`
- Debe estar **Active**
- Amount: $250/month

## 🚨 PROBLEMA REAL (Muy Probable)

Tu cuenta **LIVE está bloqueada para checkouts**. Paddle respondió:

> "Hosted checkouts require approval from Paddle before use in live accounts"

Entonces **aunque el Price ID exista**, Paddle lo bloquea y muestra "Page Not Found" como error genérico.

## 💡 Soluciones

### Solución 1: Esperar aprobación de Paddle ⏳
- Ya enviaste email a support@paddle.com
- Puede tomar 1-3 días hábiles

### Solución 2: Usar Sandbox para pruebas 🧪
1. Ir a dashboard de Paddle
2. Switch a **Sandbox mode** (arriba a la derecha)
3. Crear producto y precio en Sandbox
4. Actualizar tu `.env`:
```bash
NEXT_PUBLIC_PADDLE_ENVIRONMENT="sandbox"
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN="test_xxx..."
NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID="pri_test_xxx..."
```

### Solución 3: Pedir a Paddle que active SOLO Payment Links 🎯
1. Responder al email de Paddle Support
2. Pedirles que activen Payment Links (no requieren aprobación completa)
3. Usar este formato: `https://buy.paddle.com/checkout?price_id=pri_01k9d95qvht02dqzvkw0h5876p`

## 🧪 Prueba Rápida

Para confirmar que el problema es el bloqueo de cuenta, intenta:

1. Ir directamente a:
```
https://vendors.paddle.com/subscriptions/products/pro_01k9d940v6ppjbh0cknn5xz4t3
```

2. Buscar el botón "Get checkout link" o "Preview"

3. Si NO aparece esa opción → **Confirmado: checkouts bloqueados**

## 📧 Qué decirle a Paddle Support

```
Subject: Enable Payment Links for Live Account - Seller ID 257347

Hi Paddle Support,

I'm trying to use Payment Links with my verified live account (Seller ID: 257347).

When I try to access:
https://buy.paddle.com/checkout?price_id=pri_01k9d95qvht02dqzvkw0h5876p

I get "Page Not Found".

My account is 4/4 verified. Can you please enable Payment Links for my live account? 
I don't need the full hosted checkout overlay, just the ability to use buy.paddle.com links.

Product ID: pro_01k9d940v6ppjbh0cknn5xz4t3
Price ID: pri_01k9d95qvht02dqzvkw0h5876p

Thank you!
```

## ⚡ Mientras tanto...

Puedes probar la integración con **tarjetas de prueba de Paddle** cuando te den acceso a Sandbox:

🔗 https://developer.paddle.com/concepts/payment-methods/credit-debit-card#test-card-numbers

---

**🎯 Próximo paso:** Verifica en tu dashboard que el precio existe y está activo. Si está activo, el problema es 100% el bloqueo de cuenta LIVE.
