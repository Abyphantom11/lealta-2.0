# 🔍 CÓMO ENCONTRAR EL WEBHOOK SECRET DE PADDLE

## 📍 OPCIÓN 1: Si ya creaste un webhook antes

1. Ve a: https://sandbox-vendors.paddle.com/notifications/webhooks
2. Verás una lista de webhooks existentes
3. Click en cualquier webhook de la lista
4. Busca la sección **"Signing key"** o **"Webhook secret"**
5. Click en **"Show"** o **"Reveal"**
6. Copia el secreto que empieza con `pdl_whsec_`

---

## 📍 OPCIÓN 2: Crear un nuevo webhook (RECOMENDADO)

### Paso 1: Ir a Webhooks
```
https://sandbox-vendors.paddle.com/notifications/webhooks
```

### Paso 2: Click en "Create Webhook" o "Add Webhook"

### Paso 3: Configurar el webhook

**URL del webhook:**
- Por ahora usa: `https://example.com/api/webhooks/paddle`
- (Lo cambiaremos después cuando uses ngrok o tu dominio real)

**Eventos a seleccionar:**
✅ Marca estos eventos (son los que usa tu código):
- `subscription.created`
- `subscription.updated`
- `subscription.canceled`
- `subscription.paused`
- `subscription.past_due`
- `transaction.completed`
- `transaction.payment_failed`

### Paso 4: Guardar y copiar el secret

1. Click en **"Save"** o **"Create"**
2. Paddle te mostrará el **Webhook Secret** (solo UNA vez)
3. Copia el secreto que empieza con `pdl_whsec_`
4. **¡IMPORTANTE!** Guárdalo porque no lo podrás ver después

**Formato esperado:**
```
pdl_whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 📍 OPCIÓN 3: Si no puedes crear/ver webhooks

Paddle puede tener diferentes interfaces dependiendo de tu cuenta. Prueba estas rutas alternativas:

### A) Developer Tools
```
https://sandbox-vendors.paddle.com/developer/webhooks
```

### B) Settings > Notifications
```
https://sandbox-vendors.paddle.com/settings/notifications
```

### C) API Settings
```
https://sandbox-vendors.paddle.com/settings/api
```

---

## 🎯 RESUMEN VISUAL

```
Paddle Dashboard
├── Developer Tools
│   └── Notifications
│       └── Webhooks
│           └── [Create Webhook]
│               ├── URL: https://example.com/api/webhooks/paddle
│               ├── Events: [seleccionar todos los de subscription + transaction]
│               └── [Save] → ¡Copia el pdl_whsec_xxxxx!
```

---

## ✅ CREDENCIALES QUE YA TIENES:

```
✅ API_KEY: apikey_01k8m6ka12hs2f6rhstmd5dfa3
✅ CLIENT_TOKEN: live_36ddf9a4003f105fc2730fae735
✅ PRICE_ID: pri_01k9d95qvht02dqzvkw0h5876p
⚠️ WEBHOOK_SECRET: [Falta por copiar]
```

---

## 🚀 PRÓXIMO PASO

Una vez que copies el **Webhook Secret**, pégalo aquí y crearé tu archivo `.env.local` completo.

**Formato esperado:**
```
pdl_whsec_01xxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 💡 NOTA IMPORTANTE

Si Paddle no te deja ver o crear webhooks en el sandbox, es posible que:
1. Tu cuenta necesite verificación adicional
2. O podamos proceder sin webhooks por ahora (solo para testing local)

**¿Puedes intentar crear el webhook siguiendo estos pasos?** 🔍
