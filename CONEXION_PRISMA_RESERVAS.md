# 🔌 CONEXIÓN DE PRISMA CON MÓDULO DE RESERVAS

## ✅ Cambios Aplicados

### 1. Schema de Prisma Actualizado

Se agregaron los siguientes modelos al `prisma/schema.prisma`:

#### Enums
- `ReservationStatus`: PENDING, CONFIRMED, CHECKED_IN, COMPLETED, CANCELLED, NO_SHOW
- `SlotStatus`: AVAILABLE, RESERVED, OCCUPIED, BLOCKED  
- `QRCodeStatus`: ACTIVE, USED, EXPIRED, CANCELLED

#### Modelos
1. **ReservationService** - Servicios/espacios reservables
2. **ReservationSlot** - Slots de tiempo disponibles
3. **Reservation** - Reservas principales
4. **ReservationQRCode** - Códigos QR para check-in

### 2. Relaciones Agregadas

#### En `Business`:
```prisma
reservationServices ReservationService[] @relation("BusinessReservationServices")
```

#### En `Cliente`:
```prisma
reservations Reservation[] @relation("ClienteReservations")
```

### 3. Base de Datos Actualizada

✅ Migraciones aplicadas correctamente
✅ Tablas creadas en PostgreSQL
✅ Índices creados para performance

---

## 🐛 Problema Actual: Cliente de Prisma

### Síntoma
```
Property 'reservation' does not exist on type 'PrismaClient'
```

### Causa
El archivo `query_engine-windows.dll.node` está bloqueado por un proceso de Node.js.

### Solución

#### Opción 1: Script Automático (Recomendado)

```powershell
.\fix-prisma-client.ps1
```

#### Opción 2: Manual

1. **Cierra el servidor de desarrollo** (Ctrl+C en la terminal)

2. **Cierra VS Code** completamente

3. **Abre PowerShell como Administrador**

4. **Navega al proyecto**:
   ```powershell
   cd c:\Users\abrah\lealta
   ```

5. **Limpia la caché de Prisma**:
   ```powershell
   Remove-Item -Path "node_modules\.prisma" -Recurse -Force
   ```

6. **Regenera el cliente**:
   ```powershell
   npx prisma generate
   ```

7. **Reinicia el servidor**:
   ```powershell
   npm run dev
   ```

---

## 📊 Estructura de Datos

### ReservationService
```typescript
{
  id: string
  businessId: string
  name: string               // "Servicio VIP", "Espacio Principal"
  description: string?
  capacity: number           // 50 personas por defecto
  duration: number           // 120 minutos por defecto
  price: Decimal?
  isActive: boolean
  sortOrder: number
  metadata: Json?
}
```

### ReservationSlot
```typescript
{
  id: string
  businessId: string
  serviceId: string
  date: Date
  startTime: DateTime
  endTime: DateTime
  capacity: number
  reservedCount: number
  status: SlotStatus
  price: Decimal?
  notes: string?
  isRecurring: boolean
  recurringId: string?
}
```

### Reservation
```typescript
{
  id: string
  businessId: string
  clienteId: string?
  serviceId: string
  slotId: string
  reservationNumber: string  // "RES-2510-1234"
  status: ReservationStatus
  guestCount: number
  customerName: string
  customerEmail: string
  customerPhone: string?
  specialRequests: string?
  notes: string?
  totalPrice: Decimal?
  paidAmount: Decimal
  isPaid: boolean
  paymentReference: string?
  
  // Fechas
  reservedAt: DateTime
  confirmedAt: DateTime?
  checkedInAt: DateTime?
  completedAt: DateTime?
  cancelledAt: DateTime?
  
  // Recordatorios
  reminderSent: boolean
  reminderSentAt: DateTime?
  
  // Metadata
  source: string             // "manual", "web", "app"
  metadata: Json?
}
```

### ReservationQRCode
```typescript
{
  id: string
  businessId: string
  reservationId: string
  qrToken: string           // Token único para el QR
  qrData: string            // Datos codificados en el QR
  status: QRCodeStatus
  expiresAt: DateTime       // 12 horas después del slot
  usedAt: DateTime?
  usedBy: string?
  scanCount: number         // Contador de escaneos
  lastScannedAt: DateTime?
  metadata: Json?
}
```

---

## 🔄 Flujo de Creación de Reserva

### 1. POST /api/reservas

```typescript
{
  cliente: {
    nombre: "Juan Pérez",
    email: "juan@email.com",
    telefono: "+506 8888-1234"
  },
  numeroPersonas: 10,
  fecha: "2025-10-15",
  hora: "19:00",
  razonVisita: "Cumpleaños",
  beneficiosReserva: "Descuento 20%",
  promotor: {
    nombre: "Sofia Vargas"
  }
}
```

### 2. Backend Process

```typescript
// 1. Crear o buscar servicio
const service = await prisma.reservationService.upsert({
  where: { 
    businessId_name: { 
      businessId, 
      name: "Servicio General" 
    } 
  },
  create: { ... },
  update: { ... }
});

// 2. Crear slot de tiempo
const slot = await prisma.reservationSlot.create({
  data: {
    businessId,
    serviceId: service.id,
    date: fecha,
    startTime: DateTime,
    endTime: DateTime + duration,
    capacity: numeroPersonas,
    reservedCount: 0,
    status: 'RESERVED'
  }
});

// 3. Crear reserva
const reservation = await prisma.reservation.create({
  data: {
    businessId,
    serviceId: service.id,
    slotId: slot.id,
    reservationNumber: generateReservationNumber(),
    status: 'CONFIRMED',
    guestCount: numeroPersonas,
    customerName: cliente.nombre,
    customerEmail: cliente.email,
    customerPhone: cliente.telefono,
    specialRequests: razonVisita,
    notes: beneficiosReserva,
    reservedAt: new Date(),
    source: 'manual'
  }
});

// 4. Crear código QR
const qrCode = await prisma.reservationQRCode.create({
  data: {
    businessId,
    reservationId: reservation.id,
    qrToken: generateQRToken(),
    qrData: JSON.stringify({ reservationId, customerName }),
    status: 'ACTIVE',
    expiresAt: new Date(slot.endTime.getTime() + 12 * 60 * 60 * 1000)
  }
});
```

---

## 🔍 Queries Comunes

### Obtener reservas de un día específico

```typescript
const reservations = await prisma.reservation.findMany({
  where: {
    businessId: businessId,
    slot: {
      date: {
        gte: startOfDay,
        lte: endOfDay
      }
    }
  },
  include: {
    cliente: true,
    service: true,
    slot: true,
    qrCodes: true
  },
  orderBy: {
    slot: {
      startTime: 'asc'
    }
  }
});
```

### Escanear QR y registrar asistencia

```typescript
const qrCode = await prisma.reservationQRCode.findUnique({
  where: { qrToken: token },
  include: {
    reservation: {
      include: {
        slot: true,
        service: true
      }
    }
  }
});

if (qrCode && qrCode.status === 'ACTIVE' && qrCode.expiresAt > new Date()) {
  await prisma.reservationQRCode.update({
    where: { id: qrCode.id },
    data: {
      scanCount: { increment: 1 },
      lastScannedAt: new Date(),
      status: qrCode.scanCount === 0 ? 'USED' : 'ACTIVE'
    }
  });
  
  await prisma.reservation.update({
    where: { id: qrCode.reservationId },
    data: {
      status: 'CHECKED_IN',
      checkedInAt: new Date()
    }
  });
}
```

---

## 🔐 Seguridad por BusinessId

Todas las queries DEBEN incluir el filtro de `businessId`:

### ✅ Correcto
```typescript
const reservations = await prisma.reservation.findMany({
  where: {
    businessId: session.businessId,
    status: 'CONFIRMED'
  }
});
```

### ❌ Incorrecto
```typescript
const reservations = await prisma.reservation.findMany({
  where: {
    status: 'CONFIRMED'
  }
});
```

---

## 📝 APIs a Actualizar

### Pendientes de actualización:

1. ✅ `/api/reservas` - GET/POST
2. ⚠️ `/api/reservas/[id]` - GET/PUT/DELETE
3. ⚠️ `/api/reservas/scanner` - POST (escaneo QR)
4. ⚠️ `/api/reservas/qr-info` - POST
5. ⚠️ `/api/reservas/increment-attendance` - POST
6. ⚠️ `/api/reservas/stats` - GET

### Protección con Auth

Agregar middleware `withAuth` a todas las APIs:

```typescript
import { withAuth, AuthConfigs } from '@/middleware/requireAuth';

export async function GET(request: NextRequest) {
  return withAuth(request, async (session) => {
    const businessId = session.businessId;
    
    const reservations = await prisma.reservation.findMany({
      where: { businessId }
    });
    
    return NextResponse.json({ reservations });
  }, AuthConfigs.BUSINESS_STAFF);
}
```

---

## 🚀 Próximos Pasos

1. **Regenerar cliente de Prisma** (ejecutar script)
2. **Actualizar todas las APIs** con Prisma queries
3. **Agregar middleware de autenticación**
4. **Crear seeds de datos** para testing
5. **Implementar validaciones** de capacidad y horarios
6. **Agregar notificaciones** por email/SMS

---

## 🧪 Testing

### Crear reserva de prueba

```bash
curl -X POST http://localhost:3000/api/reservas \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "tu-business-id",
    "cliente": {
      "nombre": "Test User",
      "email": "test@email.com"
    },
    "numeroPersonas": 5,
    "fecha": "2025-10-15",
    "hora": "19:00"
  }'
```

---

## 📞 Soporte

Si el script no funciona:
1. Reinicia tu computadora
2. Ejecuta el script como Administrador
3. Si persiste, elimina `node_modules` y ejecuta `npm install`

---

## ✨ Resultado Esperado

Una vez regenerado el cliente de Prisma:

✅ Sin errores de TypeScript
✅ Autocompletado de Prisma funcionando
✅ APIs conectadas a PostgreSQL
✅ Reservas persistiendo en base de datos
✅ Sistema QR completamente funcional

**¡El módulo de reservas estará 100% conectado a la base de datos!** 🎉
