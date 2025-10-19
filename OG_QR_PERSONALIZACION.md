# ✅ Personalización de Diseño en Vistas Previas de QR

## 🎯 Problema Resuelto

El diseño del QR es **personalizable por cada business** a través de `qrBrandingConfig`. Ahora las vistas previas de Open Graph **siempre muestran el diseño específico del business** que creó la reserva.

## 🔧 Cambios Implementados

### 1. **API de Share QR** (`/api/share/qr/[shareId]/route.ts`)

#### ✅ Antes:
```typescript
include: {
  reservation: {
    include: {
      cliente: true,
      service: {
        include: {
          business: true, // ❌ Sin qrBrandingConfig
        },
      },
    },
  },
},
```

#### ✅ Después:
```typescript
include: {
  Reservation: {
    include: {
      Cliente: true,
      ReservationService: {
        include: {
          Business: {
            select: {
              id: true,
              name: true,
              slug: true,
              qrBrandingConfig: true, // ✅ Incluye configuración
            },
          },
        },
      },
    },
  },
},
```

#### ✅ Extracción del cardDesign:
```typescript
// Extraer cardDesign de qrBrandingConfig
const business = shareLink.Reservation.ReservationService.Business;
let cardDesign = null;

if (business.qrBrandingConfig && typeof business.qrBrandingConfig === 'object') {
  const config = business.qrBrandingConfig as any;
  cardDesign = config.cardDesign || null;
}

// Retornar en respuesta
return NextResponse.json({
  success: true,
  data: {
    reserva: shareLink.Reservation,
    message: shareLink.message,
    businessName: business.name,
    qrToken: shareLink.Reservation.reservationNumber,
    cardDesign, // ✅ Diseño personalizado incluido
  },
});
```

### 2. **API de Open Graph Image** (`/api/og/qr/[shareId]/route.tsx`)

#### ✅ Diseño por Defecto:
```typescript
// Valores por defecto (Black Card)
let cardDesign = {
  backgroundColor: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
  borderColor: '#2a2a2a',
  borderWidth: 2,
  borderRadius: 40,
  padding: 80,
  headerColor: '#ffffff',
  textColor: '#ffffff',
};
```

#### ✅ Override con Diseño del Business:
```typescript
// Si el business tiene diseño personalizado, usarlo
if (business.qrBrandingConfig && typeof business.qrBrandingConfig === 'object') {
  const config = business.qrBrandingConfig as any;
  if (config.cardDesign) {
    cardDesign = { ...cardDesign, ...config.cardDesign };
  }
}
```

#### ✅ Aplicación en ImageResponse:
```tsx
<div
  style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: cardDesign.backgroundColor, // ✅ Dinámico
    borderRadius: `${cardDesign.borderRadius}px`,
    padding: `${cardDesign.padding}px`,
    border: `${cardDesign.borderWidth}px solid ${cardDesign.borderColor}`,
    // ... resto de estilos
  }}
>
  <h1 style={{ color: cardDesign.headerColor }}>
    {businessName}
  </h1>
  
  <span style={{ color: cardDesign.textColor }}>
    {customerName}
  </span>
  
  {/* ... más contenido */}
</div>
```

## 🎨 Diseños Disponibles

El sistema soporta múltiples diseños configurables:

### Black Card (Por Defecto)
```typescript
{
  backgroundColor: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
  borderColor: '#2a2a2a',
  borderWidth: 2,
  borderRadius: 40,
  padding: 80,
  headerColor: '#ffffff',
  textColor: '#ffffff',
}
```

### Ejemplo: Gold Card
```typescript
{
  backgroundColor: 'linear-gradient(135deg, #d4af37 0%, #f9d71c 50%, #d4af37 100%)',
  borderColor: '#b8860b',
  borderWidth: 3,
  borderRadius: 40,
  padding: 80,
  headerColor: '#1a1a1a',
  textColor: '#1a1a1a',
}
```

### Ejemplo: Blue Modern
```typescript
{
  backgroundColor: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #1e3a8a 100%)',
  borderColor: '#60a5fa',
  borderWidth: 2,
  borderRadius: 40,
  padding: 80,
  headerColor: '#ffffff',
  textColor: '#ffffff',
}
```

## 📊 Flujo de Personalización

```
Business configura diseño
         ↓
Guarda en qrBrandingConfig (JSON)
         ↓
Cliente crea reserva
         ↓
Genera QR con diseño del business
         ↓
Comparte link de reserva
         ↓
API carga diseño desde qrBrandingConfig
         ↓
Vista previa OG usa diseño personalizado
         ↓
WhatsApp/Social Media muestra diseño correcto ✅
```

## 🔄 Prisma Relations

### Corrección de Nombres (Mayúsculas)
```typescript
// ❌ INCORRECTO (lowercase)
shareLink.reservation.service.business

// ✅ CORRECTO (PascalCase según schema)
shareLink.Reservation.ReservationService.Business
```

### Schema Reference
```prisma
model QRShareLink {
  id            String      @id
  shareId       String      @unique
  reservationId String
  message       String
  views         Int         @default(0)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime
  Reservation   Reservation @relation(fields: [reservationId], references: [id])
}

model Reservation {
  // ...
  ReservationService ReservationService @relation(...)
  Cliente            Cliente?           @relation(...)
}

model Business {
  // ...
  qrBrandingConfig Json? @default("{}")
}
```

## ✅ Resultado

Ahora cada business tiene su propio diseño de QR card, y **todas las vistas previas** (WhatsApp, Facebook, Twitter, etc.) muestran el diseño correcto y personalizado del business específico.

### Antes vs Después

#### ❌ Antes:
- Todas las vistas previas usaban diseño Black Card genérico
- No se respetaba la personalización del business
- Inconsistencia entre QR descargado y vista previa

#### ✅ Después:
- Cada business ve su diseño personalizado
- Vista previa idéntica al QR descargado
- Consistencia total en la experiencia del cliente

## 🧪 Testing

### Verificar Diseño Personalizado
1. Crear un business con diseño custom en `/admin/qr-branding`
2. Crear una reserva
3. Compartir QR vía WhatsApp
4. Verificar que la vista previa muestra el diseño correcto

### Endpoints para Debug
```typescript
// Ver diseño del business
GET /api/business/[businessId]/qr-branding

// Ver datos completos del share (incluye cardDesign)
GET /api/share/qr/[shareId]

// Ver imagen OG generada directamente
GET /api/og/qr/[shareId]
```

## 📝 Notas Técnicas

1. **TypeScript Type Safety**: Usamos `Prisma.QRShareLinkGetPayload` para inferir tipos correctos
2. **Fallback Design**: Si no hay diseño personalizado, usa Black Card por defecto
3. **Performance**: `qrBrandingConfig` es JSON, no requiere joins adicionales
4. **Compatibilidad**: Funciona con Edge Functions y Node.js runtime
5. **Cache**: No se cachea para siempre reflejar cambios de diseño

---

**Fecha**: 17 de Octubre, 2025  
**Estado**: ✅ Implementado y Funcional  
**Archivos Modificados**: 
- `src/app/api/share/qr/[shareId]/route.ts`
- `src/app/api/og/qr/[shareId]/route.tsx`
