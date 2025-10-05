# 🔍 DEBUG: Email y Promotor Detectados como Vacíos

## 🔴 Problema Reportado

Usuario muestra captura donde:
- ✅ Email visible: `h@gmail.com`
- ✅ Promotor visible: `Jhoni`
- ❌ Banner rojo: "Falta completar: Email, Promotor"

## 🧪 Logging Agregado

He agregado logging detallado en dos puntos críticos:

### 1. Al Detectar Cliente Existente

**Ubicación:** `useEffect` línea ~91

```typescript
console.log('👤 [CLIENTE] Datos del cliente encontrado:', {
  nombre: clienteExacto.nombre,
  cedula: clienteExacto.cedula,
  correo: clienteExacto.correo,
  email: clienteExacto.email,
  telefono: clienteExacto.telefono,
  allKeys: Object.keys(clienteExacto)
});
```

**Qué verifica:**
- Si el cliente tiene `correo` o `email` (variación de nombre de campo)
- Todos los campos disponibles en el objeto
- Si los datos se están trayendo correctamente de la BD

### 2. Al Intentar Crear Reserva

**Ubicación:** `handleCreateReservation` línea ~199

```typescript
console.log('🔍 [SUBMIT] Validando datos:', {
  clienteNombre: editableData.clienteNombre,
  clienteCedula: editableData.clienteCedula,
  clienteCorreo: editableData.clienteCorreo,
  clienteTelefono: editableData.clienteTelefono,
  fecha: editableData.fecha,
  hora: editableData.hora,
  promotorId: editableData.promotorId,
  promotorNombre: editableData.promotorNombre,
  clienteExistente,
});

console.log('📋 [SUBMIT] Valores con trim y verificación:', {
  nombre: `"${editableData.clienteNombre}" (length: ${editableData.clienteNombre?.length || 0})`,
  cedula: `"${editableData.clienteCedula}" (length: ${editableData.clienteCedula?.length || 0})`,
  correo: `"${editableData.clienteCorreo}" (length: ${editableData.clienteCorreo?.length || 0})`,
  telefono: `"${editableData.clienteTelefono}" (length: ${editableData.clienteTelefono?.length || 0})`,
  promotorId: `"${editableData.promotorId}" (length: ${editableData.promotorId?.length || 0})`,
});
```

**Qué verifica:**
- Valores exactos con comillas para ver espacios en blanco
- Longitud de cada string para detectar strings vacíos
- Si `promotorId` está realmente vacío

## 🔧 Mejoras Aplicadas

### 1. Manejo de Campos con Nombres Alternativos

```typescript
// ANTES - Asumía nombres fijos
clienteCorreo: clienteExacto.correo,
clienteTelefono: clienteExacto.telefono,

// AHORA - Soporta variaciones
const emailCliente = clienteExacto.correo || clienteExacto.email;
const telefonoCliente = clienteExacto.telefono || clienteExacto.phone;

setEditableData(prev => ({
  ...prev,
  clienteCorreo: emailCliente || prev.clienteCorreo,
  clienteTelefono: telefonoCliente || prev.clienteTelefono,
}));
```

**Razón:** La base de datos podría usar `email` en lugar de `correo`.

### 2. Validación con Trim

```typescript
// ANTES - Solo verificaba existencia
if (!editableData.clienteCorreo) camposFaltantes.push('Email');

// AHORA - Verifica existencia Y que no sea solo espacios
if (!editableData.clienteCorreo || !editableData.clienteCorreo.trim()) camposFaltantes.push('Email');
```

**Razón:** Un string con solo espacios `"   "` pasa la validación pero está vacío.

## 🎯 Próximos Pasos de Debugging

### Paso 1: Recargar y Ver Logs al Detectar Cliente

1. Recarga la aplicación
2. Abre DevTools Console (F12 → Console)
3. Pega el mensaje con cédula existente
4. Click en "Analizar con IA"
5. Busca en consola: `👤 [CLIENTE] Datos del cliente encontrado:`

**Qué revisar:**
```javascript
{
  nombre: "jose gomez",
  cedula: "1762075777",
  correo: "h@gmail.com",      // ¿Está presente?
  email: undefined,            // ¿O está aquí?
  telefono: "9898948984",      // ¿Está presente?
  allKeys: ["id", "nombre", "cedula", "email", "phone", ...] // Ver todos los campos
}
```

### Paso 2: Ver Logs al Intentar Crear Reserva

1. Completa fecha, hora
2. Busca y **SELECCIONA** un promotor de la lista (no solo escribir)
3. Click en "Crear Reserva"
4. Busca en consola: `🔍 [SUBMIT] Validando datos:`

**Qué revisar:**
```javascript
{
  clienteCorreo: "h@gmail.com",  // ¿Tiene valor?
  promotorId: "abc123",          // ¿Tiene ID o está vacío?
  promotorNombre: "Jhoni"        // El nombre está pero...
}
```

### Paso 3: Ver Detalles con Trim

Busca: `📋 [SUBMIT] Valores con trim y verificación:`

```javascript
{
  correo: '"h@gmail.com" (length: 12)',     // ✅ OK
  // O podría ser:
  correo: '"" (length: 0)',                  // ❌ Vacío
  correo: '"   " (length: 3)',               // ❌ Solo espacios
  
  promotorId: '"" (length: 0)'               // ❌ Sin seleccionar
}
```

## 🔎 Diagnóstico Esperado

### Caso A: Email Vacío en BD

```javascript
👤 [CLIENTE] Datos del cliente encontrado: {
  correo: null,        // ❌ Campo NULL en base de datos
  email: undefined,
  ...
}
```

**Solución:** El cliente necesita actualizarse en la BD con su email correcto.

### Caso B: Campo con Nombre Diferente

```javascript
👤 [CLIENTE] Datos del cliente encontrado: {
  correo: undefined,
  email: "h@gmail.com",  // ✅ Está en "email" no "correo"
  allKeys: ["email", "phone", "name"]
}
```

**Solución:** Ya implementada - ahora busca en ambos campos.

### Caso C: Promotor No Seleccionado

```javascript
🔍 [SUBMIT] Validando datos: {
  promotorNombre: "Jhoni",  // ✅ Nombre está
  promotorId: "",           // ❌ ID vacío - no seleccionó de la lista
}
```

**Solución:** El usuario debe hacer **click** en el promotor de la lista desplegable, no solo escribir el nombre.

### Caso D: Strings con Espacios

```javascript
📋 [SUBMIT] Valores con trim y verificación: {
  correo: '"   " (length: 3)',  // ❌ Solo espacios en blanco
}
```

**Solución:** Ya implementada - validación con `.trim()`.

## 📝 Instrucciones para el Usuario

### Para el Email:

Si el log muestra que `correo` viene `null` o `undefined` de la BD:

1. Ve a la sección de Clientes
2. Busca al cliente con cédula `1762075777`
3. Edita sus datos y agrega el email `h@gmail.com`
4. Guarda
5. Intenta nuevamente crear la reserva con IA

### Para el Promotor:

El componente `PromotorSearchOnly` requiere **SELECCIÓN**:

1. Escribe "Jhoni" en el campo
2. **Espera a que aparezca la lista** desplegable
3. **Haz click en el nombre** "Jhoni" en la lista
4. Verás un ✓ verde cuando esté seleccionado
5. Ahora podrás crear la reserva

**⚠️ IMPORTANTE:** Solo escribir el nombre NO es suficiente, debes seleccionarlo de la lista.

## 🎯 Resultado Esperado

Después de seguir estos pasos, deberías ver en consola:

```javascript
🔍 [SUBMIT] Validando datos: {
  clienteCorreo: "h@gmail.com",    // ✅ Presente
  promotorId: "cm1234abc",          // ✅ ID presente
  promotorNombre: "Jhoni"           // ✅ Nombre presente
}

✅ Reserva creada exitosamente
```

---

**Próxima acción:** 
1. Recarga la app
2. Sigue los pasos de debugging
3. Comparte los logs de consola para identificar cuál de los 4 casos (A, B, C, D) está ocurriendo
