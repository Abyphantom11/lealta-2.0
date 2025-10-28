# 🎯 CONFIGURACIÓN PADDLE - PASOS ESPECÍFICOS

## ✅ CREDENCIALES YA CONFIGURADAS

Tus credenciales Paddle ya están en `.env`:
```env
PADDLE_API_KEY="pdl_live_apikey_01k8m6ka12hs2f6rhstmd5dfa3_1HSSPgyktpqy3sfeG1QpPX_ALt"
PADDLE_CLIENT_TOKEN="live_36ddf9a4003f105fc2730fae735"
NEXT_PUBLIC_PADDLE_ENVIRONMENT="production"
```

---

## 🏗️ PASO 1: CREAR PLAN ENTERPRISE EN PADDLE

### 1.1 Acceder a Paddle Dashboard
1. Ve a [vendor.paddle.com](https://vendor.paddle.com) o [sandbox-vendor.paddle.com](https://sandbox-vendor.paddle.com)
2. Inicia sesión con tu cuenta

### 1.2 Crear Producto
1. Navega a **Catalog** > **Products**
2. Clic **"Add Product"**
3. Configurar:
   ```
   Name: Lealta Enterprise
   Description: Solución empresarial personalizada para múltiples negocios
   Type: Standard Product
   ```

### 1.3 Crear Precio ($250/mes)
1. Dentro del producto, clic **"Add Price"**
2. Configurar:
   ```
   Name: Enterprise Monthly
   Billing Cycle: Monthly
   Amount: $250.00
   Currency: USD (US Dollar)
   Type: Recurring
   ```

### 1.4 Obtener Price ID
- Después de crear, verás el **Price ID** (formato: `pri_xxxxxxxxx`)
- **COPIA ESTE ID** - lo necesitarás para el siguiente paso

---

## 🔗 PASO 2: CONFIGURAR WEBHOOK

### 2.1 Crear Webhook
1. Ve a **Developer Tools** > **Notifications** > **Webhooks**
2. Clic **"Add Webhook"**
3. Configurar:
   ```
   URL: https://tu-dominio.com/api/webhooks/paddle
   (O para testing local: https://tu-ngrok-url.ngrok.io/api/webhooks/paddle)
   ```

### 2.2 Seleccionar Eventos
Marca estos eventos importantes:
- `subscription.created`
- `subscription.updated` 
- `subscription.canceled`
- `transaction.completed`
- `transaction.created`

### 2.3 Obtener Webhook Secret
- Después de crear, copia el **Webhook Secret** (formato: `pdl_whsec_xxxxx`)

---

## ⚙️ PASO 3: ACTUALIZAR .ENV

Actualiza tu archivo `.env` con los IDs obtenidos:

```env
# Añadir estas líneas (reemplaza con tus IDs reales)
PADDLE_PLAN_ENTERPRISE_ID="pri_xxxxxxxxx"  # Del Paso 1.4
PADDLE_WEBHOOK_SECRET="pdl_whsec_xxxxx"    # Del Paso 2.3
```

---

## 🧪 PASO 4: PROBAR INTEGRACIÓN

### 4.1 Iniciar Servidor
```bash
npm run dev
```

### 4.2 Probar Página de Pricing
1. Ve a: `http://localhost:3001/pricing`
2. Verifica que muestre "$250/negocio"
3. Clic "Contratar Solución Enterprise"

### 4.3 Para Testing Local con Webhooks
Si quieres probar webhooks localmente:

```bash
# Instalar ngrok
npm install -g ngrok

# Exponer puerto local
ngrok http 3001

# Usar la URL ngrok en Paddle webhook
```

---

## 🎯 RESULTADO ESPERADO

Después de completar estos pasos:

1. ✅ **Credenciales configuradas** (ya listo)
2. ✅ **Plan enterprise en Paddle** ($250/mes)
3. ✅ **Webhook configurado** (para procesar pagos)
4. ✅ **IDs actualizados en .env**
5. ✅ **Sistema listo** para facturar

---

## 🚀 SIGUIENTE: PRIMER PAGO

Una vez configurado todo:
1. Cliente va a `/pricing`
2. Clic "Contratar Solución Enterprise"  
3. Redirect a Paddle checkout ($250)
4. Cliente paga
5. Webhook procesa el pago
6. Cliente tiene acceso completo

---

## 📞 AYUDA

Si tienes problemas:
- **Paddle Docs**: [developer.paddle.com](https://developer.paddle.com)
- **Support**: Via tu Paddle Dashboard
- **Testing**: Usar `/test/paddle` en tu app

¡Ya tienes todo configurado para empezar a cobrar $250/negocio! 🎉
