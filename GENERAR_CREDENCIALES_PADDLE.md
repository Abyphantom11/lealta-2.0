# 🔑 GENERAR NUEVAS CREDENCIALES DE PADDLE - GUÍA PASO A PASO

## 🎯 NECESITAS OBTENER 6 COSAS DE PADDLE SANDBOX:

```
1. ✅ Client Token (Frontend)
2. ✅ API Key (Backend)
3. ✅ Webhook Secret
4. ✅ Vendor ID
5. ✅ Price ID (Plan Enterprise)
6. ✅ Product ID
```

---

## 📋 PASO 1: OBTENER CLIENT TOKEN (Crítico para el frontend)

### 1. Ve a Paddle Sandbox Dashboard:
```
https://sandbox-vendors.paddle.com/authentication
```

### 2. En la sección "Client-side tokens":
- Click en **"Generate token"**
- Name: `Lealta Frontend Token`
- Scopes: Selecciona **TODOS** (o al menos "Checkout")
- Click **"Generate"**

### 3. Copia el token que empieza con: `test_`

**Ejemplo:** `test_abc123def456ghi789`

📝 **PÉGALO AQUÍ:**
```
CLIENT_TOKEN = test_________________________________
```

---

## 📋 PASO 2: OBTENER API KEY (Para el backend)

### 1. En la misma página de Authentication:
```
https://sandbox-vendors.paddle.com/authentication
```

### 2. En la sección "API keys":
- Click en **"Generate key"**
- Name: `Lealta Backend Key`
- Click **"Generate"**

### 3. Copia el key que empieza con: `pdl_sdbx_`

**Ejemplo:** `pdl_sdbx_apikey_01abc123...`

📝 **PÉGALO AQUÍ:**
```
API_KEY = pdl_sdbx_________________________________
```

---

## 📋 PASO 3: OBTENER WEBHOOK SECRET

### 1. Ve a Notifications Settings:
```
https://sandbox-vendors.paddle.com/notifications
```

### 2. En "Notification settings":
- Click en **"Add destination"** (si no tienes uno)
- URL: `https://tu-app.vercel.app/api/webhooks/paddle`
- Type: **Webhook**
- Click **"Save"**

### 3. Una vez guardado:
- Click en el webhook que creaste
- Copia el **"Secret key"** que empieza con: `ntfset_`

**Ejemplo:** `ntfset_01abc123...`

📝 **PÉGALO AQUÍ:**
```
WEBHOOK_SECRET = ntfset_________________________________
```

**⚠️ Si no ves el secret key:** Puede que ya exista uno. Busca en la configuración.

---

## 📋 PASO 4: OBTENER VENDOR ID

### 1. Ve a Account Settings:
```
https://sandbox-vendors.paddle.com/settings/account
```

### 2. Busca "Vendor ID" o "Account ID"

**Es un número simple como:** `257347`

📝 **PÉGALO AQUÍ:**
```
VENDOR_ID = ___________
```

---

## 📋 PASO 5: OBTENER PRICE ID (El plan que vendes)

### 1. Ve a Products:
```
https://sandbox-vendors.paddle.com/products
```

### 2. Si ya tienes un producto "Lealta Enterprise":
- Click en el producto
- Ve a la pestaña **"Prices"**
- Copia el Price ID que empieza con: `pri_`

### 3. Si NO tienes producto, créalo:

**Crear Producto:**
- Click **"Create product"**
- Name: `Lealta Enterprise`
- Description: `Plan empresarial completo`
- Click **"Save"**

**Crear Price:**
- Dentro del producto, click **"Add price"**
- Amount: `250.00`
- Currency: `USD`
- Billing cycle: `Monthly` (Recurring)
- Status: **Active** ✅
- Click **"Save"**

### 4. Copia el Price ID:

**Ejemplo:** `pri_01abc123...`

📝 **PÉGALO AQUÍ:**
```
PRICE_ID = pri_01_________________________________
```

---

## 📋 PASO 6: OBTENER PRODUCT ID

### 1. En la misma página del producto:

Arriba verás el **Product ID** que empieza con: `pro_`

**Ejemplo:** `pro_01abc123...`

📝 **PÉGALO AQUÍ:**
```
PRODUCT_ID = pro_01_________________________________
```

---

## 📋 PASO 7: CONFIGURAR DOMINIO PERMITIDO (Importante para el 403)

### 1. Ve a Checkout Settings:
```
https://sandbox-vendors.paddle.com/settings/checkout
```

### 2. En "Allowed domains", agrega:

```
*.vercel.app
localhost:3000
tu-dominio-especifico.vercel.app
```

### 3. En "Default payment link success URL":

```
https://tu-app.vercel.app/success
```

### 4. Click **"Save"**

---

## ✅ PASO 8: DAME LAS 6 CREDENCIALES

Una vez que tengas todo, pégame:

```
CLIENT_TOKEN = test_________________________________
API_KEY = pdl_sdbx_________________________________
WEBHOOK_SECRET = ntfset_________________________________
VENDOR_ID = ___________
PRICE_ID = pri_01_________________________________
PRODUCT_ID = pro_01_________________________________
```

---

## 🎯 YO HARÉ AUTOMÁTICAMENTE:

1. ✅ Actualizar tu archivo `.env` local
2. ✅ Actualizar las variables en Vercel
3. ✅ Hacer redeploy
4. ✅ Verificar que funcione

---

## ⚡ ATAJO SI YA TIENES TODO CONFIGURADO:

Si ya tienes producto y prices, solo necesitas regenerar:

### Regenerar Client Token:
```
https://sandbox-vendors.paddle.com/authentication
→ Revoke el token viejo
→ Generate nuevo
```

### Regenerar API Key:
```
https://sandbox-vendors.paddle.com/authentication
→ Revoke el key viejo
→ Generate nuevo
```

---

## 🆘 SI TIENES PROBLEMAS:

**No puedes acceder al dashboard:**
- Ve a: https://sandbox-vendors.paddle.com/
- Si no tienes cuenta: Sign up
- Es GRATIS para sandbox

**No encuentras alguna sección:**
- Usa el buscador en el dashboard (arriba)
- O busca en el menú lateral

**No puedes generar tokens:**
- Verifica que estás en modo **SANDBOX** (selector arriba a la derecha)
- Logout y vuelve a entrar

---

## 📞 CUANDO TENGAS LAS 6 CREDENCIALES:

Simplemente pégalas en el chat y yo:
1. Las configuro en tu `.env`
2. Las subo a Vercel
3. Hago redeploy
4. ¡Listo! 🚀

---

## ⏱️ TIEMPO ESTIMADO: 10-15 minutos

¿Empezamos? 🎯
