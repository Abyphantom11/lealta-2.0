# 📱 ANÁLISIS COMPLETO: Sistema de Compartir QR

## 🎯 Visión General

El sistema permite **compartir códigos QR de reservas** a través de links temporales que expiran en 24 horas. Es ideal para que los usuarios envíen su reserva por WhatsApp, SMS, o cualquier medio digital sin necesidad de compartir imágenes.

---

## 🏗️ Arquitectura del Sistema

### 1. **Base de Datos (Prisma Schema)**

```prisma
model QRShareLink {
  id            String      @id
  shareId       String      @unique          // ID corto único (nanoid de 12 chars)
  reservationId String                       // FK a Reservation
  message       String                       // Mensaje personalizado
  views         Int         @default(0)      // Contador de visualizaciones
  createdAt     DateTime    @default(now())  // Para calcular expiración
  updatedAt     DateTime
  Reservation   Reservation @relation(...)
}
```

**Características:**
- ✅ `shareId` único y corto (12 caracteres) generado con `nanoid`
- ✅ Rastrea número de visualizaciones (`views`)
- ✅ Se elimina automáticamente cuando se borra la reserva (`onDelete: Cascade`)
- ✅ Expira después de 24 horas (calculado dinámicamente)

---

## 🔄 Flujo Completo del Sistema

### **PASO 1: Creación del Link Compartible**

**Endpoint:** `POST /api/share/qr/create`

```typescript
// Input
{
  reservaId: "res_abc123",
  message: "Tu reserva está confirmada...",
  businessId: "bus_xyz789"
}

// Proceso:
1. Verifica que la reserva existe
2. Genera shareId único con nanoid(12) → "aB3xY9zQ1mN4"
3. Crea registro en QRShareLink
4. Construye URL completa basada en entorno:
   - Producción: https://lealta.app/share/qr/aB3xY9zQ1mN4
   - Desarrollo: http://localhost:3001/share/qr/aB3xY9zQ1mN4

// Output
{
  success: true,
  data: {
    shareId: "aB3xY9zQ1mN4",
    shareUrl: "https://lealta.app/share/qr/aB3xY9zQ1mN4",
    expiresIn: "24 horas"
  }
}
```

**Ubicación:** `src/app/api/share/qr/create/route.ts`

---

### **PASO 2: Usuario Comparte el Link**

**Componente:** `QRCardShare.tsx`

```typescript
// El usuario presiona "Compartir por WhatsApp"
handleShareWhatsApp() {
  1. Llama a POST /api/share/qr/create
  2. Obtiene shareUrl
  3. Prepara mensaje:
     "Tu reserva en [Negocio] está confirmada.
      
      📱 Ver QR y detalles: https://lealta.app/share/qr/aB3xY9zQ1mN4"
  
  4. Usa Web Share API (móviles):
     - Comparte directamente via WhatsApp/SMS/Email
  
  5. Fallback (desktop):
     - Abre WhatsApp Web con mensaje pre-llenado
     - URL: https://wa.me/?text=MENSAJE_CODIFICADO
}
```

**Ubicación:** `src/app/reservas/components/QRCardShare.tsx` (línea 200-250)

---

### **PASO 3: Receptor Abre el Link**

**Endpoint:** `GET /api/share/qr/[shareId]`

```typescript
// Input: shareId desde la URL
GET /share/qr/aB3xY9zQ1mN4

// Proceso:
1. Busca QRShareLink por shareId
2. Incluye datos completos de:
   - reservation (reserva)
   - cliente (info del cliente)
   - service (servicio reservado)
   - business (negocio)

3. Verifica expiración (24 horas desde createdAt)
   - Si expiró → 410 Gone
   - Si no existe → 404 Not Found

4. Incrementa contador de vistas
5. Devuelve todos los datos

// Output
{
  success: true,
  data: {
    reserva: { /* Objeto completo Reservation */ },
    message: "Tu reserva está confirmada...",
    businessName: "Casa del Sabor",
    qrToken: "RES-2024-001"
  }
}
```

**Ubicación:** `src/app/api/share/qr/[shareId]/route.ts`

---

### **PASO 4: Página de Visualización**

**Componente:** `ShareQRPage`

```typescript
// Ruta: /share/qr/[shareId]
// URL: https://lealta.app/share/qr/aB3xY9zQ1mN4

1. Carga datos del endpoint GET /api/share/qr/[shareId]
2. Muestra:
   ✅ QR Code (usando QRCard component)
   ✅ Mensaje personalizado
   ✅ Detalles de la reserva (fecha, hora, personas, etc)
   ✅ Información del negocio

3. Acciones disponibles:
   📥 Descargar QR como imagen (html2canvas)
   🔗 Re-compartir el link
   📋 Copiar al portapapeles
```

**Ubicación:** `src/app/share/qr/[shareId]/page.tsx`

---

## 🎨 Componentes Visuales

### **QRCard Component**
- Genera el código QR visual
- Estilizado con degradados y branding
- Preparado para captura de imagen (html2canvas)

### **QRCardShare Component**
- Interfaz para compartir
- Maneja toda la lógica de creación de links
- Integra Web Share API y fallbacks

---

## 🔐 Seguridad y Validaciones

### ✅ **Características de Seguridad:**

1. **Expiración Automática (24 horas)**
   ```typescript
   const expiresAt = new Date(shareLink.createdAt);
   expiresAt.setHours(expiresAt.getHours() + 24);
   if (now > expiresAt) return 410; // Gone
   ```

2. **IDs Únicos e Impredecibles**
   - Usa `nanoid(12)` → 12 caracteres
   - Espacio de claves: 62^12 = ~3.2 × 10^21 posibilidades
   - Prácticamente imposible adivinar

3. **Cascade Delete**
   - Si se elimina la reserva, se elimina el link automáticamente

4. **Read-Only**
   - Los links solo permiten VER, no modificar

5. **Tracking de Vistas**
   - Contador para detectar uso excesivo o sospechoso

---

## 📊 Métricas y Analytics

### **Datos Capturados:**
- ✅ Número de visualizaciones (`views`)
- ✅ Fecha de creación (`createdAt`)
- ✅ Relación con reserva (para análisis de compartidos)

### **Métricas Posibles:**
```sql
-- Links más compartidos
SELECT reservationId, views 
FROM QRShareLink 
ORDER BY views DESC;

-- Tasa de compartido por negocio
SELECT b.name, COUNT(*) as total_shares
FROM QRShareLink qs
JOIN Reservation r ON qs.reservationId = r.id
JOIN Business b ON r.businessId = b.id
GROUP BY b.name;
```

---

## 🚀 Ventajas del Sistema

### **Para Usuarios:**
✅ No necesitan descargar imágenes  
✅ Funciona en cualquier dispositivo  
✅ Un solo link con toda la info  
✅ Pueden re-compartir fácilmente  

### **Para el Negocio:**
✅ Reduce fricción en el proceso  
✅ Links expiran automáticamente  
✅ Trackea visualizaciones  
✅ Mantiene branding consistente  

### **Técnico:**
✅ Sin almacenamiento de imágenes  
✅ URLs amigables y cortas  
✅ Escalable y eficiente  
✅ SEO-friendly (metadata en página)  

---

## 🔧 Configuración de Entorno

### **Variables Requeridas:**

```env
# Producción
NODE_ENV=production
# ↳ Usa https://lealta.app como base

# Desarrollo
NEXT_PUBLIC_APP_URL=http://localhost:3001
# ↳ Usa esta URL si está definida, sino usa origin del request
```

### **Lógica de URL:**
```typescript
const isProduction = process.env.NODE_ENV === 'production';
const baseUrl = isProduction 
  ? 'https://lealta.app'  // Siempre en producción
  : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
```

---

## 🐛 Posibles Mejoras

### **Corto Plazo:**
1. 🎯 **Agregar metadata OG** para preview en redes sociales
2. 📊 **Dashboard de analytics** de shares
3. 🔔 **Notificaciones** cuando alguien ve el QR
4. ⏰ **Expiración configurable** (no solo 24h)

### **Mediano Plazo:**
1. 🔐 **Links con contraseña** para reservas VIP
2. 📱 **PWA Share Target** para compartir desde otras apps
3. 🎨 **Customización** del look del link compartido
4. 📧 **Email automático** con el link al confirmar

### **Largo Plazo:**
1. 🤖 **IA para detectar** uso fraudulento
2. 🌍 **Geolocalización** de visualizaciones
3. 📈 **Predicción** de tasa de no-shows basado en shares
4. 💬 **Chat integrado** en la página de share

---

## 📝 Ejemplo de Uso Completo

```typescript
// 1. Usuario completa reserva en la app
const reserva = await crearReserva({...});

// 2. Usuario presiona "Compartir por WhatsApp"
const shareLink = await fetch('/api/share/qr/create', {
  method: 'POST',
  body: JSON.stringify({
    reservaId: reserva.id,
    message: "¡Nos vemos el viernes!",
    businessId: "business_123"
  })
});
// → Recibe: https://lealta.app/share/qr/aB3xY9zQ1mN4

// 3. Usuario comparte via WhatsApp
await navigator.share({
  text: "¡Nos vemos el viernes!\n\n📱 Ver QR: https://lealta.app/share/qr/aB3xY9zQ1mN4"
});

// 4. Amigo abre el link en su teléfono
// → Ve página con QR code + detalles completos
// → Puede descargar, re-compartir, o guardar

// 5. Después de 24 horas
// → Link expira automáticamente
// → GET devuelve 410 Gone
```

---

## 🎯 Resumen Ejecutivo

**El sistema de compartir QR es:**
- ✅ Simple pero poderoso
- ✅ Seguro con expiración automática
- ✅ Escalable (sin almacenar imágenes)
- ✅ Multi-plataforma (funciona en todos los dispositivos)
- ✅ Trackeable (analytics de visualizaciones)

**Flujo resumido:**
```
Crear Reserva → Generar Link → Compartir → Visualizar → Expira (24h)
```

**Tecnologías clave:**
- `nanoid` para IDs únicos
- Web Share API para compartir nativo
- Next.js App Router para SSR
- Prisma con Cascade Delete
- html2canvas para exportar imágenes

---

**🎉 Sistema completo y funcionando en producción!**
