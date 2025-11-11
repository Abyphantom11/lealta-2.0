# ✅ PADDLE CONFIGURADO EXITOSAMENTE

## 🎉 ¡Felicidades! Paddle está completamente configurado

**Fecha de configuración:** 10 de noviembre, 2025

---

## ✅ Lo que ya tienes funcionando:

1. ✅ **Paddle.js instalado y verificado** - `@paddle/paddle-js` v1.4.2
2. ✅ **Retain activado** - Reducción automática de churn
3. ✅ **Client Token configurado** - Para checkout frontend
4. ✅ **API Key configurado** - Para operaciones backend
5. ✅ **Webhook configurado** - Para recibir eventos de Paddle
6. ✅ **Integración validada** - Paddle confirmó que todo está bien

---

## 🚀 Próximos Pasos

### 1. Probar un Checkout Real

Ahora puedes probar que el checkout funcione en tu aplicación:

```powershell
# Si tu servidor no está corriendo, inícialo:
npm run dev
```

Luego visita:
- **Página de pricing:** http://localhost:3001/pricing
- **Página de suscripción:** http://localhost:3001/[tu-business]/admin/configuracion/suscripcion

### 2. Usar Tarjetas de Prueba

Si estás en **LIVE mode** pero quieres probar sin cobros reales, considera:

**Opción A:** Cambiar a Sandbox temporalmente (ver guía abajo)

**Opción B:** Usar el "Test Mode" de Paddle Live:
- Ve a: https://vendors.paddle.com/settings/test-mode
- Activa el modo de prueba
- Usa las tarjetas de prueba de Paddle

### 3. Configurar Productos y Precios

Asegúrate de tener tus productos configurados en Paddle:

1. Ve a: **Catalog → Products**
2. Crea/verifica tus productos:
   - Lealta Enterprise
   - Otros planes que necesites

3. Para cada producto, crea precios (Prices):
   - Mensual, Anual, etc.
   - **Copia los Price IDs** - Los necesitarás en tu código

### 4. Actualizar tus Price IDs en el código

Verifica que los Price IDs en tu código coincidan con Paddle:

**Archivo:** `src/lib/paddle.ts`

```typescript
export const PADDLE_PLANS = {
  enterprise: process.env.PADDLE_PLAN_ENTERPRISE_ID || 'pri_tu_price_id_aqui',
  // Agrega más planes según necesites
};
```

**Variables de entorno necesarias:**

```env
# En tu .env.local
PADDLE_PLAN_ENTERPRISE_ID="pri_01xxxxxxxxxxxxx"
PADDLE_PRODUCT_ID="pro_01xxxxxxxxxxxxx"

# Si usas variables públicas:
NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID="pri_01xxxxxxxxxxxxx"
NEXT_PUBLIC_PADDLE_PRODUCT_ID="pro_01xxxxxxxxxxxxx"
```

---

## 🧪 Cómo Probar el Checkout

### Flujo de prueba:

1. **Inicia tu app:** `npm run dev`
2. **Ve a pricing:** http://localhost:3001/pricing
3. **Click en "Suscribirse"** en cualquier plan
4. **Se abrirá el checkout de Paddle**
5. **Usa una tarjeta de prueba** (si estás en test mode):
   ```
   Número: 4242 4242 4242 4242
   Fecha: 12/30
   CVV: 123
   ```
6. **Completa el checkout**
7. **Verifica en la consola** que no haya errores
8. **Verifica en Paddle Dashboard** que aparezca la transacción

---

## 🔄 (Opcional) Cambiar a Sandbox para Desarrollo

Si quieres desarrollar sin riesgo de cobros reales:

### 1. Obtén credenciales de Sandbox:

- Ve a: https://sandbox-vendors.paddle.com/
- Sigue los pasos de: `GUIA_RAPIDA_PADDLE_SANDBOX.md`
- Obtén: Client Token, API Key, Price IDs

### 2. Actualiza tu `.env.local`:

```env
# Modo Sandbox
PADDLE_CLIENT_TOKEN="test_xxxxxxxxxxxxx"
PADDLE_API_KEY="pdl_test_xxxxxxxxxxxxx"
PADDLE_WEBHOOK_SECRET="ntfset_test_xxxxxxxxxxxxx"
NEXT_PUBLIC_PADDLE_ENVIRONMENT="sandbox"

# Price IDs de Sandbox
PADDLE_PLAN_ENTERPRISE_ID="pri_01xxxxxxxxxxxxx"
```

### 3. Reinicia tu servidor:

```powershell
npm run dev
```

---

## 📊 Monitorear Transacciones

Para ver tus transacciones y suscripciones:

1. **Dashboard de Paddle:**
   - Live: https://vendors.paddle.com/
   - Sandbox: https://sandbox-vendors.paddle.com/

2. **Secciones importantes:**
   - **Overview:** Resumen de ventas
   - **Transactions:** Todas las transacciones
   - **Subscriptions:** Suscripciones activas
   - **Customers:** Base de clientes

---

## 🐛 Solución de Problemas Comunes

### Error 403: Forbidden

**Causa:** Client Token o API Key inválido

**Solución:**
1. Verifica que las credenciales en `.env.local` sean correctas
2. Asegúrate de que NO haya espacios extra
3. Verifica que el environment coincida (live vs sandbox)
4. Reinicia el servidor: `npm run dev`

### Checkout no se abre

**Causa:** Paddle no inicializado o error en el código

**Solución:**
1. Abre la consola del navegador (F12)
2. Busca errores relacionados con Paddle
3. Verifica que `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` esté configurado
4. Verifica que el Price ID exista en Paddle

### Webhook no funciona

**Causa:** Webhook secret incorrecto o URL incorrecta

**Solución:**
1. Verifica el Webhook Secret en `.env.local`
2. Para desarrollo local, usa ngrok o similar
3. Verifica que la ruta sea: `/api/webhooks/paddle`

---

## 📚 Recursos Útiles

- **Documentación de Paddle:** https://developer.paddle.com/
- **Paddle.js Reference:** https://developer.paddle.com/paddlejs/overview
- **API Reference:** https://developer.paddle.com/api-reference/overview
- **Tarjetas de prueba:** https://developer.paddle.com/concepts/payment-methods/credit-debit-card

---

## 🎯 Checklist Final

Antes de ir a producción, verifica:

- [ ] Client Token y API Key de **LIVE** configurados
- [ ] Productos y Precios creados en Paddle Live
- [ ] Price IDs actualizados en tu código
- [ ] Webhooks configurados con URL de producción
- [ ] Checkout probado y funcionando
- [ ] Política de privacidad y términos de servicio publicados
- [ ] SSL/HTTPS activo en tu dominio
- [ ] Variables de entorno configuradas en Vercel/hosting

---

## 🆘 ¿Necesitas Ayuda?

Si tienes algún problema:

1. Revisa los logs de la consola del navegador
2. Revisa los logs del servidor de Next.js
3. Verifica el dashboard de Paddle para errores
4. Usa el script de verificación: `node verificar-paddle-setup.js`

---

**¡Mucha suerte con tu aplicación Lealta! 🚀**
