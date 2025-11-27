# ✅ VERIFICACIÓN COMPLETA - Sistema WhatsApp

Sigue esta guía paso a paso para asegurar que todo está funcionando correctamente.

---

## 📋 VERIFICACIÓN PREVIA (5 minutos)

### 1. Verificar Variables de Entorno
```bash
# Abre tu archivo .env.local y confirma que tienes:
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+15558848359
DATABASE_URL=postgresql://...
```

**Checklist:**
- [ ] `TWILIO_ACCOUNT_SID` presente
- [ ] `TWILIO_AUTH_TOKEN` presente
- [ ] `TWILIO_PHONE_NUMBER` presente (tu número sandbox)
- [ ] `DATABASE_URL` correcta
- [ ] Archivo `.env.local` guardado

---

### 2. Verificar Conexión a Base de Datos
```bash
# Desde la carpeta del proyecto:
npm run prisma:status
```

**Esperado:**
```
✅ Conectado a PostgreSQL
3 migrations pending
```

**Checklist:**
- [ ] Conexión exitosa a PostgreSQL
- [ ] Todas las migraciones aplicadas (0 pending)
- [ ] Sin errores de conexión

---

### 3. Ejecutar Script de Verificación
```bash
node verify-whatsapp-setup.js
```

**Esperado:**
```
✅ Variables de Entorno: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, DATABASE_URL
✅ Conexión a Base de Datos: PostgreSQL
✅ Negocios Registrados: Al menos 1
✅ Cuentas de WhatsApp: Al menos 1 (PRIMARIA)
✅ Templates: Al menos 1 (APPROVED)
```

**Checklist:**
- [ ] Todas las verificaciones pasan (✅)
- [ ] Sin errores de conexión
- [ ] Al menos 1 negocio registrado
- [ ] Al menos 1 cuenta WhatsApp primaria

---

## 🚀 FASE 1: CONFIGURACIÓN INICIAL (10 minutos)

### 4. Registrar Cuenta de WhatsApp en BD
```bash
node setup-whatsapp-account.js
```

**Esperado:**
```
✅ Cuenta WhatsApp creada:
   Phone: +15558848359
   Status: ACTIVE
   Primary: YES

✅ Template "Bienvenida" creado
✅ Cola "Mensajes de Prueba" creada
```

**Checklist:**
- [ ] Cuenta creada sin errores
- [ ] Teléfono correcto: +15558848359
- [ ] Estado: ACTIVE
- [ ] Marcada como PRIMARY: YES
- [ ] Template creado
- [ ] Cola creada

---

## 📱 FASE 2: ENVIAR PRIMER MENSAJE (5 minutos)

### 5. Agregar Número de Prueba a Twilio Sandbox

1. Ve a: https://console.twilio.com/us/account/develop/sms/try-it-out
2. Busca: "WhatsApp Sandbox"
3. En "Sandbox Participants" agrega tu número de teléfono
4. Twilio te enviará un mensaje de confirmación con un código
5. Responde con el código para confirmar

**Checklist:**
- [ ] Número de teléfono agregado al sandbox
- [ ] Confirmación recibida en WhatsApp
- [ ] Número ahora "Joined" en sandbox

---

### 6. Enviar Mensaje de Prueba

```bash
# Envía un mensaje de prueba (reemplaza con tu número real)
node test-whatsapp-send.js +593987654321 "Hola! Este es un mensaje de prueba desde Love Me"
```

**Esperado:**
```
📱 Enviando mensaje de WhatsApp...
✅ Mensaje enviado con éxito!
   SID: SMxxxxx
   Estado: queued
   Contacto: +593987654321
   Guardado en BD ✓
```

**Checklist:**
- [ ] Comando ejecutado sin errores
- [ ] SID retornado
- [ ] Estado: queued/sending/sent
- [ ] Número guardado en BD
- [ ] ⏰ Espera 15-30 segundos...

---

### 7. Verificar que el Mensaje Llegó

**En tu teléfono:**
- [ ] Recibiste un WhatsApp de "+1 555-884-8359"
- [ ] El mensaje dice: "Hola! Este es un mensaje de prueba desde Love Me"
- [ ] Mostró la fecha/hora

**En la Base de Datos:**
```bash
# Verifica el mensaje en BD
npm run prisma:studio
# → Navega a WhatsAppMessage
# → Busca el número donde lo enviaste
```

**Checklist:**
- [ ] Mensaje recibido en teléfono
- [ ] Mensaje visible en BD (estado: delivered)
- [ ] Timestamp correcto

---

## 🔄 FASE 3: PRUEBA CON COLA (15 minutos)

### 8. Crear Cola de Prueba

```bash
node setup-queue-test.js
```

**Parámetros:**
- Número de mensajes: 5 (para prueba rápida)
- Contactos: Los que agregaste al sandbox de Twilio
- Template: "Bienvenida" (creado automáticamente)

**Esperado:**
```
✅ Cola "Test Queue" creada
✅ 5 jobs agregados a la cola
✅ Estado: DRAFT → READY

Próximo paso: Iniciar servidor con npm run dev
```

**Checklist:**
- [ ] Cola creada
- [ ] 5 trabajos agregados
- [ ] Estado: READY

---

### 9. Iniciar Servidor y Activar Processor

```bash
# Terminal 1:
npm run dev

# Terminal 2 (cuando el servidor esté listo):
npm run worker
```

**Esperado:**
```
✅ Servidor iniciado en localhost:3000
✅ Worker iniciado y conectado
   → Procesando cola "Test Queue"
   → 5 mensajes en espera

[15:32:45] 📤 Enviando mensaje 1/5...
[15:32:46] ✅ Mensaje 1 enviado (SID: SM...)
[15:32:47] 📤 Enviando mensaje 2/5...
...
[15:32:50] ✅ Queue completada
```

**Checklist:**
- [ ] Servidor iniciado sin errores
- [ ] Worker conectado
- [ ] Mensajes comenzaron a enviarse
- [ ] Todos los 5 mensajes procesados
- [ ] Cola marcada como COMPLETED

---

### 10. Verificar Resultados en Teléfono

**En tus teléfonos:**
- [ ] Recibiste 5 mensajes de WhatsApp
- [ ] Todos de "+1 555-884-8359"
- [ ] Llegaron en el orden esperado
- [ ] Todos mostraron timestamps

---

### 11. Verificar Resultados en BD

```bash
# En Prisma Studio: http://localhost:5555
# Navega a:
# 1. WhatsAppMessage → Verifica los 5 registros
# 2. WhatsAppQueueJob → Verifica estado "COMPLETED"
# 3. WhatsAppWorkerStatus → Verifica heartbeat reciente
```

**Checklist:**
- [ ] 5 registros en WhatsAppMessage
- [ ] Todos con status: "delivered" o "sent"
- [ ] 5 jobs con status: "COMPLETED"
- [ ] Timestamp de cada uno correcto
- [ ] Worker status activo con heartbeat reciente

---

## 📊 FASE 4: VERIFICACIÓN FINAL (5 minutos)

### 12. Dashboard de Administración

```bash
# El servidor ya debería estar corriendo en localhost:3000
# Ve a: http://localhost:3000/admin/whatsapp
```

**Verificar:**
- [ ] Sección "Cuentas": Muestra cuenta primaria (+15558848359)
- [ ] Sección "Templates": Muestra template "Bienvenida" (APPROVED)
- [ ] Sección "Mensajes Recientes": Muestra los 5 mensajes enviados
- [ ] Sección "Colas": Muestra cola "Test Queue" (COMPLETED)

---

### 13. Ejecutar Suite Completa de Verificación

```bash
node verify-whatsapp-setup.js
```

**Esperado:**
```
✅ Variables de Entorno: 4/4
✅ Conexión a Base de Datos: OK
✅ Negocios Registrados: 1
✅ Cuentas de WhatsApp: 1 (PRIMARIA)
✅ Templates: 1 (APPROVED)
✅ Colas: 1 (COMPLETED)
✅ Mensajes Enviados: 5
✅ Workers: 1 (ACTIVO)

✅ ¡Sistema completamente configurado y listo para usar!
```

**Checklist:**
- [ ] Todas las verificaciones OK
- [ ] Sin errores
- [ ] Sistema listo para producción

---

## 🎯 RESULTADO FINAL

Si completaste todas las verificaciones ✅, entonces:

- **✅ Variables de Entorno**: Configuradas
- **✅ BD**: Sincronizada y accesible
- **✅ Cuenta WhatsApp**: Registrada en BD
- **✅ Mensajes**: Enviados y recibidos correctamente
- **✅ Cola**: Funciona con background worker
- **✅ BD**: Tracking completo de mensajes
- **✅ Dashboard**: Visible y funcional

---

## 🚨 SOLUCIONAR PROBLEMAS

### Problema: "Error: TWILIO_ACCOUNT_SID not found"
```bash
# Solución: Verifica tu archivo .env.local
cat .env.local | grep TWILIO

# Si está vacío, cópialo desde .env.example
cp .env.example .env.local
# Y completa los valores
```

### Problema: "Error connecting to PostgreSQL"
```bash
# Solución: Verifica que PostgreSQL/Neon está en línea
# Si usas Neon:
# 1. Ve a: https://console.neon.tech/
# 2. Verifica que el proyecto está "Healthy"
# 3. Copia la CONNECTION STRING nuevamente
```

### Problema: "No recibí el mensaje de WhatsApp"
```bash
# Checklist:
1. ¿Agregaste tu número al Sandbox de Twilio?
   → https://console.twilio.com/us/account/develop/sms/try-it-out
   
2. ¿Confirmaste con el código que te envió Twilio?
   → Debería mostrar "Joined"
   
3. ¿El número está en formato correcto?
   → +593987654321 (país + número sin 0 inicial)
   
4. ¿Ejecutaste setup-whatsapp-account.js antes?
   → Crea la cuenta en BD
   
5. ¿Hay errores en los logs del servidor?
   → Mira la terminal donde corre npm run dev
```

### Problema: "Worker no está procesando mensajes"
```bash
# Solución:
# 1. Verifica que el worker está corriendo:
npm run worker

# 2. En otra terminal, verifica el estado:
node verify-whatsapp-setup.js

# 3. Mira los logs del worker en la terminal
```

### Problema: "Status del mensaje es 'failed'"
```bash
# Posibles causas:
1. Número no está en sandbox de Twilio
2. Límite de mensajes alcanzado (sandbox: 100/día)
3. Número sin confirmar en Twilio
4. Problema con credenciales TWILIO

# Para verificar:
1. Ve a https://console.twilio.com/
2. Clic en "Account"
3. Copia las credenciales nuevamente a .env.local
```

---

## 📞 PROXIMOS PASOS

Una vez que todo funcione:

1. **Agregar más números de prueba**
   - Añade 5-10 números al sandbox de Twilio

2. **Crear campaña más grande**
   - Cola con 100 mensajes
   - Verifica que el worker escala bien

3. **Configurar números reales**
   - Con Meta (Facebook Business)
   - Verificación de negocio
   - Números de teléfono reales

4. **Implementar analytics**
   - Dashboards de entrega
   - Reportes de conversión
   - A/B testing

5. **Lanzar a producción**
   - Con los 2,881 clientes de Love Me
   - Sistema de escalado automático
   - Monitoreo 24/7

---

## 📞 SOPORTE

Si encuentras problemas:

1. **Revisa los logs:**
   ```bash
   npm run logs  # Si tienes ese script
   ```

2. **Verifica la BD:**
   ```bash
   npm run prisma:studio
   ```

3. **Consola de Twilio:**
   - https://console.twilio.com/
   - Mira "Logs" → "WhatsApp"

4. **Contacta soporte:**
   - Twilio: https://support.twilio.com/
   - Meta: https://www.facebook.com/business/help

---

**¡Felicidades! 🎉 Tu sistema WhatsApp está listo para producción.**
