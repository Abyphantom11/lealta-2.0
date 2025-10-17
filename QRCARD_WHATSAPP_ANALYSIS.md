# 📱 ANÁLISIS DEL COMPONENTE QRCardShare - Mensaje WhatsApp

**Archivo:** `src/app/reservas/components/QRCardShare.tsx`  
**Función:** Compartir tarjetas QR de reservas por WhatsApp con mensaje personalizado

---

## 📝 MENSAJE ACTUAL EN WHATSAPP

### Texto que se envía:

```
*Reserva Confirmada - [Nombre del Negocio]*

📱 *Presenta este QR al llegar*
🅿️ *Parqueadero gratuito e ilimitado* dentro del edificio (S1, S2, S3, S4).
🪪 Presentar cédula o pasaporte (en caso de pérdida, traer denuncia con respaldo).

📍 *Dirección:* Diego de Almagro y Ponce Carrasco, Edificio Almagro 240, piso 13
📎 *Google Maps:* `https://g.co/kgs/KbKrU5N`

⏱️ *Tiempo de espera:* 10 minutos.
❗ Para cambios o cancelaciones, avisarnos por este medio.

✨ ¡Nos vemos pronto!
```

---

## 🚨 PROBLEMAS IDENTIFICADOS

### 1. **HARDCODEADO Y ESPECÍFICO** ❌
El mensaje está completamente hardcodeado con información de UN SOLO NEGOCIO:
- Dirección específica (Diego de Almagro, Edificio Almagro 240)
- Google Maps específico
- Detalles de parqueadero específicos
- Requisitos de cédula

**Impacto:** No funciona para NINGÚN otro negocio que use Lealta.

### 2. **NO USA DATOS DE LA RESERVA** ❌
El mensaje no incluye:
- ❌ Nombre del cliente
- ❌ Fecha de la reserva
- ❌ Hora de la reserva
- ❌ Número de personas
- ❌ Código QR (solo dice "presenta el QR")

### 3. **NO ES CONFIGURABLE** ❌
Todo está fijo en el código. No hay forma de que cada negocio personalice:
- Su dirección
- Sus políticas
- Sus requisitos
- Su tono de comunicación

---

## ✅ SOLUCIÓN PROPUESTA

### **Mensaje Dinámico Basado en Datos**

```typescript
const whatsappText = `
*🎉 Reserva Confirmada - ${businessName}*

👤 *Cliente:* ${reserva.cliente.nombre}
📅 *Fecha:* ${formatDate(reserva.fecha)}
⏰ *Hora:* ${reserva.hora}
👥 *Personas:* ${reserva.numeroPersonas}

📱 *Presenta este QR al llegar*
🔢 *Código:* ${reserva.qrToken}

${businessConfig?.customMessage || ''}

${businessConfig?.address ? `📍 *Dirección:* ${businessConfig.address}` : ''}
${businessConfig?.googleMapsUrl ? `📎 *Ubicación:* ${businessConfig.googleMapsUrl}` : ''}
${businessConfig?.waitTime ? `⏱️ *Tiempo de espera:* ${businessConfig.waitTime}` : ''}
${businessConfig?.requirements ? `📋 *Requisitos:* ${businessConfig.requirements}` : ''}

❗ *Para cambios o cancelaciones*, contáctanos.

✨ ¡Nos vemos pronto!
`.trim();
```

---

## 🏗️ ARQUITECTURA MEJORADA

### **1. Tabla de Configuración (Prisma Schema)**

```prisma
model BusinessReservationConfig {
  id              String   @id @default(cuid())
  businessId      String   @unique
  
  // Mensaje personalizado
  customMessage   String?  @db.Text
  address         String?
  googleMapsUrl   String?
  waitTime        String?  @default("10 minutos")
  requirements    String?  @db.Text
  
  // Políticas
  cancellationPolicy String? @db.Text
  
  // Contacto
  whatsappNumber  String?
  phoneNumber     String?
  email           String?
  
  // Branding
  logoUrl         String?
  primaryColor    String?  @default("#6366f1")
  
  business        Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### **2. API Endpoint**

```typescript
// GET /api/business/[businessId]/reservation-config
export async function GET(
  request: NextRequest,
  { params }: { params: { businessId: string } }
) {
  const config = await prisma.businessReservationConfig.findUnique({
    where: { businessId: params.businessId },
  });
  
  return NextResponse.json({
    success: true,
    data: config || getDefaultConfig(),
  });
}
```

### **3. Componente Actualizado**

```tsx
// Cargar configuración del negocio
useEffect(() => {
  const loadConfig = async () => {
    try {
      const [brandingRes, reservationRes] = await Promise.all([
        fetch(`/api/business/${businessId}/qr-branding`),
        fetch(`/api/business/${businessId}/reservation-config`), // ✅ NUEVO
      ]);
      
      const brandingData = await brandingRes.json();
      const reservationData = await reservationRes.json();
      
      setBusinessName(brandingData.data?.businessName || 'Mi Negocio');
      setCardDesign(brandingData.data?.cardDesign || defaultDesign);
      setBusinessConfig(reservationData.data); // ✅ NUEVO
    } catch (error) {
      console.error('Error loading config:', error);
    }
  };
  
  loadConfig();
}, [businessId]);
```

---

## 🎨 INTERFAZ DE ADMINISTRACIÓN

### **Panel Admin: Configurar Mensajes de Reserva**

```tsx
<section>
  <h2>📱 Mensaje de WhatsApp</h2>
  
  <Textarea
    label="Mensaje personalizado"
    value={config.customMessage}
    onChange={(e) => setConfig({...config, customMessage: e.target.value})}
    placeholder="Escribe un mensaje de bienvenida para tus clientes..."
    rows={4}
  />
  
  <Input
    label="Dirección del local"
    value={config.address}
    onChange={(e) => setConfig({...config, address: e.target.value})}
    placeholder="Calle principal #123, Ciudad"
  />
  
  <Input
    label="Google Maps URL"
    value={config.googleMapsUrl}
    onChange={(e) => setConfig({...config, googleMapsUrl: e.target.value})}
    placeholder="https://maps.google.com/?q=..."
  />
  
  <Input
    label="Tiempo de espera"
    value={config.waitTime}
    onChange={(e) => setConfig({...config, waitTime: e.target.value})}
    placeholder="10 minutos"
  />
  
  <Textarea
    label="Requisitos especiales"
    value={config.requirements}
    onChange={(e) => setConfig({...config, requirements: e.target.value})}
    placeholder="Ej: Presentar cédula, código de vestimenta..."
    rows={3}
  />
  
  <Textarea
    label="Política de cancelación"
    value={config.cancellationPolicy}
    onChange={(e) => setConfig({...config, cancellationPolicy: e.target.value})}
    placeholder="Ej: Cancelaciones con 24h de anticipación..."
    rows={2}
  />
</section>
```

---

## 📋 VARIABLES DISPONIBLES EN MENSAJE

El admin puede usar estas variables en su mensaje personalizado:

- `{clienteNombre}` - Nombre del cliente
- `{fecha}` - Fecha de la reserva
- `{hora}` - Hora de la reserva
- `{personas}` - Número de personas
- `{qrToken}` - Código QR
- `{businessName}` - Nombre del negocio

### Ejemplo:

```
¡Hola {clienteNombre}! 👋

Tu reserva para {personas} personas el {fecha} a las {hora} está confirmada.

Recuerda llegar 15 minutos antes y presentar tu código QR.
```

---

## 🚀 PLAN DE IMPLEMENTACIÓN

### **Fase 1: Backend (30 min)**
1. ✅ Crear modelo `BusinessReservationConfig` en Prisma
2. ✅ Crear migration
3. ✅ Crear API `/api/business/[businessId]/reservation-config`
4. ✅ Seedear configuración por defecto para negocios existentes

### **Fase 2: Componente (20 min)**
1. ✅ Actualizar `QRCardShare.tsx` para usar configuración dinámica
2. ✅ Implementar reemplazo de variables en mensaje
3. ✅ Fallback a mensaje por defecto si no hay config

### **Fase 3: Admin UI (40 min)**
1. ✅ Crear página de configuración en admin
2. ✅ Formulario de edición de mensajes
3. ✅ Preview del mensaje en tiempo real
4. ✅ Botón de "Enviar mensaje de prueba"

### **Fase 4: Testing (20 min)**
1. ✅ Probar en múltiples negocios
2. ✅ Verificar que variables se reemplazan correctamente
3. ✅ Probar en iOS/Android/Desktop

**Total: ~2 horas** 🎯

---

## 💡 MEJORAS ADICIONALES

### **1. Templates Predefinidos**
Ofrecer 3-4 templates que el admin puede elegir y personalizar:

- **Formal**: Para restaurantes elegantes
- **Casual**: Para bares y cafeterías
- **Minimalista**: Solo información esencial
- **Detallado**: Con todas las instrucciones

### **2. Multi-idioma**
Detectar el idioma del cliente y enviar mensaje en su idioma:
```typescript
const messages = {
  es: '¡Reserva confirmada!',
  en: 'Reservation confirmed!',
  pt: 'Reserva confirmada!',
};
```

### **3. Rich Media**
- Logo del negocio en el mensaje
- Botones interactivos (Confirmar/Cancelar)
- Carrusel con fotos del local

### **4. Métricas**
Trackear:
- Cuántos mensajes se envían
- Tasa de apertura (si usan WhatsApp Business)
- Clics en Google Maps
- Cancelaciones por WhatsApp

---

## 🎯 RECOMENDACIÓN INMEDIATA

**Prioridad ALTA:** Implementar configuración dinámica de mensajes.

**Razón:** 
- 🚨 El mensaje actual solo funciona para 1 negocio específico
- 🏢 Lealta es multi-tenant, cada negocio necesita su mensaje
- 💰 Es una característica diferenciadora vs competencia
- ⚡ Implementación rápida (~2 horas)

**ROI:** Cada negocio puede personalizar su comunicación sin tocar código.

---

## 📱 EJEMPLO DE MENSAJE MEJORADO

### **Antes (hardcodeado):**
```
*Reserva Confirmada - Mi Negocio*

📱 *Presenta este QR al llegar*
🅿️ *Parqueadero gratuito...*
[Info específica de UN solo negocio]
```

### **Después (dinámico):**
```
*🎉 Reserva Confirmada - La Terraza Rooftop*

👤 María García
📅 Viernes 20 Oct 2025
⏰ 20:00
👥 4 personas

📱 *Presenta este QR al llegar*
🔢 Código: RES-2025-1020-0042

🎵 Esta noche: DJ Set desde las 22:00
🍸 Happy Hour hasta las 21:00

📍 Av. Principal #456, Piso 10
📎 Ver ubicación: https://maps.app.goo.gl/abc123

⏱️ Tiempo de espera: 15 minutos
📋 Código de vestimenta: Smart Casual

❗ Para cambios, responde a este mensaje.

✨ ¡Te esperamos!
```

---

¿Quieres que implemente esta solución ahora? 🚀
