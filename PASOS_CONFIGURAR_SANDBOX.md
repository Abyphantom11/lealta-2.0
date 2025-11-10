# 🧪 CONFIGURACIÓN COMPLETA DE PADDLE SANDBOX - PASO A PASO

## 📍 PASO 1: ACCEDER A SANDBOX

### Opción A: Desde tu Dashboard actual

1. Ve a tu dashboard de Paddle: https://vendors.paddle.com/
2. En la **barra superior derecha**, busca tu nombre/avatar
3. Click en el **selector de ambiente** (puede decir "Live" o "Production")
4. Selecciona **"Sandbox"** o **"Test Mode"**

### Opción B: Crear cuenta de Sandbox directamente

Si no ves el selector, ve directamente a:
```
https://sandbox-vendors.paddle.com/signup
```

O prueba:
```
https://vendors.paddle.com/
```
Y busca el switch de "Sandbox/Live" en la esquina superior derecha

---

## 📍 PASO 2: CREAR PRODUCTO DE PRUEBA

Una vez en Sandbox:

### 1. Ve a **"Catalog"** en el menú lateral izquierdo

### 2. Click en **"Products"**

### 3. Click en **"Create Product"** o **"Add Product"**

### 4. Llena el formulario:
```
Product Name: Lealta Enterprise (Test)
Description: Plan de prueba para desarrollo
```

### 5. Click **"Save"** o **"Create"**

### 6. **COPIA EL PRODUCT ID** (empieza con `pro_`)

---

## 📍 PASO 3: CREAR PRECIO DE PRUEBA

Dentro del producto que acabas de crear:

### 1. Busca la sección **"Prices"**

### 2. Click en **"Add Price"** o **"Create Price"**

### 3. Configura el precio:
```
✅ Unit price: 250.00
✅ Currency: USD
✅ Billing cycle: Monthly
✅ Type: Recurring (no "One-time")
✅ Billing period: Monthly
```

### 4. Click **"Save"**

### 5. **COPIA EL PRICE ID** ← MUY IMPORTANTE
```
pri_01xxxxxxxxxxxxxxxxxxxxx
```

---

## 📍 PASO 4: OBTENER CLIENT TOKEN DE SANDBOX

### 1. Ve a **"Developer tools"** o **"Settings"** en el menú

### 2. Click en **"Authentication"**

### 3. Busca **"Client-side tokens"**

### 4. Click en **"Generate token"** o **"Create token"**

### 5. Configura:
```
Name: Lealta Sandbox Frontend
Scopes: Selecciona TODOS los disponibles
```

Los scopes importantes:
- ✅ read:products
- ✅ read:prices  
- ✅ write:checkouts
- ✅ read:customers
- ✅ write:transactions

### 6. Click **"Generate"**

### 7. **COPIA EL TOKEN** ← Solo se muestra UNA VEZ
```
test_xxxxxxxxxxxxxxxxxxxxx
```

⚠️ **IMPORTANTE:** Debe empezar con `test_` (no `live_`)

---

## 📍 PASO 5: PEGAR AQUÍ LOS VALORES

Una vez que tengas los 2 valores, pégalos aquí en este formato:

```
CLIENT_TOKEN: test_abc123def456...
PRICE_ID: pri_01xyz789...
```

Y yo los configuraré automáticamente en tu `.env`

---

## 🔍 SI NO ENCUENTRAS EL SELECTOR DE SANDBOX:

### Alternativa 1: URL Directa con parámetro
```
https://vendors.paddle.com/?environment=sandbox
```

### Alternativa 2: Desde Settings
1. Settings > Account Settings
2. Busca "Environment" o "Sandbox Mode"
3. Activa el modo Sandbox

### Alternativa 3: Crear cuenta nueva de Sandbox
Si tu cuenta es muy nueva, puede que necesites crear una cuenta de sandbox separada:
```
https://sandbox-vendors.paddle.com/signup
```

---

## 📋 CHECKLIST DE VERIFICACIÓN:

- [ ] Estoy en modo Sandbox (no Live/Production)
- [ ] Creé un producto de prueba
- [ ] Agregué un precio de $250/mes recurrente
- [ ] Copié el Price ID (empieza con pri_)
- [ ] Generé un Client Token de sandbox
- [ ] El token empieza con `test_` (no `live_`)

---

## 🎯 DESPUÉS DE CONFIGURAR:

1. Pega aquí Client Token y Price ID
2. Yo los configuro en `.env`
3. Reinicias el servidor (npm run dev)
4. Pruebas con tarjeta: **4242 4242 4242 4242**
5. ¡Funciona! 🎉

---

## 💡 TIPS:

- **Sandbox NO procesa pagos reales**
- **Usa tarjetas de prueba:** 4242 4242 4242 4242
- **Todo es idéntico a Production** (mismo flujo)
- **Cuando Production esté listo**, solo cambias las credenciales

---

**¿En qué paso estás? ¿Necesitas ayuda con alguno?** 🤔
