# 🔧 SOLUCIÓN: Simulaciones "Aborted" - Configurar Webhook

## ❌ EL PROBLEMA

Las simulaciones muestran **"Aborted"** porque:
- No hay webhook endpoint configurado en Paddle
- O el endpoint no es accesible
- Paddle no puede enviar el evento simulado

---

## ✅ SOLUCIÓN: Configurar Webhook con ngrok

### PASO 1: Instalar ngrok

**Opción A: Descarga directa**
1. Ve a: https://ngrok.com/download
2. Descarga ngrok para Windows
3. Extrae el archivo `ngrok.exe`
4. Muévelo a tu carpeta de proyecto

**Opción B: Con Chocolatey**
```powershell
choco install ngrok
```

**Opción C: Con Scoop**
```powershell
scoop install ngrok
```

---

### PASO 2: Iniciar tu aplicación

```powershell
npm run dev
```

Tu app debería estar corriendo en: `http://localhost:3001`

---

### PASO 3: Exponer con ngrok

En otra terminal de PowerShell:

```powershell
ngrok http 3001
```

Verás algo como:
```
Forwarding  https://abc123def456.ngrok.io -> http://localhost:3001
```

**⚠️ COPIA ESA URL** (la que empieza con `https://`)

Ejemplo: `https://abc123def456.ngrok.io`

---

### PASO 4: Configurar Webhook en Paddle

1. **Ve a:** https://vendors.paddle.com/notifications

2. **Click:** "Create destination" o "Add endpoint"

3. **Completa el formulario:**
   ```
   URL: https://tu-url-de-ngrok.io/api/webhooks/paddle
   Description: Local development webhook
   ```

4. **Selecciona eventos** (todos o los que necesites):
   - `transaction.completed`
   - `transaction.created`
   - `subscription.created`
   - `subscription.updated`
   - Etc.

5. **Click:** "Save"

6. **⚠️ COPIA EL WEBHOOK SECRET** si te lo muestra

---

### PASO 5: Actualizar .env.local con el Webhook Secret

Si Paddle te dio un webhook secret, agrégalo:

```env
PADDLE_WEBHOOK_SECRET="ntfset_tu_secret_aqui"
```

---

### PASO 6: Probar con Simulaciones

1. **Ve a:** https://vendors.paddle.com/simulations-v2

2. **Crea una simulación:**
   - Click: "Create simulation"
   - Selecciona evento: `transaction.completed`
   - Edita el payload si quieres
   - Click: "Send"

3. **Verifica:**
   - La simulación debería mostrar "Success" o "200 OK"
   - En tu terminal de la app, deberías ver logs del webhook
   - En ngrok, deberías ver la request

---

## 🔍 VERIFICAR QUE FUNCIONE

### En tu terminal de Next.js, deberías ver:

```
POST /api/webhooks/paddle 200 in 45ms
🔔 Paddle Webhook recibido: transaction.completed
```

### En ngrok (si abres http://localhost:4040):

- Lista de requests recibidas
- Status 200
- Payload del webhook

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### "Simulation still showing Aborted"

**Causa:** El endpoint no está respondiendo correctamente

**Solución:**
1. Verifica que tu app esté corriendo: `npm run dev`
2. Verifica que ngrok esté corriendo
3. Verifica que la URL en Paddle sea correcta
4. Verifica que tu webhook route exista: `src/app/api/webhooks/paddle/route.ts`

---

### "404 Not Found en simulación"

**Causa:** La ruta del webhook no existe o está mal configurada

**Solución:**

Verificar que el archivo exista:
```powershell
# Verificar que el archivo existe
Test-Path src/app/api/webhooks/paddle/route.ts
```

Si no existe, necesitas crearlo. ¿Quieres que te ayude?

---

### "ngrok session expired"

**Causa:** ngrok gratis expira después de 2 horas

**Solución:**
1. Detén ngrok (Ctrl+C)
2. Inícialo de nuevo: `ngrok http 3001`
3. Actualiza la URL en Paddle con la nueva URL de ngrok

---

## 🎯 FLUJO COMPLETO FUNCIONANDO

```
1. Tu App (localhost:3001)
   ↓
2. ngrok expone tu app
   ↓
3. Paddle (vendors.paddle.com)
   ↓ envía webhook
4. ngrok (https://abc.ngrok.io/api/webhooks/paddle)
   ↓ reenvía a
5. Tu App (localhost:3001/api/webhooks/paddle)
   ↓ procesa
6. Responde 200 OK
   ↓
7. Simulation muestra "Success" ✅
```

---

## 💡 ALTERNATIVA: Desarrollar sin Webhooks (Por ahora)

Si no quieres configurar ngrok todavía, puedes:

### Opción A: Ignorar simulaciones y usar Mock Checkout

Te implemento un sistema mock que NO necesita webhooks para funcionar.

### Opción B: Probar webhooks después

Desarrolla primero el checkout/frontend, los webhooks se prueban después.

---

## 🚀 ¿Qué prefieres?

**A)** Configurar ngrok + webhooks ahora (15-20 min)

**B)** Implementar mock checkout sin webhooks (más rápido)

**C)** Ambos (mock para checkout + webhooks para aprender)

Dime y te ayudo! 😊

---

## 📋 COMANDOS RÁPIDOS

```powershell
# Terminal 1: Tu app
npm run dev

# Terminal 2: ngrok
ngrok http 3001

# Ver requests de ngrok
# Abre en navegador: http://localhost:4040
```
