# 🔍 Checklist Completo: Variables de Vercel para Paddle Sandbox

## 📅 Fecha: 10 de noviembre, 2025

## ⚠️ PROBLEMA ACTUAL

**Error en producción:** 
```
Failed to load resource: the server responded with a status of 401 ()
checkout-service.paddle.com/transaction-checkout/che_01k9rkf0tfjjgcsv4f4enjtvmk/pay
```

**Causa:** Las variables de entorno en Vercel están incorrectas o mezcladas (live + sandbox).

## ✅ VARIABLES QUE DEBEN ESTAR EN VERCEL

Ve a: **Vercel Dashboard** → Tu Proyecto → **Settings** → **Environment Variables**

### 1️⃣ PADDLE_API_KEY (Backend)
```
Nombre: PADDLE_API_KEY
Valor: pdl_sdbx_apikey_01k9rf68xsj4h0z25g1d4mnd5y_MMaejrm2wQ8MnpSCzjPXwA_APd
Entornos: ✅ Production  ✅ Preview  ⬜ Development
```
**Verificar:** Debe empezar con `pdl_sdbx_` (SANDBOX)

---

### 2️⃣ PADDLE_CLIENT_TOKEN (Backend)
```
Nombre: PADDLE_CLIENT_TOKEN
Valor: test_e7baca7d5de4072f974fbe36dce
Entornos: ✅ Production  ✅ Preview  ⬜ Development
```
**Verificar:** Debe empezar con `test_` (SANDBOX)

---

### 3️⃣ NEXT_PUBLIC_PADDLE_CLIENT_TOKEN (Frontend) ⚠️ CRÍTICO
```
Nombre: NEXT_PUBLIC_PADDLE_CLIENT_TOKEN
Valor: test_e7baca7d5de4072f974fbe36dce
Entornos: ✅ Production  ✅ Preview  ⬜ Development
```
**Verificar:** 
- ✅ Debe ser EXACTAMENTE igual a `PADDLE_CLIENT_TOKEN`
- ✅ Debe empezar con `test_` (SANDBOX)
- ⚠️ **ESTA ES LA VARIABLE QUE USA EL CHECKOUT**

---

### 4️⃣ NEXT_PUBLIC_PADDLE_ENVIRONMENT (Frontend) ⚠️ CRÍTICO
```
Nombre: NEXT_PUBLIC_PADDLE_ENVIRONMENT
Valor: sandbox
Entornos: ✅ Production  ✅ Preview  ⬜ Development
```
**Verificar:** Debe ser exactamente `sandbox` (en minúsculas)

---

### 5️⃣ PADDLE_WEBHOOK_SECRET (Backend)
```
Nombre: PADDLE_WEBHOOK_SECRET
Valor: ntfset_01k9rf9t8ta8tdd06q1vgk2qex
Entornos: ✅ Production  ✅ Preview  ⬜ Development
```
**Verificar:** Debe empezar con `ntfset_` (SANDBOX)

---

### 6️⃣ PADDLE_PLAN_ENTERPRISE_ID (Backend)
```
Nombre: PADDLE_PLAN_ENTERPRISE_ID
Valor: pri_01k9d95qvht02dqzvkw0h5876p
Entornos: ✅ Production  ✅ Preview  ⬜ Development
```
**Verificar:** Debe ser `pri_01k9d95qvht02dqzvkw0h5876p` (EL CORRECTO)

---

### ❌ 7️⃣ ELIMINAR ESTA VARIABLE (Ya no se usa)
```
NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID  ← ELIMINAR
```
Ya no existe en el código, fue reemplazada por una constante.

---

## 🔍 CÓMO VERIFICAR EN VERCEL

### Paso 1: Ir a Settings
1. Ve a https://vercel.com/dashboard
2. Selecciona tu proyecto
3. Click en **Settings** (arriba)
4. Click en **Environment Variables** (menú izquierdo)

### Paso 2: Verificar TODAS las variables
Busca cada una de las 6 variables y verifica:

#### ✅ Checklist por Variable:

**PADDLE_API_KEY:**
- [ ] Existe
- [ ] Empieza con `pdl_sdbx_`
- [ ] Valor: `pdl_sdbx_apikey_01k9rf68xsj4h0z25g1d4mnd5y_MMaejrm2wQ8MnpSCzjPXwA_APd`
- [ ] Marcada para Production
- [ ] Marcada para Preview

**PADDLE_CLIENT_TOKEN:**
- [ ] Existe
- [ ] Empieza con `test_`
- [ ] Valor: `test_e7baca7d5de4072f974fbe36dce`
- [ ] Marcada para Production
- [ ] Marcada para Preview

**NEXT_PUBLIC_PADDLE_CLIENT_TOKEN:** ⚠️ **MÁS IMPORTANTE**
- [ ] Existe
- [ ] Empieza con `test_`
- [ ] Valor: `test_e7baca7d5de4072f974fbe36dce` (igual a PADDLE_CLIENT_TOKEN)
- [ ] Marcada para Production
- [ ] Marcada para Preview

**NEXT_PUBLIC_PADDLE_ENVIRONMENT:** ⚠️ **MÁS IMPORTANTE**
- [ ] Existe
- [ ] Valor: `sandbox` (minúsculas)
- [ ] Marcada para Production
- [ ] Marcada para Preview

**PADDLE_WEBHOOK_SECRET:**
- [ ] Existe
- [ ] Empieza con `ntfset_`
- [ ] Valor: `ntfset_01k9rf9t8ta8tdd06q1vgk2qex`
- [ ] Marcada para Production
- [ ] Marcada para Preview

**PADDLE_PLAN_ENTERPRISE_ID:**
- [ ] Existe
- [ ] Valor: `pri_01k9d95qvht02dqzvkw0h5876p`
- [ ] Marcada para Production
- [ ] Marcada para Preview

**NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID:**
- [ ] ELIMINADA (ya no se usa)

---

## 🚨 ERRORES COMUNES

### Error 1: Variable con prefijo incorrecto
```
❌ PADDLE_API_KEY = pdl_live_xxxxx  (LIVE, no sandbox)
✅ PADDLE_API_KEY = pdl_sdbx_xxxxx  (SANDBOX)
```

### Error 2: Environment incorrecto
```
❌ NEXT_PUBLIC_PADDLE_ENVIRONMENT = production
✅ NEXT_PUBLIC_PADDLE_ENVIRONMENT = sandbox
```

### Error 3: Client Token diferente
```
❌ PADDLE_CLIENT_TOKEN = test_abc123
    NEXT_PUBLIC_PADDLE_CLIENT_TOKEN = test_xyz789  (¡DIFERENTES!)
✅ Ambas deben ser IGUALES
```

### Error 4: Price ID incorrecto
```
❌ PADDLE_PLAN_ENTERPRISE_ID = pri_01k9rf1r9jv9aa3fsjnzf34zkp  (VIEJO)
✅ PADDLE_PLAN_ENTERPRISE_ID = pri_01k9d95qvht02dqzvkw0h5876p  (CORRECTO)
```

---

## 🔄 DESPUÉS DE ACTUALIZAR

### 1. Guardar cambios en Vercel

### 2. Redeploy OBLIGATORIO
Las variables solo se aplican en nuevos deployments:
- Ve a **Deployments**
- Click en el deployment más reciente
- Click en **...** (tres puntos)
- Click en **Redeploy**
- Espera 2-3 minutos

### 3. Verificar en producción
Una vez que el deployment termine:

1. Ve a https://lealta.app/pricing
2. Abre **DevTools** (F12)
3. Ve a la pestaña **Console**
4. Recarga la página con **Ctrl+Shift+R** (hard refresh)
5. Busca los logs de Paddle:
   ```
   🏗️ Paddle configurado en modo: sandbox
   ✅ Paddle Checkout listo
   ```

6. Intenta crear un checkout
7. **NO** debe aparecer error 401

---

## 🎯 VALORES CORRECTOS DE REFERENCIA

Para copiar y pegar en Vercel:

```bash
# Backend Keys
PADDLE_API_KEY=pdl_sdbx_apikey_01k9rf68xsj4h0z25g1d4mnd5y_MMaejrm2wQ8MnpSCzjPXwA_APd
PADDLE_CLIENT_TOKEN=test_e7baca7d5de4072f974fbe36dce
PADDLE_WEBHOOK_SECRET=ntfset_01k9rf9t8ta8tdd06q1vgk2qex
PADDLE_PLAN_ENTERPRISE_ID=pri_01k9d95qvht02dqzvkw0h5876p

# Frontend Keys (NEXT_PUBLIC_*)
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=test_e7baca7d5de4072f974fbe36dce
NEXT_PUBLIC_PADDLE_ENVIRONMENT=sandbox
```

---

## 📸 Captura para Verificar

Si quieres, puedes tomar una captura de pantalla de tus Environment Variables en Vercel (ocultando los valores sensibles) y te ayudo a verificar que estén correctas.

---

## ✅ Una vez completado el checklist

1. [ ] Todas las 6 variables verificadas
2. [ ] NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID eliminada
3. [ ] Redeploy completado
4. [ ] Checkout probado sin error 401

---

**IMPORTANTE:** El error 401 en el endpoint `/pay` significa que el **Client Token** que llega al servidor de Paddle es incorrecto. Esto solo puede ser por:

1. ❌ `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` tiene valor LIVE en lugar de SANDBOX
2. ❌ `NEXT_PUBLIC_PADDLE_ENVIRONMENT` está en "production" en lugar de "sandbox"
3. ❌ No se ha hecho redeploy después de cambiar las variables

**Verifica estas 3 primero** antes de revisar el resto. 🎯
