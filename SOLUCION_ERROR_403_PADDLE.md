# 🔴 SOLUCIÓN: Error 403 - "Transaction checkout creation is blocked for this vendor"

## 🎯 EL PROBLEMA

Paddle está bloqueando la creación de transacciones con tus credenciales de PRODUCCIÓN (`live_xxx`).

### Errores que estás viendo:
```
POST https://checkout-service.paddle.com/transaction-checkout 403 (Forbidden)

checkout.error: Transaction checkout creation is blocked for this vendor.
```

---

## 🔍 CAUSAS POSIBLES

### 1. ⚠️ **Cuenta de Paddle en Live Mode no está completamente configurada** (MÁS PROBABLE)

Tu cuenta necesita:
- ✅ Información fiscal completa
- ✅ Métodos de pago configurados
- ✅ Información bancaria para recibir pagos
- ✅ Verificación de identidad completada
- ✅ Términos y condiciones aceptados

### 2. 🚫 **Restricciones en tu cuenta**

Paddle puede haber:
- Detectado actividad sospechosa
- Bloqueado temporalmente tu cuenta
- Requerido verificación adicional
- Limitado tus capacidades hasta completar el onboarding

### 3. 🌍 **Restricciones geográficas**

- Tu cuenta puede estar limitada a ciertas regiones
- Necesitas configurar los países donde vendes

---

## ✅ SOLUCIÓN TEMPORAL: Cambiar a SANDBOX

Mientras resuelves el problema con Paddle, usa SANDBOX para continuar desarrollando:

### 1️⃣ Obtén credenciales de SANDBOX

Ve a: https://sandbox-vendors.paddle.com/

O desde tu dashboard de Paddle:
- Click en el selector de ambiente (arriba a la derecha)
- Cambia de "Live" a "Sandbox"

### 2️⃣ Crea un producto y precio de prueba

1. **Catalog → Products → Create Product**
   - Name: "Lealta Enterprise Test"
   - Save y copia el `Product ID` (empieza con `pro_`)

2. **Dentro del producto → Prices → Add Price**
   - Price: 250.00 USD
   - Billing: Monthly/Recurring
   - Save y copia el `Price ID` (empieza con `pri_`)

### 3️⃣ Genera Client Token de Sandbox

1. **Developer Tools → Authentication**
2. **Client-side tokens → Generate token**
3. Name: "Lealta Sandbox"
4. Scopes: Selecciona todos
5. **Copia el token** (empieza con `test_`)

### 4️⃣ Actualiza tu `.env`

```env
# 💳 Paddle Configuration - SANDBOX MODE
PADDLE_CLIENT_TOKEN="test_xxxxxxxxxxxxx"  # Tu token de sandbox
PADDLE_API_KEY="pdl_sandbox_xxxxx"  # API key de sandbox (desde Developer Tools → Authentication)
PADDLE_WEBHOOK_SECRET="ntfset_test_xxxxx"  # Webhook secret de sandbox
NEXT_PUBLIC_PADDLE_ENVIRONMENT="sandbox"  # ← CAMBIAR A SANDBOX

# 🎯 Variables públicas para el Frontend
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN="test_xxxxxxxxxxxxx"  # Tu token de sandbox
NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID="pri_01xxxxx"  # Tu price ID de sandbox
NEXT_PUBLIC_PADDLE_PRODUCT_ID="pro_01xxxxx"  # Tu product ID de sandbox

# 📋 Paddle Plan IDs
PADDLE_PLAN_ENTERPRISE_ID="pri_01xxxxx"  # Tu price ID de sandbox
PADDLE_PRODUCT_ID="pro_01xxxxx"  # Tu product ID de sandbox
```

### 5️⃣ Reinicia tu aplicación

```powershell
npm run dev
```

---

## 🏢 SOLUCIÓN DEFINITIVA: Configurar cuenta LIVE de Paddle

### PASO 1: Revisa el estado de tu cuenta

1. Ve a: https://vendors.paddle.com/
2. Cambia a modo "Live/Production"
3. Busca banners o notificaciones de advertencia
4. Ve a **Settings → Account** y revisa si hay pasos pendientes

### PASO 2: Completa la información requerida

Ve a **Settings** y completa:

#### A) Business Information
- Nombre legal del negocio
- Dirección fiscal completa
- Tax ID / VAT number
- Tipo de negocio

#### B) Banking Information
- Información bancaria para recibir pagos
- Método de pago preferido

#### C) Tax Settings
- Configuración de impuestos por región
- Información fiscal requerida por tu país

#### D) Compliance
- Política de privacidad URL
- Términos y condiciones URL
- Política de reembolsos

### PASO 3: Verifica restricciones geográficas

1. Ve a **Settings → Selling**
2. Asegúrate de tener configuradas las regiones donde vendes
3. Configura los métodos de pago por región

### PASO 4: Contacta a Paddle Support

Si todo está completo y sigue sin funcionar:

**📧 Email:** support@paddle.com

**Mensaje sugerido:**
```
Subject: Transaction checkout blocked - Vendor: [TU_VENDOR_ID]

Hello Paddle Support,

I'm getting a 403 error when trying to create checkouts:
"Transaction checkout creation is blocked for this vendor"

Vendor ID: [TU_VENDOR_ID]
Client Token: live_36ddf9a4003f105fc2730fae735
Error Details: All my account information appears complete but I cannot create transactions.

Could you help me understand what's blocking my account?

Thanks!
```

**💬 Live Chat:** Desde tu dashboard → Click en el ícono de ayuda

---

## 🧪 CÓMO PROBAR EN SANDBOX

Una vez configurado Sandbox:

### Tarjetas de prueba de Paddle:
```
✅ Transacción exitosa:
   Card: 4242 4242 4242 4242
   Expiry: Cualquier fecha futura
   CVV: Cualquier 3 dígitos

❌ Transacción rechazada:
   Card: 4000 0000 0000 0002

⏳ Requiere autenticación 3D Secure:
   Card: 4000 0027 6000 3184
```

### Para probar el checkout:
1. Abre tu app
2. Ve a la página de pricing/signup
3. Click en "Subscribe to Enterprise"
4. Usa una tarjeta de prueba
5. Verifica que el webhook se reciba (si lo configuraste)

---

## 📊 VERIFICAR QUE FUNCIONA

Después de cambiar a Sandbox, deberías ver en la consola del navegador:

```
✅ 🏗️ Paddle configurado en modo: sandbox
✅ 🎯 Paddle Event: {type: 'checkout.loaded'}
❌ (Sin errores 403)
```

---

## 🚨 IMPORTANTE

### El error de Sentry es normal:
```
ERR_BLOCKED_BY_CLIENT en Sentry
```
Esto es solo tu bloqueador de anuncios bloqueando Sentry. **Ignóralo**, no afecta la funcionalidad.

### NO expongas las API Keys:
- `PADDLE_API_KEY` → Solo backend, NUNCA en el frontend
- `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` → OK para el frontend
- Solo las variables con `NEXT_PUBLIC_` van al cliente

---

## ✅ CHECKLIST

- [ ] Cambié `NEXT_PUBLIC_PADDLE_ENVIRONMENT` a "sandbox"
- [ ] Creé producto y precio en Paddle Sandbox
- [ ] Obtuve Client Token de sandbox
- [ ] Actualicé todos los IDs en `.env`
- [ ] Reinicié la aplicación
- [ ] El checkout se abre sin error 403
- [ ] Puedo completar una transacción de prueba
- [ ] Contacté a Paddle Support sobre mi cuenta Live

---

## 🎯 PRÓXIMOS PASOS

1. **AHORA:** Usa Sandbox para continuar desarrollando
2. **MIENTRAS:** Contacta a Paddle Support para desbloquear tu cuenta Live
3. **DESPUÉS:** Una vez resuelto, cambia de vuelta a production con las credenciales correctas

---

## 🔗 RECURSOS

- Paddle Sandbox: https://sandbox-vendors.paddle.com/
- Paddle Support: support@paddle.com
- Documentación: https://developer.paddle.com/
- Test Cards: https://developer.paddle.com/concepts/payment-methods/credit-debit-card#test-card-numbers

---

## 🔴 ACTUALIZACIÓN: TOKEN DE PRUEBA EN MODO LIVE

### ⚠️ PROBLEMA IDENTIFICADO

Estás usando un **Client-side token de PRUEBA** en tu cuenta de **PRODUCCIÓN/LIVE**:
- Token visible: `***ae735` con descripción "prueba"
- Esto causa el error 403 porque Paddle rechaza tokens de test en modo live

---

## ✅ SOLUCIÓN INMEDIATA: Crear Token LIVE Correcto

### PASO 1: Elimina el token de "prueba"

1. En la pantalla de **Authentication → Client-side tokens**
2. Click en los **3 puntos (...)** del token "prueba"
3. **Delete/Eliminar**

### PASO 2: Crea un nuevo token LIVE

1. Click en **"+ New Client-side token"** (botón negro arriba a la derecha)
2. Configura:
   ```
   Name: Lealta Production Frontend
   Description: Token de producción para frontend
   ```

3. **Selecciona los scopes necesarios:**
   - ✅ `checkout:write` (para crear checkouts)
   - ✅ `product:read` (para leer productos)
   - ✅ `price:read` (para leer precios)
   - ✅ `customer:read` (para leer clientes)
   - ✅ `transaction:read` (para leer transacciones)
   
   **💡 Tip:** Selecciona TODOS los disponibles para estar seguro

4. Click **"Generate token"**

5. **COPIA EL TOKEN INMEDIATAMENTE** ← Solo se muestra una vez!
   - Debe empezar con `live_` (NO `test_`)
   - Ejemplo: `live_abc123def456...`

### PASO 3: Actualiza tu `.env`

```env
# Reemplaza AMBAS líneas con el nuevo token LIVE
PADDLE_CLIENT_TOKEN="live_NUEVO_TOKEN_AQUI"
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN="live_NUEVO_TOKEN_AQUI"

# Asegúrate que sigue en production
NEXT_PUBLIC_PADDLE_ENVIRONMENT="production"
```

### PASO 4: Reinicia tu app

```powershell
npm run dev
```

---

## 🎯 VERIFICACIÓN

Después de estos cambios, en la consola del navegador deberías ver:

```
✅ 🏗️ Paddle configurado en modo: production
✅ 🎯 Paddle Event: {type: 'checkout.loaded'}
❌ (Sin errores 403)
```

---

## 🚨 SI SIGUE SIN FUNCIONAR...

Es posible que tu cuenta LIVE tenga restricciones. En ese caso:

### ⬇️ CAMBIA TEMPORALMENTE A SANDBOX (Abajo hay instrucciones)
