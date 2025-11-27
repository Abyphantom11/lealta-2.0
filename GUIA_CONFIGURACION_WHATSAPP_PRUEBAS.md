# 🚀 GUÍA DE CONFIGURACIÓN - Envíos WhatsApp en Pruebas

## ✅ ESTADO ACTUAL

Ya tienes registrado en Twilio:
- **Número**: +15558848359 (Love Me Group Osado)
- **WABA ID**: 151983672258977220
- **Meta Business Manager ID**: 335223029825062
- **Estado**: Loading (en verificación)

## 🔧 PASO 1: Preparar el Número Sandbox

El número que ves es un número de **Twilio Sandbox**. Para enviar mensajes de prueba:

### Opción A: Usar el Número de Sandbox (Recomendado para Pruebas)

El número `+15558848359` es para desarrollo. Necesitas agregar números de prueba a la sandbox de Twilio.

**Acciones en Twilio Console:**

1. Ve a: https://console.twilio.com/us1/develop/sms/senders/whatsapp-senders
2. Haz clic en el número `+15558848359`
3. En "Participant Phone Numbers", agrega los números de prueba
4. Cada número necesita **confirmación por WhatsApp**

### Opción B: Registrar Número Real (Producción)

Para usar un número real como `+593995683452`:

1. Necesitas **verificación de negocio** en Meta
2. Requiere documentos de identificación
3. Toma 1-3 días de verificación
4. Costo: ~$0.05 USD por mensaje

## 📋 PASO 2: Configurar el Sistema Lealta

### 2.1 Variables de Entorno

Asegúrate de tener en tu `.env.local`:

```env
# Twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+15558848359

# Base de datos
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
```

### 2.2 Registrar Cuenta en el Sistema

Ejecuta el script de configuración:

```bash
# Iniciar servidor Next.js en otra terminal
npm run dev

# En otra terminal
node setup-whatsapp-account.js
```

Esto hará:
- ✅ Crear cuenta de WhatsApp en la BD
- ✅ Marcarla como primaria y por defecto
- ✅ Crear template de prueba
- ✅ Crear cola de prueba
- ✅ Mostrar IDs para usar en APIs

## 🧪 PASO 3: Enviar Mensaje de Prueba

### Opción 1: Desde CLI (Recomendado)

```bash
# Reemplaza el número con tu teléfono personal
node test-whatsapp-send.js +593987931691 "¡Hola! Esta es una prueba del sistema WhatsApp"
```

**Respuesta esperada:**
```
📱 Enviando mensaje de prueba...

📞 Número destinatario: +593987931691
💬 Mensaje: ¡Hola! Esta es una prueba del sistema WhatsApp

✅ Cuenta de WhatsApp encontrada: +15558848359
   Negocio ID: [ID]

📤 Enviando a través de Twilio...

✅ ¡Mensaje enviado exitosamente!

📋 Detalles de envío:
   SID: SM1234567890abcdef
   Estado: queued
   Desde: whatsapp:+15558848359
   Para: whatsapp:+593987931691
   Fecha: [timestamp]
```

### Opción 2: Desde API REST

```bash
curl -X POST http://localhost:3000/api/whatsapp/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+593987931691",
    "message": "¡Hola! Este es un mensaje desde la API"
  }'
```

### Opción 3: Panel de Administración

1. Abre http://localhost:3000/admin/whatsapp
2. Ve a la sección "Enviar Mensaje"
3. Ingresa el número y mensaje
4. Haz clic en "Enviar"

## 📞 PASO 4: Verificar en Twilio

Después de enviar, verifica el estado:

1. Ve a: https://console.twilio.com/us1/develop/sms/logs/messages
2. Busca el mensaje por SID o número
3. Verifica el estado: queued → sent → delivered → read

## ⚙️ PASO 5: Configurar Número Real (Opcional)

Para usar `+593995683452` (tu número real):

### 5.1 Crear Subaccount en Twilio

```javascript
// API para crear subaccount
const subaccount = await client.api.accounts.create({
  friendlyName: 'Love Me Sky - Main Account'
})

// Respuesta:
{
  sid: 'ACxxxxxxxxxxxxxxxx',
  authToken: 'your_auth_token'
}
```

### 5.2 Registrar Número en Meta

1. Ve a: https://business.facebook.com/
2. Ir a WhatsApp Manager
3. Business Accounts → Add Phone Number
4. Completa verificación con código SMS
5. Obtén el WABA Access Token

### 5.3 Agregar Número al Sistema

```javascript
// Script para agregar número real
const account = await prisma.whatsAppAccount.create({
  data: {
    businessId: 'xxxxx',
    name: 'Número Principal - +593995683452',
    phoneNumber: '+593995683452',
    twilioAccountSid: 'ACxxxxxxxx',
    twilioAuthToken: 'token_xxx',
    whatsappBusinessId: '135791113131313',
    wabaAccessToken: 'EAAB...',
    status: 'ACTIVE',
    isPrimary: true,
    isDefault: true
  }
})
```

## 🎯 CRONOGRAMA RECOMENDADO

### Hoy (Pruebas con Sandbox)
- ✅ Ejecutar `setup-whatsapp-account.js`
- ✅ Enviar 3-5 mensajes de prueba
- ✅ Verificar en Twilio Console

### Mañana (Integración)
- ✅ Probar colas automáticas
- ✅ Crear campaña de prueba con 10 clientes
- ✅ Monitorear workers en background

### Esta semana (Número Real)
- ⏳ Solicitar verificación de negocio en Meta
- ⏳ Cambiar a número `+593995683452`
- ⏳ Pruebas en producción

### Próxima semana (Escalado)
- 🚀 Importar 2,881 clientes
- 🚀 Crear campañas segmentadas
- 🚀 Monitorear analytics completos

## 🐛 TROUBLESHOOTING

### "Cuenta no encontrada"
```bash
# Solución: Ejecutar primero
node setup-whatsapp-account.js
```

### "Número no está en la sandbox"
```bash
# Solución: Ve a Twilio Console
# WhatsApp Senders → Participant Phone Numbers → Add
# El número recibe código por WhatsApp
```

### "Rate limit excedido"
```
El sandbox de Twilio permite:
- 100 mensajes/hora
- Solo a números confirmados
- Rate limit se resetea cada hora
```

### "Mensaje 'queued' permanentemente"
```
Posibles causas:
1. Número no está en sandbox
2. Número no confirmó código
3. Webhook no está configurado
```

## 📊 MONITOREO

### Ver Mensajes Enviados

```bash
curl http://localhost:3000/api/whatsapp/messages

# Respuesta:
{
  "messages": [
    {
      "id": "xxx",
      "phoneNumber": "+593987931691",
      "status": "SENT",
      "twilioSid": "SM...",
      "sentAt": "2025-11-23T10:30:00Z"
    }
  ]
}
```

### Ver Cuentas Registradas

```bash
curl http://localhost:3000/api/whatsapp/accounts

# Respuesta:
{
  "accounts": [
    {
      "id": "xxx",
      "phoneNumber": "+15558848359",
      "status": "ACTIVE",
      "isPrimary": true,
      "isDefault": true
    }
  ]
}
```

## ✅ CHECKLIST DE VERIFICACIÓN

- [ ] Variables de entorno configuradas
- [ ] Base de datos sincronizada
- [ ] Script `setup-whatsapp-account.js` ejecutado
- [ ] Números de prueba agregados a Twilio Sandbox
- [ ] Primer mensaje enviado exitosamente
- [ ] Mensaje recibido en WhatsApp personal
- [ ] Status verificado en Twilio Console
- [ ] Mensaje registrado en base de datos

## 🎉 ¡LISTO!

Una vez completados estos pasos, tendrás:

✅ Sistema WhatsApp Business configurado
✅ Número de prueba funcionando
✅ Colas automáticas listas
✅ Database con historial de mensajes
✅ APIs preparadas para campañas masivas

¿Necesitas ayuda con algún paso? 🚀
