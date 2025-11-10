# 🚨 ERROR: "Transaction checkout creation is blocked for this vendor"

## ⚠️ PROBLEMA IDENTIFICADO:

```
API Error: Transaction checkout creation is blocked for this vendor.
```

**Tu cuenta de Paddle Production tiene checkouts BLOQUEADOS.**

---

## 🔍 CAUSAS POSIBLES:

### 1. **Cuenta Nueva - Onboarding Incompleto**
Paddle bloquea checkouts en cuentas nuevas hasta que:
- ✅ Completes información de negocio
- ✅ Configures bank details (cómo recibirás pagos)
- ✅ Completes tax information
- ✅ Aceptes términos adicionales

### 2. **Restricciones de País**
Algunos países requieren aprobación manual de Paddle

### 3. **Billing Information Faltante**
Necesitas configurar cómo recibirás los pagos

---

## ✅ SOLUCIÓN A LARGO PLAZO: Desbloquear Production

### Paso 1: Completar Onboarding

Ve a: https://vendors.paddle.com/settings/account

**Verifica que TODO esté completo:**
- ✅ Business Information
- ✅ Tax Details
- ✅ **Bank Account Details** ← MUY IMPORTANTE
- ✅ Payment Settings

### Paso 2: Contactar Paddle Support

Si todo está completo pero sigue bloqueado:

**Email:** support@paddle.com

**Mensaje sugerido:**
```
Subject: Request to Enable Transaction Checkouts

Hi Paddle Team,

I have completed all required information in my account:
- Business details: Complete
- Tax information: Complete
- Bank account: Configured
- Account verification: Passed

However, I'm getting this error when creating checkouts:
"Transaction checkout creation is blocked for this vendor"

Account Email: abyphntom@gmail.com
Could you please enable checkout creation for my account?

Thank you!
```

### Paso 3: Esperar Activación (1-3 días hábiles)

---

## 🧪 SOLUCIÓN INMEDIATA: Usar SANDBOX

Mientras esperas la activación de Production, usa **Sandbox**:

### ✅ VENTAJAS DE SANDBOX:
- Sin bloqueos ni restricciones
- Funciona inmediatamente
- Pruebas seguras sin pagos reales
- Tarjeta de prueba: 4242 4242 4242 4242

---

## 📝 CONFIGURAR SANDBOX (5 minutos):

### 1. Ve a Paddle Sandbox:
```
https://sandbox-vendors.paddle.com/
```

Login con las **MISMAS credenciales** de tu cuenta principal

---

### 2. Crear Producto de Prueba:

**Catalog > Products > Create Product**

```
Name: Lealta Enterprise (Sandbox)
Description: Plan de prueba
```

Click **"Save"**

Copia el Product ID: `pro_xxx...`

---

### 3. Crear Precio de Prueba:

Dentro del producto, click **"Add Price"**

```
Amount: $250.00
Currency: USD
Billing: Recurring ✅
Interval: Monthly ✅
```

Click **"Save"**

**Copia el Price ID:** `pri_xxx...` ← Esto lo necesitas

---

### 4. Obtener Client Token de Sandbox:

**Developer Tools > Authentication > Client-side tokens**

Click **"Generate token"**

```
Name: Lealta Sandbox Token
Scopes: Selecciona todos
```

**Copia el token:** `test_xxx...` ← Empieza con "test_"

---

### 5. Actualizar `.env`:

Ya cambié el ambiente a "sandbox", solo necesitas actualizar:

```env
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN="test_xxx..."
NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID="pri_xxx..."
```

Pega aquí los 2 valores cuando los tengas.

---

### 6. Reiniciar Servidor:

```powershell
npm run dev
```

---

### 7. Probar con Tarjeta de Prueba:

```
Número: 4242 4242 4242 4242
Fecha: 12/26 (cualquier fecha futura)
CVV: 123
```

---

## 🎯 RESUMEN:

**Para PROBAR AHORA:**
1. Configura Sandbox (5 minutos)
2. Usa tarjeta 4242
3. Desarrolla y prueba todo

**Para PRODUCCIÓN (cuando esté listo):**
1. Completa bank details en Production
2. Contacta a Paddle Support si sigue bloqueado
3. Espera activación
4. Cambia de "sandbox" a "production" en `.env`

---

**¿Quieres configurar Sandbox ahora o prefieres contactar a Paddle Support primero?** 🤔
