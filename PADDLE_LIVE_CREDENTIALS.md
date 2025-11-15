# 🔴 PADDLE LIVE - CREDENCIALES DE PRODUCCIÓN

> ⚠️ **CRÍTICO**: Este archivo NO debe subirse a GitHub
> Está en .gitignore para seguridad

## 📅 Fecha de Activación
**11 de noviembre, 2025**

---

## 🔑 Credenciales LIVE

### Backend API Key
```
pdl_live_apikey_01k9syvg21n8tw4q07mavf6cgr_6m4jkaztpJs0SyXgryGC0q_ATt
```

### Frontend Client Token
```
live_b888d2ee4ab271ebe796a754d95
```

### Price IDs

#### Prueba - $10 USD/mes
```
pri_01k9d95qvht02dqzvkw0h5876p
```

#### Producción - $250 USD/mes
```
[PENDIENTE - Crear después de validar con $10]
```

---

## 📋 Variables de Entorno para Vercel

Copiar estas variables en: https://vercel.com/abyphantom11/lealta-2-0/settings/environment-variables

```bash
# === PADDLE LIVE - PRODUCCIÓN ===

# API Key (Backend)
PADDLE_API_KEY=pdl_live_apikey_01k9syvg21n8tw4q07mavf6cgr_6m4jkaztpJs0SyXgryGC0q_ATt

# Client Token (Frontend)
PADDLE_CLIENT_TOKEN=live_b888d2ee4ab271ebe796a754d95
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=live_b888d2ee4ab271ebe796a754d95

# Price ID - PRUEBA $10
NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID=pri_01k9d95qvht02dqzvkw0h5876p

# Entorno
NEXT_PUBLIC_PADDLE_ENVIRONMENT=production

# Vendor ID
PADDLE_VENDOR_ID=257347

# Product ID (mismo que sandbox)
PADDLE_PRODUCT_ID=pro_01k9d940v6ppjbh0cknn5xz4t3
NEXT_PUBLIC_PADDLE_PRODUCT_ID=pro_01k9d940v6ppjbh0cknn5xz4t3

# Webhook Secret (si ya lo tienes)
# PADDLE_WEBHOOK_SECRET=[obtener de Paddle Dashboard]
```

---

## ✅ Checklist de Configuración

### En Paddle Dashboard (vendors.paddle.com):

- [x] Cuenta LIVE activada
- [x] API Key generada
- [x] Client Token generada
- [x] Price ID de $10 creado
- [ ] Hosted Checkout configurado (URL: https://lealta.app)
- [ ] Webhook Secret obtenido (si vas a usarlo)

### En Vercel:

- [ ] Variables de entorno agregadas
- [ ] Deployment redeployado
- [ ] Verificar que las variables se aplicaron

### Prueba:

- [ ] Abrir https://lealta.app/pricing
- [ ] Click en "Suscribirse"
- [ ] Completar pago con tarjeta real
- [ ] Verificar cargo de $10 en banco
- [ ] Verificar email de factura
- [ ] Verificar en Paddle Dashboard → Transactions

---

## 🔄 Después de Validar con $10

1. **Crear Price ID de $250** en Paddle LIVE
2. **Actualizar** `NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID` en Vercel
3. **Redeploy** en Vercel
4. **Onboardear** a los 3 clientes reales

---

## 🚨 Seguridad

- ✅ Este archivo está en `.gitignore`
- ✅ Las credenciales solo están en Vercel (encriptadas)
- ✅ NO compartir estas credenciales por email/chat
- ✅ Rotar credenciales si se comprometen

---

## 📞 Soporte Paddle

- Email: support@paddle.com
- Dashboard: https://vendors.paddle.com/support
- Documentación: https://developer.paddle.com

---

_Última actualización: 11 de noviembre, 2025_
