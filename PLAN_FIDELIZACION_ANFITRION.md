# 🎯 PLAN DE ACCIÓN: FIDELIZACIÓN POR ANFITRIÓN
**Fecha:** 8 de Octubre 2025  
**Objetivo:** Sistema de tracking de consumos de invitados vinculados a anfitriones (reservas con alto guestCount)

---

## 📋 RESUMEN EJECUTIVO

### 🎯 Concepto
Un **anfitrión** es un cliente que hace una reserva con muchos invitados. Queremos:
1. **Rastrear el consumo** de cada invitado que viene con el anfitrión
2. **Acumular consumos** de invitados al perfil del anfitrión
3. **Analizar patrones** de consumo del grupo (productos favoritos)
4. **Recompensar anfitriones** que traen gente de alto consumo

### 🔄 Flujo de Trabajo
```
1. Cliente hace RESERVA → Mesa #5, 8 personas (ANFITRIÓN)
2. Staff atiende Mesa #5 → Procesa consumo de invitado
3. Al capturar OCR → Staff busca "Mesa 5" o "Juan Pérez"
4. Sistema vincula → Consumo va al invitado + al anfitrión
5. Al final del día → Dashboard muestra consumo total del anfitrión
```

---

## 🗄️ DISEÑO DE BASE DE DATOS

### **1. Nueva Tabla: `HostTracking`**
Registra que un cliente es anfitrión de una reserva específica.

```prisma
model HostTracking {
  id              String      @id @default(cuid())
  businessId      String      
  reservationId   String      @unique  // Una reserva = un anfitrión
  clienteId       String                // El anfitrión (quien hizo la reserva)
  
  // Info de la reserva para búsqueda rápida
  reservationName String                // "Juan Pérez" 
  tableNumber     String?               // "5" o "Mesa 5"
  reservationDate DateTime              // Fecha de la reserva
  guestCount      Int                   // Número de invitados
  
  // Estado
  isActive        Boolean     @default(true)  // Se desactiva cuando termina el evento
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  
  // Relaciones
  business        Business    @relation("BusinessHostTracking", fields: [businessId], references: [id], onDelete: Cascade)
  reservation     Reservation @relation(fields: [reservationId], references: [id], onDelete: Cascade)
  anfitrion       Cliente     @relation("ClienteAsHost", fields: [clienteId], references: [id], onDelete: Cascade)
  
  // Consumos vinculados
  guestConsumos   GuestConsumo[]
  
  @@index([businessId])
  @@index([reservationId])
  @@index([clienteId])
  @@index([reservationDate])
  @@index([tableNumber])
}
```

### **2. Nueva Tabla: `GuestConsumo`**
Vincula consumos de invitados al anfitrión.

```prisma
model GuestConsumo {
  id             String       @id @default(cuid())
  businessId     String
  hostTrackingId String       // FK a HostTracking (el anfitrión)
  consumoId      String       @unique  // FK a Consumo (el consumo del invitado)
  
  // Info del invitado (opcional - puede ser anónimo)
  guestCedula    String?      // Si el invitado está registrado
  guestName      String?      // Nombre del invitado (manual o del consumo)
  
  // Metadata
  createdAt      DateTime     @default(now())
  
  // Relaciones
  business       Business     @relation("BusinessGuestConsumos", fields: [businessId], references: [id], onDelete: Cascade)
  hostTracking   HostTracking @relation(fields: [hostTrackingId], references: [id], onDelete: Cascade)
  consumo        Consumo      @relation(fields: [consumoId], references: [id], onDelete: Cascade)
  
  @@index([businessId])
  @@index([hostTrackingId])
  @@index([consumoId])
}
```

### **3. Modificaciones a Tabla Existente: `Consumo`**
Agregar campo opcional para vincular a un anfitrión.

```prisma
model Consumo {
  // ...campos existentes...
  
  // 🆕 NUEVO: Relación opcional a tracking de anfitrión
  guestConsumo   GuestConsumo?  // Si este consumo es de un invitado
  
  // ...resto de campos...
}
```

### **4. Modificaciones a Tabla Existente: `Reservation`**
Agregar campo opcional para mesa.

```prisma
model Reservation {
  // ...campos existentes...
  
  // 🆕 NUEVO: Número de mesa asignada
  tableNumber     String?      // "5", "Mesa 5", "VIP 2", etc.
  
  // 🆕 NUEVO: Relación a host tracking
  hostTracking    HostTracking?
  
  // ...resto de campos...
}
```

---

## 🎨 DISEÑO DE INTERFAZ (UI/UX)

### **1. Staff Page - Buscador de Reservas/Anfitrión**

**Ubicación:** `src/app/staff/page.tsx`  
**Posición:** Después de capturar OCR, antes de confirmar el consumo

#### Mockup:
```
┌─────────────────────────────────────────────┐
│  📸 Imagen Capturada - OCR Procesado       │
├─────────────────────────────────────────────┤
│  Productos Detectados:                      │
│  ✓ 2x Whiskey Black Label    $45.00       │
│  ✓ 1x Coca-Cola              $3.00        │
│  ✓ 1x Hielo                  $0.00        │
│  ───────────────────────────────────────── │
│  TOTAL: $48.00                             │
├─────────────────────────────────────────────┤
│  👤 Cliente: [Juan Invitado  ▼]            │
│     Cédula: 1234567890                     │
├─────────────────────────────────────────────┤
│  🏠 ¿Es invitado de un anfitrión?          │
│  [ ] Sí, vincular a reserva               │
│                                             │
│  🔍 Buscar por:                            │
│  ○ Mesa     ● Nombre Reserva              │
│                                             │
│  [Buscar: Mesa 5 o Nombre    🔍]           │
│                                             │
│  Resultados encontrados:                   │
│  ┌───────────────────────────────────────┐ │
│  │ 🎯 Mesa 5 - María González           │ │
│  │    8 invitados | Reserva: 19:00      │ │
│  │    [Seleccionar]                      │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  [✅ Registrar Consumo]  [❌ Cancelar]     │
└─────────────────────────────────────────────┘
```

#### Componentes:
```typescript
// Nuevo componente: HostSearchModal
interface HostSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (hostTracking: HostTracking) => void;
  businessId: string;
  searchDate: Date; // Fecha del día de la reserva
}

// Estados:
- searchMode: 'table' | 'name'
- searchQuery: string
- results: HostTracking[]
- selectedHost: HostTracking | null
```

### **2. Cliente Portal - Nueva Sección "Anfitrión"**

**Ubicación:** `src/app/cliente/ClienteApp.tsx`  
**Nueva Tab:** "🏠 Anfitrión" (al lado de "🎁 Beneficios")

#### Mockup:
```
┌─────────────────────────────────────────────┐
│  🏠 Historial como Anfitrión               │
├─────────────────────────────────────────────┤
│  Total Acumulado: $2,450.00                │
│  Invitados Atendidos: 47                   │
│  Eventos Realizados: 6                     │
├─────────────────────────────────────────────┤
│  📊 Productos Favoritos del Grupo:         │
│  ┌───────────────────────────────────────┐ │
│  │ 🥃 Whiskey Black Label    15 unidades │ │
│  │ 🍺 Cerveza Corona         32 unidades │ │
│  │ 🍹 Mojito                 18 unidades │ │
│  └───────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│  📅 Eventos Recientes:                     │
│  ┌───────────────────────────────────────┐ │
│  │ 05/10/2024 - Mesa 5                   │ │
│  │ 8 invitados | $485.00                 │ │
│  │ ▶ Ver Detalle                         │ │
│  └───────────────────────────────────────┘ │
│  ┌───────────────────────────────────────┐ │
│  │ 28/09/2024 - Mesa VIP 2               │ │
│  │ 12 invitados | $890.00                │ │
│  │ ▶ Ver Detalle                         │ │
│  └───────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

#### Vista Detalle de Evento:
```
┌─────────────────────────────────────────────┐
│  📋 Evento: Mesa 5 - 05/10/2024            │
├─────────────────────────────────────────────┤
│  👥 Invitados: 8 personas                  │
│  💰 Consumo Total: $485.00                 │
│  ⏰ Horario: 19:00 - 23:30                 │
├─────────────────────────────────────────────┤
│  🛒 Consumos de Invitados:                 │
│  ┌───────────────────────────────────────┐ │
│  │ Invitado 1 - Juan (✓ Registrado)     │ │
│  │ $65.00 - 2x Whiskey, 1x Hielo         │ │
│  └───────────────────────────────────────┘ │
│  ┌───────────────────────────────────────┐ │
│  │ Invitado 2 - Anónimo                  │ │
│  │ $42.00 - 3x Cerveza, 1x Nachos        │ │
│  └───────────────────────────────────────┘ │
│  ┌───────────────────────────────────────┐ │
│  │ + 6 invitados más...                  │ │
│  └───────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│  📊 Productos más consumidos:              │
│  1. 🥃 Whiskey Black Label (8 unidades)   │
│  2. 🍺 Cerveza Corona (12 unidades)       │
│  3. 🍟 Papas Fritas (5 unidades)          │
└─────────────────────────────────────────────┘
```

---

## 🔄 FLUJO DE TRABAJO DETALLADO

### **Fase 1: Activación de Tracking (Automático o Manual)**

#### Opción A: Automático al crear reserva
```typescript
// En POST /api/reservas
if (guestCount >= THRESHOLD) {  // Ej: >= 4 invitados
  // Crear HostTracking automáticamente
  await prisma.hostTracking.create({
    data: {
      businessId,
      reservationId: newReservation.id,
      clienteId: cliente.id,
      reservationName: customerName,
      tableNumber: tableNumber, // Del formulario
      reservationDate: reservedAt,
      guestCount,
      isActive: true
    }
  });
}
```

#### Opción B: Manual desde Admin
```typescript
// Nuevo endpoint: POST /api/admin/host-tracking/activate
// Admin puede activar tracking para cualquier reserva
```

### **Fase 2: Captura de Consumo con Vinculación**

```typescript
// En Staff Page, después de OCR
const handleSubmitConsumo = async () => {
  // 1. Crear consumo normal
  const consumo = await createConsumo({
    clienteId: selectedCliente.id,
    productos,
    total,
    ...
  });
  
  // 2. Si user seleccionó un anfitrión, vincular
  if (selectedHost) {
    await fetch('/api/staff/guest-consumo', {
      method: 'POST',
      body: JSON.stringify({
        hostTrackingId: selectedHost.id,
        consumoId: consumo.id,
        guestCedula: selectedCliente.cedula,
        guestName: selectedCliente.nombre
      })
    });
  }
  
  // 3. Mostrar confirmación
  toast.success('Consumo registrado y vinculado al anfitrión');
};
```

### **Fase 3: Búsqueda Inteligente de Anfitrión**

```typescript
// Nuevo endpoint: GET /api/staff/host-tracking/search
interface SearchParams {
  businessId: string;
  query: string;        // "5" o "María González"
  searchMode: 'table' | 'name';
  date: string;         // ISO date - buscar reservas del día
}

// Lógica de búsqueda:
const searchHosts = async (params: SearchParams) => {
  const startOfDay = new Date(params.date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(params.date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return await prisma.hostTracking.findMany({
    where: {
      businessId: params.businessId,
      isActive: true,
      reservationDate: {
        gte: startOfDay,
        lte: endOfDay
      },
      ...(params.searchMode === 'table' 
        ? { tableNumber: { contains: params.query, mode: 'insensitive' } }
        : { reservationName: { contains: params.query, mode: 'insensitive' } }
      )
    },
    include: {
      anfitrion: true,
      reservation: true
    }
  });
};
```

### **Fase 4: Analytics y Visualización**

```typescript
// Nuevo endpoint: GET /api/cliente/host-stats
interface HostStatsResponse {
  totalConsumo: number;        // Suma de todos los consumos de invitados
  totalInvitados: number;      // Conteo único de invitados
  totalEventos: number;        // Número de reservas como anfitrión
  productosFavoritos: {
    nombre: string;
    cantidad: number;          // Veces ordenado
    totalGastado: number;
  }[];
  eventosRecientes: {
    id: string;
    fecha: Date;
    mesa: string;
    invitados: number;
    totalConsumo: number;
    consumosDetalle: {
      guestName: string;
      total: number;
      productos: string[];
    }[];
  }[];
}

// Implementación:
const getHostStats = async (clienteId: string) => {
  // 1. Obtener todos los eventos como anfitrión
  const hostTrackings = await prisma.hostTracking.findMany({
    where: { clienteId },
    include: {
      guestConsumos: {
        include: {
          consumo: true
        }
      },
      reservation: true
    }
  });
  
  // 2. Procesar datos
  const allConsumos = hostTrackings.flatMap(ht => 
    ht.guestConsumos.map(gc => gc.consumo)
  );
  
  // 3. Agregar productos
  const productosMap = new Map();
  allConsumos.forEach(consumo => {
    const productos = consumo.productos as any[];
    productos.forEach(p => {
      const key = p.nombre;
      if (!productosMap.has(key)) {
        productosMap.set(key, { nombre: key, cantidad: 0, totalGastado: 0 });
      }
      const existing = productosMap.get(key);
      existing.cantidad += p.cantidad;
      existing.totalGastado += p.precio * p.cantidad;
    });
  });
  
  // 4. Ordenar productos por cantidad
  const productosFavoritos = Array.from(productosMap.values())
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 10);
  
  return {
    totalConsumo: allConsumos.reduce((sum, c) => sum + c.total, 0),
    totalInvitados: new Set(allConsumos.map(c => c.clienteId)).size,
    totalEventos: hostTrackings.length,
    productosFavoritos,
    eventosRecientes: hostTrackings.slice(0, 5).map(...) // Formatear
  };
};
```

---

## 📁 ESTRUCTURA DE ARCHIVOS

### **Backend (API Routes)**
```
src/app/api/
├── staff/
│   ├── host-tracking/
│   │   ├── search/
│   │   │   └── route.ts          # GET - Buscar anfitriones activos
│   │   └── activate/
│   │       └── route.ts          # POST - Activar tracking manual
│   └── guest-consumo/
│       └── route.ts              # POST - Vincular consumo a anfitrión
│
├── cliente/
│   └── host-stats/
│       ├── route.ts              # GET - Stats generales del anfitrión
│       └── [eventId]/
│           └── route.ts          # GET - Detalle de un evento específico
│
└── admin/
    └── host-tracking/
        ├── route.ts              # GET - Lista todos los trackings
        └── [id]/
            └── route.ts          # PUT - Actualizar/Desactivar tracking
```

### **Frontend (Components)**
```
src/components/
├── staff/
│   ├── HostSearchModal.tsx       # Modal de búsqueda de anfitrión
│   ├── HostSearchResults.tsx     # Lista de resultados
│   └── GuestConsumoToggle.tsx    # Toggle "¿Es invitado?"
│
├── cliente/
│   ├── HostHistoryTab.tsx        # Tab principal de historial
│   ├── HostStatsCards.tsx        # Cards de estadísticas
│   ├── FavoriteProductsList.tsx  # Lista de productos favoritos
│   ├── HostEventsList.tsx        # Lista de eventos recientes
│   └── HostEventDetail.tsx       # Modal de detalle de evento
│
└── admin/
    ├── HostTrackingList.tsx      # Lista de trackings activos
    └── HostTrackingActivate.tsx  # Formulario activación manual
```

### **Types**
```typescript
// src/types/host-tracking.ts
export interface HostTracking {
  id: string;
  businessId: string;
  reservationId: string;
  clienteId: string;
  reservationName: string;
  tableNumber: string | null;
  reservationDate: Date;
  guestCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GuestConsumo {
  id: string;
  businessId: string;
  hostTrackingId: string;
  consumoId: string;
  guestCedula: string | null;
  guestName: string | null;
  createdAt: Date;
}

export interface HostStats {
  totalConsumo: number;
  totalInvitados: number;
  totalEventos: number;
  productosFavoritos: ProductoFavorito[];
  eventosRecientes: HostEvent[];
}

export interface ProductoFavorito {
  nombre: string;
  cantidad: number;
  totalGastado: number;
}

export interface HostEvent {
  id: string;
  fecha: Date;
  mesa: string;
  invitados: number;
  totalConsumo: number;
  consumosDetalle: GuestConsumoDetail[];
}

export interface GuestConsumoDetail {
  guestName: string;
  guestCedula: string | null;
  total: number;
  productos: string[];
}
```

---

## 🎯 PLAN DE IMPLEMENTACIÓN (FASES)

### **FASE 1: Base de Datos (1-2 horas)**
1. ✅ Agregar modelos `HostTracking` y `GuestConsumo` a `schema.prisma`
2. ✅ Agregar campo `tableNumber` a `Reservation`
3. ✅ Agregar relación `guestConsumo` a `Consumo`
4. ✅ Crear migración y aplicar
5. ✅ Crear tipos TypeScript

### **FASE 2: API Endpoints (3-4 horas)**
1. ✅ `POST /api/staff/guest-consumo` - Vincular consumo
2. ✅ `GET /api/staff/host-tracking/search` - Buscar anfitriones
3. ✅ `POST /api/staff/host-tracking/activate` - Activar tracking
4. ✅ `GET /api/cliente/host-stats` - Stats del anfitrión
5. ✅ `GET /api/cliente/host-stats/[eventId]` - Detalle evento
6. ✅ Modificar `POST /api/reservas` - Auto-activar tracking

### **FASE 3: Staff UI (3-4 horas)**
1. ✅ Crear `HostSearchModal` component
2. ✅ Agregar toggle "¿Es invitado?" en staff page
3. ✅ Integrar búsqueda en flujo de captura OCR
4. ✅ Agregar feedback visual de vinculación
5. ✅ Testing con datos reales

### **FASE 4: Cliente Portal UI (4-5 horas)**
1. ✅ Crear tab "Anfitrión" en cliente portal
2. ✅ Implementar cards de estadísticas
3. ✅ Lista de productos favoritos
4. ✅ Lista de eventos recientes
5. ✅ Modal de detalle de evento
6. ✅ Responsive design

### **FASE 5: Admin Tools (2-3 horas)**
1. ✅ Lista de trackings activos
2. ✅ Formulario de activación manual
3. ✅ Botón para desactivar tracking
4. ✅ Dashboard de anfitriones top

### **FASE 6: Testing & Refinamiento (2-3 horas)**
1. ✅ Pruebas end-to-end
2. ✅ Validación de edge cases
3. ✅ Optimización de queries
4. ✅ Documentación final

---

## 🔍 CASOS DE USO

### **Caso 1: Reserva Grande con Mesa Asignada**
```
1. Cliente hace reserva:
   - Nombre: "María González"
   - Invitados: 8
   - Mesa: 5
   
2. Sistema auto-activa HostTracking:
   - reservationName: "María González"
   - tableNumber: "5"
   - guestCount: 8
   
3. Staff atiende Mesa 5:
   - Busca "5" en el buscador
   - Encuentra "Mesa 5 - María González"
   - Selecciona y registra consumo
   
4. Consumo se vincula:
   - Va al cliente (invitado)
   - También se registra en GuestConsumo
```

### **Caso 2: Reserva Sin Mesa (Solo Nombre)**
```
1. Cliente hace reserva:
   - Nombre: "Juan Pérez"
   - Invitados: 6
   - Mesa: null
   
2. Staff procesa consumo:
   - Busca "Juan Pérez" por nombre
   - Encuentra reserva del día
   - Vincula consumo
```

### **Caso 3: Múltiples Eventos del Mismo Anfitrión**
```
1. María González tiene 3 eventos:
   - 01/10: Mesa 5, 8 invitados, $450
   - 15/10: Mesa VIP, 12 invitados, $890
   - 30/10: Mesa 3, 6 invitados, $320
   
2. Portal Cliente muestra:
   - Total acumulado: $1,660
   - 26 invitados únicos
   - Producto favorito: Whiskey (15 unidades)
```

---

## 🚀 BENEFICIOS DEL SISTEMA

### **Para el Negocio:**
- 📊 **Identificar anfitriones valiosos** que traen clientes de alto valor
- 🎯 **Marketing dirigido** a anfitriones frecuentes
- 💰 **Incrementar ticket promedio** con incentivos
- 📈 **Predecir demanda** basado en reservas grandes

### **Para el Anfitrión:**
- 🏆 **Reconocimiento** de su valor como promotor
- 🎁 **Recompensas personalizadas** según consumo del grupo
- 📊 **Transparencia** de lo que consume su grupo
- 🔄 **Incentivo** para volver a traer invitados

### **Para el Staff:**
- ⚡ **Búsqueda rápida** por mesa o nombre
- 📝 **Registro simple** sin pasos adicionales
- 🎯 **Mejor servicio** al conocer el contexto de la mesa

---

## 🔒 CONSIDERACIONES DE SEGURIDAD

1. **Privacy:** Los invitados pueden ser anónimos (no requieren registro)
2. **Data Isolation:** businessId en todas las queries
3. **Permissions:** Solo staff puede vincular consumos
4. **Audit Trail:** Timestamps en todas las relaciones

---

## 📊 MÉTRICAS DE ÉXITO

- **Activación:** % de reservas grandes con tracking activo
- **Uso:** % de consumos vinculados a anfitriones
- **Retención:** Anfitriones que repiten en 30 días
- **Valor:** Consumo promedio por invitado de anfitrión vs. cliente normal

---

## 🎨 MEJORAS FUTURAS (V2)

1. **Gamificación:** Niveles de anfitrión (Bronce, Plata, Oro)
2. **Recompensas automáticas:** Descuentos cuando el grupo gasta X
3. **Invitaciones:** Sistema de invites con código QR
4. **Social:** Compartir logros como anfitrión
5. **Predicción:** ML para predecir probabilidad de repetir

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Base de Datos
- [ ] Agregar modelo `HostTracking`
- [ ] Agregar modelo `GuestConsumo`
- [ ] Modificar modelo `Reservation`
- [ ] Modificar modelo `Consumo`
- [ ] Crear migración
- [ ] Aplicar en desarrollo
- [ ] Crear tipos TypeScript

### Backend
- [ ] Endpoint: Buscar anfitriones
- [ ] Endpoint: Vincular consumo invitado
- [ ] Endpoint: Activar tracking manual
- [ ] Endpoint: Stats anfitrión
- [ ] Endpoint: Detalle evento
- [ ] Modificar: Auto-activar en reservas

### Frontend - Staff
- [ ] Componente: HostSearchModal
- [ ] Componente: GuestConsumoToggle
- [ ] Integrar en staff page
- [ ] UI/UX feedback
- [ ] Testing funcional

### Frontend - Cliente
- [ ] Tab: Anfitrión
- [ ] Cards: Estadísticas
- [ ] Lista: Productos favoritos
- [ ] Lista: Eventos recientes
- [ ] Modal: Detalle evento
- [ ] Responsive design

### Frontend - Admin
- [ ] Lista: Trackings activos
- [ ] Form: Activar manual
- [ ] Dashboard: Top anfitriones

### Testing
- [ ] Unit tests: API endpoints
- [ ] Integration tests: Flujo completo
- [ ] E2E tests: Staff workflow
- [ ] Performance: Queries optimizadas

### Documentación
- [ ] README actualizado
- [ ] API docs
- [ ] User guide para staff
- [ ] Admin dashboard guide

---

## 🎯 PRÓXIMOS PASOS

1. **Revisar este plan** con el equipo
2. **Aprobar diseño de base de datos**
3. **Priorizar features** (MVP vs. Nice-to-have)
4. **Estimar tiempos** realistas
5. **Comenzar Fase 1** (Base de Datos)

---

**¿Estás listo para comenzar? 🚀**
