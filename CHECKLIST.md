# ✅ CHECKLIST DE IMPLEMENTACIÓN SSE REAL-TIME

> Marca cada item al completarlo. Copia este archivo para trackear tu progreso.

---

## 📋 PRE-IMPLEMENTACIÓN

- [ ] Backup de código actual realizado
- [ ] Plan completo leído y entendido (`REAL_TIME_IMPLEMENTATION_PLAN.md`)
- [ ] Resumen ejecutivo revisado (`REAL_TIME_SUMMARY.md`)
- [ ] Quickstart guide leído (`QUICKSTART.md`)
- [ ] Tiempo bloqueado: 3-4 horas sin interrupciones
- [ ] Entorno de desarrollo funcionando correctamente
- [ ] Git status limpio o cambios committeados

---

## 🚀 FASE 1: CONFIGURACIÓN BASE

### Archivos Creados
- [x] `REAL_TIME_IMPLEMENTATION_PLAN.md`
- [x] `REAL_TIME_SUMMARY.md`
- [x] `QUICKSTART.md`
- [x] `CHECKLIST.md`
- [x] `src/app/reservas/utils/realtime-config.ts`
- [x] `src/app/reservas/types/realtime.ts`

### Validaciones
- [x] Sin errores de TypeScript
- [x] Configuración exportada correctamente
- [x] Tipos compatibles con Reserva existente
- [x] Debug logging funcional

### Git
- [ ] Commit realizado
- [ ] Branch `feature/sse-realtime` creada
- [ ] Push a remote (opcional)

**Tiempo estimado:** 30 min  
**Tiempo real:** _____ min

---

## 📡 FASE 2: SSE SERVER

### 2.1 API Route SSE
- [ ] Carpeta `src/app/api/reservas/events/` creada
- [ ] Archivo `route.ts` creado
- [ ] Función `emitReservationEvent` implementada
- [ ] Sistema de conexiones activas (Map) funcional
- [ ] Heartbeat cada 30s implementado
- [ ] Cleanup en close implementado

### 2.2 Integración en APIs
- [ ] `src/app/api/reservas/[id]/asistencia/route.ts` modificado
  - [ ] Import agregado
  - [ ] Evento 'qr-scanned' emitido después de update
  - [ ] Sin errores de compilación
  
- [ ] `src/app/api/reservas/route.ts` (POST) modificado
  - [ ] Import agregado
  - [ ] Evento 'reservation-created' emitido
  - [ ] Sin errores de compilación
  
- [ ] `src/app/api/reservas/[id]/route.ts` (PUT) modificado
  - [ ] Import agregado
  - [ ] Evento 'reservation-updated' emitido
  - [ ] Sin errores de compilación

### Validaciones
- [ ] Endpoint `/api/reservas/events?businessId=golom` responde
- [ ] Mensaje de conexión recibido
- [ ] Heartbeat visible cada 30s
- [ ] Console logs muestran conexiones activas
- [ ] Sin errores en servidor

### Test Manual
```bash
# En navegador abre:
http://localhost:3000/api/reservas/events?businessId=golom

# Deberías ver:
✅ data: {"type":"connected",...}
✅ data: {"type":"heartbeat",...}
```

- [ ] Test manual pasado

**Tiempo estimado:** 45 min  
**Tiempo real:** _____ min

---

## 🎣 FASE 3: HOOKS CLIENTE

### 3.1 useServerSentEvents
- [ ] Archivo `src/app/reservas/hooks/useServerSentEvents.tsx` creado
- [ ] Hook implementado con todas las funciones
- [ ] EventSource configurado correctamente
- [ ] Reconexión automática con backoff exponencial
- [ ] Cleanup en unmount
- [ ] Estados: isConnected, reconnectAttempts
- [ ] Sin errores de TypeScript

### 3.2 useRealtimeSync
- [ ] Archivo `src/app/reservas/hooks/useRealtimeSync.tsx` creado
- [ ] Hook implementado
- [ ] Handler `handleQRScanned` implementado
- [ ] Handler `handleReservationCreated` implementado
- [ ] Handler `handleReservationUpdated` implementado
- [ ] Handler `handleReservationDeleted` implementado
- [ ] Toast notifications configuradas
- [ ] Cache updates optimistas implementados
- [ ] Custom events disparados (force-card-refresh)
- [ ] Sin errores de TypeScript

### Validaciones
- [ ] `npx tsc --noEmit` pasa sin errores
- [ ] Imports correctos en ambos hooks
- [ ] Tipos de realtime.ts usados correctamente
- [ ] Console logs de debug funcionan

**Tiempo estimado:** 45 min  
**Tiempo real:** _____ min

---

## ⚡ FASE 4: OPTIMIZAR useReservasOptimized

### Modificaciones
- [ ] Archivo `src/app/reservas/hooks/useReservasOptimized.tsx` abierto
- [ ] Import `useRealtimeSync` agregado
- [ ] Import `REALTIME_CONFIG` agregado
- [ ] Hook `useRealtimeSync` integrado
- [ ] Variable `isRealtimeEnabled` obtenida
- [ ] Variable `isConnected` obtenida

### Cambios en combinedQuery
- [ ] `staleTime` cambiado a `REALTIME_CONFIG.polling.staleTime`
- [ ] `refetchOnMount` cambiado a `REALTIME_CONFIG.polling.refetchOnMount`
- [ ] `refetchInterval` cambiado a polling adaptativo:
  ```typescript
  refetchInterval: isRealtimeEnabled ? false : REALTIME_CONFIG.polling.interval
  ```

### Cambios en reservasQuery
- [ ] Mismos cambios aplicados a `reservasQuery`
- [ ] Lógica idéntica a `combinedQuery`

### Return values
- [ ] `isRealtimeEnabled` agregado al return
- [ ] `isSSEConnected` agregado al return

### Validaciones
- [ ] Sin errores de TypeScript
- [ ] Backward compatible (no rompe código existente)
- [ ] Polling se desactiva cuando SSE activo
- [ ] Fallback funciona si SSE falla

**Tiempo estimado:** 30 min  
**Tiempo real:** _____ min

---

## 🎨 FASE 5: INTEGRACIÓN UI

### ReservasApp.tsx
- [ ] Archivo `src/app/reservas/ReservasApp.tsx` abierto
- [ ] Destructuring actualizado con nuevos valores:
  - [ ] `isRealtimeEnabled`
  - [ ] `isSSEConnected`
- [ ] Indicador visual `realtimeIndicator` creado
- [ ] Indicador agregado al JSX (antes del cierre del div principal)

### Estilos del Indicador
- [ ] Posición fixed bottom-right
- [ ] Fondo verde cuando conectado
- [ ] Animación pulse en el dot
- [ ] z-index suficientemente alto (z-50)
- [ ] Se oculta cuando no está conectado

### Validaciones
- [ ] Sin errores de compilación
- [ ] Indicador visible cuando SSE conectado
- [ ] Indicador desaparece cuando desconectado
- [ ] No interfiere con UI existente

**Tiempo estimado:** 15 min  
**Tiempo real:** _____ min

---

## 🧪 FASE 6: TESTING

### Test 1: Escaneo de QR (CRÍTICO)
- [ ] Navegador A: App de reservas abierta
- [ ] Navegador B (o móvil): Escanear QR
- [ ] **RESULTADO:** Asistencia actualizada en < 1 segundo
- [ ] Toast notification aparece
- [ ] Console log: "QR Scanned - Cache updated"
- [ ] Tarjeta se actualiza sin full refetch
- [ ] ✅ TEST PASADO

**Si falla:**
- [ ] Verificar que `emitReservationEvent` se llama
- [ ] Verificar businessId correcto
- [ ] Revisar console logs de servidor

### Test 2: Crear Reserva
- [ ] Dispositivo A: Reservas abiertas
- [ ] Dispositivo B: Crear nueva reserva
- [ ] **RESULTADO:** Aparece en A automáticamente
- [ ] Sin delay de 30 segundos
- [ ] Toast notification "Nueva reserva creada"
- [ ] ✅ TEST PASADO

**Si falla:**
- [ ] Verificar evento emitido en POST /reservas
- [ ] Revisar handler `handleReservationCreated`

### Test 3: Editar Reserva
- [ ] Dispositivo A: Ver lista de reservas
- [ ] Dispositivo B: Editar mesa/hora de una reserva
- [ ] **RESULTADO:** Cambios visibles en A
- [ ] Cache actualizado parcialmente
- [ ] ✅ TEST PASADO

### Test 4: Reconexión Automática
- [ ] Servidor corriendo con app abierta
- [ ] Detener servidor (Ctrl+C)
- [ ] **VERIFICAR:** Console muestra intentos de reconexión
- [ ] Indicador verde desaparece
- [ ] Reiniciar servidor
- [ ] **VERIFICAR:** Reconexión automática < 15s
- [ ] Indicador verde reaparece
- [ ] ✅ TEST PASADO

**Backoff esperado:**
- Intento 1: 3 segundos
- Intento 2: 6 segundos
- Intento 3: 12 segundos
- Intento 4: 24 segundos
- Intento 5: 48 segundos

### Test 5: Polling Fallback
- [ ] En `realtime-config.ts`: `sse.enabled = false`
- [ ] Recargar app
- [ ] **VERIFICAR:** Indicador verde NO aparece
- [ ] **VERIFICAR:** Network tab muestra polling cada 2 min
- [ ] Crear reserva
- [ ] **VERIFICAR:** Actualización funciona (máximo 2 min)
- [ ] ✅ TEST PASADO
- [ ] Revertir: `sse.enabled = true`

### Test 6: Múltiples Usuarios Simultáneos
- [ ] Abrir 3 pestañas/dispositivos
- [ ] Usuario 1: Escanea QR
- [ ] **VERIFICAR:** Usuarios 2 y 3 ven actualización
- [ ] Usuario 2: Crea reserva
- [ ] **VERIFICAR:** Usuarios 1 y 3 ven nueva reserva
- [ ] Usuario 3: Edita reserva
- [ ] **VERIFICAR:** Usuarios 1 y 2 ven cambios
- [ ] ✅ TEST PASADO

### Test 7: Performance
- [ ] Abrir DevTools → Performance tab
- [ ] Grabar durante 30 segundos
- [ ] **VERIFICAR:** No hay memory leaks
- [ ] **VERIFICAR:** CPU usage normal
- [ ] **VERIFICAR:** Heap size estable
- [ ] ✅ TEST PASADO

### Test 8: Network Consumption
- [ ] Abrir DevTools → Network tab
- [ ] Esperar 5 minutos con SSE activo
- [ ] **VERIFICAR:** 1 conexión persistente
- [ ] **VERIFICAR:** < 10 requests totales
- [ ] **VERIFICAR:** Data transfer < 100 KB
- [ ] ✅ TEST PASADO

### Resumen de Tests
```
Total Tests: 8
Pasados: ___/8
Fallidos: ___/8
```

**Todos los tests deben pasar antes de continuar.**

**Tiempo estimado:** 1 hora  
**Tiempo real:** _____ min

---

## 📊 VALIDACIÓN FINAL

### Métricas de Éxito

#### Requests/Hora
- **Antes:** 120
- **Ahora:** _____
- **Objetivo:** < 10
- [ ] ✅ Objetivo alcanzado

#### Latencia de Actualización
- **Antes:** 0-30 segundos
- **Ahora:** _____ segundos
- **Objetivo:** < 1 segundo
- [ ] ✅ Objetivo alcanzado

#### Reconexión Automática
- **Tiempo de reconexión:** _____ segundos
- **Objetivo:** < 15 segundos
- [ ] ✅ Objetivo alcanzado

#### UX Score (subjetivo 1-5)
- **Antes:** 3/5
- **Ahora:** ___/5
- **Objetivo:** 5/5
- [ ] ✅ Objetivo alcanzado

### Console Verification
- [ ] No hay errores en console del navegador
- [ ] No hay warnings críticos
- [ ] Logs de debug funcionan (si enabled)
- [ ] Server logs limpios

### Code Quality
- [ ] `npx tsc --noEmit` pasa sin errores
- [ ] No hay `any` types innecesarios
- [ ] Comentarios útiles presentes
- [ ] Código formateado consistentemente

---

## 🎉 POST-IMPLEMENTACIÓN

### Documentación
- [ ] `REAL_TIME_IMPLEMENTATION_PLAN.md` actualizado con resultados
- [ ] `REAL_TIME_SUMMARY.md` status cambiado a "✅ Completado"
- [ ] Screenshots del indicador verde guardados
- [ ] Métricas antes/después documentadas

### Git
- [ ] Todos los cambios committeados
- [ ] Mensaje de commit descriptivo
- [ ] Branch pusheada a remote
- [ ] PR creado (si aplica)
- [ ] Code review solicitado (si aplica)

### Rollback Plan
- [ ] Commit hash anotado para posible rollback
- [ ] Procedimiento de rollback testeado
- [ ] Configuración de feature flag lista (si aplica)

### Monitoreo
- [ ] App en producción monitoreada por 24 horas
- [ ] Métricas de performance verificadas
- [ ] Logs de errores revisados
- [ ] Feedback de usuarios recopilado

---

## 🎯 TIEMPO TOTAL

| Fase | Estimado | Real | Diferencia |
|------|----------|------|------------|
| FASE 1 | 30 min | ___ | ___ |
| FASE 2 | 45 min | ___ | ___ |
| FASE 3 | 45 min | ___ | ___ |
| FASE 4 | 30 min | ___ | ___ |
| FASE 5 | 15 min | ___ | ___ |
| FASE 6 | 60 min | ___ | ___ |
| **TOTAL** | **3h 45min** | **___** | **___** |

---

## ✅ SIGN-OFF

- [ ] Implementación completa y funcionando
- [ ] Todos los tests pasados
- [ ] Documentación actualizada
- [ ] Code review aprobado (si aplica)
- [ ] Listo para merge a main
- [ ] Listo para deploy a producción

**Implementado por:** _________________  
**Fecha:** _________________  
**Revisado por:** _________________  
**Fecha de aprobación:** _________________

---

## 🎊 ¡FELICITACIONES!

Has implementado exitosamente un sistema de tiempo real con SSE que:

✅ Reduce consumo de API en 95%  
✅ Actualiza en < 1 segundo  
✅ Reconecta automáticamente  
✅ Tiene fallback inteligente  
✅ Es production-ready  

**¡Excelente trabajo! 🚀**

---

**Última actualización:** 19/10/2025  
**Versión:** 1.0  
**Status:** ✅ COMPLETADO
