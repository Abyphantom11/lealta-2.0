# ✅ FLUJO DE ESTADOS CORRECTO - Sistema de Reservas

## 📋 Flujo Correcto de Estados (Aclarado)

### 🎯 Estados del Sistema

| Estado DB | Estado Frontend | Significado | QR Escaneable |
|-----------|----------------|-------------|---------------|
| **PENDING** | **En Progreso** | Reserva confirmada, esperando llegada del cliente | ✅ Sí |
| **CHECKED_IN** | **Activa** | Cliente llegó al local (primer escaneo realizado) | ✅ Sí |
| **CONFIRMED** | **Activa** | Reserva manual confirmada | ✅ Sí |
| **COMPLETED** | **En Camino** | Reserva finalizada | ❌ No |
| **CANCELLED** | **Reserva Caída** | Reserva cancelada | ❌ No |
| **NO_SHOW** | **Reserva Caída** | Cliente no se presentó | ❌ No |

---

## 🔄 Flujo Completo del Sistema

### 1️⃣ **Creación de Reserva**

```
Usuario crea reserva
  ↓
Estado inicial: PENDING ("En Progreso")
  ↓
QR generado: res-{id}
  ↓
✅ QR listo para escanear
```

**Código en `/api/reservas/route.ts`**:
```typescript
status: mapReservaStatusToPrisma(data.estado || 'En Progreso')
// Resultado: PENDING
```

---

### 2️⃣ **Primer Escaneo del QR (Cliente Llega)**

```
Cliente escanea QR por primera vez
  ↓
Scanner valida:
  ✅ Formato correcto (res-{id})
  ✅ Dentro de ventana de tiempo
  ✅ Estado PENDING es válido
  ↓
Estado cambia: PENDING → CHECKED_IN
  ↓
scanCount: 0 → 1
  ↓
Frontend muestra: "En Progreso" → "Activa"
  ↓
✅ Cliente registrado en el local
```

**Código en `/api/reservas/qr-scan/route.ts`**:
```typescript
const esPrimerEscaneo = currentAsistencia === 0;

if (esPrimerEscaneo) {
  await prisma.reservation.update({
    where: { id: reservaId },
    data: { 
      status: 'CHECKED_IN',  // ✅ Marca que cliente llegó
      updatedAt: new Date() 
    }
  });
}
```

---

### 3️⃣ **Escaneos Adicionales (Más Personas Llegan)**

```
Otro invitado escanea el mismo QR
  ↓
Estado permanece: CHECKED_IN ("Activa")
  ↓
scanCount incrementa: 1 → 2 → 3...
  ↓
✅ +1 persona registrada
```

**Validación**:
- ✅ Si `scanCount ≤ guestCount`: Todo normal
- ⚠️ Si `scanCount > guestCount`: Exceso registrado pero permitido

---

## 🕐 Ventana de Validez del QR

El QR es válido:
- ✅ **Desde**: 24 horas ANTES de la hora de reserva
- ✅ **Hasta**: 12 horas DESPUÉS de la hora de reserva

**Ejemplo**:
```
Reserva: 2024-12-06 19:00
├── QR válido desde: 2024-12-05 19:00 (24h antes)
└── QR válido hasta:  2024-12-07 07:00 (12h después)
```

**Total**: 36 horas de ventana de validez

---

## 🔧 Validaciones en el Scanner

### ✅ **Validaciones que SE hacen**:

1. **Formato del QR**: Debe ser `res-{id}` o JSON válido
2. **Reserva existe**: ID debe existir en la DB
3. **Token válido**: Token QR debe coincidir
4. **Ventana de tiempo**: Debe estar dentro de las 36 horas
5. **No expirado**: No más de 12h después de la reserva

### ❌ **Validaciones que NO se hacen**:

1. ~~Estado debe ser CONFIRMED~~ ← **REMOVIDO**
   - Ahora acepta PENDING, CONFIRMED, CHECKED_IN

---

## 🎬 Ejemplo de Flujo Real

### Escenario: Reserva para 4 personas

```
14:00 - Usuario crea reserva para las 19:00 (4 personas)
        Estado: PENDING
        QR: res-cm123abc...
        scanCount: 0

18:50 - Primer invitado llega y escanea el QR
        Estado: PENDING → CHECKED_IN ✅
        scanCount: 0 → 1
        Mensaje: "Entrada registrada exitosamente"

19:05 - Segundo invitado llega y escanea
        Estado: CHECKED_IN (sin cambios)
        scanCount: 1 → 2
        Mensaje: "Entrada registrada exitosamente"

19:10 - Tercero y cuarto invitado llegan juntos
        (Scanner permite incremento de +2)
        Estado: CHECKED_IN (sin cambios)
        scanCount: 2 → 4
        Mensaje: "Registradas 2 personas exitosamente"

19:15 - Invitado adicional llega (no esperado)
        Estado: CHECKED_IN (sin cambios)
        scanCount: 4 → 5 ⚠️
        Mensaje: "Entrada registrada (1 persona adicional sobre el límite)"
```

---

## 📊 Comparación: Antes vs Ahora

### ❌ **ANTES (Incorrecto)**

```
Crear reserva → Estado: CONFIRMED
                ↓
        ¿Por qué CONFIRMED si el cliente
        ni siquiera ha llegado? 🤔
```

**Problemas**:
- No se diferenciaba entre "reserva hecha" y "cliente en el local"
- Estado CONFIRMED desde el inicio confundía la lógica

---

### ✅ **AHORA (Correcto)**

```
Crear reserva → Estado: PENDING ("En Progreso")
                ↓
        Cliente aún no ha llegado
        QR listo para escanear ✅
                ↓
Primer escaneo → Estado: CHECKED_IN ("Activa")
                ↓
        Cliente está en el local ✅
        Se pueden registrar más personas
```

**Ventajas**:
- ✅ Estados claros y con significado real
- ✅ Diferenciación entre reserva creada vs cliente llegado
- ✅ Flujo natural y lógico

---

## 🔍 Mapeo de Estados

### Frontend → DB

```typescript
'En Progreso'    → PENDING      // Estado inicial
'Activa'         → CONFIRMED    // Reserva manual
'En Camino'      → COMPLETED    // Finalizada
'Reserva Caída'  → CANCELLED    // Cancelada
```

### DB → Frontend

```typescript
PENDING      → 'En Progreso'    // Esperando llegada
CHECKED_IN   → 'Activa'         // ✅ Cliente en el local
CONFIRMED    → 'Activa'         // Reserva confirmada
COMPLETED    → 'En Camino'      // Finalizada
CANCELLED    → 'Reserva Caída'  // Cancelada
NO_SHOW      → 'Reserva Caída'  // No se presentó
```

---

## 📝 Archivos Modificados

### 1. `/api/reservas/qr-scan/route.ts`

**Cambios**:
- ❌ Removida validación `if (reserva.status !== 'CONFIRMED')`
- ✅ Agregada lógica para cambiar PENDING → CHECKED_IN en primer escaneo
- ✅ Agregados comentarios explicando el flujo

### 2. `/api/reservas/route.ts`

**Cambios**:
- ✅ Revertido estado inicial a `'En Progreso'` (PENDING)
- ✅ Actualizados comentarios en funciones de mapeo

### 3. Documentación

- ✅ `FLUJO_ESTADOS_CORRECTO.md` - Este documento

---

## 🧪 Testing

### Prueba el flujo completo:

1. **Crear reserva**
   ```
   POST /api/reservas
   Estado esperado: PENDING ("En Progreso")
   QR generado: res-cmXXXXXX
   ```

2. **Verificar QR generado**
   ```
   Formato: res-cmXXXXXX
   Longitud: ~30 caracteres
   ```

3. **Primer escaneo**
   ```
   POST /api/reservas/qr-scan
   {
     "qrCode": "res-cmXXXXXX",
     "action": "increment",
     "increment": 1
   }
   
   Resultado esperado:
   - scanCount: 0 → 1
   - status: PENDING → CHECKED_IN
   - Frontend: "En Progreso" → "Activa"
   ```

4. **Segundo escaneo**
   ```
   POST /api/reservas/qr-scan
   (mismo payload)
   
   Resultado esperado:
   - scanCount: 1 → 2
   - status: CHECKED_IN (sin cambios)
   ```

---

## ✨ Resumen Final

### Estados de Reserva:

1. **PENDING** → Reserva creada, esperando llegada ✅ *QR válido*
2. **CHECKED_IN** → Cliente llegó (automático al primer escaneo) ✅ *QR válido*
3. **COMPLETED** → Reserva finalizada ❌ *QR expirado*

### Flujo del QR:

1. Se genera al crear la reserva (estado PENDING)
2. Se puede escanear inmediatamente (dentro de ventana)
3. Primer escaneo cambia estado a CHECKED_IN
4. Escaneos adicionales solo incrementan contador

### Todo funciona correctamente ahora 🎉

- ✅ Estados con significado claro
- ✅ QR funcionan desde el momento de creación
- ✅ Transición automática al primer escaneo
- ✅ Registro correcto de asistencia
