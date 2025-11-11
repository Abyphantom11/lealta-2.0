# 🚨 SOLUCIÓN: "Transaction checkout creation is blocked"

## ❌ EL PROBLEMA

Error: **"Transaction checkout creation is blocked for this vendor"**

Tu cuenta de Paddle LIVE está **bloqueada** para crear checkouts. Esto es normal y pasa porque:

1. **Cuenta nueva sin historial de transacciones**
2. **Paddle requiere aprobación para LIVE**
3. **Necesitas usar SANDBOX para desarrollo**

---

## ✅ SOLUCIÓN: Usar Paddle Sandbox

### ¿Por qué Sandbox?

- ✅ **No hay restricciones** - Puedes probar libremente
- ✅ **Tarjetas de prueba** - No cobras dinero real
- ✅ **Desarrollo seguro** - Sin riesgo de transacciones reales
- ✅ **Cuando funcione en Sandbox** - Migras a LIVE

### ¿Cuándo usar LIVE?

Solo cuando:
- Tengas clientes reales
- Paddle apruebe tu cuenta
- Estés listo para producción

---

## 🚀 PASOS PARA CAMBIAR A SANDBOX

### PASO 1: Obtener credenciales de Sandbox

1. **Ve a Paddle Sandbox:**
   ```
   https://sandbox-vendors.paddle.com/
   ```

2. **Inicia sesión** (usa las mismas credenciales de tu cuenta LIVE)

3. **Obtener Client Token de Sandbox:**
   - Ve a: **Developer Tools → Authentication**
   - Sección: **"Client-side tokens"**
   - Click: **"Generate token"**
   - Name: `Lealta Sandbox`
   - Scopes: Selecciona TODOS
   - Click: **"Generate"**
   - **⚠️ COPIA EL TOKEN** (empieza con `test_`)
   
4. **Obtener API Key de Sandbox:**
   - En la misma página (Developer Tools → Authentication)
   - Sección: **"API Keys"**
   - Click: **"Generate Key"**
   - Name: `Lealta Sandbox API`
   - Scopes: Selecciona TODOS
   - Click: **"Generate"**
   - **⚠️ COPIA EL API KEY** (empieza con `pdl_test_`)

5. **Obtener Webhook Secret (Opcional):**
   - Ve a: **Developer Tools → Notifications**
   - Click: **"Create destination"**
   - URL: `https://tu-url-ngrok.io/api/webhooks/paddle` (o localhost)
   - Events: Selecciona los que necesites
   - Click: **"Save"**
   - **⚠️ COPIA EL SECRET** (empieza con `ntfset_test_`)

---

### PASO 2: Crear un Producto de Prueba

1. **Ve a:** https://sandbox-vendors.paddle.com/products

2. **Crear Producto:**
   - Click: **"Create Product"**
   - Name: `Lealta Enterprise (Test)`
   - Description: `Plan empresarial de prueba`
   - Tax category: `SaaS / Software`
   - Click: **"Save"**
   - **⚠️ COPIA EL PRODUCT ID** (empieza con `pro_`)

3. **Crear Precio:**
   - Dentro del producto, sección **"Prices"**
   - Click: **"Add Price"**
   - Name: `Monthly Test`
   - Price: `250.00` USD
   - Billing period: `Monthly`
   - Type: `Recurring`
   - Click: **"Save"**
   - **⚠️ COPIA EL PRICE ID** (empieza con `pri_`)

---

### PASO 3: Actualizar tu .env.local

Abre tu archivo `.env.local` y actualiza TODAS estas variables:

```env
# ==================================
# 💳 PADDLE BILLING CONFIGURATION
# ==================================
# Entorno: SANDBOX (Desarrollo y Pruebas)

# Backend API Key
PADDLE_API_KEY="pdl_test_TU_API_KEY_AQUI"

# Frontend Client Token
PADDLE_CLIENT_TOKEN="test_TU_TOKEN_AQUI"
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN="test_TU_TOKEN_AQUI"

# Webhook Secret
PADDLE_WEBHOOK_SECRET="ntfset_test_TU_SECRET_AQUI"

# Environment
NEXT_PUBLIC_PADDLE_ENVIRONMENT="sandbox"

# 📋 PADDLE PLANS - PRICE IDs
PADDLE_PLAN_ENTERPRISE_ID="pri_TU_PRICE_ID_AQUI"
NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID="pri_TU_PRICE_ID_AQUI"

# Product ID
PADDLE_PRODUCT_ID="pro_TU_PRODUCT_ID_AQUI"
NEXT_PUBLIC_PADDLE_PRODUCT_ID="pro_TU_PRODUCT_ID_AQUI"
```

---

### PASO 4: Verificar la configuración

Guarda el archivo y ejecuta:

```powershell
node probar-paddle-completo.js
```

Deberías ver:
- ✅ Credenciales configuradas
- ✅ Entorno: SANDBOX (Pruebas)
- ✅ Conexión con API exitosa

---

### PASO 5: Reiniciar tu aplicación

```powershell
# Detén el servidor si está corriendo (Ctrl+C)
npm run dev
```

---

### PASO 6: Probar checkout de Sandbox

1. Ve a: `http://localhost:3001/pricing`
2. Click en "Subscribe"
3. Debería abrirse el checkout de Paddle

**Usar tarjeta de prueba:**
```
Número: 4242 4242 4242 4242
Fecha: 12/30
CVV: 123
```

---

## 📝 CHECKLIST DE MIGRACIÓN A SANDBOX

- [ ] Obtener Client Token de Sandbox (`test_...`)
- [ ] Obtener API Key de Sandbox (`pdl_test_...`)
- [ ] Crear producto en Sandbox
- [ ] Crear precio en Sandbox
- [ ] Copiar Product ID (`pro_...`)
- [ ] Copiar Price ID (`pri_...`)
- [ ] Actualizar `.env.local` con todas las credenciales
- [ ] Cambiar `NEXT_PUBLIC_PADDLE_ENVIRONMENT` a `"sandbox"`
- [ ] Verificar con `node probar-paddle-completo.js`
- [ ] Reiniciar app: `npm run dev`
- [ ] Probar checkout con tarjeta de prueba

---

## 🎯 DESPUÉS DE SANDBOX

Una vez que todo funcione en Sandbox:

### Opción A: Continuar en Sandbox
- Perfecto para desarrollo
- Sin riesgo de cobros reales
- Puedes desarrollar toda tu app

### Opción B: Migrar a LIVE
Solo cuando:
1. Tu app esté lista para producción
2. Tengas clientes reales
3. Paddle apruebe tu cuenta (puede requerir documentación)

---

## 🆘 SI NECESITAS AYUDA

Puedo ayudarte:
1. A obtener las credenciales de Sandbox
2. A actualizar el `.env.local` con los valores correctos
3. A crear productos de prueba
4. A probar el primer checkout

**¿Quieres que te guíe paso a paso?** Dime en qué paso estás y te ayudo. 😊

---

## 📚 RECURSOS

- **Paddle Sandbox Dashboard:** https://sandbox-vendors.paddle.com/
- **Guía completa:** `GUIA_RAPIDA_PADDLE_SANDBOX.md`
- **Tarjetas de prueba:** https://developer.paddle.com/concepts/payment-methods/credit-debit-card
