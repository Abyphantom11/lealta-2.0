# 💳 PADDLE CHECKOUT COMPLETO - LISTO PARA FACTURAR

## ✅ CAMBIOS REALIZADOS

### 1. Variables de Entorno Actualizadas
```env
✅ NEXT_PUBLIC_PADDLE_CLIENT_TOKEN = live_36ddf9a4003f105fc2730fae735
✅ NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID = pri_01k9d95qvht02dqzvkw0h5876p
✅ PADDLE_WEBHOOK_SECRET = ntfset_01k9d9j96f9whgz0qtdke3tb6a
✅ PADDLE_API_KEY = pdl_live_apikey_01k8m6ka12hs2f6rhstmd5dfa3_...
```

### 2. Checkout Overlay Implementado
- ✅ Ya NO redirige a otra página
- ✅ Muestra formulario de pago inline (modal/overlay)
- ✅ Pide número de tarjeta, CVV, fecha, etc.
- ✅ Maneja el pago directamente en tu app
- ✅ Envía correo de factura automáticamente

---

## 🚀 CÓMO PROBAR AHORA

### Paso 1: Reiniciar el Servidor
```powershell
# Detener el servidor actual (Ctrl+C)
# Luego:
npm run dev
```

**¿Por qué?** Las variables `NEXT_PUBLIC_*` solo se cargan al iniciar Next.js

---

### Paso 2: Ir a la Página de Pricing
```
http://localhost:3001/pricing
```

O si estás logueado como admin:
```
http://localhost:3001/[tu-businessId]/admin/configuracion/suscripcion
```

---

### Paso 3: Click en "Suscribirme Ahora"

**Qué debería pasar:**
1. Se abre un **overlay/modal de Paddle** sobre tu página
2. Ves un formulario con:
   - ✅ Email (pre-llenado)
   - ✅ Número de tarjeta
   - ✅ Fecha de vencimiento
   - ✅ CVV
   - ✅ Nombre en la tarjeta
   - ✅ Dirección de facturación
3. El precio muestra: **$250 USD/mes**

---

### Paso 4: Usar Tarjeta de Prueba

**🧪 TARJETA DE PRUEBA (Paddle Sandbox):**
```
Número: 4242 4242 4242 4242
Fecha: 12/26 (o cualquier fecha futura)
CVV: 123
Nombre: Test User
Dirección: Cualquier dirección
```

**⚠️ IMPORTANTE:**
- Si estás en **modo production**, se cobrará dinero real
- Para pruebas, cambia a sandbox en `.env`:
  ```env
  NEXT_PUBLIC_PADDLE_ENVIRONMENT="sandbox"
  NEXT_PUBLIC_PADDLE_CLIENT_TOKEN="test_xxxxx" # Token de sandbox
  ```

---

### Paso 5: Completar el Pago

1. Llena todos los campos del formulario
2. Click en **"Pay $250"** o **"Subscribe"**
3. Paddle procesa el pago (tarda 2-5 segundos)

**Qué debería pasar:**
- ✅ El overlay se cierra
- ✅ Eres redirigido a `/billing/success`
- ✅ Paddle envía correo de confirmación/factura
- ✅ Webhook actualiza la base de datos

---

## 📧 VERIFICAR CORREOS DE FACTURA

### Paddle envía automáticamente:
1. **Confirmación de pago** - Inmediatamente después del pago
2. **Factura (Invoice)** - Con el recibo detallado
3. **Recordatorio de próximo pago** - Antes del siguiente ciclo

**¿Dónde verificar?**
- Revisa la bandeja de entrada del email que usaste
- Si no llega, revisa **spam/junk**
- En Paddle Dashboard > **Customers** > busca el email > ver transacciones

---

## 🔍 VERIFICAR EN DATABASE

Después del pago, verifica que se actualizó:

```sql
-- En Prisma Studio o tu DB client:
SELECT 
  id,
  name,
  subscriptionId,
  subscriptionStatus,
  planId,
  subscriptionEndsAt
FROM Business
WHERE email = 'tu-email@test.com';

-- También verifica historial:
SELECT *
FROM PaymentHistory
ORDER BY createdAt DESC
LIMIT 5;
```

**Campos que deberían actualizarse:**
- ✅ `subscriptionId` = "sub_xxxxx" (ID de Paddle)
- ✅ `subscriptionStatus` = "active"
- ✅ `planId` = "ENTERPRISE"
- ✅ `subscriptionEndsAt` = fecha del próximo pago

---

## 🐛 TROUBLESHOOTING

### Problema 1: "No se abre el overlay, solo veo un botón"
**Solución:**
1. Verifica que reiniciaste el servidor después de cambiar `.env`
2. Abre la consola (F12) y busca:
   ```
   ✅ Paddle inicializado correctamente
   🛒 Creando checkout con Paddle Overlay
   ```
3. Si ves `❌ Error inicializando Paddle`, revisa las credenciales

---

### Problema 2: "Se abre el overlay pero no pide tarjeta"
**Solución:**
1. Verifica que `NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID` sea el correcto
2. Ve a Paddle Dashboard > Catalog > Prices
3. Copia el ID exacto (formato: `pri_01xxxxx`)
4. Pégalo en `.env` y reinicia

---

### Problema 3: "No recibo correos de factura"
**Solución:**
1. Ve a Paddle Dashboard > Settings > Email Settings
2. Verifica que **"Send receipts"** esté habilitado
3. Verifica el email en **Customers** > busca tu email
4. Revisa spam/junk en tu bandeja

---

### Problema 4: "Error: invalid price_id"
**Solución:**
- El Price ID que tienes (`pri_01k9d95qvht02dqzvkw0h5876p`) debe existir en Paddle
- Ve a: https://vendors.paddle.com/catalog/prices
- Si no existe, crea uno nuevo:
  1. Click "Create Price"
  2. Producto: "Lealta Enterprise"
  3. Precio: $250 USD
  4. Billing: Recurring (Monthly)
  5. Copia el nuevo ID y actualiza `.env`

---

### Problema 5: "Webhook no actualiza la base de datos"
**Solución:**
1. Verifica que el webhook esté configurado en Paddle:
   ```
   URL: https://lealta.app/api/webhooks/paddle
   Events: subscription.created, transaction.completed
   ```
2. Verifica que `PADDLE_WEBHOOK_SECRET` sea correcto
3. Prueba el webhook manualmente desde Paddle Dashboard

---

## 🎯 CHECKLIST FINAL

Antes de contactar clientes:

- [ ] ✅ Paddle Overlay se abre correctamente
- [ ] ✅ Formulario pide tarjeta, CVV, fecha
- [ ] ✅ Pago de prueba funciona (tarjeta 4242...)
- [ ] ✅ Redirect a `/billing/success` después del pago
- [ ] ✅ Correo de factura llega al email
- [ ] ✅ Base de datos se actualiza con `subscriptionId`
- [ ] ✅ Webhook procesa correctamente los eventos

---

## 🚀 PRÓXIMO PASO: ACTIVAR PRODUCCIÓN

Cuando todo funcione en sandbox:

1. **Cambiar a modo Production:**
   ```env
   NEXT_PUBLIC_PADDLE_ENVIRONMENT="production"
   NEXT_PUBLIC_PADDLE_CLIENT_TOKEN="live_36ddf9a4003f105fc2730fae735"
   ```

2. **Verificar Price ID de producción:**
   - Ve a Paddle Dashboard (producción)
   - Catalog > Prices
   - Verifica que el Price ID sea correcto

3. **Probar con tarjeta real:**
   - ⚠️ Esto cobrará dinero real
   - Usa tu propia tarjeta primero para verificar
   - Verifica que recibas el correo de factura

4. **Contactar clientes:**
   - Envía link: `https://lealta.app/pricing`
   - O: `https://lealta.app/[businessId]/admin/configuracion/suscripcion`

---

## 📊 DASHBOARD DE PADDLE

Para monitorear pagos:
```
https://vendors.paddle.com/dashboard
```

**Secciones importantes:**
- **Customers** - Lista de todos tus clientes
- **Subscriptions** - Todas las suscripciones activas
- **Transactions** - Historial de pagos
- **Invoices** - Facturas generadas

---

## 💰 PRECIOS ACTUALES

```
Plan Enterprise: $250 USD/mes por negocio
```

**¿Cómo cambiar el precio?**
1. Ve a Paddle Dashboard > Catalog > Prices
2. Edita el precio existente o crea uno nuevo
3. Copia el nuevo Price ID
4. Actualiza `NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID` en `.env`
5. Reinicia el servidor

---

## 🎉 ¡LISTO PARA FACTURAR!

Una vez que completes el checklist:
1. Cambia a modo **production**
2. Haz una prueba con tu propia tarjeta
3. Verifica que llegue el correo
4. **¡Empieza a facturar! 💸**

---

**¿Dudas o problemas?** Revisa los logs en:
- Consola del navegador (F12)
- Terminal del servidor (npm run dev)
- Paddle Dashboard > Notifications > Webhooks > Ver logs
