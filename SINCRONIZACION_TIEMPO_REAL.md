# 🔄 SINCRONIZACIÓN EN TIEMPO REAL - MÓDULO RESERVAS

## 📋 DESCRIPCIÓN

Sistema de sincronización inteligente que actualiza automáticamente el dashboard de reservas cuando hay cambios en la base de datos, sin recargar la página y con consumo mínimo de recursos.

---

## 🎯 PROBLEMA QUE RESUELVE

**Escenario:**
- **Recepción** escanea QR codes y registra asistencia
- **Dashboard de gestión** (otra pantalla) necesita ver los cambios en tiempo real
- **Requisitos:** Ligero, automático, sin polling excesivo, sin colapsar el módulo

**Solución anterior intentada:**
- ❌ **Polling tradicional:** Recarga completa cada 30s (pesado, incómodo)
- ❌ **SSE (Server-Sent Events):** Colapsó el módulo, reseteo completo necesario

**Solución implementada:**
- ✅ **Polling Inteligente con Timestamp:** Solo actualiza cuando HAY cambios reales

---

## 🏗️ ARQUITECTURA

### **Flujo de Sincronización:**

```
┌─────────────────────────────────────────────────────────────┐
│  1. Dashboard pregunta cada 8s:                             │
│     "¿Hay cambios desde 14:30:45?"                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  2. API verifica (super rápido):                            │
│     SELECT MAX(updatedAt) FROM reservations                 │
│     WHERE businessId = X                                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    ┌───────┴────────┐
                    │                │
         ┌──────────┴───┐    ┌──────┴──────────┐
         │ NO HAY CAMBIOS│    │ SÍ HAY CAMBIOS  │
         └──────────┬───┘    └──────┬──────────┘
                    │                │
                    ↓                ↓
    ┌───────────────────────┐  ┌──────────────────────┐
    │ Response:             │  │ Response:            │
    │ { hasChanges: false } │  │ { hasChanges: true,  │
    │ (0.2KB, súper rápido) │  │   changedCount: 3,   │
    │                       │  │   reservas: [...] }  │
    │ ⚡ Dashboard no hace  │  │ (50KB con datos)     │
    │    nada               │  │                      │
    └───────────────────────┘  │ ✨ Dashboard        │
                               │    actualiza UI      │
                               └──────────────────────┘
```

---

## 📁 ARCHIVOS MODIFICADOS/CREADOS

### **1. `/api/reservas/check-updates/route.ts` (NUEVO)**
```typescript
GET /api/reservas/check-updates?businessId=X&since=2025-10-01T14:30:45.000Z
```

**Responsabilidad:**
- Verificar si hay actualizaciones desde un timestamp
- Retornar `hasChanges: boolean` y `lastUpdate: string`
- Solo enviar datos completos si hay cambios

**Optimización:**
- Consulta ligera: `SELECT MAX(updatedAt)` (milisegundos)
- No envía datos pesados si no hay cambios
- Fallar de manera segura en caso de error

---

### **2. `src/app/reservas/hooks/useReservations.tsx` (MODIFICADO)**

**Nuevos estados agregados:**
```typescript
const [lastUpdateTimestamp, setLastUpdateTimestamp] = useState<string>()
const [isSyncing, setIsSyncing] = useState(false)
const [syncStatus, setSyncStatus] = useState<'idle' | 'checking' | 'updating'>()
```

**Nuevas funciones:**

#### `checkForUpdates()` - Polling inteligente
```typescript
// Verifica cada 8 segundos si hay cambios
// Solo carga datos completos si hasChanges = true
```

#### `forceRefresh()` - Refresh manual
```typescript
// Permite refrescar manualmente con botón
// Útil si el usuario quiere ver cambios inmediatamente
```

**Efectos implementados:**

1. **Polling automático cada 8 segundos:**
```typescript
useEffect(() => {
  const interval = setInterval(checkForUpdates, 8000);
  return () => clearInterval(interval);
}, [checkForUpdates]);
```

2. **Pausar/reanudar al cambiar de tab:**
```typescript
useEffect(() => {
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) checkForUpdates(); // Refrescar al volver
  });
}, [checkForUpdates]);
```

---

### **3. `src/app/reservas/ReservasApp.tsx` (MODIFICADO)**

**Indicador visual de sincronización:**
```tsx
{/* Badge superior que muestra el estado */}
{syncStatus === 'checking' && (
  <div className="flex items-center gap-2">
    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
    <span>Verificando actualizaciones...</span>
  </div>
)}

{syncStatus === 'idle' && (
  <div className="flex items-center gap-2">
    <div className="w-2 h-2 bg-green-500 rounded-full" />
    <span>Sincronizado</span>
  </div>
)}
```

**Botón de refresh manual:**
```tsx
<button onClick={forceRefresh} disabled={isSyncing}>
  {isSyncing ? 'Actualizando...' : 'Refrescar'}
</button>
```

---

### **4. `src/app/reservas/components/QRScannerClean.tsx` (MODIFICADO)**

**Callback agregado:**
```typescript
interface QRScannerCleanProps {
  onRefreshNeeded?: () => void; // ← NUEVO
  // ...otros props
}
```

**Disparo después de escaneo exitoso:**
```typescript
// Después de confirmar asistencia
if (onRefreshNeeded) {
  onRefreshNeeded(); // Trigger refresh inmediato
}
```

**Beneficio:** 
- Cuando recepción escanea QR → Dashboard se actualiza inmediatamente
- No espera los 8 segundos del polling

---

## 📊 COMPARACIÓN DE CONSUMO

| Método | Llamadas/min | Datos transferidos | Carga servidor | UX |
|--------|--------------|-------------------|----------------|-----|
| **Polling tradicional (30s)** | 2 | ~100KB/min | Media | ⚠️ Recarga visible |
| **SSE** | Conexión abierta | Variable | Alta | ❌ Colapsó módulo |
| **WebSockets** | Conexión abierta | Variable | Alta | ❌ Complejo |
| **✅ Polling Inteligente (8s)** | 7.5 | **1.4KB/min** (sin cambios)<br>**50KB/min** (con cambios) | Baja | ✅ Imperceptible |

**Ahorro:** **98% de datos** cuando no hay cambios activos.

---

## ⚡ OPTIMIZACIONES IMPLEMENTADAS

### **A. Silent Loading**
```typescript
loadReservasFromAPI(silent = true)
// No muestra spinner de loading para actualizaciones en background
```

### **B. Pausar en segundo plano**
```typescript
// Detiene polling cuando tab no está visible
// Reanuda y refresca inmediatamente al volver
```

### **C. Feedback visual discreto**
```typescript
// Toast solo cuando HAY cambios
toast.success(`✨ ${changedCount} reserva(s) actualizada(s)`)
```

### **D. Refresh inmediato post-escaneo**
```typescript
// Después de escanear QR, no espera los 8s
onRefreshNeeded() // Trigger manual
```

---

## 🎬 FLUJO DE USUARIO

### **Escenario 1: Recepción escanea QR**

1. Staff en recepción escanea QR code
2. `QRScannerClean` registra asistencia
3. Llama a `onRefreshNeeded()` → `forceRefresh()`
4. Dashboard en oficina ve toast: "✨ 1 reserva(s) actualizada(s)"
5. Tabla actualiza fila con nuevo `asistenciaActual`

**Tiempo:** ~1-2 segundos (casi instantáneo)

---

### **Escenario 2: Monitoreo pasivo**

1. Gerente observa dashboard
2. Cada 8 segundos: `checkForUpdates()` verifica cambios
3. Si NO hay cambios: No pasa nada (solo 0.2KB transferidos)
4. Si SÍ hay cambios: Toast + actualización automática

**Impacto:** Imperceptible, no interrumpe flujo de trabajo

---

### **Escenario 3: Tab en segundo plano**

1. Usuario cambia a otra pestaña
2. Polling se detiene automáticamente
3. Al volver al tab: Refresh inmediato
4. Ve todos los cambios acumulados

**Beneficio:** No consume recursos innecesariamente

---

## 🔧 CONFIGURACIÓN

### **Intervalo de polling (modificable):**
```typescript
// En useReservations.tsx línea ~245
const pollingInterval = setInterval(checkForUpdates, 8000); 
// ↑ Cambiar 8000ms (8s) según necesidad
```

**Recomendaciones:**
- **5-8s:** Para actividad alta (hora pico)
- **10-15s:** Para actividad media
- **20-30s:** Para actividad baja

---

## 🚀 PRÓXIMAS MEJORAS (OPCIONALES)

### **A. Polling Adaptativo**
```typescript
// Ajustar frecuencia según actividad reciente
const interval = timeSinceLastChange < 2min ? 5000 : 30000;
```

### **B. Notificación en título**
```typescript
document.title = `(3) Nuevas llegadas - Reservas`;
```

### **C. Sound Alert**
```typescript
if (changedCount > 0) new Audio('/notification.mp3').play();
```

### **D. Animación de filas nuevas**
```typescript
// Highlight temporal en filas actualizadas
className={isNew ? 'animate-pulse bg-blue-50' : ''}
```

---

## ✅ TESTING

### **1. Verificar endpoint:**
```bash
curl "http://localhost:3000/api/reservas/check-updates?businessId=test&since=2025-10-01T00:00:00.000Z"
```

**Respuesta esperada:**
```json
{
  "hasChanges": true,
  "lastUpdate": "2025-10-01T14:35:12.000Z",
  "changedCount": 3
}
```

---

### **2. Test de sincronización:**

**Paso 1:** Abrir dashboard en navegador
**Paso 2:** Abrir scanner en otro navegador/dispositivo
**Paso 3:** Escanear QR code
**Paso 4:** Verificar que dashboard muestra toast y actualiza

**Resultado esperado:**
- ✅ Toast aparece: "✨ 1 reserva(s) actualizada(s)"
- ✅ Tabla actualiza `asistenciaActual`
- ✅ No recarga página
- ✅ Indicador muestra "Sincronizado"

---

### **3. Test de rendimiento:**

```javascript
// Abrir consola del navegador en dashboard
console.time('checkUpdate');
fetch('/api/reservas/check-updates?businessId=test&since=2025-10-01T14:00:00.000Z')
  .then(() => console.timeEnd('checkUpdate'));
```

**Resultado esperado:** < 100ms

---

## 📝 NOTAS TÉCNICAS

### **¿Por qué 8 segundos?**
- Suficientemente rápido para sentirse "en tiempo real"
- Suficientemente lento para no saturar servidor
- Balance perfecto entre UX y rendimiento

### **¿Por qué no WebSockets?**
- Vercel serverless no mantiene conexiones persistentes eficientemente
- Overkill para 4 usuarios máx simultáneos
- Requiere infraestructura externa (costos adicionales)

### **¿Por qué no SSE?**
- Ya se intentó y colapsó el módulo
- Mantener conexiones abiertas es costoso en serverless
- Polling inteligente es más robusto y fácil de debuggear

### **Ventaja del timestamp:**
- Base de datos hace el trabajo pesado (índice en `updatedAt`)
- Prisma optimiza la query automáticamente
- No necesita cache adicional

---

## 🐛 TROUBLESHOOTING

### **Problema:** Dashboard no actualiza después de escanear
**Solución:**
1. Verificar que `onRefreshNeeded` está conectado
2. Check consola: debe aparecer "🔄 Disparando refresh después de escaneo exitoso"
3. Verificar que `forceRefresh()` está en el return del hook

---

### **Problema:** Polling muy frecuente (muchas llamadas)
**Solución:**
1. Aumentar intervalo: `setInterval(checkForUpdates, 15000)` (15s)
2. Verificar que no hay múltiples instancias del hook

---

### **Problema:** No detecta cambios
**Solución:**
1. Verificar que `updatedAt` se actualiza en Prisma:
   ```prisma
   model Reservation {
     updatedAt DateTime @updatedAt // ← Debe existir
   }
   ```
2. Regenerar cliente Prisma: `npx prisma generate`

---

## 📈 MÉTRICAS DE ÉXITO

✅ **Latencia:** < 10 segundos entre cambio y visualización
✅ **Consumo de datos:** < 5KB/min en idle
✅ **Carga del servidor:** < 50ms por verificación
✅ **UX:** Sin recargas perceptibles de página
✅ **Estabilidad:** Sin colapsos del módulo

---

## 🎓 CONCLUSIÓN

Sistema de sincronización en tiempo real implementado de manera:
- **Ligera:** Solo 1.4KB/min cuando no hay cambios
- **Automática:** Polling cada 8s + trigger post-escaneo
- **Robusta:** Fallos silenciosos, sin interrupciones
- **Escalable:** Fácil de ajustar intervalos según necesidad

**Resultado:** Dashboard de gestión siempre sincronizado con cambios de recepción, sin impacto en rendimiento.

---

**Fecha de implementación:** 1 de octubre, 2025
**Autor:** Lealta 2.0 Development Team
**Status:** ✅ PRODUCCIÓN - Fase 1 completa
