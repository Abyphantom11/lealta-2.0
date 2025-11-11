# 🔴 ERROR PERSISTENTE: ERR_BLOCKED_BY_CLIENT + 403 Paddle

## 🎯 LOS 3 ERRORES QUE VES:

```
1. ERR_BLOCKED_BY_CLIENT
   ↓
2. 403 Forbidden (checkout-service.paddle.com/transaction-checkout)
   ↓
3. 400 Bad Request (transaction-checkout/null/event)
```

---

## 🔍 DIAGNÓSTICO REAL

### ❌ Error #1: ERR_BLOCKED_BY_CLIENT (BLOQUEADOR)

**Causa:**
Tu bloqueador de anuncios (AdBlock, uBlock Origin, Brave Shields, Privacy Badger, etc.) está **bloqueando las peticiones a Paddle**.

**Evidencia:**
- El error dice "ERR_BLOCKED_BY_CLIENT" = El navegador/extensión bloqueó la petición
- Paddle usa dominios que los bloqueadores consideran "tracking/analytics"

**Impacto:**
- 🔴 Las peticiones a Paddle **nunca llegan al servidor**
- Por eso ves el 403 después

---

### ❌ Error #2: 403 Forbidden (PADDLE)

**Causas posibles:**

#### A) Bloqueador bloqueó la petición (más probable)
Si el bloqueador actúa primero, Paddle responde 403.

#### B) Dominio no permitido en Paddle
Tu app está en: `https://lealta-2-0-[hash].vercel.app`

Paddle puede rechazar peticiones de dominios no autorizados.

#### C) Price ID inválido o inactivo
El Price ID que estás usando no existe o está archivado.

---

### ❌ Error #3: 400 Bad Request (CONSECUENCIA)

Como el checkout falló (403), no hay `transactionId`:
```
/transaction-checkout/null/event  ← null porque falló
```

Este error **desaparece** cuando se soluciona el 403.

---

## ✅ SOLUCIÓN PASO A PASO

### 🎯 PASO 1: DESACTIVAR BLOQUEADOR DE ANUNCIOS (CRÍTICO)

#### Opción A: Desactivar para tu sitio específico

**Si usas AdBlock/uBlock Origin:**
1. Click en el ícono de la extensión
2. Click en el botón de "power" para desactivar
3. Selecciona "Solo para este sitio"
4. Refresca la página (F5)

**Si usas Brave:**
1. Click en el ícono del león (Brave Shields)
2. Desactiva "Shields"
3. Refresca

**Si usas otra extensión:**
- Lista todas tus extensiones relacionadas con privacidad/bloqueo
- Desactívalas temporalmente

#### Opción B: Modo Incógnito + Sin Extensiones

```powershell
# Esto abre el navegador sin extensiones
# Chrome:
start chrome --incognito "https://tu-app.vercel.app"

# Edge:
start msedge -inprivate "https://tu-app.vercel.app"
```

---

### 🎯 PASO 2: AGREGAR TU DOMINIO EN PADDLE SANDBOX

#### 1. Ve a Paddle Sandbox Settings:
```
https://sandbox-vendors.paddle.com/settings/checkout
```

#### 2. Busca la sección "Allowed domains"

#### 3. Agrega tus dominios de Vercel:

```
https://*.vercel.app
https://lealta-2-0.vercel.app
http://localhost:3000
```

**⚠️ Importante:** Agrega el asterisco `*.vercel.app` para cubrir todos los previews.

#### 4. También configura "Default success URL":

```
https://lealta-2-0.vercel.app/success
```

#### 5. Save changes

---

### 🎯 PASO 3: VERIFICAR PRICE ID EN PADDLE

#### 1. Ve a tus productos:
```
https://sandbox-vendors.paddle.com/products
```

#### 2. Busca "Lealta Enterprise" o tu producto

#### 3. Verifica que el Price ID sea:
```
pri_01k9rf1r9jv9aa3fsjnzf34zkp
```

#### 4. Verifica que el estado sea: **ACTIVE** ✅

**Si no está activo:**
- Click en el Price
- Click en "Reactivate" o "Publish"

---

### 🎯 PASO 4: LIMPIAR CACHE Y PROBAR

```powershell
# Si probando en producción, fuerza un redeploy
vercel --prod --force
```

**Luego en el navegador:**
1. CTRL + SHIFT + R (hard refresh)
2. O mejor: Modo incógnito sin extensiones
3. Ve a tu página de pricing
4. Intenta el checkout de nuevo

---

## 🧪 TEST PARA CONFIRMAR QUÉ ESTÁ BLOQUEANDO

### Test 1: ¿Es el bloqueador?

**En DevTools (F12) → Console, ejecuta:**

```javascript
// Intenta hacer una petición directa a Paddle
fetch('https://checkout-service.paddle.com/health')
  .then(r => console.log('✅ Paddle accesible:', r.status))
  .catch(e => console.error('❌ Paddle bloqueado:', e.message));
```

**Resultado esperado:**
- ✅ Si responde = El bloqueador NO está activo
- ❌ Si falla con "blocked" = El bloqueador SÍ está activo

---

### Test 2: ¿El Price ID existe?

**En la consola de tu app, verifica:**

```javascript
console.log('🔍 Configuración actual:', {
  environment: process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT,
  priceId: process.env.NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID,
  productId: process.env.NEXT_PUBLIC_PADDLE_PRODUCT_ID,
  hasToken: !!process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
});
```

**Copia el Price ID que muestra** y verifícalo en tu dashboard de Paddle.

---

### Test 3: ¿Es el dominio?

**Prueba con Payment Link en lugar del overlay:**

Si tu código ya tiene `createCheckoutWithLink`, úsalo temporalmente:

```typescript
// En lugar de:
await createCheckout({...})

// Usa:
await createCheckoutWithLink({...})
```

Esto redirige a una página de Paddle directamente, evitando el overlay.

---

## 🔥 SOLUCIÓN RÁPIDA (SI TIENES PRISA)

### Opción 1: Usar pago directo (sin overlay)

Agrega este botón temporal en tu página de pricing:

```typescript
<button onClick={() => {
  // Link directo de Paddle (cámbialo por el tuyo)
  window.location.href = 'https://buy.paddle.com/test/XXXXX';
}}>
  Pagar directamente (sin overlay)
</button>
```

Ve a tu dashboard de Paddle y genera un Payment Link:
1. Catalog → Products
2. Click en tu producto
3. "Create payment link"
4. Copia el link
5. Úsalo en el botón

---

### Opción 2: Testear en localhost (más fácil)

```powershell
# Local no tiene problemas de CORS ni dominios
npm run dev
```

Abre: http://localhost:3000/pricing

**Si funciona en local pero NO en producción:**
- ✅ Tu código está bien
- ❌ El problema es configuración de dominio en Paddle

---

## 📊 CHECKLIST COMPLETO

```markdown
□ Bloqueador de anuncios DESACTIVADO
  → Click en el ícono de la extensión
  → Desactivar para este sitio
  → Verificar con el test de fetch (arriba)

□ Dominio agregado en Paddle Sandbox
  → https://sandbox-vendors.paddle.com/settings/checkout
  → Agregar: *.vercel.app y tu dominio específico
  → Save changes

□ Price ID verificado y ACTIVE
  → https://sandbox-vendors.paddle.com/products
  → Verificar: pri_01k9rf1r9jv9aa3fsjnzf34zkp
  → Estado: ACTIVE ✅

□ Variables agregadas en Vercel
  → NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID
  → Valor: pri_01k9rf1r9jv9aa3fsjnzf34zkp

□ Redeploy forzado
  → vercel --prod --force
  → O desde dashboard: Redeploy

□ Cache limpiado en navegador
  → CTRL + SHIFT + R
  → O modo incógnito

□ Probado sin extensiones
  → Modo incógnito
  → O desactivar todas las extensiones
```

---

## 🎯 CAUSA MÁS PROBABLE (90%)

**ERR_BLOCKED_BY_CLIENT = BLOQUEADOR DE ANUNCIOS**

El 403 es **consecuencia** de que el bloqueador impide que la petición llegue.

**Prueba esto AHORA:**
1. Abre tu app en **modo incógnito** (sin extensiones)
2. Ve a pricing
3. Intenta el checkout

**Si funciona en incógnito:**
- ✅ Confirmado: Es el bloqueador
- Solución: Desactívalo permanentemente para tu sitio

**Si NO funciona ni en incógnito:**
- ❌ Es el dominio no permitido en Paddle
- Solución: Agrega tu dominio en Paddle Settings (Paso 2)

---

## 📞 SIGUIENTE ACCIÓN

**Dime:**
1. ¿Qué extensiones de bloqueo tienes instaladas?
2. ¿Ya probaste en modo incógnito?
3. ¿Cuál es tu URL de producción exacta?

Con esa info te doy la solución exacta 🎯

---

## 🆘 SI NADA FUNCIONA: CONTACT PADDLE SUPPORT

```markdown
Subject: 403 Error - Sandbox checkout blocked for domain

Hi Paddle Team,

I'm getting a 403 error when trying to create checkouts in Sandbox:

Error: Transaction checkout creation failed
URL: checkout-service.paddle.com/transaction-checkout

Setup:
- Environment: Sandbox
- Vendor ID: 257347
- Price ID: pri_01k9rf1r9jv9aa3fsjnzf34zkp
- Domain: https://lealta-2-0.vercel.app

I have added my domain in the Checkout Settings but still getting 403.

Could you please:
1. Verify if my domain is properly whitelisted
2. Check if there are any restrictions on my sandbox account
3. Confirm if the Price ID is active and accessible

Thank you!
```

Enviar a: https://vendors.paddle.com/support
