# 🎨 PROMPT MEJORADO PARA FIGMA - MENUNU DASHBOARD

## 🎯 Contexto de Mejora

**Objetivo:** Transformar el diseño actual de Menunu (que está "plano y no optimizado para teléfono") incorporando las mejores prácticas del dashboard cliente de Lealta, con énfasis en:
- 📱 Diseño mobile-first con interacciones táctiles fluidas
- 🌓 Modo claro/oscuro completamente personalizable por negocio
- 🎨 Estética moderna con rosa coral (#ff6b9d), degradados (gradients) y efectos glassmorphism
- 🎭 UI llamativa con microinteracciones y animaciones
- 📊 Estructura tipo menú con banners, promociones, favoritos y despliegue de menú

---

## 🏗️ ARQUITECTURA DE COMPONENTES (Inspirada en Lealta)

### 1. **Navbar Superior** (Fija, mejorada)
```
┌─────────────────────────────────────────────────┐
│ ☰  Menunu  |  🌙/☀️ Toggle  |  👤 Mi Negocio   │ ← Glassmorphism
└─────────────────────────────────────────────────┘
```

**Especificaciones Detalladas:**
- **Altura:** 64px (móvil), 72px (desktop)
- **Background:** 
  - Modo Oscuro: `bg-black/95 backdrop-blur-sm border-b border-gray-800`
  - Modo Claro: `bg-white/95 backdrop-blur-sm border-b border-gray-200`
- **Logo/Marca:**
  - Texto "Menunu" con fuente Poppins Bold 24px
  - Color personalizable (default: rosa coral #ff6b9d)
  - Ícono de hamburguesa opcional a la izquierda
- **Toggle Modo Oscuro/Claro:**
  - Switch animado tipo iOS (40x24px)
  - Luna 🌙 para oscuro, sol ☀️ para claro
  - Transición suave de 300ms cubic-bezier(0.4, 0, 0.2, 1)
- **Nombre del Negocio:**
  - Truncado con ellipsis si es muy largo
  - Color del texto personalizable
  - Ícono de avatar circular 32x32px
- **Efectos:**
  - Sombra sutil: `shadow-lg`
  - Efecto glassmorphism con blur
  - Sticky position en scroll

**Auto Layout Figma:**
- Direction: Horizontal
- Padding: 16px (móvil), 24px (desktop)
- Gap: 16px
- Alignment: Space between

---

### 2. **Hero Section / Bienvenida** (Degradado Llamativo)
```
┌─────────────────────────────────────────────────┐
│  ╔═══════════════════════════════════════╗      │
│  ║  🎉 ¡Hola, [Nombre del Negocio]!      ║      │ ← Gradiente rosa coral
│  ║  Gestiona tu menú con estilo ✨       ║      │
│  ╚═══════════════════════════════════════╝      │
└─────────────────────────────────────────────────┘
```

**Especificaciones:**
- **Altura:** 120px (móvil), 140px (desktop)
- **Background Gradiente (Modo Oscuro):**
  - `linear-gradient(135deg, #ff6b9d 0%, #c471ed 50%, #f64f59 100%)`
  - Con overlay oscuro: `rgba(0,0,0,0.15)` para mejor contraste de texto
- **Background Gradiente (Modo Claro):**
  - `linear-gradient(135deg, #ffeef5 0%, #f3e7f9 50%, #ffe5e8 100%)`
  - Tonos pastel del rosa coral
- **Texto:**
  - Saludo: Poppins SemiBold 18px (móvil), 22px (desktop)
  - Nombre negocio: Poppins Bold 24px (móvil), 32px (desktop) con color personalizable
  - Subtítulo: DM Sans Regular 14px con opacity 0.9
- **Elementos Decorativos:**
  - Confetti icons (🎉✨) con animación sutil rotate/scale
  - Patrón de puntos difuminado en esquinas
- **Border Radius:** 0 (ocupa todo el ancho)

---

### 3. **Banners Carrusel** (Estilo Lealta Mejorado)
```
┌─────────────────────────────────────────────────┐
│  📢 BANNERS DEL DÍA                             │
│  ┌───────────────────────────────────────────┐  │
│  │  [Imagen Banner con overlay gradiente]   │  │ ← Carrusel swipe
│  │  "Promoción Especial"                     │  │
│  │  • • ○ (Indicadores)                      │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

**Especificaciones:**
- **Contenedor:**
  - Padding horizontal: 16px
  - Gap entre banners: 12px
  - Scroll horizontal con snap (CSS scroll-snap-type: x mandatory)
- **Card de Banner:**
  - Dimensiones: 100% width x 180px height (móvil), 320px x 200px (tablet/desktop)
  - Border radius: 20px
  - Overflow: hidden para imagen
  - Background: imagen con overlay `linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 70%)`
- **Overlay de Información:**
  - Posición: absolute bottom-0 left-0 right-0
  - Padding: 16px
  - Título: Poppins SemiBold 18px, color white
  - Descripción: DM Sans Regular 14px, color white/80
  - Chip de día: `bg-white/20 backdrop-blur px-2 py-1 rounded-full text-xs`
- **Indicadores de Página:**
  - Dots de 6px (inactivo) y 8px (activo)
  - Color: white/40 (inactivo), rosa coral (activo)
  - Gap: 6px
- **Interacción:**
  - Hover: scale(1.02) transform con transition 200ms
  - Click: Modal expandido (ver Modal de Banner abajo)

**Auto Layout Figma:**
- Direction: Horizontal (carrusel)
- Padding: 0px
- Gap: 12px
- Width: Fill container

---

### 4. **Promociones Grid** (Cards Modernas)
```
┌─────────────────────────────────────────────────┐
│  🎁 PROMOCIONES ACTIVAS                         │
│  ┌─────────────┐  ┌─────────────┐              │
│  │ 20% OFF     │  │ 2x1 Bebidas │              │ ← Grid 2 columnas
│  │ [Imagen]    │  │ [Imagen]    │              │
│  │ ⭐⭐⭐⭐    │  │ ⭐⭐⭐⭐⭐  │              │
│  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────┘
```

**Especificaciones:**
- **Grid Layout:**
  - 2 columnas en móvil (< 768px)
  - 3 columnas en tablet (768-1024px)
  - 4 columnas en desktop (> 1024px)
  - Gap: 16px entre cards
- **Card de Promoción:**
  - Aspect ratio: 1:1.2 (más alto que ancho)
  - Border radius: 16px
  - Background (Modo Oscuro): `bg-gray-800/50 backdrop-blur`
  - Background (Modo Claro): `bg-white shadow-md`
  - Border: 1px solid (gray-700 oscuro, gray-200 claro)
  - Padding: 12px
- **Imagen de Promoción:**
  - Aspect ratio: 4:3
  - Border radius: 12px
  - Object fit: cover
  - Lazy loading placeholder con shimmer effect
- **Badge de Descuento:**
  - Posición: absolute top-2 right-2
  - Background: `bg-gradient-to-r from-red-500 to-pink-500`
  - Texto: Poppins Bold 14px, color white
  - Padding: 4px 8px
  - Border radius: 8px
  - Sombra: `shadow-lg`
- **Información:**
  - Título: Poppins SemiBold 14px, 2 líneas max con ellipsis
  - Descripción: DM Sans Regular 12px, 3 líneas max
  - Rating: Estrellas 12px con color amarillo (#fbbf24)
- **Hover State:**
  - Transform: translateY(-4px) scale(1.02)
  - Shadow: shadow-2xl
  - Transition: all 250ms ease-out

**Auto Layout Figma:**
- Direction: Horizontal wrap
- Padding: 16px
- Gap: 16px
- Min width per card: 150px (móvil), 180px (desktop)

---

### 5. **Favorito del Día** (Destacado con Estrella)
```
┌─────────────────────────────────────────────────┐
│  ⭐ FAVORITO DEL DÍA                            │
│  ┌───────────────────────────────────────────┐  │
│  │  [Imagen grande con badge "FAVORITO"]    │  │ ← Card especial
│  │  "Hamburguesa Premium"                    │  │
│  │  $12.99  |  ⭐ 4.8 (120 reviews)          │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

**Especificaciones:**
- **Contenedor:**
  - Full width con padding 16px
  - Única card destacada (no grid)
- **Card Favorito:**
  - Border radius: 24px (más redondeado que otros)
  - Background (Modo Oscuro): `bg-gradient-to-br from-yellow-900/30 to-orange-900/30 backdrop-blur`
  - Background (Modo Claro): `bg-gradient-to-br from-yellow-50 to-orange-50`
  - Border: 2px solid con gradiente dorado (#fbbf24 to #f59e0b)
  - Padding: 0 (imagen full width en top)
  - Box shadow: `shadow-2xl` con tinte amarillo
- **Imagen:**
  - Height: 200px (móvil), 280px (desktop)
  - Object fit: cover
  - Border radius: 24px 24px 0 0 (solo esquinas superiores)
  - Overlay gradiente: `linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)`
- **Badge "FAVORITO":**
  - Posición: absolute top-4 left-4
  - Background: `bg-yellow-400 text-black`
  - Texto: Poppins Bold 12px uppercase
  - Padding: 6px 12px
  - Border radius: 20px
  - Ícono estrella antes del texto
  - Animación: pulse sutil cada 2s
- **Información Producto (Overlay en Imagen):**
  - Posición: absolute bottom-0 padding 20px
  - Nombre: Poppins Bold 22px, color white con text-shadow
  - Precio: Poppins SemiBold 28px, color rosa coral
  - Rating: DM Sans Regular 14px con estrellas
- **CTA Button:**
  - "Ver Detalles" o "Agregar al Menú"
  - Full width con margin 16px
  - Background: `bg-gradient-to-r from-pink-500 to-rose-500`
  - Padding: 14px
  - Border radius: 12px
  - Texto: Poppins SemiBold 16px, color white
  - Hover: brightness(1.1) scale(1.02)

---

### 6. **Menú Principal (Accordion/Desplegable)**
```
┌─────────────────────────────────────────────────┐
│  🍽️ NUESTRO MENÚ                                │
│  ┌───────────────────────────────────────────┐  │
│  │ ▼ Entradas (12 items)          [Editar]  │  │ ← Accordion
│  │   • Ensalada César             $8.99     │  │
│  │   • Nachos Supreme             $10.50    │  │
│  └───────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────┐  │
│  │ ▶ Platos Fuertes (18 items)    [Editar]  │  │
│  └───────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────┐  │
│  │ ▶ Bebidas (9 items)            [Editar]  │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

**Especificaciones:**
- **Categoría Header (Collapsed):**
  - Height: 60px
  - Background (Modo Oscuro): `bg-gray-800/80 backdrop-blur hover:bg-gray-700/80`
  - Background (Modo Claro): `bg-white hover:bg-gray-50`
  - Border radius: 16px
  - Border: 1px solid (gray-700 oscuro, gray-200 claro)
  - Padding: 16px 20px
  - Margin bottom: 12px
  - Cursor: pointer
  - Transition: all 200ms
- **Header Content:**
  - Ícono chevron: 20x20px, rotación animada 180deg al expandir
  - Emoji de categoría: 24px (🍽️🥗🍔🍕🍰🍹)
  - Nombre categoría: Poppins SemiBold 18px
  - Contador items: DM Sans Regular 14px, opacity 0.6, entre paréntesis
  - Botón "Editar": 
    - Posición: absolute right
    - Padding: 6px 12px
    - Background: rosa coral/10 hover:rosa coral/20
    - Border radius: 8px
    - Texto: DM Sans Medium 14px
- **Items List (Expanded):**
  - Background: Continúa del header pero con opacity 0.5
  - Padding: 0 20px 16px 20px
  - Border radius: 0 0 16px 16px (solo abajo)
  - Max height: 400px con scroll si excede
  - Animación expand: height 0 → auto con easing cubic-bezier
- **Item de Producto:**
  - Layout: Grid 3 columnas (imagen | info | precio)
  - Height: 72px
  - Padding: 8px 0
  - Border bottom: 1px solid gray-700/30 (último sin borde)
- **Miniatura Imagen:**
  - Size: 56x56px
  - Border radius: 12px
  - Object fit: cover
  - Placeholder: Shimmer gray si no hay imagen
- **Info Producto:**
  - Nombre: DM Sans Medium 15px, 1 línea con ellipsis
  - Descripción: DM Sans Regular 13px, opacity 0.7, 2 líneas max
  - Tags: Pills pequeños (ej: "Vegano", "Sin gluten") 10px con bg-green-500/20
- **Precio:**
  - Texto: Poppins SemiBold 16px
  - Color: rosa coral (personalizable)
  - Alineación: center vertical, right horizontal
- **Hover State Item:**
  - Background: gray-700/20 (oscuro), gray-100 (claro)
  - Cursor: pointer
  - Transform: translateX(4px)
  - Transition: 150ms

**Auto Layout Figma:**
- Direction: Vertical
- Padding: 16px
- Gap: 0px (spacing manual con margin)
- Width: Fill container

---

### 7. **Búsqueda Global** (Drawer Deslizante)
```
┌─────────────────────────────────────────────────┐
│  🔍 Buscar productos...          [X]            │ ← Input flotante
└─────────────────────────────────────────────────┘
     ↓ (al escribir, aparece drawer desde arriba)
┌─────────────────────────────────────────────────┐
│  Resultados para "pizza":                       │
│  ┌─────────────────────────────────────────┐    │
│  │ [img] Pizza Margherita      $15.99     │    │
│  │ [img] Pizza Pepperoni       $17.50     │    │
│  └─────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
```

**Especificaciones:**
- **Input de Búsqueda:**
  - Position: sticky top-64px (bajo navbar)
  - Width: calc(100% - 32px) con margin 16px
  - Height: 48px
  - Background (Modo Oscuro): `bg-gray-800 border-gray-600`
  - Background (Modo Claro): `bg-white border-gray-300 shadow-md`
  - Border radius: 24px (pill shape)
  - Padding: 0 16px 0 48px (espacio para ícono)
  - Font: DM Sans Regular 15px
  - Placeholder: "Buscar productos..." con opacity 0.5
- **Ícono Lupa:**
  - Position: absolute left-16px
  - Size: 20x20px
  - Color: gray-400
- **Botón Cerrar (X):**
  - Position: absolute right-12px
  - Size: 20x20px
  - Solo visible cuando hay texto
  - Animación: fadeIn 150ms
- **Drawer de Resultados:**
  - Position: fixed top-0 (overlay completo)
  - Background: black/60 (oscuro), black/40 (claro) con backdrop-blur-md
  - Z-index: 40
  - Click outside cierra el drawer
- **Contenido Resultados:**
  - Background: Mismo del body
  - Max height: 80vh
  - Overflow: scroll
  - Border radius: 0 0 24px 24px
  - Padding: 80px 16px 16px (espacio para header sticky)
- **Item de Resultado:**
  - Layout: Horizontal (imagen | info | precio)
  - Height: 80px
  - Background: gray-800/50 hover:gray-700/50 (oscuro)
  - Border radius: 12px
  - Padding: 12px
  - Margin bottom: 8px
  - Cursor: pointer
- **Animación Entrada Drawer:**
  - Transform: translateY(-100%) → translateY(0)
  - Transition: 300ms cubic-bezier(0.4, 0, 0.2, 1)
- **Estado Vacío:**
  - Mensaje: "No se encontraron productos 😔"
  - Ilustración: Lupa con tache
  - Sugerencias: "Intenta con otros términos"

---

### 8. **Bottom Navigation** (Mobile)
```
┌─────────────────────────────────────────────────┐
│  🏠 Inicio  |  📊 Stats  |  ➕ Nuevo  |  ⚙️   │ ← Sticky bottom
└─────────────────────────────────────────────────┘
```

**Especificaciones:**
- **Contenedor:**
  - Position: fixed bottom-0
  - Width: 100%
  - Height: 68px (con safe area inset)
  - Background (Modo Oscuro): `bg-black/95 backdrop-blur border-t border-gray-800`
  - Background (Modo Claro): `bg-white/95 backdrop-blur border-t border-gray-200 shadow-2xl`
  - Z-index: 50
  - Safe area inset: padding-bottom env(safe-area-inset-bottom)
- **Items (4-5 máximo):**
  - Layout: Horizontal distribuido equitativamente
  - Padding: 8px 0
  - Gap: auto (space-between)
- **Botón Individual:**
  - Size: 56x56px (área táctil)
  - Border radius: 12px
  - Background activo: rosa coral/20
  - Ícono: 24x24px
  - Label: DM Sans Medium 11px
  - Color activo: rosa coral
  - Color inactivo: gray-400
  - Transition: all 200ms
- **Botón Central "Nuevo" (FAB estilo):**
  - Size: 64x64px (más grande)
  - Position: relative top -16px (sobresale del nav)
  - Background: `bg-gradient-to-r from-pink-500 to-rose-500`
  - Border radius: 50% (círculo)
  - Ícono: Plus 28x28px, color white
  - Box shadow: `shadow-2xl` con tinte rosa
  - Hover/Active: scale(1.1) rotate(90deg)
- **Indicador de Tab Activa:**
  - Barra superior de 3px height
  - Color: rosa coral
  - Width: 24px
  - Border radius: 0 0 3px 3px
  - Animación: slide horizontal al cambiar tab

**Auto Layout Figma:**
- Direction: Horizontal
- Padding: 0 16px
- Gap: auto
- Alignment: Center

---

## 🎨 SISTEMA DE PERSONALIZACIÓN (Modo Oscuro/Claro)

### **Variables de Color Personalizables:**

#### **Primarios:**
```css
--primary-color: #ff6b9d (rosa coral) - Botones, enlaces, acentos
--secondary-color: #c471ed (púrpura claro) - Elementos secundarios
--accent-color: #f64f59 (rojo coral) - Llamadas a la acción
```

#### **Modo Oscuro:**
```css
--bg-primary: #0a0a0a (Negro profundo)
--bg-secondary: #1a1a1a (Gris muy oscuro)
--bg-tertiary: #2a2a2a (Gris oscuro)
--text-primary: #ffffff (Blanco puro)
--text-secondary: #9ca3af (Gris claro)
--border-color: #374151 (Gris medio oscuro)
```

#### **Modo Claro:**
```css
--bg-primary: #ffffff (Blanco puro)
--bg-secondary: #f9fafb (Gris muy claro)
--bg-tertiary: #f3f4f6 (Gris claro)
--text-primary: #111827 (Negro suave)
--text-secondary: #6b7280 (Gris medio)
--border-color: #e5e7eb (Gris claro)
```

### **Componentes con Variables en Figma:**
- Crear **Component Set** para cada componente con variantes "Dark" y "Light"
- Usar **Styles** de Figma para colores, tipografía y efectos
- Toggle entre modos debe ser instantáneo (sin animación de transición de color en mockup)
- Todos los degradados deben tener versión clara y oscura

---

## 🎭 EFECTOS VISUALES Y ANIMACIONES

### **Glassmorphism:**
- Background: rgba con transparencia (0.05-0.15 para oscuro, 0.8-0.95 para claro)
- Backdrop filter: blur(12px) saturate(180%)
- Border: 1px solid rgba(255,255,255,0.1) en oscuro, rgba(0,0,0,0.05) en claro
- Uso: Navbar, Cards flotantes, Modals

### **Degradados (Gradients):**
- Banners: 135deg, 3 colores con stops 0%, 50%, 100%
- Botones CTA: Horizontal (90deg), 2 colores
- Fondos de sección: Radial o diagonal (135deg)
- Overlay de imágenes: to top o to bottom con transparencia

### **Sombras (Shadows):**
- **Pequeña:** 0 2px 8px rgba(0,0,0,0.1)
- **Media:** 0 4px 16px rgba(0,0,0,0.15)
- **Grande:** 0 8px 32px rgba(0,0,0,0.2)
- **XL:** 0 12px 48px rgba(0,0,0,0.25) con tinte del color primario
- Modo claro: Reducir opacity en 50%

### **Animaciones a Documentar (No animar en Figma, solo indicar):**
- **Hover Cards:** Transform scale(1.02) + shadow upgrade (250ms ease-out)
- **Accordion Expand:** Height 0 → auto (300ms cubic-bezier(0.4, 0, 0.2, 1))
- **Drawer Slide:** TranslateY/X from edge (300ms ease-out)
- **Button Press:** Scale(0.95) active state (100ms)
- **Skeleton Loading:** Shimmer effect left to right (1.5s infinite)
- **Floating Elements:** TranslateY(-2px → 2px) loop (2s ease-in-out)

### **Microinteracciones:**
- **Like/Favorite:** Heart icon scale + color change
- **Add to Cart:** Botón con checkmark temporal
- **Notifications:** Badge con bounce animation
- **Scroll Progress:** Barra superior que crece con scroll
- **Pull to Refresh:** Spinner circular en top

---

## 📐 RESPONSIVE BREAKPOINTS

### **Mobile (< 768px):**
- Navbar: Logo centrado, hamburger menu
- Banners: 1 columna, swipe horizontal
- Promociones: 2 columnas grid
- Menú: Accordion full width
- Bottom nav: Visible
- Font scale: Base (16px root)

### **Tablet (768px - 1024px):**
- Navbar: Logo izquierda, toggle center, usuario derecha
- Banners: 2 banners visibles, swipe
- Promociones: 3 columnas grid
- Menú: Accordion con sidebar opcional
- Bottom nav: Oculto, nav lateral aparece
- Font scale: 110% (17.6px root)

### **Desktop (> 1024px):**
- Navbar: Expanded con todos los elementos
- Banners: 3 banners visibles, flechas navegación
- Promociones: 4 columnas grid
- Menú: Sidebar fija + contenido central
- Bottom nav: Oculto, nav lateral siempre visible
- Font scale: 125% (20px root)
- Max width: 1280px centrado

---

## 🎨 PALETA DE COLORES COMPLETA (Para Estilos de Figma)

### **Rosa Coral (Principal):**
```
50:  #fff0f5
100: #ffe0eb
200: #ffc7d9
300: #ff9dba
400: #ff6b9d  ← Base
500: #f94283
600: #e6266e
700: #c41a5f
800: #a31853
900: #891a4c
```

### **Púrpura (Secundario):**
```
50:  #faf5ff
100: #f3e8ff
200: #e9d5ff
300: #d8b4fe
400: #c084fc
500: #c471ed  ← Base
600: #a855f7
700: #9333ea
800: #7e22ce
900: #6b21a8
```

### **Grises (Neutral):**
```
50:  #f9fafb
100: #f3f4f6
200: #e5e7eb
300: #d1d5db
400: #9ca3af
500: #6b7280
600: #4b5563
700: #374151
800: #1f2937
900: #111827
950: #0a0a0a
```

### **Semánticos:**
```
Success: #10b981 (Verde)
Warning: #f59e0b (Naranja)
Error: #ef4444 (Rojo)
Info: #3b82f6 (Azul)
```

---

## 🖼️ MODALES Y OVERLAYS

### **Modal de Banner Expandido:**
```
┌─────────────────────────────────────────────────┐
│  [X]                                            │ ← Cerrar
│  ┌─────────────────────────────────────────┐    │
│  │  [Imagen grande full width]            │    │
│  └─────────────────────────────────────────┘    │
│  Promoción Especial                             │
│  Válido del 20 al 27 de Octubre                 │
│  Descripción larga del banner...                │
│  [Botón CTA: "Activar Promoción"]               │
└─────────────────────────────────────────────────┘
```

**Especificaciones:**
- Backdrop: rgba(0,0,0,0.7) con backdrop-blur(8px)
- Modal width: 90% móvil, 500px desktop
- Modal max height: 90vh con scroll
- Background: bg-primary (según modo)
- Border radius: 24px
- Padding: 24px
- Animación entrada: scale(0.9) opacity(0) → scale(1) opacity(1) en 250ms
- Botón cerrar: Posición absolute top-4 right-4, size 32x32px

### **Modal de Producto (Ver Detalles):**
- Similar al banner pero con secciones:
  - Galería de imágenes (swipe horizontal)
  - Nombre + precio + rating
  - Descripción completa
  - Tags de alérgenos
  - Botones: "Editar" | "Eliminar" | "Compartir"

### **Toast Notifications:**
- Position: fixed top-20 right-4 (stack vertical)
- Size: min 300px x 60px
- Background: Según tipo (success verde, error rojo, etc.)
- Border radius: 12px
- Padding: 12px 16px
- Ícono + mensaje + botón cerrar
- Auto-dismiss: 5 segundos con barra de progreso
- Animación: SlideInRight + FadeOut

---

## 📱 INTERACCIONES MÓVILES

### **Gestos Táctiles:**
- **Swipe Left/Right:** Cambiar entre banners, navegar tabs
- **Swipe Down:** Pull to refresh en listas
- **Swipe Up from Bottom:** Abrir menú completo (drawer desde abajo)
- **Long Press:** Opciones contextuales (editar, eliminar)
- **Pinch:** Zoom en imágenes de productos
- **Double Tap:** Like rápido en promociones

### **Feedback Táctil:**
- **Ripple Effect:** En todos los botones y cards clickeables
- **Scale Reduction:** Active state con scale(0.95)
- **Vibración:** Al completar acciones (si API disponible)
- **Color Change:** Hover/active con 10% más brillo

### **Áreas Táctiles:**
- Mínimo 44x44px según guías de accesibilidad
- Spacing entre elementos táctiles: mínimo 8px
- Botones importantes: 56x56px o más

---

## 🎯 COMPONENTES ESPECIALES DE MENUNU

### **Editor de Productos Inline:**
```
┌─────────────────────────────────────────────────┐
│  [Imagen]  Nombre: [Input______]  💾 ❌        │
│            Precio: $[____]                      │
│            Desc: [Textarea__________]           │
└─────────────────────────────────────────────────┘
```
- Aparece al hacer click en "Editar" de un producto
- Background: Mismo del item pero con border rosa coral
- Inputs: Inline editing sin modal
- Botones: Guardar (check verde) y Cancelar (X rojo)

### **Drag & Drop de Categorías:**
- Handle de arrastre (☰ ícono)
- Visual feedback al arrastrar: opacity 0.5 + shadow
- Drop zone indicator: Border dashed rosa coral
- Snap animation al soltar

### **Vista Previa de Menú Público:**
- Botón flotante: "👁️ Vista Cliente"
- Abre drawer desde derecha con preview
- Mismo diseño del menú público de Menunu
- Botón compartir con link único

---

## 🚀 ESTADOS DE LA UI

### **Loading States:**
- **Skeleton Screens:** Placeholders grises con shimmer para cards, texto, imágenes
- **Spinners:** Circular rosa coral para acciones asíncronas
- **Progress Bars:** Horizontal en top para cargas de página
- **Lazy Images:** Blur placeholder → sharp image transition

### **Empty States:**
- **Sin Banners:** Ilustración de megáfono + "Agrega tu primer banner"
- **Sin Promociones:** Ilustración de regalo + CTA "Crear Promoción"
- **Sin Productos:** Ilustración de plato vacío + "Construye tu menú"
- **Búsqueda sin resultados:** Lupa con tache + sugerencias

### **Error States:**
- **Error de Carga:** Mensaje + botón "Reintentar"
- **Error de Conexión:** Ícono WiFi tachado + "Sin conexión"
- **Error de Validación:** Inputs con border rojo + mensaje debajo
- **Error 404:** Ilustración divertida + "Esta página no existe"

---

## ✅ CHECKLIST DE ENTREGA FIGMA

### **Organización del Archivo:**
- [ ] Página 1: Cover con descripción del proyecto
- [ ] Página 2: Design System (colores, tipografía, componentes)
- [ ] Página 3: Mobile Screens (375px width)
- [ ] Página 4: Tablet Screens (768px width)
- [ ] Página 5: Desktop Screens (1440px width)
- [ ] Página 6: Modales y Overlays
- [ ] Página 7: Componentes especiales y variantes

### **Componentes de Figma:**
- [ ] Navbar (variantes: Dark, Light)
- [ ] Hero Section (variantes: Dark, Light)
- [ ] Banner Card (estados: Default, Hover, Expanded)
- [ ] Promoción Card (estados: Default, Hover)
- [ ] Favorito Card (siempre destacado)
- [ ] Categoría Accordion (estados: Collapsed, Expanded)
- [ ] Item de Producto (estados: Default, Hover, Editing)
- [ ] Bottom Navigation (estados: Tab 1-5 activa)
- [ ] Modal Base (variantes: Banner, Producto, Confirmación)
- [ ] Toast Notification (variantes: Success, Warning, Error, Info)
- [ ] Input Field (estados: Default, Focus, Error, Disabled)
- [ ] Button (variantes: Primary, Secondary, Ghost, Destructive)
- [ ] Switch Toggle (estados: On, Off para dark mode)

### **Estilos de Figma:**
- [ ] Color Styles: Todos los colores de la paleta + personalizables
- [ ] Text Styles: Headings (H1-H6), Body (Regular, Medium, Bold), Captions
- [ ] Effect Styles: Shadows (sm, md, lg, xl), Blur (glassmorphism)
- [ ] Grid Styles: 12 columnas (Desktop), 8 columnas (Tablet), 4 columnas (Mobile)

### **Prototipado:**
- [ ] Flow principal: Login → Dashboard → Ver Menú → Editar Producto
- [ ] Transiciones: Smart animate para acordeones y modales
- [ ] Overflow scrolling: En listas largas y drawers
- [ ] Interacciones: Hover states donde aplique

### **Documentación:**
- [ ] Anotaciones de spacing (padding, margins)
- [ ] Anotaciones de medidas (widths, heights)
- [ ] Comentarios sobre animaciones esperadas
- [ ] Notas sobre comportamiento responsive
- [ ] Especificaciones de imágenes (aspect ratios, tamaños)

### **Exportación:**
- [ ] Assets: Íconos en SVG, Imágenes en PNG @2x
- [ ] Especificaciones CSS: Exportar variables de color en formato CSS
- [ ] Guías de implementación: PDF con anotaciones técnicas

---

## 🎨 PROMPT FINAL PARA FIGMA AI (Resumen Ejecutivo)

**"Crea un dashboard moderno y personalizable para Menunu (gestor de menús SaaS) con las siguientes características:**

**📱 DISEÑO MOBILE-FIRST:**
- Navbar fija con glassmorphism, logo "Menunu", toggle dark/light mode, y avatar de negocio
- Hero section con degradado rosa coral (#ff6b9d) + púrpura (#c471ed) + rojo coral (#f64f59)
- Banners carrusel horizontal (swipe) con overlay gradiente y dots indicator
- Grid de promociones 2 columnas (móvil), 3 (tablet), 4 (desktop) con cards modernas
- Favorito del día destacado con borde dorado, badge "FAVORITO" y CTA llamativo
- Menú principal en accordion/desplegable con categorías expandibles
- Búsqueda global con drawer deslizante desde arriba
- Bottom navigation fijo con 5 tabs (Inicio, Stats, Nuevo FAB, Menú, Config)

**🌓 MODO OSCURO/CLARO COMPLETO:**
- Oscuro: Fondo negro profundo (#0a0a0a), grises oscuros, texto blanco
- Claro: Fondo blanco, grises claros, texto negro suave
- Toggle instantáneo tipo iOS en navbar
- Todas las cards, inputs y componentes con variantes de color

**🎨 ESTÉTICA MEJORADA:**
- Rosa coral como color primario personalizable
- Degradados en hero, banners, botones CTA (135deg, 3 colores)
- Glassmorphism en navbar, cards flotantes, modals (backdrop-blur + rgba)
- Sombras XL con tinte del color primario
- Border radius generoso (16-24px)
- Microinteracciones documentadas (hover scale, accordion expand, etc.)

**✨ COMPONENTES CLAVE:**
- Cards de promoción con badge de descuento, imagen, rating de estrellas
- Favorito del día con imagen grande, gradiente dorado, badge animado
- Accordion de categorías con ícono chevron rotatorio y contador de items
- Items de producto con miniatura, nombre, descripción, tags, precio
- Modales expandidos para banners y productos (backdrop blur, border radius 24px)
- Toast notifications con íconos, auto-dismiss y barra de progreso

**📐 RESPONSIVE:**
- Mobile: 375px, 2 columnas promociones, accordion full width, bottom nav visible
- Tablet: 768px, 3 columnas promociones, sidebar opcional
- Desktop: 1440px max width 1280px, 4 columnas, nav lateral fija

**🎭 EFECTOS VISUALES:**
- Skeleton loading con shimmer
- Empty states con ilustraciones
- Error states con mensajes claros
- Ripple effect en botones
- Pull to refresh indicator

**📚 TECH STACK A CONSIDERAR EN DISEÑO:**
- Next.js App Router (SSR/CSR híbrido)
- Tailwind CSS (utility-first, responsive)
- Framer Motion (animaciones suaves)
- shadcn/ui (componentes accesibles)
- Poppins (headings) + DM Sans (body)

**🎯 OBJETIVO FINAL:** Dashboard altamente personalizable, mobile-first, con modo oscuro/claro completo, estética moderna con rosa coral/degradados/glassmorphism, y UX fluida inspirada en las mejores apps de gestión de restaurantes. El diseño debe ser más llamativo, menos plano, y optimizado para uso en teléfono con interacciones táctiles intuitivas."**

---

## 📎 ANEXOS

### **Inspiración de Diseño (Referencias):**
- **Uber Eats Restaurant Dashboard:** Cards modernas, grid responsive
- **Spotify for Artists:** Dark mode elegante, degradados, estadísticas visuales
- **Notion:** Accordion/collapse bien ejecutado, interacciones suaves
- **Airbnb Host:** Balance entre información y estética, uso de espacios en blanco
- **Instagram:** Modo oscuro/claro bien implementado, animaciones microinteracciones

### **Fuentes Tipográficas:**
- **Headings:** Poppins (Google Fonts) - Weights: 400, 500, 600, 700
- **Body:** DM Sans (Google Fonts) - Weights: 400, 500, 700
- **Monospace (Precios):** Roboto Mono - Weight: 500

### **Íconos:**
- Lucide React (línea simple, 24x24px base)
- Emojis Unicode para categorías y estados
- Custom icons solo si es absolutamente necesario

### **Imágenes de Placeholder:**
- Unsplash API para fotos de comida (1280x720px)
- Lorem Picsum para placeholders genéricos
- Aspect ratios: 16:9 (banners), 4:3 (productos), 1:1 (avatars)

---

**NOTA IMPORTANTE PARA EL DISEÑADOR EN FIGMA:**
Este prompt está diseñado para que un diseñador humano o IA de Figma genere un sistema completo de diseño. El objetivo es tener todos los screens principales, componentes reutilizables con variantes, y documentación visual suficiente para que un desarrollador frontend pueda implementarlo pixel-perfect en Next.js + Tailwind CSS. 

**Prioriza:**
1. **Consistencia:** Mismos spacings, border radius, shadows en todos los componentes
2. **Escalabilidad:** Componentes reutilizables con variantes (dark/light mínimo)
3. **Accesibilidad:** Contraste de colores AA mínimo, tamaños táctiles de 44px+
4. **Claridad:** Auto-layout bien definido, naming claro, agrupación lógica

**Entregables esperados:**
- 1 archivo Figma con 7 páginas organizadas
- 30+ componentes reutilizables
- 50+ pantallas/estados documentados
- Variables de color, tipografía y efectos
- Prototipo interactivo básico (opcional pero recomendado)

---

**Versión:** 2.0 Enhanced  
**Última actualización:** Octubre 2025  
**Autor:** Equipo Menunu basado en análisis de Lealta Dashboard
