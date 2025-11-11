# 🚀 CONFIGURAR PADDLE WEBHOOKS CON VERCEL

## ✅ VENTAJA: Ya tienes todo listo

Como tu proyecto ya está en Vercel, puedes usar esa URL directamente para webhooks de Paddle.

---

## 🎯 PASO A PASO

### PASO 1: Obtener tu URL de Vercel

Tu URL de producción es: **https://lealta.app**

O tu URL de Vercel: **https://lealta-themaster2648-9501s-projects.vercel.app**

---

### PASO 2: Configurar Webhook en Paddle

1. **Ve a:** https://vendors.paddle.com/notifications

2. **Click:** "Create destination" o "Add endpoint"

3. **Configurar:**
   ```
   URL: https://lealta.app/api/webhooks/paddle
   
   O si prefieres Vercel directamente:
   URL: https://lealta-themaster2648-9501s-projects.vercel.app/api/webhooks/paddle
   
   Description: Production webhook
   ```

4. **Seleccionar eventos importantes:**
   - ✅ `transaction.completed`
   - ✅ `transaction.created` 
   - ✅ `transaction.updated`
   - ✅ `subscription.created`
   - ✅ `subscription.updated`
   - ✅ `subscription.canceled`
   - ✅ `payment.succeeded`
   - ✅ `payment.failed`

5. **Click:** "Save"

6. **⚠️ COPIAR EL WEBHOOK SECRET** que te muestre

---

### PASO 3: Agregar Webhook Secret en Vercel

1. **Ve a tu proyecto en Vercel:**
   ```
   https://vercel.com/themaster2648-9501s-projects/lealta
   ```

2. **Ve a:** Settings → Environment Variables

3. **Agregar nueva variable:**
   ```
   Name: PADDLE_WEBHOOK_SECRET
   Value: ntfset_el_secret_que_copiaste_de_paddle
   ```

4. **Aplicar a:** Production, Preview, Development (selecciona todos)

5. **Click:** "Save"

---

### PASO 4: Re-deploy (si es necesario)

Si ya tenías el código del webhook, Vercel automáticamente usará la nueva variable.

Si necesitas re-deploy:
```powershell
git add .
git commit -m "chore: configure paddle webhook"
git push
```

Vercel automáticamente hará deploy.

---

### PASO 5: Probar con Simulaciones de Paddle

1. **Ve a:** https://vendors.paddle.com/simulations-v2

2. **Crear simulación:**
   - Click: "Create simulation"
   - Selecciona: `transaction.completed`
   - Click: "Send"

3. **Verificar:**
   - La simulación debería mostrar **"Success" o "200 OK"** ✅
   - NO debería mostrar "Aborted"

---

## 🔍 VERIFICAR QUE EL ENDPOINT EXISTE

Primero, verifica que tu webhook route esté en el código:

```powershell
# Verificar que existe
Test-Path src/app/api/webhooks/paddle/route.ts
```

Si NO existe, necesitas crearlo. ¿Existe el archivo?

---

## 📊 MONITOREAR WEBHOOKS

### Opción A: En Paddle Dashboard

1. Ve a: https://vendors.paddle.com/notifications
2. Click en tu webhook endpoint
3. Verás el historial de eventos enviados

### Opción B: En Vercel Logs

1. Ve a tu proyecto en Vercel
2. Click en "Deployments" → Tu último deployment
3. Click en "Functions" → Busca `/api/webhooks/paddle`
4. Verás los logs en tiempo real

---

## 🧪 PROBAR EN DESARROLLO LOCAL (Opcional)

Si quieres probar webhooks en local con Cloudflare Tunnel:

### Opción A: Usar tu túnel existente

Si ya tienes `cloudflared` configurado:

```powershell
# Iniciar túnel
cloudflared tunnel --url http://localhost:3001
```

Esto te dará una URL como: `https://abc-123.trycloudflare.com`

Usa esa URL temporalmente en Paddle para desarrollo.

### Opción B: Usar Vercel Preview

Cada vez que hagas push a una rama, Vercel crea un preview:
```
https://lealta-git-tu-rama-themaster2648.vercel.app
```

Puedes usar esa URL para probar webhooks sin afectar producción.

---

## ⚠️ IMPORTANTE: Verificar el Webhook Route

Tu archivo debe estar en:
```
src/app/api/webhooks/paddle/route.ts
```

Y debe manejar eventos POST. ¿Quieres que verifique tu webhook handler?

---

## 🎯 CHECKLIST FINAL

- [ ] Webhook endpoint configurado en Paddle (`https://lealta.app/api/webhooks/paddle`)
- [ ] Webhook Secret copiado de Paddle
- [ ] Webhook Secret agregado en Vercel Environment Variables
- [ ] Re-deploy hecho (si fue necesario)
- [ ] Simulación probada y exitosa (no "Aborted")
- [ ] Archivo `src/app/api/webhooks/paddle/route.ts` existe y funciona

---

## 🚀 SIGUIENTE PASO

Una vez que el webhook esté configurado:

1. ✅ Las simulaciones funcionarán
2. ✅ Puedes probar eventos de Paddle
3. ✅ Pero aún necesitas resolver el checkout bloqueado

**Para el checkout**, las opciones son:

**A)** Contactar soporte de Paddle (te desbloquean la cuenta)

**B)** Usar un mock checkout mientras esperas

**C)** Usar Payment Links (workaround temporal)

¿Qué prefieres hacer? 😊

---

## 📚 RECURSOS

- **Verificar webhook:** https://lealta.app/api/webhooks/paddle (debe dar 405 en GET)
- **Paddle Notifications:** https://vendors.paddle.com/notifications
- **Vercel Functions Logs:** https://vercel.com/themaster2648-9501s-projects/lealta/logs
