# 🔑 CREDENCIALES DE PADDLE - CHECKLIST

## ✅ Credenciales que ya tienes:

1. **✅ PADDLE_API_KEY (Backend):**
   ```
   apikey_01k8m6ka12hs2f6rhstmd5dfa3
   ```

---

## ⚠️ CREDENCIALES QUE FALTAN (Necesarias para que funcione):

### 2. **PADDLE_CLIENT_TOKEN (Frontend)** - OBLIGATORIO
**¿Dónde obtenerlo?**
1. Ve a: https://sandbox-vendors.paddle.com/authentication
2. Busca la sección **"Client-side tokens"**
3. Click en **"Generate new token"**
4. Selecciona permisos: `read:products`, `read:prices`
5. Copia el token que empieza con `test_` o `live_`

**Formato esperado:**
```
test_xxxxxxxxxxxxxxxxxxxxxxxx
```

---

### 3. **PADDLE_WEBHOOK_SECRET** - OBLIGATORIO
**¿Dónde obtenerlo?**
1. Ve a: https://sandbox-vendors.paddle.com/notifications/webhooks
2. Click en **"Create Webhook"**
3. URL del webhook: `https://tu-dominio.com/api/webhooks/paddle` (puedes dejarlo en blanco por ahora)
4. Selecciona estos eventos:
   - ✅ `subscription.created`
   - ✅ `subscription.updated`
   - ✅ `subscription.canceled`
   - ✅ `transaction.completed`
   - ✅ `transaction.payment_failed`
5. Click "Save"
6. Copia el **Webhook Secret** que empieza con `pdl_whsec_`

**Formato esperado:**
```
pdl_whsec_xxxxxxxxxxxxxxxxxxxxxxxx
```

---

### 4. **PADDLE_PLAN_ENTERPRISE_ID (Price ID)** - OBLIGATORIO
**¿Dónde obtenerlo?**
1. Ve a: https://sandbox-vendors.paddle.com/products
2. Click en **"Create Product"**
3. Nombre: `Lealta Enterprise`
4. Descripción: `Plan enterprise para testing`
5. Click "Save"
6. Ahora click en **"Add Price"**
7. Configurar:
   - Billing: **Recurring**
   - Interval: **Monthly**
   - Amount: **250.00 USD**
8. Click "Save"
9. Copia el **Price ID** que empieza con `pri_`

**Formato esperado:**
```
pri_01xxxxxxxxxxxxxxxxxxxxxxxx
```

---

### 5. **PADDLE_VENDOR_ID** - OPCIONAL (pero recomendado)
**¿Dónde obtenerlo?**
1. Ve a: https://sandbox-vendors.paddle.com/settings/account
2. Busca **"Vendor ID"** o **"Seller ID"**
3. Es un número de 5-6 dígitos

**Formato esperado:**
```
12345
```

---

## 📝 RESUMEN - Lo que necesitas buscar en Paddle:

```
1. ✅ API Key (Backend)          → Ya la tienes ✓
2. ⚠️ Client Token (Frontend)    → Ir a Authentication
3. ⚠️ Webhook Secret              → Ir a Notifications > Webhooks
4. ⚠️ Price ID (Plan Enterprise)  → Ir a Products > Create Product
5. ⚠️ Vendor ID (Opcional)        → Ir a Settings > Account
```

---

## 🚀 Una vez que tengas todas las credenciales:

Pégalas aquí en el chat en este formato:

```
CLIENT_TOKEN: test_xxxxx
WEBHOOK_SECRET: pdl_whsec_xxxxx
PRICE_ID: pri_01xxxxx
VENDOR_ID: 12345 (opcional)
```

Y yo crearé automáticamente tu archivo `.env.local` configurado.

---

## 💡 TIPS:

- **Usa el ambiente SANDBOX** (no producción) para testing
- Las credenciales de sandbox empiezan con `test_` o `sandbox_`
- No compartas estas credenciales públicamente
- El Client Token es para el FRONTEND (Next.js público)
- La API Key es para el BACKEND (Next.js API routes)

---

**¿Listo para ir a buscar las otras 3-4 credenciales?** 🔍
