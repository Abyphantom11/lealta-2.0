# 🧪 GUÍA DE TESTING - PADDLE INTEGRATION

**Fecha:** 6 de noviembre, 2025  
**Objetivo:** Probar toda la integración de Paddle paso a paso

---

## 🎯 CHECKLIST DE TESTING

### ✅ FASE 1: Verificar que el código compila (2 min)

- [ ] Servidor corriendo sin errores
- [ ] No hay errores de TypeScript
- [ ] Cliente Prisma generado correctamente

### ✅ FASE 2: Testing sin credenciales (Modo Sandbox Local) (5 min)

- [ ] Página `/pricing` se carga correctamente
- [ ] Botones de "Contratar" funcionan
- [ ] Se abre el formulario de checkout
- [ ] Logs en consola muestran intentos de inicialización

### ✅ FASE 3: Configurar Paddle Sandbox (15 min)

- [ ] Crear cuenta en Paddle Sandbox
- [ ] Obtener credenciales de prueba
- [ ] Configurar variables de entorno
- [ ] Crear producto de prueba

### ✅ FASE 4: Testing de Checkout en Sandbox (10 min)

- [ ] Crear checkout exitoso
- [ ] Completar pago con tarjeta de prueba
- [ ] Verificar redirect a página de éxito
- [ ] Verificar webhook recibido

### ✅ FASE 5: Verificar Base de Datos (5 min)

- [ ] Tabla PaymentHistory tiene registros
- [ ] Business tiene subscriptionId
- [ ] Datos correctos en la BD

---

## 🚀 PASO 1: VERIFICAR QUE EL CÓDIGO COMPILA

Primero asegúrate de que tu servidor esté corriendo:

```bash
npm run dev
```

**Qué esperar:**
```
✓ Ready in 2.5s
○ Local: http://localhost:3001
```

**✅ Checkpoint:** Sin errores de compilación

---

## 🧪 PASO 2: TESTING LOCAL (Sin credenciales de Paddle)

### 2.1 Probar Página de Pricing

1. Ve a: `http://localhost:3001/pricing`
2. Deberías ver la página con el plan Enterprise

**✅ Checkpoint:** Página se carga sin errores

### 2.2 Intentar Crear Checkout

1. Click en "Contratar Solución Enterprise"
2. Abre la consola del navegador (F12)

**Qué esperar:**
```
🚀 Inicializando Paddle...
⚠️ Variable de entorno faltante: PADDLE_CLIENT_TOKEN - usando valor por defecto
❌ Error inicializando Paddle: [error]
```

**✅ Checkpoint:** El código intenta inicializar Paddle (aunque falle por falta de credenciales)

---

## 🔑 PASO 3: CONFIGURAR PADDLE SANDBOX

### 3.1 Crear Cuenta en Paddle Sandbox

1. Ve a: https://sandbox-vendors.paddle.com/signup
2. Completa el registro
3. Verifica tu email

### 3.2 Obtener Credenciales

Una vez dentro del dashboard:

#### A) Client Token (Frontend)
1. Ve a **Developer Tools** > **Authentication**
2. En la sección "Client-side tokens"
3. Click **"Generate new token"**
4. Selecciona scope: `read:products, read:prices`
5. Copia el token (formato: `live_xxxxx` o `test_xxxxx`)

#### B) API Key (Backend)
1. Ve a **Developer Tools** > **Authentication**
2. En la sección "API Keys"
3. Click **"Create API Key"**
4. Dale un nombre: "Lealta Backend"
5. Selecciona permisos: Todo (o al menos `transactions:write`, `subscriptions:read`)
6. Copia la clave (formato: empieza con muchos caracteres)

#### C) Webhook Secret
1. Ve a **Developer Tools** > **Notifications** > **Webhooks**
2. Click **"Create Webhook"**
3. URL: `https://tu-dominio-temporal.com/api/webhooks/paddle` (o deja en blanco por ahora)
4. Selecciona eventos:
   - `subscription.created`
   - `subscription.updated`
   - `subscription.canceled`
   - `transaction.completed`
   - `transaction.payment_failed`
5. Copia el **Webhook Secret** (formato: `pdl_whsec_xxxxx`)

### 3.3 Crear Producto de Prueba

1. Ve a **Catalog** > **Products**
2. Click **"Create Product"**
3. Configurar:
   - **Name:** Lealta Enterprise (Test)
   - **Description:** Plan enterprise para testing
4. Click "Save Product"
5. Ahora crea un precio:
   - Click **"Add Price"**
   - **Billing type:** Recurring
   - **Interval:** Monthly
   - **Amount:** 250.00 USD
6. Copia el **Price ID** (formato: `pri_01xxxxx`)

### 3.4 Actualizar Variables de Entorno

Edita tu archivo `.env.local` (o `.env`):

```env
# 💳 Paddle Sandbox Configuration
PADDLE_VENDOR_ID="tu_vendor_id"
PADDLE_CLIENT_TOKEN="test_xxxxxxxxxxxxxxxx"
PADDLE_API_KEY="tu_api_key_larga_aqui"
PADDLE_WEBHOOK_SECRET="pdl_whsec_xxxxxxxx"
NEXT_PUBLIC_PADDLE_ENVIRONMENT="sandbox"

# 📋 Price ID del producto de prueba
PADDLE_PLAN_ENTERPRISE_ID="pri_01xxxxxxxxx"
NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID="pri_01xxxxxxxxx"

# URL de tu app
NEXT_PUBLIC_APP_URL="http://localhost:3001"
```

### 3.5 Reiniciar Servidor

```bash
# Ctrl+C para detener
npm run dev
```

**✅ Checkpoint:** Servidor reiniciado con nuevas credenciales

---

## 🛒 PASO 4: PROBAR CHECKOUT EN SANDBOX

### 4.1 Ir a Pricing

1. Ve a: `http://localhost:3001/pricing`
2. Asegúrate de estar logueado (si no, loguéate primero)

### 4.2 Crear Checkout

1. Click en **"Contratar Solución Enterprise"**
2. Abre la consola del navegador

**Qué esperar:**
```
🚀 Inicializando Paddle...
✅ Paddle inicializado correctamente
🛒 Creando checkout con opciones: {...}
```

3. Deberías ser redirigido a la página de Paddle Checkout

### 4.3 Completar Pago de Prueba

En la página de Paddle:

1. Completa el formulario con:
   - **Email:** test@example.com (o cualquiera)
   - **Card Number:** `4242 4242 4242 4242` (Visa de prueba)
   - **Expiry:** Cualquier fecha futura (ej: 12/26)
   - **CVC:** 123
   - **Billing:** Cualquier dirección

2. Click **"Complete Payment"**

**✅ Checkpoint:** Pago procesado exitosamente

### 4.4 Verificar Redirect

Deberías ser redirigido a:
```
http://localhost:3001/billing/success?...
```

**Página debe mostrar:**
- ✅ Mensaje de éxito
- ✅ "¡Pago Recibido!"
- ✅ Botón para ir al dashboard

---

## 🔍 PASO 5: VERIFICAR BASE DE DATOS

### 5.1 Verificar PaymentHistory

Ejecuta este script:

```bash
node listar-qrs.js
```

O abre Prisma Studio:

```bash
npx prisma studio
```

**Qué buscar:**
1. Ve a tabla `PaymentHistory`
2. Debe haber un nuevo registro con:
   - ✅ `transactionId`
   - ✅ `amount` = 250
   - ✅ `status` = 'completed'
   - ✅ `businessId` del usuario

### 5.2 Verificar Business

En Prisma Studio:

1. Ve a tabla `Business`
2. Busca tu business
3. Debe tener:
   - ✅ `subscriptionId` poblado
   - ✅ `subscriptionStatus` = 'active'
   - ✅ `planId` = tu Price ID
   - ✅ `customerId` poblado

---

## 📊 PASO 6: VERIFICAR WEBHOOKS

### 6.1 Ver Logs del Servidor

En la terminal donde corre tu servidor, deberías ver:

```
🔗 Webhook recibido de Paddle
📨 Evento de Paddle: { type: 'subscription.created', id: 'sub_xxx' }
✅ Nueva suscripción creada: sub_xxx
✅ Business actualizado con nueva suscripción
```

### 6.2 Ver Webhooks en Paddle Dashboard

1. Ve a **Developer Tools** > **Notifications** > **Webhooks**
2. Click en tu webhook
3. Ve a la pestaña **"Recent deliveries"**
4. Deberías ver:
   - ✅ `subscription.created` - Status: 200
   - ✅ `transaction.completed` - Status: 200

---

## 🧪 PASO 7: TESTING ADICIONAL

### 7.1 Probar Cancelación

1. Ve a Paddle Dashboard
2. **Customers** > Busca el email de prueba
3. Click en la suscripción
4. **Actions** > **Cancel Subscription**
5. Verifica en logs del servidor:
   ```
   ❌ Suscripción cancelada: sub_xxx
   ✅ Suscripción marcada como cancelada
   ```

### 7.2 Probar Pago Fallido

1. En Paddle Dashboard
2. Ve a **Customers** > tu cliente de prueba
3. Simula un pago fallido desde el dashboard
4. Verifica logs:
   ```
   ❌ Pago fallido: txn_xxx
   ⚠️ ACCIÓN REQUERIDA: Notificar a business sobre pago fallido
   ```

### 7.3 Verificar que PaymentHistory guarda fallos

En Prisma Studio:
- Debe haber un registro con `status` = 'failed'

---

## 🎯 CHECKLIST FINAL

### ✅ Frontend
- [ ] Página `/pricing` carga correctamente
- [ ] Botón de checkout funciona
- [ ] Redirect a Paddle Checkout
- [ ] Redirect a success page después de pago
- [ ] No hay errores en consola del navegador

### ✅ Backend
- [ ] API `/api/billing/checkout` crea checkout exitoso
- [ ] Webhook `/api/webhooks/paddle` recibe eventos
- [ ] Logs muestran procesamiento correcto
- [ ] No hay errores en logs del servidor

### ✅ Base de Datos
- [ ] `PaymentHistory` tiene registros de transacciones
- [ ] `Business` actualizado con `subscriptionId`
- [ ] `subscriptionStatus` = 'active'
- [ ] Campos de trial (`trialEndsAt`) funcionan

### ✅ Paddle Dashboard
- [ ] Transacción aparece en Transactions
- [ ] Cliente creado en Customers
- [ ] Suscripción activa en Subscriptions
- [ ] Webhooks con status 200

---

## 🐛 TROUBLESHOOTING

### Problema: "Paddle no está inicializado"

**Causa:** Faltan credenciales o están mal configuradas

**Solución:**
1. Verifica `.env.local` tiene todas las variables
2. Reinicia el servidor
3. Limpia caché del navegador (Ctrl+Shift+R)

### Problema: "Checkout no se crea"

**Causa:** Price ID inválido o API Key incorrecta

**Solución:**
1. Verifica que `PADDLE_PLAN_ENTERPRISE_ID` sea correcto
2. Copia el Price ID exacto desde Paddle Dashboard
3. Verifica logs del servidor para ver el error específico

### Problema: "Webhooks no llegan"

**Causa:** URL del webhook incorrecta o localhost no accesible

**Solución:**
1. Para testing local, usa **ngrok**:
   ```bash
   npx ngrok http 3001
   ```
2. Copia la URL de ngrok (ej: `https://abc123.ngrok.io`)
3. Actualiza webhook en Paddle: `https://abc123.ngrok.io/api/webhooks/paddle`
4. Vuelve a hacer un pago de prueba

### Problema: "Error de firma de webhook"

**Causa:** `PADDLE_WEBHOOK_SECRET` incorrecto

**Solución:**
1. Ve a Paddle Dashboard > Webhooks
2. Copia el secret exacto
3. Actualiza `.env.local`
4. Reinicia servidor

---

## 📝 COMANDOS ÚTILES

```bash
# Ver logs del servidor en tiempo real
npm run dev

# Abrir Prisma Studio para ver BD
npx prisma studio

# Listar QRs y verificar estructura
node listar-qrs.js

# Verificar que Prisma esté actualizado
npx prisma generate

# Ver tablas de la BD
npx prisma db push --preview-feature
```

---

## 🎉 RESULTADO ESPERADO

Después de completar todos los pasos:

```
✅ Paddle inicializado correctamente
✅ Checkout creado exitosamente
✅ Pago procesado en sandbox
✅ Webhooks recibidos y procesados
✅ Base de datos actualizada
✅ PaymentHistory con transacciones
✅ Business con suscripción activa
```

---

## 🚀 PRÓXIMO PASO: PRODUCCIÓN

Una vez que todo funcione en sandbox:

1. Crear cuenta de producción en Paddle
2. Obtener credenciales de producción
3. Cambiar `NEXT_PUBLIC_PADDLE_ENVIRONMENT="production"`
4. Actualizar Price IDs con los de producción
5. Configurar webhook con URL de producción real
6. Deploy a producción
7. Hacer primer pago real

---

**¿Todo listo?** Sigue los pasos uno por uno y marca los checkboxes ✅

¡Buena suerte! 🍀
