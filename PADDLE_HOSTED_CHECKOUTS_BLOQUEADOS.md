# 🔴 PROBLEMA ENCONTRADO: Hosted Checkouts Bloqueados en Live

## ❌ EL ERROR

```
Error 403: Transaction checkout creation is blocked for this vendor
```

## 🎯 LA CAUSA REAL

En el dashboard de Paddle → **Hosted checkouts** aparece:

> ⚠️ "Hosted checkouts require approval from Paddle before use in live accounts. To request access, please contact support."

**Tu cuenta está verificada**, pero Paddle no te ha dado acceso a **Hosted Checkouts en modo LIVE**.

---

## ✅ SOLUCIÓN 1: Solicitar Acceso (RECOMENDADO)

### Paso 1: Contacta a Paddle Support

**📧 Email:** support@paddle.com

**O click aquí:** https://vendors.paddle.com/hosted-checkouts → "contact support"

### Paso 2: Usa esta plantilla

```
Subject: Request access to Hosted Checkouts in Live mode

Hi Paddle Team,

I would like to request access to Hosted Checkouts for my live account.

Account Details:
✅ Account Status: Verified (4/4)
✅ Business Information: Complete
✅ Tax Settings: Configured
✅ Payout Method: Configured

Use Case:
- Product: SaaS platform for restaurant management (Lealta)
- Business Model: Monthly subscriptions ($250/month)
- Target Market: Restaurants and hospitality businesses
- Expected Volume: Starting with 5-10 customers, scaling gradually

I'm ready to start accepting payments and would appreciate approval for Hosted Checkouts.

Thank you!
[Tu Nombre]
```

### Paso 3: Espera respuesta

Paddle suele responder en **1-2 días hábiles**.

---

## ✅ SOLUCIÓN 2: Usar Paddle.js (Inline Checkout) - INMEDIATO

No necesitas aprobación para usar **Paddle.js** (el checkout embebido).

### Ventajas:
- ✅ **No necesita aprobación** de Paddle
- ✅ Funciona inmediatamente
- ✅ Mejor experiencia de usuario (no sale de tu sitio)
- ✅ Más personalizable

### Cómo verificar que estás usando Paddle.js:

Tu código actual debería tener algo como:

```typescript
// ✅ CORRECTO - Paddle.js (inline)
Paddle.Checkout.open({
  items: [{ priceId: 'pri_xxx', quantity: 1 }]
});

// ❌ INCORRECTO - Hosted Checkout (necesita aprobación)
window.location.href = 'https://buy.paddle.com/checkout/...'
```

### ¿Dónde verificar?

Busca en tu código donde abres el checkout de Paddle. Si estás usando `Paddle.Checkout.open()`, **ya estás usando el método correcto** y no deberías tener el error 403.

Si estás redirigiendo a una URL de Paddle, entonces estás usando Hosted Checkouts.

---

## ✅ SOLUCIÓN 3: Usar Sandbox mientras tanto

Mientras Paddle aprueba tu cuenta:

### Paso 1: Cambia a Sandbox

Ve a: https://sandbox-vendors.paddle.com/

### Paso 2: Crea productos de prueba

1. **Catalog → Products → Create Product**
   - Name: "Lealta Enterprise Test"
   
2. **Add Price:**
   - Amount: 250.00 USD
   - Billing: Monthly

3. **Copia los IDs:**
   - Product ID: `pro_01xxxxx`
   - Price ID: `pri_01xxxxx`

### Paso 3: Genera tokens de Sandbox

**Developer Tools → Authentication:**

1. **Client-side token:**
   - Click "Generate token"
   - Name: "Lealta Sandbox Frontend"
   - Scopes: Todos
   - Copia el token (empieza con `test_`)

2. **API Key:**
   - Copia tu API key de sandbox (empieza con `pdl_sandbox_`)

### Paso 4: Actualiza tu `.env`

```env
# Cambia a Sandbox
PADDLE_CLIENT_TOKEN="test_xxxxxxxxxxxxx"
PADDLE_API_KEY="pdl_sandbox_xxxxx"
NEXT_PUBLIC_PADDLE_ENVIRONMENT="sandbox"
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN="test_xxxxxxxxxxxxx"
NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID="pri_01xxxxx"  # Tu price ID de sandbox
NEXT_PUBLIC_PADDLE_PRODUCT_ID="pro_01xxxxx"  # Tu product ID de sandbox
PADDLE_PLAN_ENTERPRISE_ID="pri_01xxxxx"
PADDLE_PRODUCT_ID="pro_01xxxxx"
```

### Paso 5: Reinicia

```powershell
npm run dev
```

### Paso 6: Prueba con tarjetas de test

```
Tarjeta exitosa: 4242 4242 4242 4242
Fecha: Cualquier fecha futura
CVV: 123
```

---

## 🔍 VERIFICAR QUÉ TIPO DE CHECKOUT USAS

Busca en tu código:

```bash
# En VS Code:
Ctrl + Shift + F
Buscar: "Paddle.Checkout.open"
```

O:

```bash
# En PowerShell:
Select-String -Path "src/**/*.tsx" -Pattern "Paddle.Checkout"
```

### Si encuentras:
- ✅ `Paddle.Checkout.open()` → Estás usando inline (NO necesita aprobación)
- ❌ `window.location` o `href` con URL de Paddle → Estás usando hosted (necesita aprobación)

---

## 📊 COMPARACIÓN

| Feature | Paddle.js (Inline) | Hosted Checkout |
|---------|-------------------|-----------------|
| Aprobación necesaria | ❌ No | ✅ Sí |
| Disponibilidad | ✅ Inmediata | ⏳ 1-2 días |
| Experiencia | Mejor (no sale del sitio) | Sale del sitio |
| Personalización | Alta | Limitada |
| Implementación | Ya lo tienes | Necesitas URL |

---

## 🎯 RECOMENDACIÓN

### Corto plazo (HOY):
1. **Verifica si estás usando Paddle.js** (busca `Paddle.Checkout.open`)
2. **Si sí**, el error 403 debería desaparecer con las credenciales correctas
3. **Si no**, cambia tu código para usar Paddle.js en lugar de Hosted Checkout

### Mediano plazo (1-2 días):
1. **Solicita acceso a Hosted Checkouts** por si lo necesitas después
2. **Mientras tanto, usa Sandbox** para desarrollar

### Largo plazo:
- Una vez aprobado, puedes usar cualquiera de los dos métodos

---

## 🔗 RECURSOS

- Paddle.js Docs: https://developer.paddle.com/paddlejs/overview
- Hosted Checkouts: https://developer.paddle.com/concepts/sell/hosted-checkouts
- Support: support@paddle.com
- Dashboard: https://vendors.paddle.com/

---

## ✅ CHECKLIST

- [ ] Contacté a Paddle Support para solicitar acceso a Hosted Checkouts
- [ ] Verifiqué qué tipo de checkout estoy usando en mi código
- [ ] Si uso Paddle.js, verifiqué que las credenciales sean correctas
- [ ] Si uso Hosted Checkout, consideré cambiar a Paddle.js
- [ ] Configuré Sandbox como alternativa temporal
- [ ] Probé que el checkout funcione en Sandbox

---

## 🆘 SIGUIENTE PASO

**¿Qué tipo de checkout estás usando?**

Busca en tu código `Paddle.Checkout.open` y dime si lo encuentras.
