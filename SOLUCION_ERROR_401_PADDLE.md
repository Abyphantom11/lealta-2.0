# 🔧 Solución: Error 401 en Paddle Checkout

## 🔴 El Error
```
checkout-service.paddle.com/transaction-checkout/.../pay:1
Failed to load resource: the server responded with a status of 401 ()
```

## 🎯 Causa
Error 401 = **No autorizado**. Paddle no puede validar tu Client Token.

## ✅ Soluciones

### **Solución 1: Verificar Variables en Vercel**

Ve a:
```
https://vercel.com/[tu-usuario]/lealta-2-0/settings/environment-variables
```

**Verifica que estas variables existan y sean correctas:**

```bash
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=test_e7baca7d5de4072f974fbe36dce
NEXT_PUBLIC_PADDLE_ENVIRONMENT=sandbox
```

⚠️ **IMPORTANTE:**
- Deben estar en **"Production"** y **"Preview"**
- Deben empezar con `NEXT_PUBLIC_` (son públicas)
- El token debe empezar con `test_` (para sandbox)

### **Solución 2: Regenerar Client Token**

El token puede haber expirado. Vamos a crear uno nuevo:

1. **Ve a Paddle Dashboard:**
   ```
   https://sandbox-vendors.paddle.com/authentication
   ```

2. **En "Client-side tokens" haz clic en "Create token"**

3. **Copia el nuevo token** (empieza con `test_`)

4. **Actualiza en Vercel:**
   ```
   NEXT_PUBLIC_PADDLE_CLIENT_TOKEN = [NUEVO_TOKEN]
   ```

5. **Redeploy:**
   - Ve a Vercel → Deployments
   - Busca el último deployment
   - Haz clic en "..." → "Redeploy"

### **Solución 3: Verificar el Entorno**

Asegúrate de que el entorno coincida:

**En Paddle Dashboard:**
- Estás usando: **Sandbox** ✅

**En Vercel:**
```bash
NEXT_PUBLIC_PADDLE_ENVIRONMENT=sandbox  ✅
```

Si tienes `production`, cámbialo a `sandbox`.

---

## 🚀 **Pasos Rápidos:**

1. **Abre Vercel:** https://vercel.com/settings/environment-variables
2. **Busca:** `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`
3. **Verifica que sea:** `test_e7baca7d5de4072f974fbe36dce`
4. **Si no existe, agrégala**
5. **Redeploy** desde Vercel

---

## 🧪 **Alternativa: Probar con nuevo token**

Si el problema persiste, probablemente el token expiró:

1. **Genera nuevo token en Paddle:**
   ```
   https://sandbox-vendors.paddle.com/authentication
   ```

2. **Actualiza `.env.local` localmente:**
   ```bash
   NEXT_PUBLIC_PADDLE_CLIENT_TOKEN="[NUEVO_TOKEN]"
   ```

3. **Actualiza Vercel con el nuevo token**

4. **Commit y push:**
   ```bash
   git add .env.local
   git commit -m "fix: Actualizar Paddle Client Token"
   git push origin feat/optimize-ui-rendering
   ```

---

## 📊 **Verificar que funcionó:**

1. Espera el redeploy (1 min)
2. Recarga `lealta.app/pricing`
3. Abre el checkout
4. Completa el pago
5. No debería haber error 401

---

**¿Quieres que te ayude a verificar las variables en Vercel o generar un nuevo token?** 🔑
