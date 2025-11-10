# 🚀 FLUJO DE SIGNUP CON PADDLE - IMPLEMENTADO

## ✅ NUEVO FLUJO COMPLETO

### Página: `/pricing`

**Botón: "Crear Cuenta y Suscribirse"**

Abre un modal con 2 opciones:

---

## 🎯 OPCIÓN 1: TRIAL GRATIS (14 DÍAS)

### Flujo:
1. Usuario llena el formulario:
   - 🏢 Nombre del Negocio
   - 👤 Tu Nombre
   - 📧 Email
   - 🔒 Contraseña

2. Click en **"🎉 Comenzar con 14 Días Gratis"**

3. Sistema:
   - ✅ Crea el negocio (Business)
   - ✅ Crea la cuenta del usuario (SuperAdmin)
   - ✅ Activa trial de 14 días automáticamente
   - ✅ Inicia sesión automáticamente
   - ✅ Redirige a dashboard: `/{businessId}/admin`

4. Usuario tiene **14 días completos** para usar todas las funciones

**Base de Datos:**
```sql
Business {
  subscriptionStatus: "trialing"
  trialEndsAt: now() + 14 días
  planId: null
  subscriptionId: null
}
```

---

## 💳 OPCIÓN 2: PAGAR AHORA ($250/mes)

### Flujo:
1. Usuario llena el mismo formulario:
   - 🏢 Nombre del Negocio
   - 👤 Tu Nombre
   - 📧 Email
   - 🔒 Contraseña

2. Click en **"💳 Pagar Ahora ($250/mes)"**

3. Sistema:
   - ✅ Crea el negocio (Business)
   - ✅ Crea la cuenta del usuario (SuperAdmin)
   - ✅ Inicia sesión automáticamente
   - ✅ Abre **Paddle Checkout Overlay** (modal de pago)

4. **Paddle Overlay se abre** mostrando:
   - 💳 Formulario de tarjeta
   - 📧 Email pre-llenado
   - 💵 Precio: $250 USD/mes
   - 📄 Términos y condiciones

5. Usuario completa el pago

6. Después del pago:
   - ✅ Paddle envía **correo de confirmación + factura**
   - ✅ Webhook actualiza la base de datos
   - ✅ Usuario redirigido a `/billing/success`

**Base de Datos (después del pago):**
```sql
Business {
  subscriptionStatus: "active"
  subscriptionId: "sub_xxxxx" (de Paddle)
  planId: "ENTERPRISE"
  customerId: "ctm_xxxxx"
  subscriptionStartDate: now()
  trialEndsAt: null
}

PaymentHistory {
  businessId: "..."
  amount: 25000 (en centavos)
  status: "completed"
  transactionId: "txn_xxxxx"
}
```

---

## 🔐 OPCIÓN 3: USUARIO EXISTENTE

**Link: "¿Ya tienes cuenta? Inicia sesión aquí"**

### Flujo:
1. Click en el link
2. Modal cambia a modo **Login**
3. Usuario ingresa:
   - 📧 Email
   - 🔒 Contraseña

4. Click en **"Iniciar Sesión"**

5. Sistema:
   - ✅ Valida credenciales
   - ✅ Inicia sesión
   - ✅ Cierra el modal
   - ✅ Abre **Paddle Checkout** automáticamente

6. Usuario completa el pago y se suscribe

---

## 📝 CAMPOS DEL FORMULARIO

### Modo Signup (Registro)
```
🏢 Nombre del Negocio    [Restaurante El Sabor]
👤 Tu Nombre             [Juan Pérez]
📧 Email                 [tu@email.com]
🔒 Contraseña            [••••••••]

Botones:
[🎉 Comenzar con 14 Días Gratis]
[💳 Pagar Ahora ($250/mes)]
```

### Modo Login
```
📧 Email                 [tu@email.com]
🔒 Contraseña            [••••••••]

Botón:
[Iniciar Sesión]
```

---

## 🔧 ENDPOINTS API

### POST `/api/auth/signup`

**Body:**
```json
{
  "businessName": "Restaurante El Sabor",
  "name": "Juan Pérez",
  "email": "juan@email.com",
  "password": "MiPassword123",
  "trial": true  // true = 14 días gratis, false = sin trial
}
```

**Respuesta:**
```json
{
  "success": true,
  "businessId": "clxxxxxx",
  "trial": true,
  "message": "Negocio y administrador creados exitosamente"
}
```

---

## 🎨 PADDLE CHECKOUT OVERLAY

### Configuración en `usePaddle.ts`:

```typescript
paddle.Checkout.open({
  items: [{
    priceId: "pri_01k9d95qvht02dqzvkw0h5876p",
    quantity: 1,
  }],
  customer: {
    email: "juan@email.com", // Pre-llenado
  },
  customData: {
    businessId: "clxxxxxx",
    source: "lealta-dashboard",
  },
  settings: {
    displayMode: 'overlay', // Modal sobre la página
    theme: 'light',
    locale: 'es', // Español
    successUrl: "https://lealta.app/billing/success",
  },
});
```

**Resultado:**
- Modal se abre sobre la página
- Usuario ve formulario de pago
- Paddle maneja todo el proceso de pago
- Paddle envía correos automáticamente

---

## 📧 CORREOS AUTOMÁTICOS (Paddle)

Paddle envía estos correos sin configuración adicional:

1. **Confirmación de Pago** - Inmediatamente después
2. **Factura (Invoice)** - Con el PDF adjunto
3. **Recordatorio de Renovación** - Antes del próximo pago
4. **Recibo de Pago Recurrente** - Cada mes

---

## 🐛 TROUBLESHOOTING

### Error: "customer ID or email is required"

**Causa:** El email no se está pasando correctamente al checkout

**Solución:** 
- Verificar que `formData.email` tenga valor
- Verificar que `currentSession?.user?.email` exista si está logueado
- En el código, ahora se usa el fallback: `email || currentSession?.user?.email || formData.email`

---

### Error: "Paddle no está configurado"

**Causa:** Variables de entorno faltantes

**Solución:**
```env
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN="live_36ddf9a4003f105fc2730fae735"
NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID="pri_01k9d95qvht02dqzvkw0h5876p"
NEXT_PUBLIC_PADDLE_ENVIRONMENT="production"
```

**Reiniciar el servidor después de cambiar `.env`**

---

### Modal no se cierra después del pago

**Causa:** Paddle no redirige automáticamente

**Solución:**
- Configurar `successUrl` en el checkout
- Paddle redirigirá a esa URL después del pago exitoso

---

## 🎯 TESTING

### 1. Probar Trial Gratis
```bash
1. Ir a http://localhost:3001/pricing
2. Click "Crear Cuenta y Suscribirse"
3. Llenar formulario
4. Click "🎉 Comenzar con 14 Días Gratis"
5. Verificar que redirige a /admin
6. Verificar en DB que trialEndsAt = +14 días
```

### 2. Probar Pago Directo
```bash
1. Ir a http://localhost:3001/pricing
2. Click "Crear Cuenta y Suscribirse"
3. Llenar formulario
4. Click "💳 Pagar Ahora"
5. Verificar que se abre modal de Paddle
6. Usar tarjeta de prueba: 4242 4242 4242 4242
7. Completar pago
8. Verificar redirect a /billing/success
9. Verificar correo de factura
```

### 3. Probar Login y Suscripción
```bash
1. Crear cuenta con trial gratis primero
2. Logout
3. Ir a /pricing
4. Click "¿Ya tienes cuenta? Inicia sesión aquí"
5. Ingresar email y contraseña
6. Click "Iniciar Sesión"
7. Verificar que se abre Paddle automáticamente
8. Completar pago
```

---

## ✅ VENTAJAS DE ESTE FLUJO

1. **Sin fricción:** Usuario puede probar gratis sin tarjeta
2. **Conversión directa:** Usuarios que quieren pagar lo hacen inmediatamente
3. **Sin redirect:** Todo sucede en la misma página (modal overlay)
4. **Emails automáticos:** Paddle maneja toda la comunicación
5. **Seguro:** Nunca manejamos datos de tarjeta
6. **Internacionalizado:** Paddle soporta múltiples monedas y métodos de pago

---

## 🚀 PRÓXIMOS PASOS

1. **Testing completo** en sandbox (tarjeta 4242...)
2. **Cambiar a producción** cuando esté listo
3. **Monitorear pagos** en Paddle Dashboard
4. **Contactar clientes** con el link de pricing

---

**¿Listo para facturar?** 💰
