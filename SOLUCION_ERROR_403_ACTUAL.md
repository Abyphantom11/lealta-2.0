# 🔴 SOLUCIÓN: Error 403 en Paddle Sandbox

## 🎯 EL PROBLEMA ACTUAL

```
POST https://sandbox-checkout-service.paddle.com/transaction-checkout 403 (Forbidden)
Failed to retrieve JWT
```

**Error:** El Client Token que estás usando (`test_e7baca7d5de4072f974fbe36dce`) está siendo **rechazado** por Paddle Sandbox.

---

## ✅ SOLUCIÓN: Generar un NUEVO Client Token

Tu token actual podría estar:
- ❌ Expirado
- ❌ Desactivado
- ❌ Configurado con permisos incorrectos
- ❌ De una cuenta diferente

### Paso 1: Ir a Paddle Sandbox Dashboard

1. Ve a: https://sandbox-vendors.paddle.com/
2. Login con tu cuenta de Paddle
3. Asegúrate de estar en modo **SANDBOX** (esquina superior derecha)

### Paso 2: Generar un NUEVO Client Token

1. Ve a: **Developer Tools** → **Authentication**
2. En la sección **Client-side tokens**
3. Click en **"Generate client-side token"**
4. Configuración:
   - **Name:** `Lealta Production Sandbox`
   - **Allowed URLs:** `https://lealta.app` o deja en blanco para permitir todos
   - **Scopes:** Selecciona todos los checkboxes disponibles:
     - ✅ Create transactions
     - ✅ Read customer details
     - ✅ etc.
5. Click en **Generate**
6. **⚠️ COPIA EL TOKEN INMEDIATAMENTE** (empieza con `test_`)

### Paso 3: Actualizar Variables

#### A) En tu `.env.local`:

```bash
# Reemplaza el token viejo por el nuevo
PADDLE_CLIENT_TOKEN="test_NUEVO_TOKEN_AQUI"
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN="test_NUEVO_TOKEN_AQUI"
```

#### B) En Vercel:

1. Ve a: https://vercel.com/dashboard
2. Tu proyecto → **Settings** → **Environment Variables**
3. Busca estas variables y **EDÍTALAS** con el nuevo token:
   - `PADDLE_CLIENT_TOKEN` = `test_NUEVO_TOKEN_AQUI`
   - `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` = `test_NUEVO_TOKEN_AQUI`
4. Asegúrate de que estén marcadas para **Production** y **Preview**
5. **Guarda los cambios**

### Paso 4: Redeploy OBLIGATORIO

```powershell
# Opción 1: Desde Vercel Dashboard
# Deployments → [último deployment] → ... → Redeploy

# Opción 2: Push un cambio
git commit --allow-empty -m "chore: trigger redeploy para nuevo Paddle token"
git push origin feat/optimize-ui-rendering
```

---

## 🔍 VERIFICAR QUE EL TOKEN SEA VÁLIDO

Antes de actualizar Vercel, prueba localmente:

```powershell
# 1. Actualiza tu .env.local con el nuevo token
# 2. Reinicia tu servidor
npm run dev

# 3. Ve a: http://localhost:3001/pricing
# 4. Abre la consola del navegador (F12)
# 5. Intenta crear un checkout
```

**Deberías ver:**
```
✅ 🚀 Inicializando Paddle...
✅ Paddle inicializado correctamente
✅ 🎯 Paddle Event: {type: 'checkout.loaded'}
```

**NO deberías ver:**
```
❌ POST https://sandbox-checkout-service.paddle.com/transaction-checkout 403
```

---

## 🚨 SI SIGUE FALLANDO

### Problema 1: Bloqueador de anuncios

Los errores `net::ERR_BLOCKED_BY_CLIENT` de Sentry indican que tienes un bloqueador activo.

**Solución:**
1. Desactiva **uBlock Origin**, **AdBlock**, o cualquier bloqueador
2. Agrega `*.paddle.com` a la whitelist
3. Recarga la página con `Ctrl+Shift+R`

### Problema 2: Token de cuenta equivocada

Verifica que el **Vendor ID** coincida:

1. En Paddle Sandbox Dashboard
2. Ve a: **Settings** → **Account**
3. Busca tu **Vendor ID** (debe ser `257347`)
4. Si es diferente, estás en la cuenta equivocada

### Problema 3: Cuenta sandbox no activada

Algunas cuentas de Paddle requieren:
- ✅ Verificar email
- ✅ Completar información de negocio
- ✅ Aceptar términos de servicio

**Solución:**
1. Revisa si hay notificaciones/banners en Paddle Dashboard
2. Completa cualquier paso pendiente
3. Intenta de nuevo

---

## 🎯 VALORES CORRECTOS (después de actualizar token)

```bash
# Backend Keys
PADDLE_VENDOR_ID=257347
PADDLE_API_KEY=pdl_sdbx_apikey_01k9rf68xsj4h0z25g1d4mnd5y_MMaejrm2wQ8MnpSCzjPXwA_APd
PADDLE_CLIENT_TOKEN=test_NUEVO_TOKEN_AQUI  # ← CAMBIAR
PADDLE_WEBHOOK_SECRET=ntfset_01k9rf9t8ta8tdd06q1vgk2qex
PADDLE_PLAN_ENTERPRISE_ID=pri_01k9d95qvht02dqzvkw0h5876p
PADDLE_PRODUCT_ID=pro_01k9d940v6ppjbh0cknn5xz4t3

# Frontend Keys (NEXT_PUBLIC_*)
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=test_NUEVO_TOKEN_AQUI  # ← CAMBIAR (mismo que arriba)
NEXT_PUBLIC_PADDLE_ENVIRONMENT=sandbox  # ← MANTENER en sandbox
NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID=pri_01k9d95qvht02dqzvkw0h5876p
NEXT_PUBLIC_PADDLE_PRODUCT_ID=pro_01k9d940v6ppjbh0cknn5xz4t3
```

---

## ⚠️ IMPORTANTE: NO cambies a production

**NO** cambies `NEXT_PUBLIC_PADDLE_ENVIRONMENT` a `production`. Tu cuenta LIVE está bloqueada (error 403 original).

**Debes usar SANDBOX hasta:**
1. ✅ Completar la configuración de tu cuenta LIVE en Paddle
2. ✅ Recibir aprobación de Paddle
3. ✅ Obtener credenciales LIVE funcionales

---

## 📞 CONTACTAR A PADDLE SUPPORT

Si el nuevo token también falla:

**Email:** support@paddle.com

**Asunto:** Sandbox Client Token returning 403 - Vendor ID: 257347

**Mensaje:**
```
Hello Paddle Support,

I'm trying to use Paddle Sandbox for development but I'm getting 403 errors when creating transactions:

- Vendor ID: 257347
- Environment: Sandbox
- Error: "POST https://sandbox-checkout-service.paddle.com/transaction-checkout 403 (Forbidden)"
- Error Message: "Failed to retrieve JWT"

I've generated a new client-side token but it's still being rejected. 

Could you help me understand why my sandbox account is blocked?

Thanks!
```

---

## ✅ Checklist de solución

- [ ] Generé un NUEVO Client Token en Paddle Sandbox
- [ ] Actualicé `.env.local` con el nuevo token
- [ ] Actualicé las variables en Vercel
- [ ] Hice redeploy en Vercel
- [ ] Probé localmente y funciona
- [ ] Probé en producción y NO veo error 403
- [ ] Desactivé bloqueadores de anuncios

---

¡Una vez que tengas el nuevo token, avísame y te ayudo a configurarlo! 🚀
