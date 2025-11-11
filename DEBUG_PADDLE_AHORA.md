# 🔴 DEBUG: "Funcionaba hace un rato, ahora no"

## 🎯 PROBLEMA IDENTIFICADO

Tienes **variables duplicadas** con **valores diferentes** en tu `.env`:

```env
# Primera declaración (línea 87)
NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID="pri_01k9d95qvht02dqzvkw0h5876p"

# Segunda declaración (línea 107) - ¡DIFERENTE!
NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID="pri_01k9rf1r9jv9aa3fsjnzf34zkp"
```

**¿Qué pasa?**
- La última declaración SOBRESCRIBE la primera
- A veces Next.js usa el cache antiguo (funcionaba)
- Otras veces usa el nuevo (falla con 403)

---

## 🔍 CAUSAS DEL "FUNCIONABA Y AHORA NO"

### 1️⃣ **Price ID Inválido** (PROBABLE)

Uno de estos Price IDs no existe o está inactivo en tu Paddle Sandbox:
- `pri_01k9d95qvht02dqzvkw0h5876p` ← ¿Este es válido?
- `pri_01k9rf1r9jv9aa3fsjnzf34zkp` ← ¿Este es válido?

**Si el Price ID no existe:** Paddle devuelve 403

### 2️⃣ **Cache de Next.js**

Next.js cachea las variables `NEXT_PUBLIC_*`:
- Funcionaba = usaba cache con Price ID válido
- Ahora no = refresca cache y usa Price ID inválido

### 3️⃣ **Hot Reload no recargó el .env**

Cambios en `.env` requieren **reiniciar el servidor**:
```powershell
# CTRL+C para detener
npm run dev
```

---

## ✅ SOLUCIÓN PASO A PASO

### Paso 1: Verificar qué Price ID es válido

Ve a tu Paddle Sandbox:
https://sandbox-vendors.paddle.com/products

**Encuentra tu producto "Lealta Enterprise":**
1. Click en el producto
2. Ve a la pestaña **Prices**
3. Verifica cuál es el **Price ID activo**
4. Cópialo (algo como `pri_01xxxxx`)

### Paso 2: Limpiar tu .env (ELIMINAR DUPLICADOS)

Tu `.env` tiene variables duplicadas. Necesitas limpiarlo.

**Cuál usar:**
- ✅ Si `pri_01k9rf1r9jv9aa3fsjnzf34zkp` es el correcto → Usa ese
- ✅ Si `pri_01k9d95qvht02dqzvkw0h5876p` es el correcto → Usa ese
- ❌ Si ninguno funciona → Crea un nuevo Price en Paddle

### Paso 3: Reiniciar con cache limpio

```powershell
# 1. Detener el servidor (CTRL+C)

# 2. Limpiar cache de Next.js
Remove-Item -Recurse -Force .next

# 3. Limpiar cache de npm (opcional pero recomendado)
npm cache clean --force

# 4. Reiniciar
npm run dev
```

---

## 🧪 TEST RÁPIDO: ¿Qué Price ID está usando tu app ahora?

Abre la consola del navegador (F12) y ejecuta:

```javascript
// Ver qué Price ID está cargado
console.log('Price ID actual:', process.env.NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID);

// O busca en el window object
console.log('Variables públicas:', Object.keys(window).filter(k => k.includes('PADDLE')));
```

---

## 🎯 DIAGNÓSTICO ESPECÍFICO DEL 403

El error **403** en Paddle Sandbox puede ser por:

### A) Price ID no existe
```
pri_01k9rf1r9jv9aa3fsjnzf34zkp ← Este ID no está en tu dashboard
```

**Solución:** Crear o usar el Price ID correcto

### B) Price está ARCHIVED (archivado)
Puedes tener el Price creado pero en estado "Archived"

**Solución:** 
1. Ve al Price en dashboard
2. Reactivarlo

### C) Product no está publicado
El producto padre del Price no está en estado "Active"

**Solución:**
1. Ve a Products en dashboard
2. Verifica que esté "Active"

---

## ⚡ SOLUCIÓN INMEDIATA (3 minutos)

### Opción A: Usar el Price ID que funcionaba antes

Si recuerdas cuál funcionaba, usa ese:

1. Busca en tu historial de git:
```powershell
git log --all --full-history -p -- .env | Select-String "PADDLE_PLAN"
```

2. O revisa commits recientes:
```powershell
git log --oneline -10
```

### Opción B: Crear nuevo Price desde cero

Si ninguno funciona, crea uno nuevo limpio:

**En Paddle Dashboard:**
1. Ve a: https://sandbox-vendors.paddle.com/products
2. Abre tu producto (o crea uno nuevo)
3. **Prices → Add Price**
   - Amount: `250.00`
   - Currency: `USD`
   - Billing: `Monthly`
   - Status: **Active** ✅
4. **Copia el nuevo Price ID**
5. Actualiza tu `.env`:
   ```env
   NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID="pri_01NUEVO_ID_AQUI"
   ```

### Opción C: Simplificar el .env (RECOMENDADO)

Tu `.env` está muy desordenado con duplicados. Voy a limpiarlo.

---

## 🧹 .env LIMPIO (COPIA ESTO)

```env
# ========================================
# 💳 PADDLE SANDBOX CONFIGURATION
# ========================================

# Entorno
NEXT_PUBLIC_PADDLE_ENVIRONMENT="sandbox"

# Client Token (Frontend)
PADDLE_CLIENT_TOKEN="test_e7baca7d5de4072f974fbe36dce"
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN="test_e7baca7d5de4072f974fbe36dce"

# API Key (Backend)
PADDLE_API_KEY="pdl_sdbx_apikey_01k9rf68xsj4h0z25g1d4mnd5y_MMaejrm2wQ8MnpSCzjPXwA_APd"

# Webhook Secret
PADDLE_WEBHOOK_SECRET="ntfset_01k9rf9t8ta8tdd06q1vgk2qex"

# Vendor ID
PADDLE_VENDOR_ID="257347"

# ========================================
# 📋 PRICE IDs - USA EL QUE FUNCIONE
# ========================================

# Verifica en: https://sandbox-vendors.paddle.com/products
# Usa SOLO UNO de estos (el que esté activo en tu dashboard):

# Opción 1:
PADDLE_PLAN_ENTERPRISE_ID="pri_01k9rf1r9jv9aa3fsjnzf34zkp"
NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID="pri_01k9rf1r9jv9aa3fsjnzf34zkp"

# Opción 2 (comenta la opción 1 si usas esta):
# PADDLE_PLAN_ENTERPRISE_ID="pri_01k9d95qvht02dqzvkw0h5876p"
# NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID="pri_01k9d95qvht02dqzvkw0h5876p"

# Product ID
PADDLE_PRODUCT_ID="pro_01k9d940v6ppjbh0cknn5xz4t3"
NEXT_PUBLIC_PADDLE_PRODUCT_ID="pro_01k9d940v6ppjbh0cknn5xz4t3"
```

---

## 🔬 DEBUGGING EN VIVO

Cuando pruebes, abre DevTools y revisa:

```javascript
// 1. Verifica qué se está enviando a Paddle
// Busca en la pestaña Network la petición que falla

// 2. Ve a Network → Filter: "checkout-service"

// 3. Click en la petición 403

// 4. Ve a "Payload" o "Request" 
// Deberías ver algo como:
{
  items: [{ priceId: "pri_01xxxxx" }]
}

// 5. Copia ese Price ID y verifica si existe en tu dashboard
```

---

## 📊 CHECKLIST DE VERIFICACIÓN

```markdown
□ Verificar Price ID en Paddle Dashboard
  → Ve a: https://sandbox-vendors.paddle.com/products
  → Confirma que el Price existe y está "Active"

□ Eliminar duplicados del .env
  → Solo una declaración de cada variable

□ Limpiar cache de Next.js
  → Remove-Item -Recurse -Force .next

□ Reiniciar servidor
  → npm run dev

□ Probar en navegador con cache limpio
  → CTRL + F5 (hard refresh)
  → O modo incógnito

□ Verificar en DevTools qué Price ID se está usando
  → Network → checkout-service → Request payload
```

---

## 🎯 SI NADA FUNCIONA: FALLBACK

Usa Payment Links como alternativa temporal:

```typescript
// En tu componente donde llamas a Paddle:
const { createCheckoutWithLink } = usePaddle();

// En lugar de:
// await createCheckout({...})

// Usa:
await createCheckoutWithLink({
  priceId: 'pri_01k9rf1r9jv9aa3fsjnzf34zkp',
  businessId: businessId,
  customerEmail: user.email,
});
```

Esto evita el overlay y redirige a una página de Paddle directamente.

---

## 🚨 CAUSA MÁS PROBABLE

**TL;DR:**
1. Tienes 2 Price IDs diferentes en tu `.env`
2. Uno está inválido/archivado
3. El cache a veces usa el bueno, a veces el malo
4. Por eso "funcionaba y ahora no"

**Solución:** Verifica cuál Price ID es válido en tu dashboard y usa solo ese.

---

## 📞 SIGUIENTE ACCIÓN

1. Ve a tu dashboard: https://sandbox-vendors.paddle.com/products
2. Copia el Price ID correcto que veas ahí
3. Dime cuál es
4. Yo te ayudo a limpiar el .env

¿Qué Price ID ves en tu dashboard de Paddle? 🎯
