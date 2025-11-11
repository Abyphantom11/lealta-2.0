# 🚀 Configuración Paddle para Deploy en Vercel

## 📋 PASO 1: Configurar URLs en Paddle Dashboard

### Ve a Paddle Sandbox Settings:
```
https://sandbox-vendors.paddle.com/settings/checkout
```

### Configura "Default Checkout URLs":

**Para tu dominio de Vercel:**
```
Success URL: https://lealta-themaster2648-9501s-projects.vercel.app/billing/success
Cancel URL: https://lealta-themaster2648-9501s-projects.vercel.app/pricing
```

**O si prefieres usar el dominio principal:**
```
Success URL: https://lealta.app/billing/success
Cancel URL: https://lealta.app/pricing
```

---

## 📋 PASO 2: Configurar Webhooks (Recomendado)

### Ve a Notifications:
```
https://sandbox-vendors.paddle.com/settings/notifications
```

### Agrega Webhook Endpoint:
```
URL: https://lealta.app/api/webhooks/paddle
Description: Lealta Production Webhooks
```

### Eventos a suscribirse:
- ✅ `subscription.created`
- ✅ `subscription.updated`
- ✅ `subscription.canceled`
- ✅ `transaction.completed`
- ✅ `transaction.payment_failed`

---

## 📋 PASO 3: Variables de Entorno en Vercel

### Ve a tu proyecto en Vercel:
```
https://vercel.com/abyphantom11/lealta
```

### Settings → Environment Variables

**Agrega estas variables:**

```bash
# Paddle Sandbox Credentials
PADDLE_API_KEY=pdl_sdbx_apikey_01k9rf68xsj4h0z25g1d4mnd5y_MMaejrm2wQ8MnpSCzjPXwA_APd
PADDLE_CLIENT_TOKEN=test_e7baca7d5de4072f974fbe36dce
PADDLE_WEBHOOK_SECRET=ntfset_01k9rf9t8ta8tdd06q1vgk2qex

# Paddle Public Variables
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=test_e7baca7d5de4072f974fbe36dce
NEXT_PUBLIC_PADDLE_ENVIRONMENT=sandbox
NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID=pri_01k9rf1r9jv9aa3fsjnzf34zkp

# Paddle Plan IDs
PADDLE_PLAN_ENTERPRISE_ID=pri_01k9rf1r9jv9aa3fsjnzf34zkp
```

**Asegúrate de que sean para el environment: `Preview` (para ramas) y `Production`**

---

## 📋 PASO 4: Commit y Push

```powershell
# Agregar cambios
git add .

# Commit
git commit -m "feat: Configurar Paddle Sandbox para pruebas"

# Push a tu rama
git push origin feat/optimize-ui-rendering
```

---

## 📋 PASO 5: Probar en Vercel

1. **Espera el deploy** en Vercel (1-2 minutos)
2. **Abre la URL del preview:**
   ```
   https://lealta-[hash]-abyphantom11.vercel.app/pricing
   ```
3. **Prueba el checkout** con:
   - Email: `test@example.com`
   - Tarjeta: `4242 4242 4242 4242`
   - CVV: `123`
   - Fecha: `12/28`

---

## ✅ Checklist

- [ ] URLs configuradas en Paddle Dashboard
- [ ] Webhooks configurados (opcional)
- [ ] Variables de entorno en Vercel
- [ ] Código commiteado y pusheado
- [ ] Deploy completado en Vercel
- [ ] Checkout probado y funcionando

---

## 🔍 Si algo falla:

### Ver logs en tiempo real:
```
https://vercel.com/abyphantom11/lealta/deployments
```

### Ver errores en el navegador:
- F12 → Console
- F12 → Network → Buscar errores 400/500

---

**¿Listo para hacer el push?** 🚀
