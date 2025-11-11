# ✅ ACTUALIZAR PRICE ID EN VERCEL

## 🔴 El Problema

El proyecto en Vercel tiene configurado el Price ID de **LIVE** (producción) cuando debería usar el de **SANDBOX**.

## 📋 Price IDs Correctos

### **Sandbox** (para pruebas) ✅ USAR ESTE:
```
pri_01k9rf1r9jv9aa3fsjnzf34zkp
```
- Nombre: Full stack
- Precio: $250.00 USD/mes
- Entorno: Sandbox

### **Live** (producción real) ❌ NO USAR POR AHORA:
```
pri_01k9d95qvht02dqzvkw0h5876p
```

---

## ✅ Solución: Actualizar en Vercel

### **1. Ve a Environment Variables:**
```
https://vercel.com/[tu-usuario]/lealta-2-0/settings/environment-variables
```

### **2. Busca y actualiza estas variables:**

#### Variable 1:
```
Nombre: NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID
Valor: pri_01k9rf1r9jv9aa3fsjnzf34zkp
Environments: ✅ Production ✅ Preview
```

#### Variable 2:
```
Nombre: PADDLE_PLAN_ENTERPRISE_ID
Valor: pri_01k9rf1r9jv9aa3fsjnzf34zkp
Environments: ✅ Production ✅ Preview
```

### **3. Guardar y Redeploy:**

Después de actualizar:
1. Guarda los cambios
2. Ve a Deployments
3. Último deployment → "..." → "Redeploy"
4. Espera 1-2 minutos

---

## 🧪 Verificar que funcionó:

1. **Abre:** `lealta.app/pricing`
2. **Recarga con caché limpia:** Ctrl+Shift+R
3. **Abre el checkout**
4. **Ya NO debería dar error 401** ✅
5. **El precio debe mostrar:** $250.00 USD/mes

---

## 📊 Resumen de Variables Sandbox Completas:

```bash
# API Keys
PADDLE_API_KEY=pdl_sdbx_apikey_01k9rf68xsj4h0z25g1d4mnd5y_MMaejrm2wQ8MnpSCzjPXwA_APd
PADDLE_CLIENT_TOKEN=test_e7baca7d5de4072f974fbe36dce
PADDLE_WEBHOOK_SECRET=ntfset_01k9rf9t8ta8tdd06q1vgk2qex

# Public Variables
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=test_e7baca7d5de4072f974fbe36dce
NEXT_PUBLIC_PADDLE_ENVIRONMENT=sandbox

# Price IDs (IMPORTANTE)
NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID=pri_01k9rf1r9jv9aa3fsjnzf34zkp
PADDLE_PLAN_ENTERPRISE_ID=pri_01k9rf1r9jv9aa3fsjnzf34zkp
```

---

**Actualiza los Price IDs en Vercel y redeploy** 🚀
