# 🚨 Configuración Requerida en Paddle Dashboard

## ❗ Antes de que funcione el checkout

Según la documentación de Paddle, necesitas configurar esto en tu dashboard:

### 1️⃣ Default Payment Link (OBLIGATORIO)

Ve a: **Paddle Dashboard → Checkout → Checkout settings → Default payment link**

Necesitas:
- ✅ Agregar un "default payment link" (por ejemplo: `https://lealta.app`)
- ✅ Si estás en LIVE (producción), ese dominio debe estar **aprobado** por Paddle

**¿Cómo verificar?**
1. Ve a: https://vendors.paddle.com/checkout-settings
2. Busca la sección "Default payment link"
3. Debería mostrar tu dominio aprobado

### 2️⃣ Domain Approval (Solo en LIVE)

Si estás usando el ambiente LIVE:
- Tu dominio (`https://lealta.app` o el que uses) debe estar aprobado
- Paddle necesita verificar que eres dueño del dominio
- Este proceso puede tardar 1-3 días

**Para desarrollo local:**
- Puedes usar `http://localhost:3001` como default payment link
- NO requiere aprobación

---

## 🎯 Qué está pasando ahora

1. ✅ Creamos la transacción usando el API de Paddle
2. ✅ Paddle debería devolver un `checkout.url` automáticamente
3. ❌ Si NO devuelve `checkout.url` → **Necesitas configurar default payment link**

---

## 📝 Pasos para Configurar

### Opción A: Desarrollo Local (Rápido)

1. Ve a: https://vendors.paddle.com/checkout-settings
2. En "Default payment link" pon: `http://localhost:3001`
3. Guarda

### Opción B: Producción (Requiere Aprobación)

1. Ve a: https://vendors.paddle.com/checkout-settings
2. En "Default payment link" pon tu dominio: `https://lealta.app`
3. Paddle te pedirá verificar el dominio
4. Sigue las instrucciones de verificación (agregar DNS record o archivo HTML)
5. Espera aprobación (1-3 días)

---

## 🔍 Verificar en la Consola

Después de configurar, prueba de nuevo y verifica en la consola:

```javascript
{
  id: "txn_xxx...",
  status: "ready",
  checkout: {
    url: "http://localhost:3001/?_ptxn=txn_xxx..." // ✅ Esto debe aparecer
  }
}
```

Si `checkout.url` está **null** o **undefined** → El default payment link no está configurado.

---

## 📧 Qué hacer mientras tanto

Si no tienes acceso a configurar el default payment link (porque la cuenta está bloqueada), **debes esperar a que Paddle apruebe tu cuenta**.

Envía este email a support@paddle.com:

```
Subject: Enable Checkout Configuration - Seller ID 257347

Hi Paddle Team,

I need to configure the "Default payment link" in my checkout settings 
but I don't have access because my account is pending approval.

Can you please:
1. Approve my account for checkouts
2. Enable access to checkout settings

Seller ID: 257347
Product: Lealta Enterprise SaaS

Thank you!
```

---

**🎯 Próximo paso:** Ve a tu dashboard y verifica si puedes configurar el default payment link.
