# 🚀 ACTUALIZAR PADDLE TOKEN EN VERCEL

## ✅ TOKEN ACTUALIZADO LOCALMENTE

Ya actualicé tu `.env.local` con el nuevo token:
- ✅ **Nuevo token sandbox**: `test_15b516bbd81724918f2154fcf5a`
- ✅ Todas las validaciones pasaron

---

## 📝 AHORA: Actualiza Vercel

### Paso 1: Ve a Vercel Dashboard

1. Abre: https://vercel.com/dashboard
2. Selecciona tu proyecto **lealta-2.0**
3. Click en **Settings** (arriba)
4. Click en **Environment Variables** (menú izquierdo)

---

### Paso 2: Actualiza estas 2 variables

#### Variable 1: `PADDLE_CLIENT_TOKEN`

1. Busca `PADDLE_CLIENT_TOKEN`
2. Click en el botón **Edit** (lápiz) al lado
3. **Nuevo valor**: `test_15b516bbd81724918f2154fcf5a`
4. Asegúrate de marcar:
   - ✅ Production
   - ✅ Preview
5. Click **Save**

#### Variable 2: `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`

1. Busca `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`
2. Click en el botón **Edit** (lápiz) al lado
3. **Nuevo valor**: `test_15b516bbd81724918f2154fcf5a`
4. Asegúrate de marcar:
   - ✅ Production
   - ✅ Preview
5. Click **Save**

---

### Paso 3: Verifica otras variables (NO las cambies, solo verifica)

Estas deben seguir igual:

```bash
PADDLE_VENDOR_ID=257347
PADDLE_API_KEY=pdl_sdbx_apikey_01k9rf68xsj4h0z25g1d4mnd5y_MMaejrm2wQ8MnpSCzjPXwA_APd
PADDLE_WEBHOOK_SECRET=ntfset_01k9rf9t8ta8tdd06q1vgk2qex
NEXT_PUBLIC_PADDLE_ENVIRONMENT=sandbox  ← MANTENER en "sandbox"
NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID=pri_01k9d95qvht02dqzvkw0h5876p
NEXT_PUBLIC_PADDLE_PRODUCT_ID=pro_01k9d940v6ppjbh0cknn5xz4t3
PADDLE_PLAN_ENTERPRISE_ID=pri_01k9d95qvht02dqzvkw0h5876p
PADDLE_PRODUCT_ID=pro_01k9d940v6ppjbh0cknn5xz4t3
```

---

### Paso 4: Redeploy OBLIGATORIO

Después de guardar las variables:

**Opción A: Redeploy manual**
1. Ve a **Deployments** (en el menú superior)
2. Click en el deployment más reciente
3. Click en los 3 puntos **...** a la derecha
4. Click en **Redeploy**
5. Confirma

**Opción B: Push automático**
```powershell
git add .env.local .env
git commit -m "fix: Actualizar Paddle Client Token a nuevo token sandbox"
git push origin feat/optimize-ui-rendering
```

---

### Paso 5: Verificar en Producción

Una vez que el deployment termine (2-3 minutos):

1. Ve a: https://lealta.app (o tu dominio)
2. Abre **DevTools** (F12)
3. Ve a la pestaña **Console**
4. Recarga con **Ctrl+Shift+R** (hard refresh)
5. Ve a la página donde usas Paddle (ej: `/pricing`)

**Deberías ver:**
```
✅ 🏗️ Paddle configurado en modo: sandbox
✅ 🚀 Inicializando Paddle...
✅ Paddle inicializado correctamente
✅ 🔑 Token: test_15b516bb...
```

**NO deberías ver:**
```
❌ POST https://sandbox-checkout-service.paddle.com/transaction-checkout 403
❌ Failed to retrieve JWT
```

---

## 🎯 RESUMEN DE CAMBIOS

| Variable | Valor Anterior | Valor Nuevo |
|----------|----------------|-------------|
| `PADDLE_CLIENT_TOKEN` | `test_e7baca7d5de4072f974fbe36dce` | `test_15b516bbd81724918f2154fcf5a` ✅ |
| `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` | `test_e7baca7d5de4072f974fbe36dce` | `test_15b516bbd81724918f2154fcf5a` ✅ |

---

## 🔐 TOKENS DE RESPALDO

Si en el futuro quieres cambiar a LIVE (cuando tu cuenta esté activada):

```bash
# Token LIVE (para cuando Paddle apruebe tu cuenta)
PADDLE_CLIENT_TOKEN=live_6045874d5269c83f8d2c3eef1f4
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=live_6045874d5269c83f8d2c3eef1f4
NEXT_PUBLIC_PADDLE_ENVIRONMENT=production

# Token SANDBOX (actual - funcionando)
PADDLE_CLIENT_TOKEN=test_15b516bbd81724918f2154fcf5a
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=test_15b516bbd81724918f2154fcf5a
NEXT_PUBLIC_PADDLE_ENVIRONMENT=sandbox
```

---

## ✅ Checklist

- [ ] Actualicé `PADDLE_CLIENT_TOKEN` en Vercel
- [ ] Actualicé `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` en Vercel
- [ ] Ambas variables tienen el mismo valor: `test_15b516bbd81724918f2154fcf5a`
- [ ] Marqué Production y Preview para ambas
- [ ] Hice redeploy en Vercel
- [ ] Esperé 2-3 minutos a que termine el deployment
- [ ] Verifiqué en producción y NO veo error 403
- [ ] Paddle se inicializa correctamente

---

**¡Una vez que lo actualices en Vercel, el error 403 debería desaparecer!** 🎉
