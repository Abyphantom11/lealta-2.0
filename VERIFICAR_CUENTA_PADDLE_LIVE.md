# ✅ CHECKLIST: Verificar Cuenta de Paddle LIVE

## 🎯 EL PROBLEMA

Error 403: "Transaction checkout creation is blocked for this vendor"

**Causa:** Tu cuenta de Paddle en modo LIVE tiene restricciones o no está completamente configurada.

---

## 📋 CHECKLIST DE VERIFICACIÓN

Ve a: https://vendors.paddle.com/ (modo LIVE)

### 1️⃣ **Business Account → Overview**

Busca alertas o warnings en color rojo/amarillo que digan cosas como:
- ❌ "Complete your account setup"
- ❌ "Action required"
- ❌ "Verification pending"

### 2️⃣ **Business Account → Payouts**

¿Tienes configurado tu método de pago?
- ✅ Información bancaria completa
- ✅ País y moneda configurados
- ✅ Umbral de pago configurado

**Si ves "Not configured" o similar → Configúralo**

### 3️⃣ **Business Account → Tax**

¿Tienes configurados tus impuestos?
- ✅ Tax ID / VAT Number (si aplica)
- ✅ Dirección fiscal completa
- ✅ Tipo de negocio seleccionado

### 4️⃣ **Checkout → Checkout Settings**

¿Está habilitado el checkout?
- ✅ Default payment methods habilitados
- ✅ Al menos una moneda configurada
- ✅ Checkout URL configurada

### 5️⃣ **Developer Tools → Authentication**

Verifica tus tokens:
- ✅ Client-side token activo
- ✅ API key activa
- ✅ Sin tokens duplicados o conflictivos

### 6️⃣ **Account Status**

En la esquina superior derecha o en "Settings":
- ✅ Account Status: "Active" o "Verified"
- ❌ Account Status: "Pending" o "Limited"

---

## 🔍 COSAS ESPECÍFICAS A BUSCAR

### Banner de Advertencia

Si ves un banner amarillo o rojo en la parte superior del dashboard que dice algo como:

```
⚠️ "Your account is in limited mode until you complete setup"
⚠️ "Some features are restricted"
⚠️ "Complete your verification"
```

**→ Haz click en él y completa lo que pida**

### Email de Paddle

Revisa tu email para mensajes de Paddle como:
- "Complete your Paddle account setup"
- "Action required for your Paddle account"
- "Verification needed"

---

## 🛠️ SOLUCIONES SEGÚN EL PROBLEMA

### Si falta información de pago:

1. **Business Account → Payouts → Set up payouts**
2. Llena:
   - Nombre del banco
   - Número de cuenta / IBAN
   - Código SWIFT/BIC
   - Dirección del banco

### Si falta información fiscal:

1. **Business Account → Tax → Tax settings**
2. Llena:
   - Business legal name
   - Tax ID (RFC en México, EIN en USA, etc.)
   - Business address completa
   - Business type

### Si falta verificación de identidad:

Paddle puede pedir:
- Documento de identidad (INE, Pasaporte)
- Comprobante de domicilio
- Documentos del negocio (Acta constitutiva, RFC, etc.)

**Sube los documentos cuando te lo pidan**

### Si es una restricción temporal:

Paddle puede limitar cuentas nuevas por seguridad:
1. Contacta a Paddle Support
2. Explica tu caso de uso
3. Pide que levanten las restricciones

---

## 📧 CONTACTAR A PADDLE SUPPORT

Si todo está completo y sigue sin funcionar:

**Email:** support@paddle.com

**Plantilla de mensaje:**
```
Subject: Unable to create checkouts - Error 403 "Transaction checkout creation is blocked"

Hi Paddle Team,

I'm experiencing an error when trying to create checkouts in my live environment:

- Error: 403 Forbidden
- Message: "Transaction checkout creation is blocked for this vendor"
- Vendor ID: [TU_VENDOR_ID si lo tienes]
- Client Token (last 6 chars): ...ae735

My account appears to be complete:
✅ Business information filled
✅ Payout method configured
✅ Tax settings configured
✅ Account verified (if applicable)

Could you please help me understand what's blocking checkout creation?

Environment:
- Products created: Yes
- Prices configured: Yes (pri_01k9d95qvht02dqzvkw0h5876p)
- Testing in: Live mode

Thank you!
[Tu Nombre]
```

---

## ⚡ SOLUCIÓN TEMPORAL: Usar Sandbox

Mientras resuelves el problema con Live, puedes usar Sandbox:

### Paso 1: Cambia a Sandbox en Paddle

https://sandbox-vendors.paddle.com/

### Paso 2: Crea productos de prueba

1. Catalog → Products → Create
2. Add Price: 250 USD Monthly

### Paso 3: Genera tokens de Sandbox

Developer Tools → Authentication:
- Client-side token (test_xxx)
- API key (pdl_sandbox_xxx)

### Paso 4: Actualiza `.env`

```env
PADDLE_CLIENT_TOKEN="test_xxxxxxxxxxxxx"
PADDLE_API_KEY="pdl_sandbox_xxxxx"
NEXT_PUBLIC_PADDLE_ENVIRONMENT="sandbox"
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN="test_xxxxxxxxxxxxx"
NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID="pri_01xxxxx"  # Del producto que creaste
NEXT_PUBLIC_PADDLE_PRODUCT_ID="pro_01xxxxx"  # Del producto que creaste
```

### Paso 5: Reinicia

```powershell
npm run dev
```

### Paso 6: Prueba con tarjetas de test

```
Tarjeta: 4242 4242 4242 4242
Fecha: Cualquier fecha futura
CVV: 123
```

---

## 🎯 RESULTADO ESPERADO

Una vez que tu cuenta esté completa, deberías poder:

✅ Crear checkouts sin error 403
✅ Ver productos y precios en el checkout
✅ Completar transacciones de prueba
✅ Recibir webhooks de confirmación

---

## 📊 MONITOR EN LA CONSOLA

Cuando funcione, verás:

```javascript
✅ 🏗️ Paddle configurado en modo: production
✅ 🎯 Paddle Event: {type: 'checkout.loaded'}
✅ 🎯 Paddle Event: {type: 'checkout.customer.created'}
✅ 🎯 Paddle Event: {type: 'checkout.completed'}
```

Sin errores 403 ❌

---

## 🔗 RECURSOS ÚTILES

- Dashboard Live: https://vendors.paddle.com/
- Dashboard Sandbox: https://sandbox-vendors.paddle.com/
- Docs: https://developer.paddle.com/
- Support: support@paddle.com
- Status Page: https://status.paddle.com/
