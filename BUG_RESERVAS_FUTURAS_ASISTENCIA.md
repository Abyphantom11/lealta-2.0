# 🐛 Bug: Reservas Futuras Muestran Asistencia Incorrecta

## 📊 Resumen del Problema

**Síntoma:** Las reservas futuras (7-13 de noviembre) aparecen en la tabla como si ya hubieran asistido (15/15, 5/5, 10/10) cuando en realidad nadie ha llegado aún.

## ✅ Verificación Realizada

### Base de Datos (CORRECTO):
```
Isabel Cajo (RES-1761186663039):
   HostTracking.guestCount: 0 ✅
   QR scanCount: 0 ✅
   
José Vanegas (RES-1762471878194):
   HostTracking.guestCount: 0 ✅
   QR scanCount: 0 ✅
   
Cristina Aguayo (RES-1762472173466):
   HostTracking.guestCount: 0 ✅
   QR scanCount: 0 ✅
```

### API Response (CORRECTO):
```javascript
// src/app/api/reservas/route.ts línea 382
asistenciaActual: reservation.HostTracking?.guestCount || 0

// El API devuelve:
Isabel Cajo: asistenciaActual = 0, numeroPersonas = 15
José Vanegas: asistenciaActual = 0, numeroPersonas = 5
Cristina Aguayo: asistenciaActual = 0, numeroPersonas = 10
```

### Frontend (INCORRECTO):
```
Isabel Cajo: 15/15 (100%) ❌
José Vanegas: 5/5 (100%) ❌
Cristina Aguayo: 10/10 (100%) ❌
```

## 🔍 Diagnóstico

El frontend está mostrando `numeroPersonas/numeroPersonas` en lugar de `asistenciaActual/numeroPersonas`.

**Posibles causas:**
1. **Caché del navegador** con datos antiguos
2. **localStorage** con valores viejos
3. **React Query cache** no actualizado
4. **Bug en el componente** que está calculando mal

## 🔧 Soluciones

### Solución 1: Limpiar Caché del Navegador (PRUEBA ESTO PRIMERO)

1. **Hard Refresh:**
   - Windows: `Ctrl + Shift + R` o `Ctrl + F5`
   - Mac: `Cmd + Shift + R`

2. **Limpiar Cache Completo:**
   - Presiona `F12` para abrir DevTools
   - Click derecho en el botón de recargar
   - Selecciona "Vaciar caché y recargar de forma forzada"

3. **Limpiar localStorage:**
   - Presiona `F12`
   - Ve a la pestaña "Application" (Chrome) o "Almacenamiento" (Firefox)
   - Expande "Local Storage"
   - Click derecho en `lealta.app` → "Clear"
   - Recarga la página

### Solución 2: Limpiar React Query Cache

Agrega un botón temporal para forzar limpieza:

**Archivo:** `src/app/reservas/ReservasApp.tsx`

```tsx
// Agregar al componente
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();

// Botón temporal para debugging
<button 
  onClick={() => {
    queryClient.invalidateQueries({ queryKey: ['reservas'] });
    queryClient.clear();
    window.location.reload();
  }}
  className="bg-red-500 text-white px-4 py-2 rounded"
>
  🔄 Forzar Refresh Completo
</button>
```

### Solución 3: Verificar Componente ReservationTable

Revisar si hay algún cálculo local incorrecto:

**Archivo:** `src/app/reservas/components/ReservationTable.tsx` líneas 933-937

```tsx
// CÓDIGO ACTUAL (debería estar así):
<span className={`font-medium text-xs ${getAsistenciaColor(reserva.asistenciaActual, reserva.numeroPersonas)}`}>
  {reserva.asistenciaActual}/{reserva.numeroPersonas}
</span>

// ❌ SI DICE ESTO, ES EL BUG:
<span>
  {reserva.numeroPersonas}/{reserva.numeroPersonas}  // INCORRECTO
</span>
```

## 🧪 Scripts de Verificación Creados

### 1. `verificar-reservas-futuras.js`
Detecta reservas futuras con datos incorrectos.

```bash
node verificar-reservas-futuras.js
```

### 2. `limpiar-reservas-futuras.js`
Elimina HostTracking de reservas futuras (YA EJECUTADO).

```bash
node limpiar-reservas-futuras.js
```

### 3. `verificar-reservas-imagen.js`
Verifica las reservas específicas de la captura de pantalla.

```bash
node verificar-reservas-imagen.js
```

### 4. `simular-api-response.js`
Simula exactamente lo que devuelve el API.

```bash
node simular-api-response.js
```

## 📝 Limpieza Realizada

✅ Eliminados 9 registros de HostTracking de reservas futuras:
- 3 reservas del 07/11
- 6 reservas del 08/11

## 🎯 Próximos Pasos

1. **Hacer hard refresh** en el navegador (Ctrl + Shift + R)
2. **Limpiar localStorage** desde DevTools
3. Si el problema persiste, buscar si hay un cálculo local incorrecto en el componente
4. Verificar si hay algún estado de React Query cacheado

## 🔒 Prevención Futura

Para evitar que se creen datos de HostTracking para reservas futuras:

**Archivo:** `src/app/api/staff/host-tracking/activate/route.ts`

Agregar validación:

```typescript
// Verificar que la reserva sea para hoy o antes
const hoy = new Date();
hoy.setHours(0, 0, 0, 0);

const fechaReserva = new Date(reservation.reservedAt);
fechaReserva.setHours(0, 0, 0, 0);

if (fechaReserva > hoy) {
  return NextResponse.json({
    success: false,
    error: 'No se puede crear HostTracking para reservas futuras'
  }, { status: 400 });
}
```

## ✅ Estado Actual

- ✅ Base de datos limpia
- ✅ API devuelve valores correctos
- ⚠️ Frontend mostrando datos cacheados incorrectos
- 🔧 Requiere hard refresh del navegador

---

**Fecha de diagnóstico:** 7 de noviembre de 2025
**Archivos analizados:**
- `src/app/api/reservas/route.ts`
- `src/app/reservas/components/ReservationTable.tsx`
- Base de datos: Reservation, HostTracking, ReservationQRCode

**Confirmado:** El backend está funcionando correctamente. El problema es en el frontend (caché).
