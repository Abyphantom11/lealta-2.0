# 📱 PLAN: Optimización Móvil del Sistema de Reservas

## 🎯 Objetivo

Optimizar la interfaz del módulo de reservas para dispositivos móviles, garantizando:
- ✅ Elementos de tamaño adecuado (mínimo 44px de altura para touch)
- ✅ Textos legibles sin zoom (mínimo 16px)
- ✅ Componentes que se ajusten al viewport
- ✅ Navegación intuitiva en pantallas pequeñas
- ✅ Performance óptima en redes móviles

## 📊 Breakpoints de Referencia

```css
/* Mobile First */
xs: 320px - 639px   (Smartphones)
sm: 640px - 767px   (Smartphones grandes)
md: 768px - 1023px  (Tablets)
lg: 1024px - 1279px (Tablets landscape / Desktop pequeño)
xl: 1280px+         (Desktop)
```

## 🔍 Componentes a Optimizar

### 1. **AIReservationModal.tsx** (PRIORIDAD ALTA)

**Problemas:**
- Modal ocupa demasiado espacio vertical
- Grid 2 columnas muy estrecho en móvil
- Botones pequeños para touch
- Scroll interno confuso

**Soluciones:**
```typescript
// Cambiar grid responsivo
className="grid grid-cols-1 sm:grid-cols-2 gap-4"

// Modal responsive
className="sm:max-w-[600px] w-full max-w-[95vw] max-h-[90vh]"

// Botones táctiles
className="h-12 text-base" // Mínimo 48px

// Padding ajustado
className="p-4 sm:p-6"
```

### 2. **Header.tsx** (PRIORIDAD ALTA)

**Problemas:**
- Botones muy juntos en móvil
- Texto pequeño
- Difícil presionar el botón correcto

**Soluciones:**
```typescript
// Layout móvil mejorado
<div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
  <Button className="w-full sm:w-auto h-12 text-base">
    Nueva Reserva
  </Button>
  <Button className="w-full sm:w-auto h-12 text-base">
    ✨ Reserva IA
  </Button>
</div>
```

### 3. **ReservationTable.tsx** (PRIORIDAD MEDIA)

**Problemas:**
- Tabla con scroll horizontal en móvil
- Columnas muy estrechas
- Acciones difíciles de presionar

**Soluciones:**
```typescript
// Vista móvil: Cambiar a cards
const MobileCard = ({ reserva }) => (
  <div className="bg-white rounded-lg shadow p-4 space-y-3">
    <div className="flex justify-between">
      <h3 className="font-semibold text-lg">{reserva.cliente}</h3>
      <Badge>{reserva.estado}</Badge>
    </div>
    <div className="text-sm text-gray-600 space-y-1">
      <p>📅 {reserva.fecha} - {reserva.hora}</p>
      <p>👤 {reserva.personas} personas</p>
      <p>🎫 Mesa {reserva.mesa}</p>
    </div>
    <div className="flex gap-2">
      <Button className="flex-1 h-11">Ver</Button>
      <Button className="flex-1 h-11">Editar</Button>
    </div>
  </div>
);

// Detectar móvil
const isMobile = useMediaQuery('(max-width: 768px)');
return isMobile ? <MobileView /> : <TableView />;
```

### 4. **ReservationForm.tsx** (PRIORIDAD MEDIA)

**Problemas:**
- Inputs muy juntos
- Labels difíciles de leer
- Pickers nativos mal adaptados

**Soluciones:**
```typescript
// Inputs más grandes
<Input className="h-12 text-base" />

// Labels más claros
<Label className="text-base font-medium mb-2" />

// Grid adaptativo
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"

// Bottom sheet en lugar de modal
import { Sheet, SheetContent } from "@/components/ui/sheet";
```

### 5. **DashboardStats.tsx** (PRIORIDAD BAJA)

**Problemas:**
- Tarjetas muy pequeñas en móvil
- Números difíciles de leer

**Soluciones:**
```typescript
// Grid adaptativo
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"

// Tarjetas más grandes en móvil
<div className="p-6 sm:p-4">
  <p className="text-3xl sm:text-2xl font-bold">{stat.value}</p>
  <p className="text-base sm:text-sm">{stat.label}</p>
</div>
```

### 6. **QRScannerClean.tsx** (PRIORIDAD BAJA)

**Problemas:**
- Cámara no aprovecha toda la pantalla
- Botones de control pequeños

**Soluciones:**
```typescript
// Fullscreen en móvil
className="fixed inset-0 z-50 bg-black"

// Video adaptativo
<video className="w-full h-full object-cover" />

// Botones grandes
<Button className="h-14 w-14 rounded-full" />
```

## 🛠️ Implementación por Fases

### FASE 1: Modal IA y Header (1-2 horas)
```
✅ AIReservationModal.tsx
  - Grid 1 columna en móvil
  - Botones h-12 full-width
  - Padding reducido
  - Max-width 95vw

✅ Header.tsx
  - Stack vertical en móvil
  - Botones full-width
  - Texto más grande
  - Gap consistente
```

### FASE 2: Tabla de Reservas (2-3 horas)
```
✅ ReservationTable.tsx
  - Hook useMediaQuery
  - MobileCard component
  - Transición suave
  - Swipe actions (opcional)

✅ ReservationCard.tsx
  - Optimizar para touch
  - Botones más grandes
  - Información clara
```

### FASE 3: Formularios (1-2 horas)
```
✅ ReservationForm.tsx
  - Inputs h-12
  - Grid 1 columna en móvil
  - Labels más grandes
  - Bottom sheet en móvil

✅ CedulaSearch.tsx
  - Input más grande
  - Results dropdown adaptativo
```

### FASE 4: Dashboard y Stats (1 hora)
```
✅ DashboardStats.tsx
  - Grid 1 columna en móvil
  - Tarjetas más grandes
  - Números legibles

✅ ReportsGenerator.tsx
  - Formulario adaptativo
  - Botones grandes
```

### FASE 5: Scanner QR (30 min - opcional)
```
✅ QRScannerClean.tsx
  - Fullscreen en móvil
  - Controles táctiles
  - Vibración al escanear
```

## 📐 Utilidades Helper

### Hook useMediaQuery
```typescript
// src/hooks/useMediaQuery.ts
import { useState, useEffect } from 'react';

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}
```

### Breakpoint Constants
```typescript
// src/utils/breakpoints.ts
export const BREAKPOINTS = {
  xs: 320,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

export const QUERIES = {
  mobile: '(max-width: 767px)',
  tablet: '(min-width: 768px) and (max-width: 1023px)',
  desktop: '(min-width: 1024px)',
} as const;
```

## ✅ Checklist de Testing

### Dispositivos de Prueba
- [ ] iPhone SE (375x667)
- [ ] iPhone 12/13 (390x844)
- [ ] iPhone 14 Pro Max (430x932)
- [ ] Samsung Galaxy S21 (360x800)
- [ ] Google Pixel 5 (393x851)
- [ ] iPad Mini (768x1024)
- [ ] iPad Pro (1024x1366)

### Aspectos a Validar
- [ ] Todos los textos legibles sin zoom
- [ ] Botones mínimo 44x44px
- [ ] Inputs mínimo 48px de altura
- [ ] Sin scroll horizontal no deseado
- [ ] Modales/sheets no cortados
- [ ] Touch targets bien espaciados (mín 8px gap)
- [ ] Transiciones suaves
- [ ] Performance fluida (60fps)
- [ ] Carga rápida de componentes

## 🎨 Componentes UI Necesarios

### Sheet (Bottom Drawer)
```bash
npx shadcn-ui@latest add sheet
```

### Dialog Responsive
```bash
# Ya instalado, ajustar estilos
```

### Drawer para Tablet
```bash
npx shadcn-ui@latest add drawer
```

## 📊 Métricas de Éxito

- ✅ Touch targets > 44px (WCAG AAA)
- ✅ Textos > 16px (legibilidad)
- ✅ Modal no requiere zoom
- ✅ Formularios en 1 columna en móvil
- ✅ Tabla se convierte a cards
- ✅ Carga < 3s en 3G
- ✅ 0 scroll horizontal
- ✅ Lighthouse Mobile > 90

## 🚀 Próxima Acción

**Comenzar con FASE 1:**
1. Optimizar AIReservationModal.tsx
2. Optimizar Header.tsx
3. Testing en DevTools responsive mode
4. Commit: "feat(mobile): optimiza Modal IA y Header"

---

**Ready to start!** 📱✨
