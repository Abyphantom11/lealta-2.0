# 📱 Sistema WhatsApp Business - Love Me Group

> **Sistema profesional y completo de envío de mensajes WhatsApp con cumplimiento normativo, multi-cuenta y procesamiento en cola**

---

## 🎯 ¿Qué es este sistema?

Este es un **sistema empresarial de mensajería WhatsApp** que integra:

✅ **Cumplimiento Normativo**: Plantillas aprobadas, opt-out automático, limites de tarifa
✅ **Multi-Cuenta**: Soporte para múltiples números y subaccounts de Twilio
✅ **Procesamiento en Cola**: Sistema de fondo para enviar miles de mensajes sin bloquear la app
✅ **Seguimiento Completo**: BD con historial de cada mensaje, estado de entrega, etc.
✅ **Dashboard Profesional**: Interfaz para gestionar todo desde el navegador

---

## 🚀 INICIO RÁPIDO (5 minutos)

### Paso 1: Configuración Inicial
```bash
node quick-setup.js
```

Esto hace automáticamente:
- ✅ Verifica todas las variables de entorno
- ✅ Conecta con la base de datos
- ✅ Crea tu cuenta WhatsApp en la BD
- ✅ Crea un template de bienvenida
- ✅ Crea una cola de prueba

### Paso 2: Enviar Mensaje de Prueba
```bash
node test-whatsapp-send.js +593987654321 "Hola! Este es un mensaje de prueba"
```

### Paso 3: Monitorear el Sistema
```bash
node monitor-whatsapp-live.js
```

### Paso 4: Iniciar el Servidor
```bash
npm run dev
# En otra terminal:
npm run worker
```

Listo! 🎉

---

## 📚 Scripts Disponibles

| Script | Descripción | Uso |
|--------|-------------|-----|
| `quick-setup.js` | Configuración automática rápida | `node quick-setup.js` |
| `verify-whatsapp-setup.js` | Verifica que todo esté configurado | `node verify-whatsapp-setup.js` |
| `test-whatsapp-send.js` | Envía un mensaje de prueba | `node test-whatsapp-send.js +593... "mensaje"` |
| `setup-whatsapp-account.js` | Registra cuenta en BD | `node setup-whatsapp-account.js` |
| `monitor-whatsapp-live.js` | Dashboard en tiempo real | `node monitor-whatsapp-live.js` |
| `full-test.js` | Suite completa de pruebas | `node full-test.js` |

---

## 🔧 Configuración

### Variables de Entorno (`.env.local`)

```env
# Twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_token_here
TWILIO_PHONE_NUMBER=+15558848359

# Base de Datos
DATABASE_URL=postgresql://user:password@host:5432/database

# Webhook (opcional)
WHATSAPP_WEBHOOK_URL=https://tudominio.com/api/whatsapp/webhook
```

### Obtener Credenciales Twilio

1. Ve a https://console.twilio.com/
2. Clic en "Account" → "API Keys & Tokens"
3. Copia tu `Account SID` y `Auth Token`
4. Busca tu "Twilio WhatsApp Sandbox Number"
5. Pega todo en tu `.env.local`

---

## 📖 Guías Detalladas

### Enviar Primer Mensaje

**Paso 1: Agregar tu número al Sandbox de Twilio**

1. Ve a: https://console.twilio.com/us/account/develop/sms/try-it-out
2. Busca "WhatsApp Sandbox"
3. Bajo "Sandbox Participants" agrega tu número
4. Twilio te enviará un código por WhatsApp
5. Responde: `join XXXX-XXXX` (los códigos que recibiste)

**Paso 2: Ejecutar configuración rápida**
```bash
node quick-setup.js
```

**Paso 3: Enviar mensaje**
```bash
node test-whatsapp-send.js +593987654321 "Hola mundo!"
```

**Paso 4: Verificar**
- Revisa tu teléfono (debería llegar en 30 segundos)
- Verifica en Twilio Console: https://console.twilio.com/us/account/logs/messages/sms

### Enviar Masivo (Cientos de Mensajes)

**Opción 1: Usando Cola (Recomendado)**

```bash
# Edita setup-queue-test.js con tus números
# Luego:
node setup-queue-test.js

# Inicia el servidor:
npm run dev

# En otra terminal, inicia el worker:
npm run worker

# Monitorea en tiempo real:
node monitor-whatsapp-live.js
```

**Opción 2: Usando API**

```bash
curl -X POST http://localhost:3000/api/whatsapp/send-campaign \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "business_id_here",
    "recipients": ["+593987654321", "+593987654322"],
    "templateId": "template_id_here",
    "variables": {"nombre": "Juan"}
  }'
```

### Crear Template Personalizado

1. Ve a: https://console.twilio.com/
2. Busca "Content Templates"
3. Crea uno nuevo con tu nombre de marca
4. Espera aprobación de Twilio (1-2 horas)
5. Usa en tus campañas

---

## 🗄️ Estructura de Base de Datos

### Tablas Principales

```
WhatsAppAccount
├── phoneNumber (ej: +15558848359)
├── status (ACTIVE, INACTIVE)
├── isPrimary (SÍ/NO)
└── messageLimit (1000, 10000, 100000)

WhatsAppTemplate
├── name (ej: "Bienvenida")
├── category (MARKETING, ALERT, etc)
├── status (PENDING, APPROVED, REJECTED)
└── variables (nombre, email, etc)

WhatsAppMessage
├── phoneNumber (ej: +593987654321)
├── status (queued, sent, delivered, read, failed)
├── sentAt (fecha/hora)
├── deliveredAt (fecha/hora)
└── readAt (fecha/hora)

WhatsAppQueue
├── name (ej: "Campaña Octubre")
├── status (DRAFT, READY, PROCESSING, COMPLETED)
├── totalMessages (5000)
└── processedMessages (3200)

WhatsAppQueueJob
├── queueId
├── phoneNumber
├── status (PENDING, COMPLETED, FAILED)
└── attempts (1, 2, 3)

WhatsAppWorkerStatus
├── workerName (worker-1, worker-2)
├── status (ACTIVE, IDLE, ERROR)
├── jobsProcessed (1234)
└── lastHeartbeat (2024-01-15 14:32:45)
```

### Ver Datos en Tiempo Real

```bash
npm run prisma:studio
# Abre: http://localhost:5555
```

---

## 📊 Limites y Cumplimiento

### Rate Limits (Limites de Tarifa)

| Tier | Mensajes/Día | Mensajes/Hora | Costo |
|------|-------------|---------------|--------|
| FREE | 1,000 | 100 | Gratis (prueba) |
| STARTER | 10,000 | 1,000 | $99/mes |
| PROFESSIONAL | 100,000 | 10,000 | $599/mes |
| ENTERPRISE | Ilimitado | Ilimitado | Contactar |

### Reglas de Cumplimiento

✅ **Usa templates aprobados**
- No puedes enviar mensajes de texto libre
- Solo templates pre-aprobados por Meta

✅ **Respeta Opt-outs**
- Si un usuario responde "stop", se agrega automáticamente a blacklist
- No envíes más mensajes a ese número

✅ **Horarios Permitidos**
- 9:00 - 22:00 (hora local del destinatario)
- Fuera de esos horarios, los mensajes se encolan

✅ **Frecuencia**
- Máximo 3 mensajes por usuario, por día
- Mínimo 1 hora entre mensajes al mismo usuario

---

## 🔄 Cómo Funciona el Sistema

### Arquitectura General

```
User (Dashboard)
    ↓
API Gateway (/api/whatsapp/*)
    ↓
Business Logic
    ↓
Prisma (BD)
    ↓
PostgreSQL

Background Worker
    ↓
WhatsAppQueueWorker
    ↓
Twilio API
    ↓
WhatsApp
```

### Flujo de Envío de Mensaje

1. **Usuario envía**: Clic en "Enviar" en dashboard
2. **API valida**: 
   - ¿Es un template aprobado?
   - ¿Está el número en opt-out?
   - ¿No superamos rate limit?
3. **Se agrega a cola**: El trabajo va a WhatsAppQueue
4. **Worker procesa**: 
   - Toma trabajo de la cola
   - Envía a Twilio
   - Recibe SID
   - Guarda en BD
5. **Webhook recibe**: Twilio nos avisa de cambios
   - Enviado (sent)
   - Entregado (delivered)
   - Leído (read)
   - Fallado (failed)
6. **BD se actualiza**: Guardamos el nuevo estado
7. **Dashboard muestra**: Usuario ve en tiempo real

---

## 🐛 Solucionar Problemas

### "Error: TWILIO_ACCOUNT_SID not found"
```bash
# Verifica tu .env.local
cat .env.local

# Si está vacío:
cp .env.example .env.local
# Edita y completa los valores
```

### "Error connecting to PostgreSQL"
```bash
# Si usas Neon:
# 1. Ve a: https://console.neon.tech/
# 2. Verifica que el proyecto está "Healthy"
# 3. Copia la CONNECTION STRING nuevamente
# 4. Pega en .env.local como DATABASE_URL
```

### "No recibí el mensaje"
```bash
# Checklist:
□ ¿Tu número está en Sandbox de Twilio?
  → https://console.twilio.com/us/account/develop/sms/try-it-out
  
□ ¿Confirmaste con el código de Twilio?
  → Debería mostrar "Joined"
  
□ ¿Es formato correcto? (+593987654321, no 0987654321)

□ ¿Ya pasaron 30 segundos?

□ ¿Hay errores en los logs? (mira la terminal de npm run dev)

□ ¿El límite diario no fue superado?
  → node verify-whatsapp-setup.js
```

### "Worker no procesa mensajes"
```bash
# Verifica que está corriendo:
npm run worker

# En otra terminal, verifica estado:
node verify-whatsapp-setup.js

# Mira los logs de stdout del worker
```

### "Estado del mensaje es 'failed'"
```bash
# Probable causa: número no en Sandbox
# Solución: agrégalo nuevamente a Twilio Sandbox

# O: límite alcanzado (sandbox = 100 mensajes/día)
# Espera a mañana o upgrade a número real
```

---

## 📈 Escalando a Producción

### Paso 1: Obtener Número Real
- Meta Business Manager: https://business.facebook.com/
- Crear Business Account
- Verificar negocio
- Crear WhatsApp App
- Obtener WABA ID

### Paso 2: Registrar Número en BD
```bash
# Edita quick-setup.js con:
- Número real (+593XXX)
- WABA ID real
- Nuevas credenciales Twilio

node quick-setup.js
```

### Paso 3: Agregar Contactos Reales
```bash
# Importa desde tu CSV:
node import-contacts-csv.js clients.csv
```

### Paso 4: Crear Primera Campaña
```bash
# Edita setup-queue-test.js con tus contactos
# Cambia número de mensajes (ej: 2881)
node setup-queue-test.js
```

### Paso 5: Iniciar Procesamiento
```bash
npm run dev      # Terminal 1
npm run worker   # Terminal 2
```

### Paso 6: Monitorear
```bash
node monitor-whatsapp-live.js  # Terminal 3
```

---

## 📞 Soporte

### Recursos Oficiales
- **Twilio**: https://support.twilio.com/
- **Meta**: https://www.facebook.com/business/help
- **Documentación API**: https://developers.twilio.com/docs

### Comandos Útiles
```bash
# Ver estado general
node verify-whatsapp-setup.js

# Ejecutar suite completa de pruebas
node full-test.js

# Ver logs en tiempo real
tail -f server.log

# Conectar a BD
npm run prisma:studio

# Resetear (CUIDADO: borra datos)
npm run prisma:reset
```

---

## ✅ Checklist Antes de Lanzar

- [ ] Variables de entorno configuradas
- [ ] Conexión a BD verificada
- [ ] Cuenta WhatsApp en BD creada
- [ ] Template aprobado por Twilio
- [ ] Primer mensaje enviado correctamente
- [ ] Cola de prueba procesada sin errores
- [ ] Dashboard funcionando
- [ ] Worker procesando en background
- [ ] Webhook recibiendo actualizaciones
- [ ] Opt-out funcionando
- [ ] Rate limit aplicado

---

## 🎓 Próximos Pasos

Después de verificar que todo funciona:

1. **Importar 2,881 clientes de Love Me**
   ```bash
   node import-clients-loveme.js
   ```

2. **Crear cola con todos los clientes**
   ```bash
   node create-campaign-all-clients.js
   ```

3. **Monitorear envío masivo**
   ```bash
   node monitor-whatsapp-live.js
   ```

4. **Generar reportes**
   ```bash
   npm run reports
   ```

5. **Implementar analytics avanzado**
   - Dashboards de conversión
   - A/B testing
   - Reportes personalizados

---

## 📄 Licencia

Propiedad de Love Me Group. Uso interno.

---

## 👨‍💻 Desarrollo

Para contribuir o reportar bugs:
1. Crea una rama desde `main`
2. Haz tus cambios
3. Abre un Pull Request
4. Pasa las pruebas

```bash
# Correr pruebas
npm test

# Linting
npm run lint

# Build
npm run build
```

---

**¡Bienvenido al sistema WhatsApp más profesional! 🚀**

Pregunta si tienes dudas → Los scripts están diseñados para ser amigables y auto-explicativos.
