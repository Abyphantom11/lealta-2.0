# 🔍 ANÁLISIS CRÍTICO: Lógica de Actualización Diaria (Banners, Promociones, Favoritos)

## 📋 RESUMEN EJECUTIVO

Después de analizar el código, he identificado **múltiples inconsistencias** y **lógicas conflictivas** en el sistema de actualización diaria para banners, promociones y favoritos del día. El sistema tiene implementaciones dispersas que no siguen un patrón unificado.

## 🚨 PROBLEMAS CRÍTICOS IDENTIFICADOS

### 1. **INCONSISTENCIA EN HORARIOS DE RESETEO**

#### 🎯 **Banners**
- ✅ **Hora por defecto**: `04:00` (4:00 AM)
- ✅ **Campo**: `horaPublicacion`
- ✅ **Lógica**: Se publican a partir de la hora especificada
- ❌ **Problema**: No hay lógica de "fin" automática

```tsx
// BannersManager.tsx - línea 45, 150
horaPublicacion: bannerPorDia?.horaPublicacion || '04:00'
```

#### 🎯 **Promociones**
- ✅ **Hora por defecto**: `04:00` (4:00 AM)
- ✅ **Campo**: `horaTermino`
- ✅ **Lógica**: Terminan a la hora especificada del **día siguiente**
- ⚠️ **Comportamiento especial**: Si `horaTermino < 6:00`, se interpreta como día siguiente

```tsx
// PromocionesManager.tsx - línea 45
horaTermino: '04:00'

// test-nueva-logica.js - línea 28-30
if (horas < 6) {
  horaTermino += 24 * 60; // Agregar 24 horas
}
```

#### 🎯 **Favorito del Día**
- ✅ **Hora por defecto**: `09:00` (9:00 AM)
- ✅ **Campo**: `horaPublicacion`
- ✅ **Lógica**: Se publican a partir de la hora especificada
- ❌ **Inconsistencia**: Diferente hora por defecto que banners

```tsx
// FavoritoDelDiaManager.tsx - línea 139
horaPublicacion: '09:00'
```

### 2. **MÚLTIPLES SISTEMAS DE DÍA COMERCIAL**

#### 🔄 **Sistema Principal**: `business-day-utils.ts`
- ✅ Hora de reseteo configurable por negocio
- ✅ Por defecto: 4:00 AM
- ✅ Lógica centralizada
- ❌ **Problema**: No se usa consistentemente en todos los componentes

#### 🔄 **Sistema Manual**: Lógica dispersa en componentes
- ❌ Cada componente calcula el día a su manera
- ❌ Horarios hardcodeados diferentes
- ❌ No hay sincronización entre componentes

### 3. **LÓGICAS CONFLICTIVAS DE FILTRADO**

#### 📅 **Banners** (`BannersSection.tsx`)
```tsx
// Filtro de hora de publicación
if (b.horaPublicacion) {
  const [horas, minutos] = b.horaPublicacion.split(':').map(Number);
  const horaPublicacion = horas * 60 + minutos;
  return horaActualMinutos >= horaPublicacion; // ✅ Después de hora de publicación
}
```

#### 🎁 **Promociones** (`PromocionesSection.tsx`)
```tsx
// Lógica de extensión a día siguiente
if (p.horaTermino) {
  const [horas, minutos] = p.horaTermino.split(':').map(Number);
  const horaTermino = horas * 60 + minutos;
  return horaActual < horaTermino; // ✅ Antes de hora de término
}
```

#### ⭐ **Favoritos** (`FavoritoDelDiaSection.tsx`)
```tsx
// Sin lógica de horarios específica
const favoritoHoy = favoritos.find(f => f.dia === diaActual);
```

## 🎯 COMPORTAMIENTOS ACTUALES DOCUMENTADOS

### 📊 **Escenario de Prueba: Lunes → Martes**

| Hora | Banner (Lunes) | Promoción (Lunes) | Favorito (Lunes) |
|------|----------------|-------------------|------------------|
| **Lunes 23:59** | ✅ Visible | ✅ Visible | ✅ Visible |
| **Martes 00:00** | ✅ Visible | ✅ Visible | ❌ Desaparece |
| **Martes 03:59** | ✅ Visible | ✅ Visible | ❌ No visible |
| **Martes 04:00** | ❌ Desaparece | ❌ Desaparece | ❌ No visible |
| **Martes 04:01** | ✅ Banner del martes aparece | ❌ No hay promoción | ❌ No visible |
| **Martes 09:00** | ✅ Banner del martes | ❌ No hay promoción | ✅ Favorito del martes aparece |

### 🔍 **Análisis del Comportamiento**

1. **Favoritos cambian a medianoche** (comportamiento incorrecto)
2. **Banners y promociones respetan horario comercial** hasta las 4:00 AM
3. **Favoritos tienen horario diferente** (9:00 AM por defecto)
4. **No hay sincronización** entre componentes

## 🛠️ RECOMENDACIONES DE MEJORA

### 1. **UNIFICAR SISTEMA DE DÍA COMERCIAL**
- ✅ Usar `business-day-utils.ts` en **todos** los componentes
- ✅ Hora de reseteo configurable por negocio
- ✅ Default unificado: 4:00 AM

### 2. **ESTANDARIZAR CAMPOS Y COMPORTAMIENTOS**
```typescript
interface ComponenteDiario {
  dia: DayOfWeek;
  horaInicio?: string;    // Cuándo aparece (default: hora de reseteo)
  horaTermino?: string;   // Cuándo desaparece (default: próximo reseteo)
  activo: boolean;
}
```

### 3. **CENTRALIZAR LÓGICA DE FILTRADO**
```typescript
// Función unificada para todos los componentes
function esVisibleEnDiaComercial(
  item: ComponenteDiario, 
  diaComercial: DayOfWeek, 
  horaActual: number
): boolean {
  // Lógica unificada aquí
}
```

### 4. **SINCRONIZACIÓN AUTOMÁTICA**
- ✅ Hook unificado que detecte cambios de día comercial
- ✅ Evento global cuando cambia el día comercial
- ✅ Refresco automático de todos los componentes

## 📝 CONCLUSIÓN

El sistema actual tiene **lógicas fragmentadas** que causan comportamientos inconsistentes. Es necesario:

1. **Refactorizar** para usar un sistema unificado
2. **Estandarizar** horarios y comportamientos
3. **Centralizar** la lógica de día comercial
4. **Implementar** sincronización automática entre componentes

**Prioridad**: 🔥 **ALTA** - Afecta la experiencia del usuario y puede causar confusión en el negocio.

---
*Análisis realizado el: ${new Date().toLocaleString()}*
