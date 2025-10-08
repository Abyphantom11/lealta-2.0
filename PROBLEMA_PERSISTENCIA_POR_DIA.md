# 🐛 PROBLEMA: Persistencia por Día no Funciona Correctamente

## 📋 Descripción del Problema

Los banners, promociones y favorito del día **NO se actualizan automáticamente** cuando cambia el día comercial.

### Síntomas:
- ✅ **Lunes**: Guardo un banner para el lunes → Se muestra correctamente
- ❌ **Martes 00:00**: El banner del lunes sigue apareciendo
- ❌ **Martes 04:00**: (Hora de reseteo) El banner del lunes AÚN sigue apareciendo
- ❌ El banner del martes NO aparece aunque esté configurado

## 🔍 Análisis del Problema

### 1. **Base de Datos: Estructura Correcta** ✅
```typescript
// portalFavoritoDelDia
{
  id: string
  businessId: string
  productName: string
  date: DateTime  // ✅ Fecha del día
  active: boolean
  ...
}
```

### 2. **API Query: PROBLEMA IDENTIFICADO** ❌

```typescript
// src/app/api/portal/config-v2/route.ts (línea 115-125)
prisma.portalFavoritoDelDia.findFirst({
  where: {
    businessId,
    active: true,
    // ❌ PROBLEMA: Este query se ejecuta UNA VEZ y usa la fecha de ESE momento
    ...(await getBusinessDayRange(businessId).then(({ start, end }) => ({
      date: {
        gte: start,  // Ejemplo: 2025-10-07 04:00:00
        lte: end     // Ejemplo: 2025-10-08 03:59:59
      }
    })))
  }
})
```

**¿Por qué falla?**
- ✅ El query **en sí mismo** está bien construido
- ❌ El problema es que se ejecuta **solo cuando el cliente hace fetch**
- ❌ Si el fetch se hace a las 23:00 del lunes, trae datos del lunes
- ❌ A las 00:00 del martes, el **cliente NO vuelve a hacer fetch automáticamente**
- ❌ El hook `useAutoRefreshPortalConfig` sí hace polling cada 10-30 segundos
- ❌ **PERO** el contenido en cache del navegador puede prevenir el fetch real

### 3. **Cliente: Hook con Auto-Refresh** ⚠️ PARCIAL

```typescript
// src/hooks/useAutoRefreshPortalConfig.ts
const { getBanners, getFavoritoDelDia, getPromociones } = useAutoRefreshPortalConfig({
  businessId,
  refreshInterval: 10000, // ✅ Polling cada 10 segundos
  enabled: true
});
```

**Problemas:**
1. ✅ El polling funciona
2. ❌ **Pero** el fetch puede estar cacheado por el navegador
3. ❌ Los headers `Cache-Control` pueden no ser suficientes
4. ❌ Service Workers pueden cachear las respuestas

### 4. **localStorage: NO es el problema** ✅

El localStorage **NO almacena** los banners/promociones/favorito del día por fecha.
Solo cachea:
- Branding (colores, nombre)
- Configuración de notificaciones
- Sesión del cliente

## 🎯 Causa Raíz

```
📱 CLIENTE                    🌐 API                      🗄️ BASE DE DATOS
    |                            |                              |
    | fetch(/api/portal/config-v2)                             |
    |--------------------------->|                              |
    |                            | Query con date >= start     |
    |                            |----------------------------->|
    |                            |                              |
    |                            |<-- Retorna datos del LUNES   |
    |<-- Respuesta cacheada     |                              |
    |                            |                              |
    | 🕐 Martes 00:00 AM         |                              |
    | ⚠️ PROBLEMA: No hace fetch |                              |
    | Usa datos cacheados        |                              |
    |                            |                              |
    | 🕐 Martes 04:00 AM         |                              |
    | (hora de reseteo)          |                              |
    | ⚠️ PROBLEMA: Aún usa cache |                              |
    |                            |                              |
    | 🔄 Polling (10 seg)        |                              |
    | fetch() con cache=no-store |                              |
    | ❌ Navegador ignora header |                              |
    | Retorna respuesta cached   |                              |
```

## 🔧 Soluciones Propuestas

### Solución 1: **Force Cache Bust con Timestamp Mejorado** ⭐ RECOMENDADO

Agregar lógica de detección de cambio de día en el cliente:

```typescript
// src/hooks/useAutoRefreshPortalConfig.ts

const [lastFetchDay, setLastFetchDay] = useState<string>('');

const getCurrentBusinessDay = () => {
  const now = new Date();
  const hour = now.getHours();
  
  // Si es antes de las 4 AM, es el día anterior
  if (hour < 4) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toDateString();
  }
  
  return now.toDateString();
};

const fetchConfig = useCallback(async (showLoading = true) => {
  const currentDay = getCurrentBusinessDay();
  
  // ✅ Si cambió el día, forzar fetch fresco
  const bustCache = currentDay !== lastFetchDay;
  
  const timestamp = Date.now();
  const response = await fetch(
    `/api/portal/config-v2?businessId=${businessId}&t=${timestamp}&bustCache=${bustCache}`,
    {
      cache: bustCache ? 'reload' : 'no-store', // ✅ Force reload en cambio de día
      headers: {
        'Cache-Control': bustCache ? 'no-cache, must-revalidate' : 'no-cache',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    }
  );
  
  if (response.ok) {
    setLastFetchDay(currentDay); // ✅ Actualizar día del último fetch
    // ... resto del código
  }
}, [businessId, lastFetchDay]);
```

### Solución 2: **Verificación Adicional en el Backend**

Agregar validación de frescura en la respuesta:

```typescript
// src/app/api/portal/config-v2/route.ts

export async function GET(request: NextRequest) {
  const businessDayInfo = await getBusinessDayDebugInfo(businessId);
  
  // ... query existing ...
  
  return NextResponse.json({
    ...config,
    _metadata: {
      businessDay: businessDayInfo.businessDay,
      fetchedAt: new Date().toISOString(),
      validUntil: businessDayInfo.businessDayRange.end, // ✅ Cuándo expira
      resetHour: businessDayInfo.config.resetHour
    }
  }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    }
  });
}
```

### Solución 3: **Event Listener para Cambio de Día**

Agregar listener que detecta el cambio de día:

```typescript
// src/hooks/useDayChangeDetector.ts

export const useDayChangeDetector = (onDayChange: () => void) => {
  useEffect(() => {
    const checkDayChange = () => {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      
      // Detectar si estamos en la hora de reseteo (4:00 AM)
      if (hour === 4 && minute === 0) {
        console.log('🔄 Cambio de día detectado, refrescando datos...');
        onDayChange();
      }
    };
    
    // Verificar cada minuto
    const interval = setInterval(checkDayChange, 60000);
    
    return () => clearInterval(interval);
  }, [onDayChange]);
};
```

## ✅ Plan de Implementación

1. **Inmediato** (5 minutos):
   - Agregar detección de cambio de día en `useAutoRefreshPortalConfig`
   - Forzar `cache: 'reload'` cuando cambia el día

2. **Corto Plazo** (15 minutos):
   - Agregar metadata con `validUntil` en la respuesta de la API
   - Implementar hook `useDayChangeDetector`

3. **Mediano Plazo** (30 minutos):
   - Testing exhaustivo de cambio de día
   - Verificar con diferentes timezones

## 🧪 Testing

```typescript
// Test manual:
1. Configurar un banner para "lunes"
2. Cambiar la hora del sistema a lunes 23:00
3. ✅ Verificar que aparece el banner
4. Cambiar la hora del sistema a martes 00:00
5. ❌ Verificar que DESAPARECE el banner (actualmente falla)
6. Cambiar la hora del sistema a martes 04:00 (hora de reseteo)
7. ❌ Verificar que NO aparece el banner del lunes (actualmente falla)
8. Configurar un banner para "martes"
9. ✅ Verificar que aparece el banner del martes
```

## 📊 Componentes Afectados

1. ✅ **Banners** (`BannersSection.tsx`)
2. ✅ **Promociones** (`PromocionesSection.tsx`)
3. ✅ **Favorito del Día** (`FavoritoDelDiaSection.tsx`)

Todos usan el mismo hook `useAutoRefreshPortalConfig`.
