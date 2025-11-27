# 📱 SISTEMA DE WHATSAPP - GUÍA COMPLETA

## 🚀 Configuración Inicial

### 1. Crear cuenta en Twilio
1. Ve a [Twilio](https://www.twilio.com) y crea una cuenta
2. Verifica tu número de teléfono
3. Ve a Console > Messaging > Try WhatsApp

### 2. Configurar credenciales
Agrega estas variables a tu `.env.local`:

```bash
# WhatsApp Configuration (Twilio)
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your-auth-token-here"
TWILIO_WHATSAPP_NUMBER="whatsapp:+14155238886"
```

### 3. Configurar Webhook (Opcional pero recomendado)
1. Ve a Twilio Console > Messaging > Settings > WhatsApp Sandbox
2. Configura webhook URL: `https://tu-dominio.com/api/webhooks/whatsapp`
3. Esto te permitirá recibir estados de entrega de mensajes

## 📖 Usar el Sistema

### Panel de Administración
Agrega el componente WhatsApp a tu dashboard:

```typescript
import WhatsAppPanel from '@/components/whatsapp/WhatsAppPanel';

export default function AdminPage() {
  return (
    <div>
      <WhatsAppPanel />
    </div>
  );
}
```

### API Endpoints Disponibles

#### 1. Envío Masivo
```
POST /api/whatsapp/send-campaign
```

**Ejemplo de uso:**
```javascript
const response = await fetch('/api/whatsapp/send-campaign', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    templateId: 'promotion',
    variables: {
      promocion: '2x1 en bebidas',
      fecha: '31 de Diciembre',
      negocio: 'Casa Sabor'
    },
    filtros: {
      puntosMinimos: 50,
      ultimaVisitaDias: 30
    }
  })
});
```

#### 2. Mensaje Individual
```
POST /api/whatsapp/send-message
```

**Ejemplo:**
```javascript
const response = await fetch('/api/whatsapp/send-message', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    telefono: '+593987654321',
    mensaje: '¡Hola! Gracias por ser parte de nuestro programa.',
    clienteId: 'opcional'
  })
});
```

## 📝 Templates Disponibles

### 1. Bienvenida
```
¡Hola {{nombre}}! 🎉

¡Bienvenido a {{negocio}}! 

Tu cuenta de fidelización ya está activa.
Empieza a acumular puntos con cada visita.

¡Nos vemos pronto! 🚀
```

### 2. Promoción Especial
```
¡Hola {{nombre}}! 🔥

🎁 PROMOCIÓN ESPECIAL para ti:
{{promocion}}

Válida hasta {{fecha}}
¡No te la pierdas!

Saludos,
El equipo de {{negocio}}
```

### 3. Recordatorio de Puntos
```
¡Hola {{nombre}}! ⭐

Tienes {{puntos}} puntos acumulados.
¡Estás muy cerca de tu próxima recompensa!

¿Cuándo nos visitas de nuevo?

{{negocio}}
```

## 🎯 Filtros para Campañas

### Filtros Disponibles
- **puntosMinimos**: Clientes con X puntos o más
- **ultimaVisitaDias**: Clientes que visitaron en los últimos X días
- **businessId**: Específico para un negocio

### Ejemplo de Filtros
```javascript
{
  puntosMinimos: 100,           // Clientes con 100+ puntos
  ultimaVisitaDias: 30,         // Visitaron en últimos 30 días
  businessId: "negocio_id"      // Solo clientes de este negocio
}
```

## 📞 Formatos de Teléfono Soportados

El sistema acepta estos formatos y los convierte automáticamente:
- `+593987654321` (Internacional completo)
- `593987654321` (Sin +)
- `0987654321` (Con 0 inicial Ecuador)
- `987654321` (Solo número)

## 🛠️ Desarrollo y Testing

### Ejecutar configuración automática
```bash
node scripts/setup-whatsapp.js
```

### Testing con Sandbox
1. Twilio proporciona un número sandbox para testing
2. Necesitas enviar un mensaje específico al número sandbox desde tu WhatsApp
3. Mensaje: `join [palabra-código]`

### API de estado de mensajes
```javascript
// Ver estado de un mensaje
const status = await fetch(`/api/whatsapp/status/${messageId}`);
```

## 📊 Monitoreo y Logs

### Estados de mensajes
- `sent`: Enviado
- `delivered`: Entregado
- `read`: Leído
- `failed`: Fallido

### Webhooks
Los webhooks te permiten recibir actualizaciones en tiempo real del estado de tus mensajes.

## 🔒 Seguridad

### Autenticación
- Todas las APIs requieren autenticación de admin/staff
- Los tokens se validan en cada request

### Rate Limiting
- 1 mensaje por segundo para evitar bloqueos
- Twilio tiene límites de envío por día

### Validaciones
- Números de teléfono se validan antes del envío
- Mensajes se sanean para evitar spam

## 💰 Costos

### Twilio Pricing (aproximado)
- Mensaje WhatsApp: ~$0.005 USD
- Números dedicados: $15-50 USD/mes
- Volumen alto: descuentos disponibles

### Optimización de costos
- Usar filtros para enviar solo a clientes relevantes
- Configurar frecuencia máxima de mensajes por cliente
- Monitorear tasa de respuesta

## 🚀 Puesta en Producción

### Checklist pre-producción
- [ ] Configurar número WhatsApp Business verificado
- [ ] Solicitar aprobación de Meta para templates
- [ ] Configurar webhook en producción
- [ ] Testing completo con números reales
- [ ] Configurar monitoreo y alertas

### Solicitar número WhatsApp Business
1. Contactar Twilio sales
2. Proporcionar documentos del negocio
3. Proceso de verificación con Meta
4. Aprobación de templates de mensaje

## 📈 Mejores Prácticas

### Contenido de mensajes
- Mantener mensajes cortos y directos
- Incluir call-to-action claro
- Personalizar con nombre del cliente
- Evitar spam/mensajes excesivos

### Timing
- Enviar en horarios de atención
- Respetar zonas horarias
- No enviar fines de semana (a menos que aplique)

### Segmentación
- Segmentar por comportamiento del cliente
- Diferentes mensajes para diferentes niveles
- Testing A/B de diferentes templates

---

**💡 Tip**: Empieza con el sandbox de Twilio para desarrollo y testing, luego migra a WhatsApp Business para producción.
