# 🚨 ERROR PADDLE EN PRODUCCIÓN (VERCEL)

## 🎯 SITUACIÓN ACTUAL

Estás probando en **PRODUCCIÓN** (Vercel), no en desarrollo local.

**Tu configuración local (.env):**
```env
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN="test_e7baca7d5de4072f974fbe36dce"  ← SANDBOX
NEXT_PUBLIC_PADDLE_ENVIRONMENT="sandbox"  ← SANDBOX
NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID="pri_01k9rf1r9jv9aa3fsjnzf34zkp"  ← SANDBOX
```

---

## 🔴 PROBLEMA PRINCIPAL

**El error 403 en producción puede ser por:**

### 1️⃣ Variables de entorno NO configuradas en Vercel
Las variables `NEXT_PUBLIC_*` de tu `.env` local **NO se suben automáticamente** a Vercel.

**Tienes que configurarlas manualmente en:**
👉 https://vercel.com/[tu-proyecto]/settings/environment-variables

### 2️⃣ Estás usando tokens SANDBOX en producción
Si configuraste las variables en Vercel, pero usaste los tokens de SANDBOX:
- ❌ `test_e7baca7d5de4072f974fbe36dce` (Sandbox)
- ✅ Necesitas tokens LIVE para producción

### 3️⃣ Cache de Vercel está usando variables antiguas
Aunque actualices las variables, Vercel puede tener cache del build anterior.

---

## ✅ SOLUCIÓN PASO A PASO

### OPCIÓN A: Configurar Paddle SANDBOX en Vercel (Recomendado para testing)

Si solo quieres probar, usa Sandbox también en producción:

#### 1. Ve a la configuración de variables de Vercel:
```
https://vercel.com/[tu-usuario]/lealta-2-0/settings/environment-variables
```

#### 2. Agrega estas variables (todas para "Production"):

```env
NEXT_PUBLIC_PADDLE_ENVIRONMENT=sandbox
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=test_e7baca7d5de4072f974fbe36dce
NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID=pri_01k9rf1r9jv9aa3fsjnzf34zkp
NEXT_PUBLIC_PADDLE_PRODUCT_ID=pro_01k9d940v6ppjbh0cknn5xz4t3

PADDLE_API_KEY=pdl_sdbx_apikey_01k9rf68xsj4h0z25g1d4mnd5y_MMaejrm2wQ8MnpSCzjPXwA_APd
PADDLE_WEBHOOK_SECRET=ntfset_01k9rf9t8ta8tdd06q1vgk2qex
PADDLE_VENDOR_ID=257347
```

#### 3. Configura dominios permitidos en Paddle Sandbox:

Ve a: https://sandbox-vendors.paddle.com/settings/checkout

**Agrega tu dominio de Vercel:**
```
https://tu-app.vercel.app
https://*.vercel.app
```

#### 4. Redeploy en Vercel:

```powershell
# Forzar nuevo deploy con las variables actualizadas
vercel --prod --force
```

O desde el dashboard de Vercel:
- Ve a "Deployments"
- Click en los 3 puntos del último deploy
- "Redeploy"

---

### OPCIÓN B: Usar Paddle LIVE en Producción (Cuando tu cuenta esté activa)

**⚠️ PROBLEMA:** Tu cuenta LIVE está bloqueada (Error 403)

Para activarla necesitas:

#### 1. Completar onboarding de Paddle Live:

```markdown
□ Business information (empresa, dirección, RFC)
□ Banking details (cuenta bancaria)
□ Identity verification (INE/pasaporte)
□ Tax configuration (impuestos)
```

Ve a: https://vendors.paddle.com/onboarding

#### 2. Una vez activada, obtén credenciales LIVE:

**En Paddle Dashboard (Live mode):**
- Developer Tools → Authentication
- Generate **Client Token** (empieza con `live_`)
- Generate **API Key** (empieza con `pdl_live_`)

#### 3. Crea producto y precio en LIVE:

- Catalog → Products → Create Product
- Prices → Add Price
- Copia el Price ID (empieza con `pri_`)

#### 4. Actualiza variables en Vercel con credenciales LIVE:

```env
NEXT_PUBLIC_PADDLE_ENVIRONMENT=production
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=live_xxxxx
NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID=pri_xxxxx (de LIVE)

PADDLE_API_KEY=pdl_live_apikey_xxxxx
```

#### 5. Configura dominio en Paddle Live:

https://vendors.paddle.com/settings/checkout

Agrega: `https://tu-app.vercel.app`

---

## 🔬 DIAGNÓSTICO: ¿Qué variables tiene Vercel ahora?

### Verificar desde la terminal:

```powershell
# Ver variables configuradas en Vercel
vercel env ls
```

### Verificar desde el navegador (en producción):

Abre DevTools (F12) en tu app desplegada y ejecuta:

```javascript
// Ver qué variables públicas están disponibles
console.log('Environment:', process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT);
console.log('Client Token:', process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN);
console.log('Price ID:', process.env.NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID);
```

---

## 🎯 CAUSA MÁS PROBABLE DE TU ERROR 403

Si el error dice **"Transaction checkout creation is blocked"**, es porque:

### En Sandbox:
- ❌ No configuraste las variables en Vercel
- ❌ El dominio de Vercel no está permitido en Paddle Sandbox
- ❌ El Price ID no existe en Sandbox

### En Live:
- ❌ Tu cuenta está bloqueada/incompleta
- ❌ Necesitas completar onboarding

---

## 🚀 ACCIÓN INMEDIATA (5 minutos)

### Paso 1: Verificar qué variables tiene Vercel

```powershell
vercel env ls
```

**¿Ves las variables `NEXT_PUBLIC_PADDLE_*`?**
- ✅ SÍ → Pasa al paso 2
- ❌ NO → Agrégalas (instrucciones arriba)

### Paso 2: Verificar dominio en Paddle Sandbox

Ve a: https://sandbox-vendors.paddle.com/settings/checkout

**¿Está tu dominio de Vercel en "Allowed domains"?**
- ✅ SÍ → Pasa al paso 3
- ❌ NO → Agrégalo

### Paso 3: Forzar redeploy

```powershell
vercel --prod --force
```

### Paso 4: Verificar en producción

Abre: `https://tu-app.vercel.app/pricing`

DevTools (F12) → Console:
```javascript
console.log('Paddle Config:', {
  env: process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT,
  token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN?.substring(0, 10),
  priceId: process.env.NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID
});
```

---

## 📋 CHECKLIST COMPLETO

```markdown
□ Variables configuradas en Vercel
  → Ir a: vercel.com/tu-proyecto/settings/environment-variables
  
□ Dominio agregado en Paddle Sandbox
  → Ir a: sandbox-vendors.paddle.com/settings/checkout
  
□ Price ID verificado y activo
  → Ir a: sandbox-vendors.paddle.com/products
  
□ Redeploy forzado en Vercel
  → vercel --prod --force
  
□ Cache de navegador limpiado
  → CTRL + SHIFT + R (hard refresh)
  
□ Verificado en DevTools que las variables están cargadas
  → console.log(process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT)
```

---

## 🆘 SI NADA FUNCIONA

### Opción 1: Testing en desarrollo local

```powershell
npm run dev
# Abre: http://localhost:3000/pricing
```

Esto usa tu `.env` local donde ya está todo configurado.

### Opción 2: Usar Payment Links (bypass del overlay)

Si el overlay de Paddle no funciona en producción, usa links directos:

Ya tienes el método `createCheckoutWithLink` en tu hook que hace esto.

### Opción 3: Logs en producción

Agrega logging temporal para ver qué está pasando:

```typescript
// En tu componente que llama a Paddle
console.log('🔍 DEBUG PRODUCCIÓN:', {
  environment: process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT,
  hasToken: !!process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
  priceId: process.env.NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID,
});
```

Deploy y revisa la consola del navegador en producción.

---

## 💡 RESUMEN EJECUTIVO

**PROBLEMA:** Error 403 en producción (Vercel)

**CAUSA:** Variables de entorno no configuradas en Vercel o dominio no permitido en Paddle

**SOLUCIÓN RÁPIDA:**
1. Configurar variables en Vercel Dashboard
2. Agregar dominio en Paddle Sandbox Settings
3. Redeploy con `vercel --prod --force`

**TIEMPO ESTIMADO:** 5-10 minutos

---

## 📞 DIME:

1. ¿Ya tienes variables configuradas en Vercel Dashboard?
2. ¿Cuál es tu URL de producción? (tu-app.vercel.app)
3. ¿Quieres usar Sandbox o Live en producción?

Te ayudo con el paso específico que necesites 🚀
