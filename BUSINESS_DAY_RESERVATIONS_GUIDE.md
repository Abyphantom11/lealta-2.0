# 📅 Guía: Día de Reserva con Corte a las 4:00 AM

## 🎯 Problema Resuelto

Los negocios nocturnos (bares, discotecas, restaurantes) que operan hasta las 3-4 AM necesitan que las reservas de la madrugada se cuenten como parte del día anterior, no del siguiente día del calendario.

### Ejemplo:
- **Antes**: Una reserva a las 2:00 AM del 17 de octubre se muestra como del día 17
- **Ahora**: Una reserva a las 2:00 AM del 17 de octubre se muestra como del día 16 (porque el nuevo día empieza a las 4:00 AM)

## ⚙️ Configuración

### Hora de Corte
Por defecto, el "día de reserva" cambia a las **4:00 AM**. Esto significa:
- **00:00 - 03:59**: Pertenece al día de reserva ANTERIOR
- **04:00 - 23:59**: Pertenece al día de reserva ACTUAL

Esta configuración se puede ajustar en `src/app/reservas/utils/reservation-day-utils.ts`:
```typescript
const RESERVATION_DAY_CUTOFF_HOUR = 4; // Cambiar a 3, 5, etc. según necesidad
```

⚠️ **Nota importante**: Este sistema es **independiente** del `business-day-utils.ts` que se usa para el dashboard del cliente. Son dos sistemas separados:
- `business-day-utils.ts`: Para portal, banners, promociones (dashboard cliente)
- `reservation-day-utils.ts`: Para módulo de reservas (este documento)

## 🛠️ Funciones Disponibles

### `getReservationDayDate(datetime, cutoffHour?)`
Convierte una fecha/hora a la fecha del día de reserva correspondiente.

```typescript
import { getReservationDayDate } from '@/app/reservas/utils/reservation-day-utils';

// Ejemplo 1: Reserva a las 2:00 AM
const datetime1 = new Date('2025-10-17T02:00:00');
const reservationDay1 = getReservationDayDate(datetime1);
console.log(reservationDay1); // "2025-10-16" (día anterior)

// Ejemplo 2: Reserva a las 5:00 PM
const datetime2 = new Date('2025-10-17T17:00:00');
const reservationDay2 = getReservationDayDate(datetime2);
console.log(reservationDay2); // "2025-10-17" (mismo día)

// Ejemplo 3: Reserva a las 4:00 AM exactas (hora de corte)
const datetime3 = new Date('2025-10-17T04:00:00');
const reservationDay3 = getReservationDayDate(datetime3);
console.log(reservationDay3); // "2025-10-17" (nuevo día de reserva)
```

### `filterReservasByDay(reservas, targetDate, cutoffHour?)`
Filtra reservas que pertenecen a un día específico.

```typescript
import { filterReservasByDay } from '@/app/reservas/utils/reservation-day-utils';

const targetDate = new Date('2025-10-16');
const reservasDelDia = filterReservasByDay(allReservas, targetDate);
```

### `groupReservasByDay(reservas, cutoffHour?)`
Agrupa reservas por día de reserva.

```typescript
import { groupReservasByDay } from '@/app/reservas/utils/reservation-day-utils';

const grouped = groupReservasByDay(allReservas);
// Map { '2025-10-16' => [...], '2025-10-17' => [...] }
```

### `getReservationDayRange(date, cutoffHour?)`
Obtiene el rango completo de un día de reserva.

```typescript
import { getReservationDayRange } from '@/app/reservas/utils/reservation-day-utils';

const range = getReservationDayRange(new Date('2025-10-16'));
// {
//   start: 2025-10-16T04:00:00,
//   end: 2025-10-17T03:59:59
// }
```

### `getReservationDayExplanation(hora)`
Genera mensaje explicativo para mostrar al usuario.

```typescript
import { getReservationDayExplanation } from '@/app/reservas/utils/reservation-day-utils';

const explanation = getReservationDayExplanation('02:30');
// "Esta reserva (02:30) será parte del día anterior (horario nocturno)"
```

## 📊 Cómo Usar en el Sistema de Reservas

### 1. Al Filtrar Reservas por Fecha (Frontend)

**Archivo**: `src/app/reservas/ReservasApp.tsx`

```typescript
import { filterReservasByDay } from '@/app/reservas/utils/reservation-day-utils';

// Función para obtener reservas del día
const getReservasByDate = (date: Date) => {
  return filterReservasByDay(reservas, date);
};
```

### 2. Al Mostrar Estadísticas Diarias

**Archivo**: `src/app/reservas/components/ReservationTable.tsx`

```typescript
import { filterReservasByDay } from '@/app/reservas/utils/reservation-day-utils';

// Calcular métricas del día de reserva
const reservasDelDia = filterReservasByDay(reservas, selectedDate);

const metricas = {
  totalReservas: reservasDelDia.length,
  totalInvitados: reservasDelDia.reduce((sum, r) => sum + r.numeroPersonas, 0),
  totalAsistentes: reservasDelDia.reduce((sum, r) => sum + r.asistenciaActual, 0),
};
```

### 3. Al Crear Reservas - Mostrar Advertencia

**Archivo**: `src/app/reservas/components/ReservationForm.tsx`

```typescript
import { getReservationDayExplanation } from '@/app/reservas/utils/reservation-day-utils';

// Al seleccionar hora
const handleHoraChange = (hora: string) => {
  setFormData({ ...formData, hora });
  
  // Mostrar advertencia si es madrugada
  const explanation = getReservationDayExplanation(hora);
  if (explanation) {
    toast.info('📅 ' + explanation, {
      duration: 5000,
    });
  }
};
```

### 4. En el Calendario - Marcar Días con Reservas

**Archivo**: `src/app/reservas/components/ReservationCalendar.tsx`

```typescript
import { getReservationDayDate } from '@/app/reservas/utils/reservation-day-utils';

const getReservasForDate = (date: Date) => {
  const targetDayStr = getReservationDayDate(date);
  
  return reservas.filter(reserva => {
    const reservaDatetime = new Date(`${reserva.fecha}T${reserva.hora}`);
    const reservaDayStr = getReservationDayDate(reservaDatetime);
    return reservaDayStr === targetDayStr;
  });
};
```

### 5. En Reportes - Agrupar por Día de Reserva

**Archivo**: `src/app/reservas/components/ReportsGenerator.tsx`

```typescript
import { groupReservasByDay } from '@/app/reservas/utils/reservation-day-utils';

const generateDailyReport = () => {
  const grouped = groupReservasByDay(reservas);
  
  for (const [fecha, reservasDelDia] of grouped) {
    console.log(`Día ${fecha}: ${reservasDelDia.length} reservas`);
  }
};
```

## 🔄 Implementación Recomendada (Sin Modificar BD)

**La gran ventaja de este enfoque**: NO requiere modificar la base de datos ni migrar datos existentes. Todo el filtrado se hace en el frontend/consultas.

### Paso 1: Actualizar Componentes de Visualización
Reemplazar los filtros actuales por fecha con `filterReservasByDay()`:

```typescript
// Antes
const reservasDelDia = reservas.filter(r => r.fecha === selectedDateStr);

// Después
import { filterReservasByDay } from '@/app/reservas/utils/reservation-day-utils';
const reservasDelDia = filterReservasByDay(reservas, selectedDate);
```

### Paso 2: Agregar Mensajes Informativos
Mostrar advertencias al usuario cuando crea reservas en madrugada:

```typescript
import { getReservationDayExplanation } from '@/app/reservas/utils/reservation-day-utils';

const explanation = getReservationDayExplanation(formData.hora);
if (explanation) {
  toast.info('📅 ' + explanation);
}
```

### Paso 3: Actualizar Calendario
Modificar la función que marca días con reservas:

```typescript
// Usar getReservationDayDate para agrupar correctamente
```

## ⚠️ Consideraciones Importantes

### 1. **UI/UX**: Comunicar Claramente al Usuario
```typescript
// En el formulario de reserva
if (hora < '04:00') {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
      <span className="font-semibold">📅 Nota:</span> Esta reserva ({hora}) 
      será parte del día anterior en el sistema (horario nocturno).
    </div>
  );
}
```

### 2. **Consistencia**: Usar Siempre las Mismas Funciones
Todos los componentes que filtran/agrupan por día deben usar `filterReservasByDay()` o `getReservationDayDate()`.

### 3. **Reportes**: Mantener Coherencia
Los reportes deben usar la misma lógica para evitar discrepancias.

## 🧪 Testing

```typescript
// tests/reservation-day-utils.test.ts
import { getReservationDayDate, filterReservasByDay } from '@/app/reservas/utils/reservation-day-utils';

describe('Reservation Day Utils', () => {
  it('should count early morning (2 AM) as previous day', () => {
    const datetime = new Date('2025-10-17T02:00:00');
    expect(getReservationDayDate(datetime)).toBe('2025-10-16');
  });
  
  it('should count afternoon (5 PM) as same day', () => {
    const datetime = new Date('2025-10-17T17:00:00');
    expect(getReservationDayDate(datetime)).toBe('2025-10-17');
  });
  
  it('should count 4 AM as new reservation day', () => {
    const datetime = new Date('2025-10-17T04:00:00');
    expect(getReservationDayDate(datetime)).toBe('2025-10-17');
  });
  
  it('should filter reservations correctly', () => {
    const reservas = [
      { fecha: '2025-10-16', hora: '22:00', cliente: { nombre: 'A' } },
      { fecha: '2025-10-17', hora: '02:00', cliente: { nombre: 'B' } }, // Debe ser del 16
      { fecha: '2025-10-17', hora: '20:00', cliente: { nombre: 'C' } },
    ];
    
    const targetDate = new Date('2025-10-16');
    const filtered = filterReservasByDay(reservas, targetDate);
    
    expect(filtered.length).toBe(2); // 22:00 del 16 y 02:00 del 17
    expect(filtered.map(r => r.cliente.nombre)).toContain('A');
    expect(filtered.map(r => r.cliente.nombre)).toContain('B');
  });
});
```

## 📚 Referencias

- `src/app/reservas/utils/reservation-day-utils.ts`: Utilidades de día de reserva
- `src/lib/business-day-utils.ts`: Sistema DIFERENTE para dashboard del cliente (NO usar aquí)

## ✅ Checklist de Implementación

- [x] Crear `reservation-day-utils.ts` con funciones utilitarias
- [ ] Actualizar `ReservasApp.tsx` para usar `filterReservasByDay()`
- [ ] Actualizar `ReservationTable.tsx` para métricas con corte 4 AM
- [ ] Actualizar `ReservationCalendar.tsx` para marcar días correctamente
- [ ] Agregar mensajes informativos en `ReservationForm.tsx`
- [ ] Actualizar `ReportsGenerator.tsx` para usar `groupReservasByDay()`
- [ ] Agregar tests unitarios
- [ ] Documentar en README del módulo de reservas

## 🚀 Ejemplo Completo de Uso
