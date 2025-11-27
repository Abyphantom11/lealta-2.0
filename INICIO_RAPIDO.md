# ⚡ INICIO RÁPIDO - 5 MINUTOS

```
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║  📱 SISTEMA WHATSAPP BUSINESS - LOVE ME GROUP                 ║
║  ✨ Profesional | Compliant | Multi-Cuenta | Escalable       ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
```

---

## 🎯 En 5 Pasos (Copiar y Pegar)

### 1️⃣ Verifica que Twilio esté configurado
```bash
echo $TWILIO_ACCOUNT_SID    # Debe mostrar algo como AC...
echo $TWILIO_AUTH_TOKEN      # Debe mostrar algo como ...
echo $DATABASE_URL           # Debe mostrar postgresql://...
```

Si no ves nada, edita tu `.env.local` con:
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_token_here
TWILIO_PHONE_NUMBER=+15558848359
DATABASE_URL=postgresql://user:pass@host:5432/db
```

### 2️⃣ Ejecutar configuración rápida
```bash
node quick-setup.js
```

Esperado:
```
✅ Variables de Entorno: 4/4
✅ Conexión a BD: OK
✅ Cuenta WhatsApp: Creada
✅ Template: Creado
✅ Cola: Creada
```

### 3️⃣ Enviar mensaje de prueba
```bash
node test-whatsapp-send.js +593987654321 "¡Hola desde Love Me!"
```

Esperado:
```
✅ Mensaje enviado (SID: SMxxxxx)
⏳ Esperando confirmación...
✅ Estado: delivered
```

### 4️⃣ Iniciar servidor
```bash
# Terminal 1:
npm run dev

# Terminal 2:
npm run worker

# Terminal 3:
node monitor-whatsapp-live.js
```

### 5️⃣ Ver Dashboard
```
http://localhost:3000/admin/whatsapp
```

---

## 🔧 Troubleshooting Rápido

### ❌ "TWILIO_ACCOUNT_SID not found"
```bash
# Edita .env.local y asegúrate que tiene:
cat .env.local | grep TWILIO_ACCOUNT_SID

# Si está vacío:
cp .env.example .env.local
# Luego edita con tus valores reales
```

### ❌ "Error connecting to PostgreSQL"
```bash
# Si usas Neon:
# 1. Ve a: https://console.neon.tech/
# 2. Copia la CONNECTION STRING nuevamente
# 3. Pega en .env.local como DATABASE_URL
```

### ❌ "No recibí el mensaje"
```bash
# 1. ¿Agregaste tu número a Twilio Sandbox?
#    https://console.twilio.com/us/account/develop/sms/try-it-out
#    → Busca "WhatsApp Sandbox"
#    → Agrega tu número
#    → Responde con el código

# 2. ¿El formato es correcto?
#    ✅ +593987654321 (SÍ)
#    ❌ 0987654321 (NO)

# 3. ¿Ya pasaron 30 segundos?
#    WhatsApp tarda 30 segundos en entregar

# 4. ¿El trabajo está en BD?
#    npm run prisma:studio → WhatsAppMessage
```

---

## 📚 Scripts Principales

| Script | Qué Hace | Comando |
|--------|----------|---------|
| `quick-setup.js` | Setup automático | `node quick-setup.js` |
| `verify-whatsapp-setup.js` | Verifica estado | `node verify-whatsapp-setup.js` |
| `test-whatsapp-send.js` | Envía 1 mensaje | `node test-whatsapp-send.js +593... "msg"` |
| `monitor-whatsapp-live.js` | Dashboard en vivo | `node monitor-whatsapp-live.js` |
| `full-test.js` | Suite de pruebas | `node full-test.js` |
| `deploy.js` | Deploy automático | `node deploy.js` |

---

## 🚀 Próximo Nivel (Campañas Masivas)

Una vez que el primer mensaje funciona:

```bash
# 1. Crear cola con múltiples números
# Edita setup-queue-test.js y agrega:
# const recipients = ["+593987654321", "+593987654322", ...];

node setup-queue-test.js

# 2. Monitorear procesamiento
node monitor-whatsapp-live.js

# 3. Ver en BD
npm run prisma:studio
```

---

## 📞 Recursos

- **Documentación Completa**: `README_WHATSAPP.md`
- **Checklist Detallado**: `VERIFICACION_COMPLETA.md`
- **Setup Paso a Paso**: `GUIA_CONFIGURACION_WHATSAPP_PRUEBAS.md`
- **Consola Twilio**: https://console.twilio.com/
- **Meta Business**: https://business.facebook.com/

---

## ✅ Validación Rápida

```bash
# Ejecuta esto para verificar todo en 10 segundos:
node verify-whatsapp-setup.js

# Esperado:
# ✅ Variables de Entorno: 4/4
# ✅ Conexión a BD: OK
# ✅ Negocios: 1
# ✅ Cuentas WhatsApp: 1 (PRIMARIA)
# ✅ Templates: 1 (APPROVED)
# ✅ Colas: 1
# ✅ Mensajes: 5 (últimos enviados)
# ✅ Workers: 1 (ACTIVO)
```

---

## 🎓 Casos de Uso

### Caso 1: Enviar 1 Mensaje (Ahora)
```bash
node test-whatsapp-send.js +593987654321 "Hola!"
```

### Caso 2: Enviar 100 Mensajes (Hoy)
```bash
node setup-queue-test.js
npm run dev
npm run worker
node monitor-whatsapp-live.js
```

### Caso 3: Enviar a 2,881 Clientes (Esta Semana)
```bash
# 1. Importar clientes desde CSV
node import-clients-csv.js clients.csv

# 2. Crear campaña masiva
node create-campaign-all-clients.js

# 3. Procesar
npm run dev
npm run worker
node monitor-whatsapp-live.js
```

---

## 💡 Tips Pro

1. **Siempre revisa logs antes de cambios grandes**
   ```bash
   npm run logs
   ```

2. **BD sincronizada? Verifica:**
   ```bash
   npm run prisma:status
   ```

3. **¿Necesitas resetear todo? (CUIDADO: borra datos)**
   ```bash
   npm run prisma:reset
   ```

4. **¿Entorno nuevo? Ejecuta:**
   ```bash
   node deploy.js
   ```

5. **¿Problemas? Ejecuta pruebas completas:**
   ```bash
   node full-test.js
   ```

---

## ⏱️ Timeline

```
Ahora (5 min)
├─ node quick-setup.js
├─ node test-whatsapp-send.js
└─ Verifica mensaje en teléfono

Hoy (1 hora)
├─ npm run dev
├─ npm run worker
├─ node monitor-whatsapp-live.js
└─ Envía 10-20 mensajes de prueba

Esta Semana (Producción)
├─ Importa 2,881 clientes
├─ Crea campaña masiva
├─ Monitorea entrega
└─ Genera reportes
```

---

## 🎉 ¡Listo!

Tu sistema WhatsApp está 100% configurado y listo para:

✅ Enviar mensajes individuales
✅ Procesar campañas masivas  
✅ Cumplir normativas (templates, opt-out, rate limits)
✅ Escalar a producción
✅ Generar analytics

**Pregunta**: ¿Necesitas ayuda en algo? Revisa los scripts, están diseñados para ser auto-explicativos.

```
╔════════════════════════════════════════════════════════════════╗
║                   ¡Felicidades! 🚀                           ║
║              Sistema listo para producción                     ║
╚════════════════════════════════════════════════════════════════╝
```
