# 🎨 IMPLEMENTACIÓN: Vista Previa Open Graph para QR Compartidos

## ✅ ¿Qué se implementó?

Se agregó **vista previa con imagen del QR** cuando se comparte un link de reserva en WhatsApp, Facebook, Twitter y otras redes sociales.

---

## 📁 Archivos Creados/Modificados

### 1. **`/api/og/qr/[shareId]/route.tsx`** ✨ NUEVO
Endpoint que genera la imagen Open Graph dinámicamente.

**Características:**
- ✅ Genera imagen 1200x630 (estándar Open Graph)
- ✅ Diseño idéntico al QR Card descargable
- ✅ Incluye QR code real con el código de reserva
- ✅ Muestra nombre del negocio, cliente, fecha y código
- ✅ Estilo oscuro con degradados (matching brand)

**Tecnologías:**
- `@vercel/og` o `next/og` para generar imágenes
- `qrcode` para generar QR codes server-side
- Node.js runtime (no Edge) para compatibilidad

### 2. **`/share/qr/[shareId]/layout.tsx`** ✨ NUEVO  
Layout que inyecta los meta tags de Open Graph.

**Metadata incluida:**
```typescript
<meta property="og:title" content="🎉 Reserva en [Negocio]" />
<meta property="og:description" content="[Mensaje personalizado]" />
<meta property="og:image" content="https://lealta.app/api/og/qr/[shareId]" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:url" content="https://lealta.app/share/qr/[shareId]" />
<meta property="og:type" content="website" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content="https://lealta.app/api/og/qr/[shareId]" />
```

### 3. **`/share/qr/[shareId]/page.tsx`** ✏️ SIN CAMBIOS
El componente cliente sigue igual, solo se agregó el layout padre.

---

## 🎨 Diseño de la Imagen

### Layout de la Imagen OG:
```
┌──────────────────────────────────────────────┐
│  Fondo gris degradado (#f5f5f5 → #e5e5e5)  │
│                                              │
│   ┌────────────────────────────────────┐    │
│   │  Card negro con degradado          │    │
│   │                                    │    │
│   │  🏢 [Nombre del Negocio]          │    │
│   │  Código de Reserva                │    │
│   │                                    │    │
│   │  ┌────────────────────┐           │    │
│   │  │                    │           │    │
│   │  │   [QR CODE 400x400]│           │    │
│   │  │                    │           │    │
│   │  └────────────────────┘           │    │
│   │                                    │    │
│   │  Cliente: [Nombre]                │    │
│   │  Fecha: [Fecha formateada]        │    │
│   │  Código: RES-2024-001             │    │
│   │                                    │    │
│   └────────────────────────────────────┘    │
│                                              │
└──────────────────────────────────────────────┘
        1200 x 630 pixels
```

### Colores y Estilo:
- **Fondo card:** Degradado negro (#0a0a0a → #1a1a1a)
- **Texto principal:** Blanco (#ffffff)
- **Texto secundario:** Gris (#9ca3af, #6b7280)
- **Código:** Verde (#10b981)
- **QR Container:** Fondo blanco con padding
- **Bordes:** Redondeados (40px card, 24px QR)
- **Sombras:** Sombra profunda para el card

---

## 🔄 Flujo Completo

### 1. Usuario comparte reserva:
```
Usuario → Compartir por WhatsApp
  ↓
Genera link: https://lealta.app/share/qr/abc123
  ↓
WhatsApp pide preview
```

### 2. WhatsApp/Red Social pide imagen:
```
GET https://lealta.app/share/qr/abc123
  ↓
Layout detecta request
  ↓
generateMetadata() se ejecuta
  ↓
Devuelve meta tags:
  <meta property="og:image" content="https://lealta.app/api/og/qr/abc123" />
```

### 3. WhatsApp carga la imagen:
```
GET https://lealta.app/api/og/qr/abc123
  ↓
Endpoint busca datos en BD
  ↓
Genera QR code
  ↓
Renderiza imagen con @vercel/og
  ↓
Devuelve PNG 1200x630
```

### 4. Usuario ve preview en WhatsApp:
```
┌─────────────────────────────┐
│ 🎉 Reserva en Casa del Sabor│
│                              │
│ [IMAGEN DEL QR + DETALLES]   │
│                              │
│ Tu reserva está confirmada.  │
│ Presenta este QR al llegar.  │
│                              │
│ 📱 Ver Reserva               │
└─────────────────────────────┘
```

---

## 🛠️ Paquetes Instalados

```bash
npm install @vercel/og qrcode @types/qrcode dotenv-cli
```

**Dependencias:**
- `@vercel/og` (v0.6+) - Generación de imágenes Open Graph
- `qrcode` (v1.5+) - Generación de QR codes server-side
- `@types/qrcode` - TypeScript types
- `dotenv-cli` - Para cargar .env en desarrollo (ya instalado antes)

---

## ⚙️ Configuración

### Variables de Entorno (.env):
```env
# URL base (producción siempre usa lealta.app)
NODE_ENV=production

# No se requieren variables adicionales
# El sistema usa lealta.app automáticamente en producción
```

### En el código:
```typescript
// src/app/share/qr/[shareId]/layout.tsx
const ogImageUrl = `https://lealta.app/api/og/qr/${shareId}`;
const pageUrl = `https://lealta.app/share/qr/${shareId}`;
```

---

## 🧪 Testing

### Probar localmente:
```bash
# 1. Iniciar servidor con variables cargadas
npm run dev

# 2. Abrir en navegador
http://localhost:3001/share/qr/[ID_VALIDO]

# 3. Ver meta tags (View Source)
# Buscar og:image

# 4. Probar endpoint de imagen directamente
http://localhost:3001/api/og/qr/[ID_VALIDO]
```

### Probar en redes sociales:

**Facebook Debugger:**
https://developers.facebook.com/tools/debug/

**Twitter Card Validator:**
https://cards-dev.twitter.com/validator

**WhatsApp:**
- Compartir link real en un chat
- Ver preview automático

---

## 📊 Ejemplo Real

### URL de ejemplo:
```
https://lealta.app/share/qr/aB3xY9zQ1mN4
```

### Meta tags generados:
```html
<meta property="og:title" content="🎉 Reserva en Casa del Sabor" />
<meta property="og:description" content="Tu reserva para el viernes, 18 de octubre de 2025 está confirmada." />
<meta property="og:image" content="https://lealta.app/api/og/qr/aB3xY9zQ1mN4" />
<meta property="og:url" content="https://lealta.app/share/qr/aB3xY9zQ1mN4" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Lealta" />
```

### Preview en WhatsApp:
```
┌──────────────────────────────────┐
│ 🎉 Reserva en Casa del Sabor     │
│                                   │
│ [Imagen con QR + Detalles]        │
│                                   │
│ Tu reserva para el viernes,       │
│ 18 de octubre de 2025 está        │
│ confirmada.                       │
│                                   │
│ LEALTA.APP                        │
└──────────────────────────────────┘
```

---

## 🎯 Beneficios

### Para el Usuario:
✅ Ve inmediatamente el QR sin abrir el link  
✅ Confirma visualmente que es legítimo  
✅ Puede guardar la imagen desde el preview  
✅ Experiencia más profesional  

### Para el Negocio:
✅ Mayor tasa de clics en links compartidos  
✅ Reduce dudas sobre legitimidad  
✅ Branding consistente en redes sociales  
✅ Aspecto más profesional y confiable  

### Técnico:
✅ SEO mejorado (aunque no se indexa por robots: false)  
✅ Mejor engagement en redes sociales  
✅ Generación server-side (no consume recursos del cliente)  
✅ Escalable (funciona con Edge/Serverless)  

---

## 🚀 Próximos Pasos (Opcional)

### Mejoras Sugeridas:

1. **Cache de imágenes:**
   ```typescript
   export const revalidate = 3600; // 1 hora
   ```

2. **Personalización por negocio:**
   - Usar colores del negocio
   - Incluir logo del negocio
   - Fuentes custom

3. **Analytics:**
   - Trackear views de la imagen OG
   - Medir tasa de clics desde preview

4. **Variaciones:**
   - Versión vertical para Instagram Stories
   - Versión cuadrada para Instagram Feed

5. **Optimización:**
   - Pre-generar imágenes más comunes
   - CDN para servir imágenes cacheadas

---

## ✅ Checklist de Implementación

- [x] Instalar dependencias (@vercel/og, qrcode)
- [x] Crear endpoint /api/og/qr/[shareId]/route.tsx
- [x] Crear layout con generateMetadata
- [x] Configurar meta tags Open Graph
- [x] Configurar meta tags Twitter Card
- [x] Usar URL correcta (lealta.app)
- [x] Manejar casos de error (404, 410)
- [x] Ajustar relaciones de Prisma (mayúsculas)
- [ ] Testing en Facebook Debugger
- [ ] Testing en Twitter Card Validator
- [ ] Testing en WhatsApp real
- [ ] Deploy a producción
- [ ] Verificar en producción

---

**🎉 Implementación completa y lista para testing!**
