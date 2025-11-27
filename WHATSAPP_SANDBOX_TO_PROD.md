# 🚀 GUÍA DE CONFIGURACIÓN WHATSAPP - SANDBOX A PRODUCCIÓN

## Estado Actual (Desarrollo - SANDBOX)
- ✅ Sistema completo implementado
- ✅ Endpoints listos
- ✅ Base de datos integrada
- ✅ Campañas de invitación funcionales
- 📌 Usando: `whatsapp:+14155238886` (Sandbox)
- 📌 Solo funciona con números pre-registrados

## Para Mañana: Cambiar a Producción (3 minutos)

### Paso 1: Restaurar tu WhatsApp Business Account en Meta
1. Ve a [Meta Business Manager](https://business.facebook.com)
2. Busca tu cuenta de WhatsApp Business deshabilitada
3. Haz clic en **"Appeal"** o **"Request Review"**
4. Espera a que Meta la reactive (puede tardar horas o días)

### Paso 2: Una vez aprobado por Meta, cambiar en Lealta

**Archivo a modificar:** `.env.local`

**Cambio necesario:**
```bash
# CAMBIAR ESTO:
TWILIO_WHATSAPP_NUMBER="whatsapp:+14155238886"
TWILIO_WHATSAPP_SANDBOX="true"

# POR ESTO:
TWILIO_WHATSAPP_NUMBER="whatsapp:+15558848359"  # Tu número de Twilio
TWILIO_WHATSAPP_SANDBOX="false"
```

### Paso 3: Reiniciar servidor
```bash
# Detener servidor actual
# Ejecutar:
npm run dev
```

### Paso 4: Verificar que funciona
```bash
# Ejecutar script de prueba:
node send-template-message.js
```

## 📱 Configuración del Sandbox Actual

### Números Verificados en Sandbox:
```
+593987931691   ← Este número está pre-registrado
+593995683452   ← Otro número disponible
```

### Para agregar más números al Sandbox:
1. Ve a [Twilio Console → Messaging → Try it out](https://console.twilio.com/us1/develop/messaging/services)
2. En "Recipient's phone number", agrega el número
3. Twilio enviará un código de verificación
4. El usuario confirma el código

## 🔄 Endpoints Disponibles

### 1. Enviar Mensaje Individual
```bash
POST /api/whatsapp/send-message

{
  "telefono": "+593987654321",
  "templateSid": "HX2e1e6f8cea11d2c18c1761ac48c0ca29",
  "clienteId": "opcional"
}
```

### 2. Enviar Campaña Masiva
```bash
POST /api/whatsapp/send-campaign-invitation

{
  "restauranteName": "Alitas Benditas La Coruña",
  "templateSid": "HX2e1e6f8cea11d2c18c1761ac48c0ca29",
  "clienteIds": ["id1", "id2", "id3"]
}
```

O para todos los clientes:
```bash
{
  "restauranteName": "Alitas Benditas La Coruña",
  "templateSid": "HX2e1e6f8cea11d2c18c1761ac48c0ca29",
  "filtro": {
    "businessId": "tu_business_id"
  }
}
```

## 📋 Template Aprobado

**Nombre:** `estamos_abiertos`  
**SID:** `HX2e1e6f8cea11d2c18c1761ac48c0ca29`  
**Contenido:** 
```
🟡 ¡HOY VIERNES!

🔥 OSADO YA ESTÁ ABIERTO
Sí, somos las mismas alitas de siempre
(📍 Alitas Benditas La Coruña)

Solo que ahora con más actitud, más sabor.

📍 Estamos aquí:
https://maps.app.goo.gl/TEVEkXmnG8mmWJ9bA?g_st=ipc

📲 Síguenos y únete al mood:
instagram.com/osado_uio

Horarios: 13h00 a 01h00
```

## 🧪 Scripts de Prueba Disponibles

```bash
# Enviar a tu número
node send-template-message.js

# Enviar a los primeros 5 clientes de BD
node test-campaign-self.js

# Diagnóstico completo de Twilio
node diagnose-whatsapp.js
```

## ⚠️ Notas Importantes

1. **Sandbox:** Mensajes solo a números pre-registrados
2. **Producción:** Una vez aprobado por Meta, puedes enviar a cualquier número
3. **Templates:** Siempre usa templates aprobados, no mensajes de texto libre
4. **Limpieza de números:** El sistema automáticamente limpia formatos (0xx, +593xx, etc.)

## 🔗 Links Útiles

- [Twilio Console](https://console.twilio.com)
- [Meta Business Manager](https://business.facebook.com)
- [Twilio WhatsApp Docs](https://www.twilio.com/docs/whatsapp)

---

**Estado:** ✅ Listo para producción  
**Última actualización:** 2025-11-23  
**Tiempo de cambio:** ~3 minutos
