# 🎯 Solución: Simulación de Días en Vista Previa

## 🐛 Problema Identificado

En el **Portal del Cliente** del panel de administración:
- Los botones **"Simular día"** (D, L, M, X, J, V, S) **NO estaban funcionando correctamente**
- Al hacer clic en un día diferente, la vista previa mostraba **SIEMPRE** el contenido del día comercial actual
- **NO se filtraba** el contenido por el día seleccionado

## 🔍 Causa Raíz

1. **Frontend**: `handleDaySimulation` solo cambiaba una variable global (`window.portalPreviewDay`) pero **NO recargaba los datos**
2. **API**: No aceptaba un parámetro para simular días diferentes
3. **Filtrado**: Se hacía en el frontend con datos ya cargados, sin pasar por la base de datos

## ✅ Solución Implementada

### 1. **Modificación de la API** (`config-v2/route.ts`)

```typescript
// ✅ ANTES:
const currentBusinessDay = await getCurrentBusinessDay(businessId);

// ✅ AHORA:
const simulateDay = searchParams.get('simulateDay'); // Nuevo parámetro
const currentBusinessDay = simulateDay || await getCurrentBusinessDay(businessId);
```

**Beneficios**:
- La API ahora acepta `?simulateDay=lunes` (o cualquier otro día)
- Si viene `simulateDay`, usa ese día para filtrar
- Si NO viene, usa el día comercial calculado (comportamiento normal)

### 2. **Modificación del Hook** (`PortalContentManager.tsx`)

#### 2.1. Actualización de `loadPreviewData`:

```typescript
// ✅ ANTES:
const loadPreviewData = useCallback(async () => {
  const response = await fetch(`/api/portal/config-v2?businessId=${businessId}`, ...);
  ...
}, [businessId, previewMode]);

// ✅ AHORA:
const loadPreviewData = useCallback(async (simulatedDay?: string) => {
  const dayToSimulate = simulatedDay || (window as any).portalPreviewDay;
  
  const url = dayToSimulate 
    ? `/api/portal/config-v2?businessId=${businessId}&simulateDay=${dayToSimulate}`
    : `/api/portal/config-v2?businessId=${businessId}`;
  
  const response = await fetch(url, ...);
  ...
}, [businessId, previewMode]);
```

#### 2.2. Actualización de `handleDaySimulation`:

```typescript
// ✅ AGREGADO:
console.log(`🗓️ Simulando día: ${diaSimulado}`);

// ✅ RECARGAR datos de la API con el día simulado
loadPreviewData(diaSimulado);
```

## 🎯 Flujo Completo

```
Usuario hace clic en "M" (Martes)
  ↓
handleDaySimulation('martes')
  ↓
window.portalPreviewDay = 'martes'
  ↓
loadPreviewData('martes')
  ↓
GET /api/portal/config-v2?businessId=xxx&simulateDay=martes
  ↓
API filtra por día: martes
  ↓
Retorna SOLO banners/promociones de martes
  ↓
Vista previa se actualiza con contenido de martes ✅
```

## 📦 Archivos Modificados

1. ✅ `src/app/api/portal/config-v2/route.ts`
   - Agregado parámetro `simulateDay`
   - Usa día simulado si está presente

2. ✅ `src/components/admin-v2/portal/PortalContentManager.tsx`
   - `loadPreviewData` ahora acepta `simulatedDay` como parámetro
   - Construye URL con `&simulateDay=` si hay día simulado
   - `handleDaySimulation` llama a `loadPreviewData(diaSimulado)`

## 🧪 Testing

### Prueba Manual:

1. **Abrir Admin Panel** → Portal Cliente
2. **Configurar diferentes banners** para diferentes días:
   - Lunes: "Today's Mood"
   - Miércoles: "dfsf"
3. **Hacer clic en botón "L"** (Lunes):
   - ✅ Debería mostrar SOLO el banner "Today's Mood"
   - ✅ Debería mostrar SOLO promociones de lunes
4. **Hacer clic en botón "M"** (Martes):
   - ✅ Debería mostrar paneles VACÍOS (no hay contenido para martes)
5. **Hacer clic en botón "X"** (Miércoles):
   - ✅ Debería mostrar SOLO el banner "dfsf"

### Prueba con Script:

```bash
# Asegúrate de que el servidor esté corriendo
npm run dev

# En otra terminal:
node test-simulate-day-api.js
```

**Salida esperada**:
```
🧪 Probando API con simulación de días...

1️⃣ Sin simulación (día comercial actual):
   ✅ Banners: 0
   ✅ Promociones: 0
   📅 Día comercial: martes

2️⃣ Simulando LUNES:
   ✅ Banners: 1
      - Today's Mood (día: lunes)
   ✅ Promociones: 0

3️⃣ Simulando MARTES:
   ✅ Banners: 0
   ✅ Promociones: 0

4️⃣ Simulando MIÉRCOLES:
   ✅ Banners: 1
      - dfsf (día: miercoles)
   ✅ Promociones: 0
```

## 📊 Logs Esperados

En la consola del navegador:

```javascript
🗓️ Simulando día: miercoles
🔄 Cargando datos de vista previa... {businessId: "xxx", simulatedDay: "miercoles"}
✅ Datos de vista previa cargados: {bannersCount: 1, simulatedDay: "miercoles"}
```

En la consola del servidor:

```javascript
🗓️ Día para filtrar contenido: {
  simulateDay: 'miercoles',
  currentBusinessDay: 'miercoles',
  isSimulated: true
}
```

## 🎉 Beneficios

1. ✅ **Vista previa funcional**: Los administradores pueden ver exactamente qué contenido verán los clientes cada día
2. ✅ **Feedback inmediato**: Al configurar contenido para un día específico, pueden verificarlo al instante
3. ✅ **Sin contenido residual**: Días sin contenido muestran paneles vacíos (correcto)
4. ✅ **Consistente con producción**: La simulación usa la MISMA lógica que el cliente real

## 🔮 Próximos Pasos (Opcionales)

1. **Indicador visual** del día simulado:
   ```tsx
   {simulatedDay && (
     <div className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded text-xs">
       🗓️ Simulando: {simulatedDay}
     </div>
   )}
   ```

2. **Botón "Reset"** para volver al día actual:
   ```tsx
   <button onClick={() => {
     delete window.portalPreviewDay;
     loadPreviewData();
   }}>
     🔄 Volver a hoy
   </button>
   ```

3. **Persistencia** del día seleccionado en localStorage

---

**Estado**: ✅ IMPLEMENTADO Y LISTO PARA TESTING
**Prioridad**: 🔥 ALTA (Mejora UX del administrador)
**Riesgo**: 🟢 BAJO (Solo afecta vista previa, no producción)
