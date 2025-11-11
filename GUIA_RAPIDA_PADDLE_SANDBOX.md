# 🚀 GUÍA RÁPIDA: Configurar Paddle Sandbox en 5 minutos

## ❓ ¿Por qué Sandbox?

El soporte de Paddle te dice "no hemos visto transacciones", pero necesitas transacciones exitosas para activar tu cuenta LIVE. Es un **"catch-22"**.

**Solución:** Usa Sandbox para desarrollar y probar. Cuando tengas todo funcionando, migras a LIVE.

---

## 📋 PASO 1: Acceder a Paddle Sandbox

1. Ve a: **https://sandbox-vendors.paddle.com/**
2. O desde tu dashboard actual:
   - Click en el selector de ambiente (arriba a la derecha)
   - Cambia de **"Live"** → **"Sandbox"**

---

## 🛍️ PASO 2: Crear Producto en Sandbox

### 2.1 Crear el Producto

1. En el dashboard sandbox, ve a: **Catalog → Products**
2. Click en **"Create Product"**
3. Completa:
   - **Name:** `Lealta Enterprise`
   - **Description:** `Solución empresarial personalizada`
   - **Tax category:** Selecciona `SaaS / Software`
4. Click **"Save"**
5. **⚠️ COPIA EL PRODUCT ID** (empieza con `pro_`)
   - Ejemplo: `pro_01k9d940v6ppjbh0cknn5xz4t3`

### 2.2 Crear el Precio

1. Dentro del producto que acabas de crear, busca la sección **"Prices"**
2. Click **"Add Price"**
3. Completa:
   - **Name:** `Monthly Plan`
   - **Price:** `250.00` USD
   - **Billing period:** `Monthly`
   - **Type:** `Recurring`
4. Click **"Save"**
5. **⚠️ COPIA EL PRICE ID** (empieza con `pri_`)
   - Ejemplo: `pri_01k9d95qvht02dqzvkw0h5876p`

---

## 🔑 PASO 3: Obtener Client Token de Sandbox

1. Ve a: **Developer Tools → Authentication**
2. En la sección **"Client-side tokens"**, click **"Generate token"**
3. Completa:
   - **Name:** `Lealta Sandbox Token`
   - **Scopes:** Selecciona **todos** (o al menos `write:checkout`)
4. Click **"Generate"**
5. **⚠️ COPIA EL TOKEN** (empieza con `test_`)
   - Ejemplo: `test_36ddf9a4003f105fc2730fae735`
   - **IMPORTANTE:** Este token solo se muestra UNA VEZ

---

## 🔐 PASO 4: Obtener API Key de Sandbox

1. Aún en **Developer Tools → Authentication**
2. En la sección **"API Keys"**, click **"Generate Key"**
3. Completa:
   - **Name:** `Lealta Sandbox API`
   - **Scopes:** Selecciona **todos**
4. Click **"Generate"**
5. **⚠️ COPIA EL API KEY** (empieza con `pdl_test_`)
   - Ejemplo: `pdl_test_apikey_01k9pkq5j39yxe14smwkz0rd1z`
   - **IMPORTANTE:** Este key solo se muestra UNA VEZ

---

## 🪝 PASO 5: (Opcional) Crear Webhook Secret

Si vas a probar webhooks localmente:

1. Ve a: **Developer Tools → Notifications**
2. Click **"Create destination"**
3. Completa:
   - **URL:** `https://tu-url-local.ngrok.io/api/webhooks/paddle` (o usa tu URL de dev)
   - **Events:** Selecciona los eventos que necesites
4. Click **"Save"**
5. **⚠️ COPIA EL WEBHOOK SECRET** (empieza con `ntfset_test_`)
   - Ejemplo: `ntfset_test_01k9d9j96f9whgz0qtdke3tb6a`

---

## ⚙️ PASO 6: Actualizar tu `.env`

Abre tu archivo `.env` y reemplaza estos valores:

```env
# ðŸ'³ Paddle Configuration - SANDBOX MODE
PADDLE_CLIENT_TOKEN="test_TU_TOKEN_AQUI"  # ← Del PASO 3
PADDLE_API_KEY="pdl_test_TU_API_KEY_AQUI"  # ← Del PASO 4
PADDLE_WEBHOOK_SECRET="ntfset_test_TU_SECRET_AQUI"  # ← Del PASO 5 (opcional)
NEXT_PUBLIC_PADDLE_ENVIRONMENT="sandbox"  # ✅ YA ESTÁ CONFIGURADO

# 🎯 Variables públicas para el Frontend
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN="test_TU_TOKEN_AQUI"  # ← MISMO del PASO 3
NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID="pri_TU_PRICE_ID_AQUI"  # ← Del PASO 2.2
NEXT_PUBLIC_PADDLE_PRODUCT_ID="pro_TU_PRODUCT_ID_AQUI"  # ← Del PASO 2.1

# 📋 Paddle Plan IDs
PADDLE_PLAN_ENTERPRISE_ID="pri_TU_PRICE_ID_AQUI"  # ← MISMO del PASO 2.2
PADDLE_PRODUCT_ID="pro_TU_PRODUCT_ID_AQUI"  # ← MISMO del PASO 2.1
```

---

## 🧪 PASO 7: Probar el Checkout

### 7.1 Reinicia tu aplicación

```powershell
# Detén tu servidor si está corriendo (Ctrl+C)
npm run dev
```

### 7.2 Abre el checkout

1. Ve a tu aplicación: `http://localhost:3001`
2. Navega a la página de pricing/suscripción
3. Click en **"Subscribe to Enterprise"**
4. Verifica que NO aparezcan errores 403 en la consola

### 7.3 Usa tarjetas de prueba de Paddle

Paddle Sandbox acepta estas tarjetas de prueba:

#### ✅ Pago Exitoso
```
Card Number: 4242 4242 4242 4242
Expiry: Cualquier fecha futura (ej: 12/30)
CVV: 123
```

#### ❌ Pago Rechazado
```
Card Number: 4000 0000 0000 0002
Expiry: Cualquier fecha futura
CVV: 123
```

#### 🔐 Requiere 3D Secure
```
Card Number: 4000 0027 6000 3184
Expiry: Cualquier fecha futura
CVV: 123
```

---

## ✅ VERIFICAR QUE TODO FUNCIONA

### En la consola del navegador deberías ver:

```javascript
✅ 🏗️ Paddle configurado en modo: sandbox
✅ 🎯 Paddle Event: {type: 'checkout.loaded'}
✅ (Sin errores 403 o ERR_BLOCKED_BY_CLIENT)
```

### En el dashboard de Paddle Sandbox:

1. Ve a **Transactions**
2. Deberías ver tu transacción de prueba

---

## 🔄 ¿Cuándo cambiar a LIVE (Producción)?

**Cambia a LIVE cuando:**
- ✅ Tu checkout funcione perfectamente en sandbox
- ✅ Hayas completado TODA la información de tu cuenta LIVE:
  - Información fiscal
  - Datos bancarios
  - Política de privacidad/términos
  - Verificación de identidad
- ✅ Paddle te confirme que tu cuenta está aprobada

**Para activar LIVE:**
1. Crea los mismos productos/precios en tu dashboard LIVE
2. Obtén nuevos tokens/keys del ambiente LIVE
3. Actualiza tu `.env` con las credenciales LIVE
4. Cambia `NEXT_PUBLIC_PADDLE_ENVIRONMENT="production"`
5. ¡Listo!

---

## 🆘 ¿Problemas?

### Error: "net::ERR_BLOCKED_BY_CLIENT"
**Causa:** Bloqueador de anuncios o extensión del navegador
**Solución:** Desactiva bloqueadores de anuncios o prueba en modo incógnito

### Error: "Transaction checkout creation is blocked"
**Causa:** Aún estás usando credenciales LIVE en vez de Sandbox
**Solución:** Verifica que TODOS los tokens empiecen con `test_` o `pdl_test_`

### El checkout no carga
**Causa:** `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` no está configurado correctamente
**Solución:** 
1. Verifica que el token esté en `.env`
2. Reinicia tu servidor (`npm run dev`)
3. Limpia el cache del navegador

---

## 💡 TIPS PRO

1. **Guarda tus credenciales LIVE comentadas** en `.env` para cuando las necesites:
   ```env
   # 🔒 LIVE CREDENTIALS (Para cuando actives producción)
   # PADDLE_CLIENT_TOKEN_LIVE="live_36ddf9a4003f105fc2730fae735"
   # PADDLE_API_KEY_LIVE="pdl_live_apikey_xxx"
   ```

2. **Usa variables de entorno diferentes para cada ambiente:**
   - Desarrollo local: Sandbox
   - Staging: Sandbox
   - Producción: Live

3. **Prueba TODO en sandbox antes de ir a LIVE:**
   - Suscripciones
   - Cancelaciones
   - Actualizaciones de plan
   - Webhooks

---

## 📞 ¿Necesitas ayuda?

**Paddle Support:**
- Email: support@paddle.com
- Live Chat: Desde tu dashboard → Icono de ayuda
- Docs: https://developer.paddle.com/

**No olvides mencionar que estás en SANDBOX** cuando pidas ayuda.
