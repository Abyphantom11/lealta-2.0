# 🧪 Checklist de Testing: Sistema de Fidelización por Anfitrión

**Fecha**: 8 de octubre, 2025  
**Estado**: ⏳ Pendiente de testing en local/preview

---

## 📋 Pre-requisitos

- [ ] Migración de base de datos aplicada
- [ ] Dev server corriendo en local
- [ ] O deployment en Vercel completado
- [ ] Usuario staff autenticado con businessId válido

---

## 1️⃣ Testing: Selector de Reservas en Staff

### Escenario 1: Cliente con reserva de hoy
**Pasos:**
1. Ir a `/staff` o la ruta del staff de tu business
2. En "Buscar Cliente", ingresar cédula de un cliente que TIENE una reserva confirmada para HOY
3. Verificar que aparezca la tarjeta de información del cliente
4. **VERIFICAR**: Debe aparecer una sección "📅 Reservas de Hoy" debajo de la info del cliente
5. **VERIFICAR**: La reserva debe mostrar:
   - Mesa asignada
   - Estado (🪑 Sentado / ✓ Confirmada)
   - Cantidad de invitados
   - Hora de la reserva
6. Click en una reserva para seleccionarla
7. **VERIFICAR**: El borde debe cambiar a morado y aparecer un checkmark
8. **VERIFICAR**: Mensaje "Consumo se vinculará a esta reserva"

**Resultado esperado:**
```
┌─────────────────────────────────────┐
│ José                    [Gold] 👆   │
│ Puntos: 93 | Estado: Regular        │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 📅 Reservas de Hoy           1 activa│
├─────────────────────────────────────┤
│ [✓] Mesa 5 | 🪑 Sentado             │
│     4 invitados • 13:40             │
│                               [✓]   │
├─────────────────────────────────────┤
│ ✓ Consumo se vinculará a esta      │
│   reserva                           │
└─────────────────────────────────────┘
```

**Console logs esperados:**
```
📅 Reservas de hoy para 1782075776: 1
```

---

### Escenario 2: Cliente sin reservas de hoy
**Pasos:**
1. Ingresar cédula de un cliente que NO tiene reservas para hoy
2. Verificar que aparezca la tarjeta de información del cliente
3. **VERIFICAR**: NO debe aparecer la sección "Reservas de Hoy"

**Resultado esperado:**
- Solo se ve la tarjeta del cliente
- No aparece selector de reservas

**Console logs esperados:**
```
📅 Reservas de hoy para XXXXXXXXXX: 0
```

---

### Escenario 3: Cliente sin identificar
**Pasos:**
1. NO ingresar cédula
2. **VERIFICAR**: NO debe aparecer selector de reservas

---

## 2️⃣ Testing: Vinculación de Consumo a Reserva

### Escenario: Procesar consumo con reserva seleccionada
**Pasos:**
1. Seguir "Escenario 1" para tener una reserva seleccionada
2. Capturar y procesar un ticket normalmente
3. Confirmar los datos del consumo
4. **VERIFICAR**: El consumo debe registrarse exitosamente
5. **VERIFICAR**: En la base de datos, el campo `reservationId` del Consumo debe estar lleno

**Query SQL para verificar:**
```sql
SELECT id, total, puntos, "reservationId", "clienteId"
FROM "Consumo"
WHERE "clienteId" = 'ID_DEL_CLIENTE'
ORDER BY "registeredAt" DESC
LIMIT 1;
```

**Resultado esperado:**
- `reservationId` debe tener el ID de la reserva seleccionada
- No debe ser `null`

---

## 3️⃣ Testing: Toggle de Anfitrión (Host Tracking)

### Escenario 1: Cliente es anfitrión (reserva con 4+ invitados)
**Pasos:**
1. Identificar cliente que tiene reserva con 4+ invitados
2. Seleccionar la reserva
3. **VERIFICAR**: Debe aparecer el toggle "🎯 Fidelización por Anfitrión"
4. Activar el toggle
5. Click en "Buscar Anfitrión"
6. Buscar por mesa (ej: "5") o por nombre
7. Seleccionar el anfitrión de la lista
8. **VERIFICAR**: Debe aparecer una tarjeta con info del anfitrión:
   - Mesa
   - Nombre
   - Cantidad de invitados
   - Botón X para limpiar
9. Procesar un consumo normalmente
10. **VERIFICAR**: Mensaje "✅ Consumo vinculado al anfitrión [Nombre]"

**Console logs esperados:**
```
🔍 [HOST SEARCH] Búsqueda de anfitriones: { businessId: '...', query: '5', searchMode: 'table' }
✅ [HOST SEARCH] Encontrados X anfitriones
🔗 [GUEST CONSUMO] Vinculando consumo a anfitrión: { hostTrackingId: '...', consumoId: '...', ... }
✅ [GUEST CONSUMO] Vinculación exitosa
```

---

### Escenario 2: Búsqueda sin resultados
**Pasos:**
1. Activar toggle de anfitrión
2. Buscar por mesa inexistente (ej: "999")
3. **VERIFICAR**: Mensaje "No se encontraron anfitriones activos"

---

## 4️⃣ Testing: Panel de Admin (SuperAdmin)

### Escenario: Ver eventos de anfitrión de un cliente
**Pasos:**
1. Ir a `/superadmin` o la ruta de superadmin de tu business
2. Tab "Historial del Cliente"
3. Buscar un cliente que sea anfitrión (tiene reservas con 4+ invitados)
4. Expandir el historial del cliente
5. **VERIFICAR**: Debe aparecer sección "🎯 Fidelización por Anfitrión"
6. **VERIFICAR**: Badge con cantidad de eventos (ej: "2 eventos")
7. Click en el toggle para expandir
8. **VERIFICAR**: Debe mostrar:
   - 4 cards con estadísticas totales (Eventos, Invitados, Consumo, Puntos)
   - Lista de eventos con:
     - Mesa, fecha, estado
     - Stats: invitados, consumos, total, puntos
     - Top productos consumidos
9. Click en el icono 👁️ de un evento
10. **VERIFICAR**: Se expande mostrando:
    - Lista de invitados
    - Consumo individual de cada invitado
    - Nombre, cédula, puntos, fecha/hora

**Resultado esperado:**
```
┌────────────────────────────────────────────┐
│ 👥 🎯 Fidelización por Anfitrión  [2 eventos] ▲ │
├────────────────────────────────────────────┤
│ Estadísticas Totales:                      │
│ ┌─────┬─────────┬─────────┬────────┐      │
│ │ 📅2 │ 👥 8    │ 📈$245  │ 🛍️245 │      │
│ └─────┴─────────┴─────────┴────────┘      │
│                                            │
│ 📅 Eventos como Anfitrión:                │
│ ┌──────────────────────────────────┐      │
│ │ Mesa 5 • 15/09/2025 • ✓  [👁️]  │      │
│ │ 5 invitados | 3 consumos | $120  │      │
│ │ 🍺 Cerveza (8×) 🍟 Papas (3×)    │      │
│ └──────────────────────────────────┘      │
└────────────────────────────────────────────┘
```

**Console logs esperados:**
```
📊 [ADMIN HOST TRACKING] Obteniendo lista de anfitriones: { businessId: '...', ... }
✅ [ADMIN HOST TRACKING] Encontrados X anfitriones
```

---

## 5️⃣ Testing: Auto-activación de Host Tracking

### Escenario: Crear reserva con 4+ invitados
**Pasos:**
1. Ir al módulo de reservas
2. Crear una nueva reserva para un cliente
3. Ingresar 4 o más invitados
4. Guardar la reserva
5. **VERIFICAR**: En logs debe aparecer:
   ```
   🏠 [AUTO HOST TRACKING] Activando para reserva con 4+ invitados
   ✅ [AUTO HOST TRACKING] Tracking creado automáticamente
   ```
6. En base de datos, verificar que existe un registro en `HostTracking`:

**Query SQL:**
```sql
SELECT * FROM "HostTracking"
WHERE "reservationId" = 'ID_DE_LA_RESERVA';
```

**Resultado esperado:**
- Debe existir 1 registro
- `isActive` debe ser `true`
- `guestCount` debe ser >= 4

---

## 6️⃣ Testing: Aislamiento de Business

### Escenario: Intentar vincular consumo de otro business
**Pasos:**
1. Como staff del Business A
2. Intentar buscar anfitriones por mesa
3. **VERIFICAR**: Solo debe mostrar anfitriones del Business A
4. No debe mostrar anfitriones de otros negocios

**Validación en logs:**
```
🔍 [HOST SEARCH] Búsqueda de anfitriones: { businessId: 'business-A', ... }
✅ [HOST SEARCH] Encontrados X anfitriones (solo de business-A)
```

---

## 🐛 Errores Comunes y Soluciones

### Error 1: "No se encontraron anfitriones activos"
**Posibles causas:**
- No hay reservas con 4+ invitados para hoy
- El campo `tableNumber` de la reserva está vacío
- El `HostTracking` tiene `isActive = false`

**Solución:**
1. Verificar en DB que existe el HostTracking
2. Verificar que `tableNumber` no sea null
3. Verificar que `isActive = true`

---

### Error 2: "La reserva pertenece a otro negocio" (403)
**Causa:**
- Problema de business isolation
- El `businessId` del staff no coincide con el de la reserva

**Solución:**
1. Verificar que el usuario staff tiene el `businessId` correcto
2. Verificar en DB que la reserva tiene el businessId correcto

---

### Error 3: Panel de admin no muestra nada
**Posibles causas:**
- El cliente no tiene eventos como anfitrión
- El `businessId` no se está pasando correctamente al componente
- La migración de DB no se aplicó

**Solución:**
1. Verificar que el cliente tiene registros en `HostTracking`
2. Verificar en console que el businessId se pasa correctamente
3. Aplicar migración: `npx prisma migrate deploy`

---

### Error 4: Selector de reservas no aparece
**Posibles causas:**
- El cliente no tiene reservas para HOY
- El endpoint `/api/reservas` no está filtrando correctamente
- El `businessId` no se está pasando en la request

**Solución:**
1. Verificar en console: `📅 Reservas de hoy para [cedula]: X`
2. Verificar que X > 0
3. Verificar que la fecha de la reserva es HOY
4. Verificar network tab que la request incluye `businessId`

---

## ✅ Checklist Final

- [ ] Selector de reservas aparece cuando cliente tiene reservas de hoy
- [ ] Selector NO aparece cuando cliente no tiene reservas
- [ ] Reserva seleccionada se vincula correctamente al consumo
- [ ] Toggle de anfitrión funciona
- [ ] Búsqueda de anfitriones por mesa funciona
- [ ] Búsqueda de anfitriones por nombre funciona
- [ ] Vinculación de consumo a anfitrión funciona
- [ ] Notificaciones de éxito/error se muestran correctamente
- [ ] Panel de admin en superadmin aparece
- [ ] Stats en panel de admin son correctas
- [ ] Lista de eventos en panel de admin funciona
- [ ] Detalles expandidos de eventos funcionan
- [ ] Auto-activación de host tracking funciona (4+ invitados)
- [ ] Aislamiento de business funciona correctamente
- [ ] Console logs son claros y útiles
- [ ] No hay errores en la consola del navegador
- [ ] No hay errores en logs del servidor

---

## 📊 Datos de Prueba Sugeridos

### Cliente 1: Con reserva de hoy (4+ invitados)
- Nombre: "José"
- Cédula: "1782075776"
- Reserva: Mesa 5, 4 invitados, hoy 13:40
- Debe aparecer en búsqueda de anfitriones

### Cliente 2: Sin reservas
- Nombre: "María"
- Cédula: "9999999999"
- Sin reservas
- NO debe aparecer selector de reservas

### Cliente 3: Con reserva pero <4 invitados
- Nombre: "Carlos"
- Cédula: "8888888888"
- Reserva: Mesa 3, 2 invitados, hoy
- Selector de reservas DEBE aparecer
- Pero NO debe activarse host tracking automáticamente

---

**¡Buena suerte con el testing!** 🚀

Si encuentras algún bug, documéntalo con:
1. Pasos para reproducir
2. Resultado esperado vs resultado actual
3. Console logs relevantes
4. Screenshots si es posible
