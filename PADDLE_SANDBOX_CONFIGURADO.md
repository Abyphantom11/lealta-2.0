# ✅ Configuración de Paddle Sandbox Completada

**Fecha:** 10 de noviembre, 2025  
**Estado:** ✅ CONFIGURADO Y LISTO PARA PRUEBAS

## 🔑 Credenciales Configuradas

### API Credentials (Sandbox)
- **API Key:** `pdl_sdbx_apikey_01k9rf68xsj4h0z25g1d4mnd5y_MMaejrm2wQ8MnpSCzjPXwA_APd`
- **Client Token:** `test_e7baca7d5de4072f974fbe36dce`
- **Webhook Secret:** `ntfset_01k9rf9t8ta8tdd06q1vgk2qex`

### Product & Pricing
- **Price ID:** `pri_01k9rf1r9jv9aa3fsjnzf34zkp`
- **Environment:** `sandbox`

## 📁 Archivos Actualizados

### `.env.local` (Principal para desarrollo)
```bash
PADDLE_API_KEY="pdl_sdbx_apikey_01k9rf68xsj4h0z25g1d4mnd5y_MMaejrm2wQ8MnpSCzjPXwA_APd"
PADDLE_CLIENT_TOKEN="test_e7baca7d5de4072f974fbe36dce"
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN="test_e7baca7d5de4072f974fbe36dce"
PADDLE_WEBHOOK_SECRET="ntfset_01k9rf9t8ta8tdd06q1vgk2qex"
NEXT_PUBLIC_PADDLE_ENVIRONMENT="sandbox"
PADDLE_PLAN_ENTERPRISE_ID="pri_01k9rf1r9jv9aa3fsjnzf34zkp"
NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID="pri_01k9rf1r9jv9aa3fsjnzf34zkp"
```

### `.env` (Backup/Template)
✅ También actualizado con las mismas credenciales

## 🚀 Próximos Pasos para Probar

### 1. Reiniciar el servidor de desarrollo
```powershell
npm run dev
```

### 2. Abrir la página de pricing
```
http://localhost:3001/pricing
```

### 3. Hacer una prueba de checkout
- Click en el botón "Comenzar Ahora" o "Subscribe"
- Se abrirá el overlay de Paddle en modo sandbox
- Puedes usar tarjetas de prueba:
  - **Visa exitosa:** `4242 4242 4242 4242`
  - **Visa rechazada:** `4000 0000 0000 0002`
  - **Cualquier CVV:** `123`
  - **Cualquier fecha futura:** `12/25`

### 4. Verificar webhooks
- Los webhooks deben llegar a: `http://localhost:3001/api/webhooks/paddle`
- Puedes ver los logs en la consola del servidor

## 🧪 Script de Prueba

Ejecuta el siguiente script para probar la conexión con Paddle:

```powershell
node test-paddle-connection.js
```

## 📊 Diferencias entre Sandbox y Production

| Característica | Sandbox | Production |
|----------------|---------|------------|
| **Pagos reales** | ❌ No | ✅ Sí |
| **Tarjetas de prueba** | ✅ Sí | ❌ No |
| **URL Dashboard** | sandbox-vendors.paddle.com | vendors.paddle.com |
| **Prefijo API Key** | `pdl_sdbx_` | `pdl_live_` |
| **Prefijo Client Token** | `test_` | `live_` |
| **Prefijo Webhook** | `ntfset_test_` o similar | `ntfset_` con ID único |

## 🔄 Volver a Production

Cuando estés listo para usar la cuenta de producción nuevamente:

1. Guarda las credenciales de sandbox para futuras pruebas
2. Reemplaza las variables en `.env.local` con las credenciales LIVE:
   ```bash
   PADDLE_CLIENT_TOKEN="live_36ddf9a4003f105fc2730fae735"
   PADDLE_API_KEY="pdl_live_apikey_01k8m6ka12hs2f6rhstmd5dfa3_1HSSPgyktpqy3sfeG1QpPX_ALt"
   PADDLE_WEBHOOK_SECRET="ntfset_01k9d9j96f9whgz0qtdke3tb6a"
   NEXT_PUBLIC_PADDLE_ENVIRONMENT="production"
   ```

## 📝 Notas Importantes

1. **No commits de credenciales:** `.env.local` está en `.gitignore`
2. **Webhooks locales:** Para probar webhooks localmente, considera usar [ngrok](https://ngrok.com/) o [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
3. **Tarjetas de prueba:** Solo funcionan en sandbox
4. **Data aislada:** Los datos de sandbox no afectan producción

## 🔗 Links Útiles

- **Dashboard Sandbox:** https://sandbox-vendors.paddle.com
- **Documentación:** https://developer.paddle.com/
- **Tarjetas de prueba:** https://developer.paddle.com/concepts/payment-methods/credit-debit-card#test-card-numbers

---

**¿Todo listo?** Ejecuta `npm run dev` y ve a `/pricing` para hacer tu primera prueba 🚀
