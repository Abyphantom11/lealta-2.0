# 🚀 CONFIGURAR PADDLE EN VERCEL

## 📋 Variables que DEBES agregar en Vercel

Ve a: **Vercel Dashboard → Tu Proyecto → Settings → Environment Variables**

### ✅ Variables a agregar:

```bash
# 🆔 Paddle Vendor ID
PADDLE_VENDOR_ID=257347

# 🔑 Backend API Key (PRIVADA - NO exponerla en el frontend)
PADDLE_API_KEY=pdl_sdbx_apikey_01k9rf68xsj4h0z25g1d4mnd5y_MMaejrm2wQ8MnpSCzjPXwA_APd

# 🎫 Client Token (PRIVADA - para uso en API routes)
PADDLE_CLIENT_TOKEN=test_e7baca7d5de4072f974fbe36dce

# 🔐 Webhook Secret (para verificar webhooks)
PADDLE_WEBHOOK_SECRET=ntfset_01k9rf9t8ta8tdd06q1vgk2qex

# 🌍 Variables públicas (Frontend - empiezan con NEXT_PUBLIC_)
NEXT_PUBLIC_PADDLE_ENVIRONMENT=sandbox
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=test_e7baca7d5de4072f974fbe36dce
NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID=pri_01k9d95qvht02dqzvkw0h5876p
NEXT_PUBLIC_PADDLE_PRODUCT_ID=pro_01k9d940v6ppjbh0cknn5xz4t3

# 📦 Price IDs (para uso en backend)
PADDLE_PLAN_ENTERPRISE_ID=pri_01k9d95qvht02dqzvkw0h5876p
PADDLE_PRODUCT_ID=pro_01k9d940v6ppjbh0cknn5xz4t3
```

---

## 📝 IMPORTANTE: Configurar para todos los entornos

Cuando agregues cada variable en Vercel, asegúrate de marcar:

- ✅ **Production**
- ✅ **Preview**
- ✅ **Development**

Esto garantiza que funcione en todos los entornos.

---

## 🔄 Después de agregar las variables

1. **Guarda todas las variables** en Vercel
2. **Redeploy tu aplicación**:
   - Ve a: **Deployments → [último deployment] → ⋯ → Redeploy**
   - O haz un nuevo commit/push para trigger un nuevo deployment

3. **Verifica que funcionen**:
   ```bash
   # Ve a tu app en producción
   # Abre la consola del navegador (F12)
   # Deberías ver:
   ✅ 🏗️ Paddle configurado en modo: sandbox
   ✅ Paddle inicializado correctamente
   ```

---

## 🎯 Cómo agregar las variables en Vercel (paso a paso)

### Opción 1: Desde la UI de Vercel

1. Ve a: https://vercel.com/dashboard
2. Selecciona tu proyecto **lealta-2.0**
3. Click en **Settings** (pestaña superior)
4. Click en **Environment Variables** (menú lateral)
5. Para cada variable:
   - Click en **Add New**
   - Key: `PADDLE_VENDOR_ID`
   - Value: `257347`
   - Marca: Production, Preview, Development
   - Click **Save**
6. Repite para todas las variables de arriba

### Opción 2: Desde Vercel CLI (más rápido)

```bash
# Instala Vercel CLI si no la tienes
npm i -g vercel

# Login
vercel login

# Navega a tu proyecto
cd c:\Users\abrah\lealta

# Agrega las variables desde tu .env local
vercel env pull .env.vercel.local

# Luego puedes pushear variables individuales:
vercel env add PADDLE_VENDOR_ID
# Ingresa: 257347
# Selecciona: Production, Preview, Development
```

---

## ⚠️ SEGURIDAD: Variables privadas vs públicas

### 🔒 Variables PRIVADAS (NUNCA exponer en frontend):
- `PADDLE_API_KEY` - Solo para API routes del servidor
- `PADDLE_WEBHOOK_SECRET` - Solo para verificar webhooks
- `PADDLE_CLIENT_TOKEN` - Solo para API routes
- `PADDLE_VENDOR_ID` - Solo para backend

### 🌐 Variables PÚBLICAS (Seguras para frontend):
- `NEXT_PUBLIC_PADDLE_ENVIRONMENT` - El entorno (sandbox/production)
- `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` - Token del cliente para Paddle.js
- `NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID` - ID del plan
- `NEXT_PUBLIC_PADDLE_PRODUCT_ID` - ID del producto

Las variables que empiezan con `NEXT_PUBLIC_` son incluidas en el bundle del frontend y son visibles para cualquier usuario. Por eso, el `Client Token` es diferente del `API Key`.

---

## 🧪 Verificar que todo funciona

Después de configurar Vercel y redeploy:

1. **Abre tu app en producción** (ej: https://lealta.vercel.app)
2. **Abre la consola del navegador** (F12)
3. **Ve a la página de pricing** o donde uses Paddle
4. **Deberías ver logs como:**
   ```
   🚀 Inicializando Paddle...
   🏗️ Paddle configurado en modo: sandbox
   ✅ Paddle inicializado correctamente
   🌍 Entorno: sandbox
   🔑 Token: test_e7bac...
   ```

5. **NO deberías ver errores 403** ❌
6. **Prueba hacer un checkout** con una tarjeta de prueba:
   - Card: `4242 4242 4242 4242`
   - Expiry: Cualquier fecha futura
   - CVV: `123`

---

## 🆘 Si sigues viendo errores 403

### Posibles causas:

1. **Variables no están configuradas en Vercel**
   - Verifica que todas las variables estén en Settings → Environment Variables
   - Asegúrate de que estén marcadas para Production

2. **No hiciste redeploy después de agregar variables**
   - Las variables solo se aplican en nuevos deployments
   - Haz un redeploy manual o push un nuevo commit

3. **Bloqueador de anuncios activado**
   - Desactiva extensiones como uBlock, AdBlock
   - Dominios de Paddle pueden estar bloqueados

4. **Client Token incorrecto**
   - Verifica que el token empiece con `test_` (sandbox)
   - Verifica que sea el mismo en `.env` y Vercel

---

## 📚 Documentos relacionados

- `SOLUCION_ERROR_403_PADDLE.md` - Solución completa al error 403
- `CREAR_CLIENT_TOKEN_PADDLE.md` - Cómo obtener tokens de Paddle
- `CONFIGURAR_WEBHOOK_VERCEL.md` - Configurar webhooks de Paddle
- `COMO_OBTENER_PRICE_ID.md` - Crear productos y precios en Paddle

---

## ✅ Checklist final

- [ ] Agregué todas las variables en Vercel
- [ ] Marqué Production, Preview, Development para todas
- [ ] Hice redeploy de la aplicación
- [ ] Verifiqué los logs en producción (consola del navegador)
- [ ] No veo errores 403
- [ ] Paddle se inicializa correctamente
- [ ] Puedo abrir el checkout sin errores

---

¡Listo! Con esto Paddle debería funcionar perfectamente en Vercel 🎉
