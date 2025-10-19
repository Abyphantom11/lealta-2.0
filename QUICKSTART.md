# 🚀 INICIO RÁPIDO - Implementación SSE Real-Time

> **¡IMPORTANTE!** Sigue estos pasos EN ORDEN. No saltees ninguno.

---

## ✅ FASE 1 COMPLETADA

Ya tienes listos:
- ✅ `REAL_TIME_IMPLEMENTATION_PLAN.md` - Plan completo detallado
- ✅ `REAL_TIME_SUMMARY.md` - Resumen ejecutivo
- ✅ `src/app/reservas/utils/realtime-config.ts` - Configuración
- ✅ `src/app/reservas/types/realtime.ts` - Tipos TypeScript

---

## 🎯 PRÓXIMOS PASOS

### Paso 1: Guardar trabajo actual (2 min)

```bash
# 1. Agregar archivos nuevos
git add REAL_TIME_IMPLEMENTATION_PLAN.md
git add REAL_TIME_SUMMARY.md
git add QUICKSTART.md
git add src/app/reservas/utils/realtime-config.ts
git add src/app/reservas/types/realtime.ts

# 2. Commit de FASE 1
git commit -m "feat(reservas): FASE 1 - Configuración base para SSE Real-Time

- Añadido plan completo de implementación
- Creada configuración centralizada
- Definidos tipos TypeScript para eventos
- Documentación completa para cada fase

Ref: REAL_TIME_IMPLEMENTATION_PLAN.md"

# 3. Crear branch para desarrollo
git checkout -b feature/sse-realtime

# 4. Push (opcional, para backup)
git push -u origin feature/sse-realtime
```

---

### Paso 2: Comenzar FASE 2 - SSE Server (45 min)

#### 2.1 Crear estructura de carpetas

```bash
# Crear carpeta para el endpoint SSE
mkdir -p src/app/api/reservas/events
```

#### 2.2 Copiar código del plan

Abre `REAL_TIME_IMPLEMENTATION_PLAN.md` y busca **"FASE 2"**.

Copia el código de la sección **"2.1 Crear API Route para SSE"** y pégalo en:
- `src/app/api/reservas/events/route.ts`

#### 2.3 Validación

Verifica que:
- [ ] Archivo creado sin errores TypeScript
- [ ] Imports correctos
- [ ] Función `emitReservationEvent` exportada

#### 2.4 Integrar en APIs existentes

**Archivo 1:** `src/app/api/reservas/[id]/asistencia/route.ts`

Busca la función `POST` y después de actualizar la reserva, agrega:

```typescript
import { emitReservationEvent } from '@/app/api/reservas/events/route';

// ... después de updatedReservation = await prisma.reservation.update({...})

// 🔥 NUEVO: Emitir evento SSE
emitReservationEvent(
  updatedReservation.businessId,
  'qr-scanned',
  {
    reservaId: updatedReservation.id,
    asistenciaActual: updatedReservation.ReservationQRCode[0]?.scanCount || 0,
    clienteNombre: updatedReservation.customerName,
  }
);
```

**Archivo 2:** `src/app/api/reservas/route.ts` (POST)

Después de crear la reserva exitosamente:

```typescript
import { emitReservationEvent } from './events/route';

// ... después de crear newReservation

emitReservationEvent(
  businessId,
  'reservation-created',
  {
    reservaId: newReservation.id,
    reserva: formatReservaResponse(newReservation),
  }
);
```

**Archivo 3:** `src/app/api/reservas/[id]/route.ts` (PUT)

Después de actualizar:

```typescript
import { emitReservationEvent } from '@/app/api/reservas/events/route';

// ... después de updatedReservation = await prisma.reservation.update({...})

emitReservationEvent(
  businessId,
  'reservation-updated',
  {
    reservaId: id,
    updates: updates,
  }
);
```

#### 2.5 Test rápido

```bash
# Iniciar servidor
npm run dev

# En otra terminal o navegador:
# Abre: http://localhost:3000/api/reservas/events?businessId=golom

# Deberías ver:
# data: {"type":"connected","connectionId":"..."}
# data: {"type":"heartbeat","time":...}
```

✅ **VALIDACIÓN:** Si ves los mensajes, ¡FASE 2 completada!

---

### Paso 3: FASE 3 - Hooks Cliente (45 min)

#### 3.1 Crear useServerSentEvents.tsx

```bash
# Crear archivo
touch src/app/reservas/hooks/useServerSentEvents.tsx
```

Copia el código de **"FASE 3, sección 3.1"** del plan.

#### 3.2 Crear useRealtimeSync.tsx

```bash
# Crear archivo
touch src/app/reservas/hooks/useRealtimeSync.tsx
```

Copia el código de **"FASE 3, sección 3.2"** del plan.

#### 3.3 Validación

```bash
# Verificar que no hay errores TypeScript
npx tsc --noEmit
```

✅ **VALIDACIÓN:** Sin errores de compilación.

---

### Paso 4: FASE 4 - Optimizar useReservasOptimized (30 min)

Abre `src/app/reservas/hooks/useReservasOptimized.tsx`

Busca las líneas con `refetchInterval: 30000` y modifícalas según **"FASE 4"** del plan.

**Cambios clave:**
```typescript
// ANTES:
refetchInterval: 30000,
refetchOnMount: true,

// DESPUÉS:
import { useRealtimeSync } from './useRealtimeSync';
import { REALTIME_CONFIG } from '../utils/realtime-config';

// Dentro del hook:
const { isRealtimeEnabled, isConnected } = useRealtimeSync({
  businessId,
  enabled,
});

refetchInterval: isRealtimeEnabled ? false : REALTIME_CONFIG.polling.interval,
refetchOnMount: REALTIME_CONFIG.polling.refetchOnMount,
```

✅ **VALIDACIÓN:** Polling se desactiva cuando SSE está conectado.

---

### Paso 5: FASE 5 - Integración UI (15 min)

Abre `src/app/reservas/ReservasApp.tsx`

Agrega después de los destructuring del hook:

```typescript
const {
  reservas,
  stats: dashboardStats,
  isLoading,
  // ... otros existentes ...
  isRealtimeEnabled, // 🆕 Nuevo
  isSSEConnected,    // 🆕 Nuevo
} = useReservasOptimized({...});

// 🆕 Indicador visual
const realtimeIndicator = isSSEConnected ? (
  <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-full shadow-lg text-xs">
    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
    <span>Tiempo Real Activo</span>
  </div>
) : null;

// En el return, antes del cierre del div principal:
{realtimeIndicator}
```

✅ **VALIDACIÓN:** Indicador verde aparece cuando SSE está conectado.

---

### Paso 6: FASE 6 - Testing (1 hora)

#### Test 1: Escaneo de QR (CRÍTICO)

1. Abre la app de reservas en navegador A
2. Escanea un QR en navegador B (o dispositivo móvil)
3. **VERIFICA:** Navegador A muestra asistencia actualizada < 1s

✅ **PASS:** Asistencia se actualiza inmediatamente  
❌ **FAIL:** Revisa console logs y emitReservationEvent

#### Test 2: Crear Reserva

1. Dispositivo A: App de reservas abierta
2. Dispositivo B: Crear nueva reserva
3. **VERIFICA:** Dispositivo A muestra nueva reserva automáticamente

✅ **PASS:** Nueva reserva aparece sin esperar  
❌ **FAIL:** Verifica que el evento se emite en POST /reservas

#### Test 3: Reconexión

1. Detener servidor (Ctrl+C)
2. **VERIFICA:** Console muestra intentos de reconexión
3. Reiniciar servidor
4. **VERIFICA:** Reconexión exitosa automática

✅ **PASS:** Se reconecta en < 15 segundos  
❌ **FAIL:** Revisa lógica de reconexión en useServerSentEvents

#### Test 4: Fallback Polling

1. En `realtime-config.ts` cambiar: `sse: { enabled: false }`
2. Recargar app
3. **VERIFICA:** Polling se activa (cada 2 minutos)
4. Crear reserva y esperar máximo 2 min
5. **VERIFICA:** Actualización funciona

✅ **PASS:** Fallback funciona correctamente  
❌ **FAIL:** Revisa configuración de polling

---

## 🎉 COMPLETADO

Cuando todos los tests pasen:

```bash
# 1. Commit final
git add .
git commit -m "feat(reservas): Implementación completa SSE Real-Time

✅ Server-Sent Events para actualizaciones instantáneas
✅ Polling inteligente como fallback
✅ Reconexión automática
✅ Reducción de 95% en consumo de API
✅ Latencia < 1 segundo para eventos críticos

Tests:
- ✅ Escaneo QR actualiza inmediatamente
- ✅ Múltiples usuarios sincronizados
- ✅ Reconexión automática funciona
- ✅ Fallback polling operativo

Closes: #SSE-REALTIME"

# 2. Push a branch
git push origin feature/sse-realtime

# 3. Merge a main (cuando esté validado en producción)
git checkout main
git merge feature/sse-realtime
git push origin main
```

---

## 📊 VERIFICACIÓN FINAL

### Antes vs Después

Abre DevTools Network tab y compara:

**Antes:**
- Request cada 30 segundos
- ~120 requests/hora

**Después:**
- 1 conexión SSE persistente
- ~5-10 requests/hora

---

## 🐛 PROBLEMAS COMUNES

### Problema 1: SSE no conecta
```bash
# Verifica:
- ¿El endpoint /api/reservas/events existe?
- ¿businessId está en la URL?
- ¿Hay errores en console del servidor?
```

### Problema 2: Eventos no se reciben
```bash
# Verifica:
- ¿emitReservationEvent se llama después de actualizar BD?
- ¿businessId es correcto en ambos lados?
- ¿Console log muestra "📨 SSE Event received"?
```

### Problema 3: Múltiples conexiones
```bash
# Verifica:
- ¿useEffect tiene cleanup correcto?
- ¿EventSource se cierra en unmount?
- ¿React StrictMode está activo? (normal en dev)
```

### Problema 4: Performance degradado
```bash
# Verifica:
- ¿Hay memory leaks? (DevTools Memory tab)
- ¿Polling está desactivado cuando SSE activo?
- ¿Cache updates son optimistas, no refetch completo?
```

---

## 📞 AYUDA

Si algo no funciona:

1. **Revisa console logs** (cliente Y servidor)
2. **Compara con el plan:** `REAL_TIME_IMPLEMENTATION_PLAN.md`
3. **Verifica cada fase** fue completada correctamente
4. **Rollback si necesario:** Ver sección "ROLLBACK PLAN" en plan completo

---

## 🎯 MÉTRICAS DE ÉXITO

Al finalizar, deberías ver:

- ✅ Indicador verde "Tiempo Real Activo"
- ✅ QR scan actualiza en < 1s
- ✅ Console log: "✅ SSE Connected"
- ✅ Network tab: 1 conexión persistente
- ✅ No más polling cada 30s

---

**¡Éxito! 🚀** Ahora tienes un sistema de reservas en tiempo real profesional.

**Tiempo total estimado:** 3-4 horas  
**Dificultad:** Media  
**Impacto:** 🔥 ALTO - Reducción de 95% en consumo
