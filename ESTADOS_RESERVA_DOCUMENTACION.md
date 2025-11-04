# Estados de Reserva - Documentación

Este documento explica los diferentes estados que puede tener una reserva en el sistema.

## 📋 Estados Disponibles

### ✅ Estados Activos

#### 1. **En Progreso** (PENDING)
- **Color**: Amarillo 🟡
- **Prisma**: `PENDING`
- **Significado**: Reserva recién creada, esperando que el cliente llegue
- **Cuándo se usa**: Estado inicial al crear una nueva reserva

#### 2. **Activa** (CONFIRMED / CHECKED_IN)
- **Color**: Verde 🟢
- **Prisma**: `CONFIRMED` o `CHECKED_IN`
- **Significado**: 
  - `CONFIRMED`: Reserva confirmada manualmente por el host
  - `CHECKED_IN`: Cliente escaneó QR y llegó al lugar
- **Cuándo se usa**: Cuando el cliente está presente o reserva confirmada

#### 3. **En Camino** (COMPLETED)
- **Color**: Azul 🔵
- **Prisma**: `COMPLETED`
- **Significado**: Reserva finalizada, cliente completó su visita
- **Cuándo se usa**: Al finalizar el servicio

---

### ❌ Estados Negativos

#### 4. **Cancelado** (CANCELLED)
- **Color**: Rojo oscuro 🔴
- **Prisma**: `CANCELLED`
- **Significado**: **Cliente canceló la reserva con aviso previo**
- **UI**: Muestra badge "CANCELADO" sobre el nombre
- **Cuándo se usa**: 
  - Cliente llama para cancelar
  - Cliente cancela desde la aplicación
  - Host cancela por petición del cliente

#### 5. **Reserva Caída** (NO_SHOW)
- **Color**: Rojo 🔴
- **Prisma**: `NO_SHOW`
- **Significado**: **Cliente NO se presentó / Excedió tiempo de espera**
- **Cuándo se usa**:
  - Cliente no llegó a la hora acordada
  - Pasó el tiempo de tolerancia
  - No hubo comunicación del cliente

---

## 🎨 Identificación Visual

### Badge "CANCELADO"
Aparece como un badge rojo encima del nombre del cliente cuando el estado es "Cancelado":
```
[CANCELADO]
Juan Pérez
```

Similar al badge de "Pago en reserva" pero en rojo.

### Diferencias visuales

| Estado | Badge en Header | Color Borde Izquierdo | Color de Fondo |
|--------|----------------|---------------------|---------------|
| En Progreso | Badge amarillo | Amarillo | Blanco |
| Activa | Badge verde | Verde | Blanco |
| En Camino | Badge azul | Azul | Blanco |
| **Cancelado** | **Badge rojo + "CANCELADO"** | **Rojo oscuro** | Blanco |
| Reserva Caída | Badge rojo | Rojo | Blanco |

---

## 🔄 Flujo de Estados

```
CREAR RESERVA
    ↓
[En Progreso] ──────────→ [Activa] ──────→ [En Camino]
    ↓                         ↓                 
    ↓                         ↓
    ↓                    [Cancelado]
    ↓                    (cliente avisa)
    ↓
[Reserva Caída]
(no show / timeout)
```

---

## 📊 Impacto en Reportes

### Asistentes
- **Cancelado**: NO cuenta en asistentes (cliente no llegó)
- **Reserva Caída**: NO cuenta en asistentes (cliente no llegó)
- **En Camino**: SÍ cuenta en asistentes (si tiene HostTracking.guestCount > 0)
- **Activa**: SÍ cuenta en asistentes (si tiene HostTracking.guestCount > 0)

### Análisis por Asistencia (en reportes)
```typescript
completadas: asistentes === esperadas
sobreaforo: asistentes > esperadas
parciales: 0 < asistentes < esperadas
canceladas: estado === 'CANCELLED' (cliente canceló)
caidas: estado === 'NO_SHOW' (no se presentó)
```

---

## 🛠️ Implementación Técnica

### Mapeo Prisma → Frontend
```typescript
function mapPrismaStatusToReserva(status: string): EstadoReserva {
  switch (status) {
    case 'PENDING': return 'En Progreso';
    case 'CONFIRMED': return 'Activa';
    case 'CHECKED_IN': return 'Activa';
    case 'COMPLETED': return 'En Camino';
    case 'CANCELLED': return 'Cancelado';      // ✅ Cliente canceló
    case 'NO_SHOW': return 'Reserva Caída';    // ❌ No se presentó
  }
}
```

### Mapeo Frontend → Prisma
```typescript
function mapReservaStatusToPrisma(estado: EstadoReserva) {
  switch (estado) {
    case 'En Progreso': return 'PENDING';
    case 'Activa': return 'CONFIRMED';
    case 'En Camino': return 'COMPLETED';
    case 'Reserva Caída': return 'NO_SHOW';
    case 'Cancelado': return 'CANCELLED';
  }
}
```

---

## ✅ Checklist de Cambios Implementados

- [x] Separar estado "Cancelado" de "Reserva Caída"
- [x] Badge "CANCELADO" sobre el nombre (igual que "Pago en reserva")
- [x] Colores distintivos para cada estado
- [x] Mapeo correcto Prisma ↔️ Frontend
- [x] Documentación de estados
- [x] Actualizar reportes para distinguir canceladas de caídas

---

**Fecha de actualización**: 4 de noviembre de 2025
