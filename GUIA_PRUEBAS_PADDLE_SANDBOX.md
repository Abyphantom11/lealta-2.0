# 🎯 Guía Rápida - Probar Paddle Sandbox

## ✅ Estado Actual
Las credenciales de Paddle Sandbox están configuradas y funcionando correctamente.

**Información del Plan Configurado:**
- **Nombre:** Full stack
- **Precio:** $250.00 USD / mes
- **Price ID:** `pri_01k9rf1r9jv9aa3fsjnzf34zkp`
- **Product ID:** `pro_01k9rf0j585bk5s8nh1fjjvvd4`

## 🚀 Pasos para Probar

### 1️⃣ Iniciar el servidor
```powershell
npm run dev
```

### 2️⃣ Abrir la página de pricing
Navega a: **http://localhost:3001/pricing**

### 3️⃣ Hacer una compra de prueba

#### Tarjetas de Prueba (Sandbox)
```
✅ Tarjeta Exitosa:
   Número: 4242 4242 4242 4242
   CVV: 123
   Fecha: 12/25
   Nombre: Test User

❌ Tarjeta Rechazada (para probar errores):
   Número: 4000 0000 0000 0002
   CVV: 123
   Fecha: 12/25
```

### 4️⃣ Verificar la compra

1. **En tu app:**
   - Deberías ver que la suscripción se creó
   - El usuario debería tener acceso al plan Enterprise

2. **En Paddle Dashboard:**
   - Ve a: https://sandbox-vendors.paddle.com/subscriptions
   - Verás la suscripción de prueba

3. **Webhooks (si están configurados):**
   - Revisa los logs en la consola del servidor
   - Deberías ver los eventos: `subscription.created`, `transaction.completed`

## 🐛 Troubleshooting

### El overlay de Paddle no se abre
✅ **Solución:** Verifica que `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` esté configurado correctamente
```powershell
# Verificar
node -e "require('dotenv').config({path: '.env.local'}); console.log(process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN)"
```

### Error "Invalid API Key"
✅ **Solución:** Verifica que estés usando la API Key de sandbox
```powershell
# Debe empezar con: pdl_sdbx_
node -e "require('dotenv').config({path: '.env.local'}); console.log(process.env.PADDLE_API_KEY)"
```

### El precio no aparece
✅ **Solución:** Verifica que el Price ID sea correcto
```powershell
# Ejecutar el test
node test-paddle-connection.js
```

## 📱 Probar en diferentes escenarios

### Escenario 1: Compra exitosa
1. Usa la tarjeta `4242 4242 4242 4242`
2. Completa el checkout
3. Verifica que la suscripción se creó en Paddle Dashboard

### Escenario 2: Pago rechazado
1. Usa la tarjeta `4000 0000 0000 0002`
2. El pago debe fallar
3. Verifica que se muestre un mensaje de error apropiado

### Escenario 3: Cancelar suscripción
1. Ve al Dashboard de Paddle: https://sandbox-vendors.paddle.com/subscriptions
2. Busca la suscripción de prueba
3. Cancélala
4. Verifica que el webhook `subscription.canceled` se reciba

## 🔍 Verificar Webhooks Localmente

Si quieres probar webhooks en tu localhost:

### Opción 1: Usar ngrok
```powershell
# Instalar ngrok
choco install ngrok

# Exponer tu localhost
ngrok http 3001
```

Luego configura el webhook URL en Paddle:
```
https://tu-url-ngrok.ngrok.io/api/webhooks/paddle
```

### Opción 2: Usar Cloudflare Tunnel
```powershell
# Instalar cloudflared
choco install cloudflared

# Crear tunnel
cloudflared tunnel --url http://localhost:3001
```

## 📊 Monitoreo

Para ver los logs en tiempo real:
```powershell
# En la terminal donde corre npm run dev
# Los eventos de webhook aparecerán aquí
```

## 🎨 Personalización

Si quieres cambiar el precio o el nombre del plan:

1. Ve a: https://sandbox-vendors.paddle.com/catalog/prices
2. Edita el precio `pri_01k9rf1r9jv9aa3fsjnzf34zkp`
3. Los cambios se reflejarán automáticamente

## ✅ Checklist de Prueba

- [ ] El servidor se inicia sin errores
- [ ] La página `/pricing` carga correctamente
- [ ] El botón "Subscribe" o "Comenzar Ahora" funciona
- [ ] El overlay de Paddle se abre
- [ ] Se puede completar una compra de prueba
- [ ] La suscripción aparece en Paddle Dashboard
- [ ] Los webhooks se reciben (si están configurados)

---

**¿Problemas?** Ejecuta `node test-paddle-connection.js` para diagnosticar 🔍
