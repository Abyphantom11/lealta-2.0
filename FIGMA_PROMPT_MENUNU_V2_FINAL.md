# 🎨 PROMPT FIGMA DEFINITIVO - MENUNU DASHBOARD v2

## 📋 CONTEXTO DEL PROYECTO

**MENUNU** es un SaaS para gestión de menús digitales con estética **minimalista, amigable y luminosa**. El dashboard permite a dueños de restaurantes:
- ✏️ **Editar su menú** (categorías + productos)
- 🎨 **Personalizar diseño** (logo, colores, tipografía)
- 📢 **Gestionar banners y promociones** diarias
- 📱 **Vista previa en vivo** tipo iPhone mockup

**IMPORTANTE:** Este diseño combina:
- ✨ **Estética Menunu** (colores pastel, light/dark mode, mobile-first)
- 🛠️ **Sistema de edición Lealta** (gestores de contenido por día)

---

## 🎨 DESIGN SYSTEM

### **Paleta de Colores**

#### **Primarios (Pastel)**
```css
/* Modo Claro (default) */
--coral-50: #FFF5F7        /* Background suave */
--coral-100: #FFE5EB       /* Cards */
--coral-200: #FFCCD9       /* Hover states */
--coral-400: #FF9DBD       /* Elementos interactivos */
--coral-500: #FF6B9D       /* Botones principales */

--lavender-50: #F9F5FF     /* Background alternativo */
--lavender-100: #F3E8FF    /* Cards secundarios */
--lavender-400: #C5A0F9    /* Acentos */
--lavender-500: #A855F7    /* Links, badges */

--honey-50: #FFFBF0        /* Highlights suaves */
--honey-400: #FEC368       /* Badges informativos */

--mint-400: #6DDCCF        /* Success states */
--mint-500: #10B981        /* Confirmaciones */

/* Modo Oscuro */
--dark-bg: #0A0A0A         /* Background principal */
--dark-surface: #1A1A1A    /* Cards */
--dark-border: #2A2A2A     /* Bordes */
--dark-hover: #333333      /* Hover states */
```

#### **Neutrales**
```css
/* Claro */
--cream: #FFFBF5           /* Background principal */
--cream-dark: #F5F1E8      /* Cards, inputs */
--gray-50: #FAFAFA
--gray-100: #F5F5F5
--gray-400: #B2BEC3        /* Bordes, iconos */
--gray-600: #636E72        /* Texto secundario */
--gray-800: #2D3436        /* Texto principal */

/* Oscuro */
--dark-50: #F9FAFB
--dark-800: #1F2937
--dark-900: #111827
--dark-950: #0A0A0A
```

#### **Semánticos**
```css
--success: #00B894
--warning: #FDCB6E
--error: #D63031
--info: #74B9FF
```

### **Tipografía**
```
Headings: Poppins (Google Fonts)
  - SemiBold 600: Títulos importantes
  - Bold 700: Hero text

Body: DM Sans (Google Fonts)
  - Regular 400: Texto general
  - Medium 500: Labels, botones

Escalas:
H1: 36px / 2.25rem
H2: 30px / 1.875rem
H3: 24px / 1.5rem
H4: 20px / 1.25rem
Body: 16px / 1rem
Small: 14px / 0.875rem
Tiny: 12px / 0.75rem
```

### **Espaciado (Tailwind)**
```
2: 8px
3: 12px
4: 16px
6: 24px
8: 32px
12: 48px
16: 64px
```

### **Border Radius**
```
sm: 6px    - Tags, badges
md: 8px    - Botones, inputs
lg: 12px   - Cards pequeños
xl: 16px   - Cards grandes
2xl: 20px  - Modales
full: 9999px - Pills, avatars
```

### **Sombras**
```
sm:  0 1px 2px rgba(0,0,0,0.05)
md:  0 4px 6px -1px rgba(0,0,0,0.1)
lg:  0 10px 15px -3px rgba(0,0,0,0.1)
xl:  0 20px 25px -5px rgba(0,0,0,0.1)
2xl: 0 25px 50px -12px rgba(0,0,0,0.25)
```

---

## 📐 LAYOUT PRINCIPAL

### **Estructura de 3 Columnas**

```
┌────────────────────────────────────────────────────────────────────┐
│  [Logo MENUNU]  Menú  Banners  Diseño  Analytics  [🌙] [Avatar▼] │ ← Top Nav (sticky)
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────────────┐  ┌────────────────────┐  ┌──────────────┐  │
│  │                  │  │                    │  │              │  │
│  │  EDITOR          │  │  VISTA PREVIA      │  │  CONTROLES   │  │
│  │  (40%)           │  │  (35%)             │  │  (25%)       │  │
│  │                  │  │  [iPhone Mockup]   │  │              │  │
│  │  Categorías      │  │  con scroll        │  │  Toggle      │  │
│  │  + Items         │  │  independiente     │  │  Dark/Light  │  │
│  │                  │  │                    │  │              │  │
│  │                  │  │  Se actualiza      │  │  Selector    │  │
│  │  [Acordeones]    │  │  en tiempo real    │  │  de día      │  │
│  │                  │  │                    │  │  (L M X...)  │  │
│  └──────────────────┘  └────────────────────┘  └──────────────┘  │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

**BREAKPOINTS:**
- Desktop (> 1280px): 3 columnas como arriba
- Tablet (768-1280px): Editor + Preview apilados, controles en sidebar
- Mobile (< 768px): Solo Editor, preview en modal flotante

---

## 🧭 TOP NAVIGATION (Fixed)

### **Especificaciones**
```
Height: 64px
Background Claro: bg-white/95 backdrop-blur-md
Background Oscuro: bg-dark-950/95 backdrop-blur-md
Border bottom: 1px solid gray-200 (claro) / dark-border (oscuro)
Shadow: shadow-sm
Z-index: 50
```

### **Contenido (Auto Layout Horizontal)**
```
┌─────────────────────────────────────────────────────────────┐
│ [🍽️ MENUNU]   Menú  Banners  Diseño  Analytics   🌙 👤▼   │
│  Logo          Tabs (centradas)                   Derecha   │
└─────────────────────────────────────────────────────────────┘
```

**Elementos:**

1. **Logo MENUNU**
   - Fuente: Poppins Bold 24px
   - Color: Coral-500 (claro) / Coral-400 (oscuro)
   - Ícono: Emoji 🍽️ o SVG custom
   - Hover: scale(1.05) transition 200ms

2. **Tabs de Navegación**
   - Layout: Horizontal, gap 32px
   - Fuente: DM Sans Medium 16px
   - Estados:
     - **Activo:** Text coral-500, border-bottom 2px coral-500, font-semibold
     - **Inactivo:** Text gray-600, hover gray-800
     - **Transition:** all 200ms ease
   - Tabs: Menú | Banners | Diseño | Analytics

3. **Toggle Dark/Light**
   - Tipo: Switch iOS style
   - Size: 48x28px
   - Background: gray-200 (off) / coral-500 (on)
   - Íconos: ☀️ (claro) / 🌙 (oscuro) 16px
   - Animación: slide + fade 300ms cubic-bezier

4. **Avatar + Dropdown**
   - Avatar: 40x40px rounded-full
   - Placeholder: Iniciales o imagen
   - Border: 2px coral-400
   - Dropdown (click):
     - Mi cuenta
     - Ajustes
     - Upgrade ⭐ (badge)
     - ---
     - Cerrar sesión

---

## 📑 TAB 1: MENÚ (Editor Principal)

### **Columna Izquierda: Editor (40%)**

#### **Header con Título Editable**
```
┌─────────────────────────────────────────────────┐
│ [✏️] Mi Menú - Bistro Central                  │
│                       [+ Nueva categoría] Coral │
└─────────────────────────────────────────────────┘
```

**Especificaciones:**
- Padding: 24px
- Título: H3 (24px) editable inline (doble click)
- Botón: Coral-500, rounded-lg, shadow-md, hover:shadow-lg

#### **Lista de Categorías (Accordions)**

**Card de Categoría (Collapsed):**
```
┌───────────────────────────────────────────────────┐
│ 🍕 Entradas (5 items)              [···] [▼]    │ ← Clickeable
└───────────────────────────────────────────────────┘
```

**Especificaciones:**
- Background: white (claro) / dark-surface (oscuro)
- Border: 1px solid gray-200 / dark-border
- Radius: 12px
- Padding: 16px 20px
- Margin bottom: 12px
- Shadow: md, hover:lg
- Cursor: pointer
- Transition: all 200ms

**Contenido del Header:**
- Emoji categoría: 24px (🍕🥗🍔🍹🍰)
- Nombre: Poppins SemiBold 18px
- Contador: Gray-600, 14px, "(5 items)"
- Botón ···: 
  - Dropdown: Editar nombre, Duplicar, Eliminar
  - Icons: 16px gray-600 hover:gray-800
- Chevron: 20x20px, rotate 180deg al expandir

**Card de Categoría (Expanded):**
```
┌───────────────────────────────────────────────────┐
│ 🍕 Entradas (5 items)              [···] [▼]    │
├───────────────────────────────────────────────────┤
│                                                   │
│  ┌──────┬─────────────────────────┬───────────┐  │
│  │[Img] │ Bruschetta Italiana     │  $8.50 ✏️│  │ ← Item
│  │60x60 │ Pan tostado con...      │          │  │
│  └──────┴─────────────────────────┴───────────┘  │
│                                                   │
│  ┌──────┬─────────────────────────┬───────────┐  │
│  │[Img] │ Ceviche de Pescado      │ $12.00 ✏️│  │
│  │60x60 │ Fresco pescado...       │          │  │
│  └──────┴─────────────────────────┴───────────┘  │
│                                                   │
│             [+ Agregar item]                      │ ← Botón ghost
└───────────────────────────────────────────────────┘
```

**Item de Producto:**
- Layout: Grid 3 columnas (imagen 60px | info flex-1 | precio 80px)
- Height: 72px
- Padding: 12px
- Margin: 8px 0
- Border radius: 8px
- Hover: background gray-50 / dark-hover, translateX(4px)
- Cursor: pointer

**Imagen Thumbnail:**
- Size: 60x60px
- Radius: 8px
- Object fit: cover
- Placeholder si no hay imagen:
  - Background: gray-200 / dark-border
  - Icon: Camera 24px gray-400
  - Text: "Sin imagen" 12px gray-500

**Info Producto:**
- Nombre: DM Sans Medium 15px, gray-800 / white
- Descripción: DM Sans Regular 13px, gray-600 / gray-400
- Max lines: 2 con ellipsis
- Tags opcionales:
  - Pills: "Vegano", "Sin gluten", "Picante"
  - Size: 10px, padding 2px 8px
  - Background: mint-100 / dark-border
  - Radius: full

**Precio + Editar:**
- Precio: Poppins SemiBold 16px, coral-500
- Botón editar: Icon pencil 16px, gray-600 hover:coral-500
- Hover: background coral-50 / dark-hover, radius 6px

**Botón Agregar Item:**
- Style: Ghost (text coral-500, hover:bg-coral-50)
- Icon: Plus 16px
- Full width, padding 12px
- Dashed border top 1px gray-300 / dark-border

#### **Animación de Expand/Collapse**
- Altura: 0 → auto con max-height trick
- Easing: cubic-bezier(0.4, 0, 0.2, 1)
- Duration: 300ms
- Contenido: opacity 0 → 1 con delay 100ms

---

### **Columna Centro: Vista Previa (35%)**

#### **iPhone Mockup (Sticky)**
```
┌────────────────────┐
│  Vista Previa      │ ← Label pequeño
├────────────────────┤
│   ┌──────────┐     │
│   │   [🔋]   │     │
│   │   12:34  │     │ ← Notch iPhone
│   ├──────────┤     │
│   │          │     │
│   │  Menú    │     │ ← Contenido scrolleable
│   │  Público │     │
│   │  Render  │     │
│   │  Live    │     │
│   │          │     │
│   │  [🏠][⚙️]│     │ ← Bottom nav
│   └──────────┘     │
└────────────────────┘
```

**Especificaciones Mockup:**
- Frame iPhone 14 Pro (375x812px aprox)
- Background frame: black (bezel)
- Shadow: 2xl con tinte oscuro
- Sticky position: top-80px (bajo navbar)
- Overflow: hidden en frame, scroll interno

**Contenido de Vista Previa:**
- **Renderiza el menú público en vivo**
- Se actualiza cada vez que se edita algo en el editor
- **NO USAR IMÁGENES DE INTERNET**, usar placeholders:
  - Rectángulos con gradientes suaves
  - Text overlay: "Imagen: Bruschetta" 14px white/80
  - Background: gradient coral-400 to lavender-400

**Header Menú Público:**
```
Hola, [Nombre Negocio] 👋
─────────────────────────
```

**Categorías en Preview:**
- Mismo estilo accordion pero compacto
- Font size: -2px vs editor
- Sin botones de edición

---

### **Columna Derecha: Controles (25%)**

#### **Panel de Controles Sticky**
```
┌────────────────────┐
│ Controles          │
├────────────────────┤
│                    │
│ 🌙 Modo Oscuro     │
│ [Toggle Switch]    │
│                    │
│ 📅 Simular Día     │
│ [L][M][X][J][V][S][D] │
│                    │
│ 🔄 Actualizar      │
│ [Botón]            │
│                    │
│ 📱 Compartir QR    │
│ [QR Code Preview]  │
│                    │
└────────────────────┘
```

**Elementos:**

1. **Toggle Dark/Light (Grande)**
   - Same as navbar pero size 56x32px
   - Label arriba: "Modo Oscuro" 14px
   - Cambia toda la UI al instante

2. **Selector de Día**
   - Label: "Simular Día" 14px gray-600
   - Botones: 7 círculos de 36x36px
   - Letras: L M X J V S D
   - Activo: bg-coral-500, text-white, scale(1.1)
   - Inactivo: bg-gray-200, text-gray-600
   - Hover: bg-coral-100
   - Gap: 6px
   - **Nota:** Afecta banners y promociones en Tab 2

3. **Botón Actualizar Preview**
   - Icon: Refresh 16px
   - Text: "Actualizar Vista" 14px
   - Style: Secondary button
   - Manualmente forza re-render del preview

4. **QR Code Preview**
   - Label: "Compartir Menú" 14px
   - QR: 120x120px con logo en centro
   - Botones debajo:
     - [Descargar PNG]
     - [Copiar Link]
   - Style: Ghost buttons 12px

---

## 📢 TAB 2: BANNERS (Nuevo Sistema de Edición)

### **Diseño INSPIRADO EN LEALTA PERO CON ESTÉTICA MENUNU**

#### **Layout 2 Columnas (60/40)**

**Columna Izquierda: Editor de Banners (60%)**

```
┌─────────────────────────────────────────────────────┐
│ Banners Diarios                                     │
│                                                     │
│ 📅 Selector de Día:  [L] M  X  J  V  S  D         │ ← Pills
│                                                     │
│ ┌─────────────────────────────────────────────────┐│
│ │ Banner 1 - Lunes                    [✓] [···]  ││ ← Card
│ ├─────────────────────────────────────────────────┤│
│ │                                                 ││
│ │  Título:                                        ││
│ │  [_______________________________________]      ││
│ │                                                 ││
│ │  Imagen: (usar placeholder si no hay img)      ││
│ │  ┌───────────────────────────────────────┐     ││
│ │  │ [Gradiente coral→lavender]           │     ││
│ │  │ "Arrastrar o click para subir"       │     ││
│ │  │ Formato: JPG, PNG, WebP (max 5MB)    │     ││
│ │  └───────────────────────────────────────┘     ││
│ │                                                 ││
│ │  [Guardar Cambios]         [Eliminar Banner]   ││
│ │                                                 ││
│ └─────────────────────────────────────────────────┘│
│                                                     │
│ [+ Agregar otro banner]  ← Max 3 por día          │
│                                                     │
│ ┌─────────────────────────────────────────────────┐│
│ │ 🎁 PROMOCIONES (Múltiples)          [+ Agregar]││ ← Sección
│ ├─────────────────────────────────────────────────┤│
│ │                                                 ││
│ │  • Promo 1: 20% en Pastas      [✓] [✏️] [🗑️] ││
│ │  • Promo 2: 2x1 Bebidas        [✓] [✏️] [🗑️] ││
│ │                                                 ││
│ └─────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

**ESPECIFICACIONES DETALLADAS:**

#### **1. Selector de Día (Pills)**
- Layout: Horizontal flex, gap 8px
- Pill size: 40x40px cada uno
- Letras: L M X J V S D (14px Medium)
- Estado activo:
  - Background: coral-500
  - Text: white
  - Shadow: md
  - Border: 2px coral-600
- Estado inactivo:
  - Background: gray-100 (claro) / dark-surface (oscuro)
  - Text: gray-600
  - Hover: coral-100
- Transition: all 200ms

#### **2. Card de Banner**

**Header:**
- Background: coral-50 (claro) / dark-surface (oscuro)
- Padding: 16px
- Border radius: 12px 12px 0 0
- Layout: Space between
- Elementos:
  - Título: "Banner 1 - Lunes" (Poppins SemiBold 16px)
  - Toggle activo: Switch pequeño (32x20px)
  - Menú ···: Dropdown (Editar, Duplicar, Eliminar)

**Body:**
- Background: white (claro) / dark-surface+5 (oscuro)
- Padding: 24px
- Border: 1px solid gray-200 / dark-border
- Radius: 0 0 12px 12px

**Input Título:**
- Label: "Título del Banner" 14px gray-600
- Input:
  - Height: 44px
  - Padding: 0 16px
  - Border: 1px gray-300 / dark-border
  - Radius: 8px
  - Focus: ring 2px coral-400
  - Placeholder: "Ej: Promoción Especial del Lunes"

**Zona de Subida de Imagen:**
- **NO USAR IMÁGENES DE INTERNET**
- **USAR PLACEHOLDERS:**
  ```
  ┌─────────────────────────────────────┐
  │ [Gradiente: coral-300→lavender-300] │
  │                                     │
  │        📷 Cámara Icon 48px          │
  │   "Arrastrar imagen o click"        │
  │   JPG, PNG, WebP (max 5MB)          │
  │                                     │
  │  "PLACEHOLDER: Banner Promocional"  │ ← Texto referencia
  └─────────────────────────────────────┘
  ```
- Height: 200px (móvil) / 240px (desktop)
- Border: 2px dashed gray-300 (default)
- Border: 2px dashed coral-400 (hover/dragover)
- Background: gray-50 / dark-hover
- Radius: 12px
- Transition: all 200ms

**Estados de la imagen:**
- **Sin imagen:** Placeholder con gradiente + texto
- **Con imagen:** 
  - Mostrar preview de la imagen
  - Botón "Cambiar" overlay on hover
  - Botón X para eliminar (esquina superior derecha)

**Botones de Acción:**
- Layout: Horizontal, space between
- **Guardar:**
  - Style: Primary (coral-500)
  - Icon: Check 16px
  - Padding: 12px 24px
  - Radius: 8px
  - Shadow: md hover:lg
- **Eliminar:**
  - Style: Destructive (error-500)
  - Icon: Trash 16px
  - Padding: 12px 24px
  - Radius: 8px

**Límites:**
- Máximo 3 banners por día
- Si hay 3, deshabilitar botón "+ Agregar otro banner"
- Mensaje: "Límite alcanzado (3/3)" gray-500 12px

#### **3. Sección Promociones**

**Header Colapsable:**
```
┌───────────────────────────────────────────┐
│ 🎁 PROMOCIONES           [+ Agregar] [▼] │
└───────────────────────────────────────────┘
```

**Lista de Promociones (cuando expandido):**
```
• 20% en Pastas               [✓] [✏️] [🗑️]
• 2x1 Bebidas                 [✓] [✏️] [🗑️]
• Postre gratis +$50          [✓] [✏️] [🗑️]
```

**Card de Edición de Promo (al click en ✏️):**
```
┌─────────────────────────────────────────┐
│ Editar Promoción                    [X] │
├─────────────────────────────────────────┤
│                                         │
│ Título:                                 │
│ [________________________________]      │
│                                         │
│ Descripción:                            │
│ [________________________________]      │
│ [________________________________]      │
│                                         │
│ Descuento (%):                          │
│ [____]  %                               │
│                                         │
│ Hora de término:                        │
│ [__:__] ← Time picker                   │
│                                         │
│     [Cancelar]    [Guardar]             │
└─────────────────────────────────────────┘
```

**Especificaciones Promo:**
- Background modal: white (claro) / dark-surface (oscuro)
- Overlay: black/40 con backdrop-blur
- Width: 480px max
- Radius: 16px
- Shadow: 2xl
- Padding: 32px
- Animación entrada: scale(0.95) opacity(0) → scale(1) opacity(1), 250ms

**Lista compacta de promos:**
- Item height: 48px
- Layout: Horizontal space-between
- Hover: background gray-50 / dark-hover
- Iconos:
  - Toggle: 24x24px switch
  - Editar: pencil 16px gray-600 hover:coral-500
  - Eliminar: trash 16px gray-600 hover:error-500
- Padding: 12px 16px
- Border bottom: 1px gray-200 / dark-border

---

**Columna Derecha: Vista Previa (40%)**

- **Mismo iPhone mockup que Tab Menú**
- **Muestra banners y promociones DEL DÍA SELECCIONADO**
- **Se actualiza en tiempo real al editar**

**Vista previa de banners:**
```
┌─────────────────────┐
│ [Placeholder Banner]│ ← Gradiente coral→lavender
│ "Banner: Lunes"     │ ← Texto overlay
│ • • ○               │ ← Dots si hay múltiples
└─────────────────────┘
```

**Vista previa de promociones:**
```
┌───────────────────────────────┐
│ 🎁 Promociones del Día        │
├───────────────────────────────┤
│  ┌─────────────────────────┐  │
│  │ 20% en Pastas          │  │
│  │ Válido hasta 04:00     │  │
│  └─────────────────────────┘  │
│  ┌─────────────────────────┐  │
│  │ 2x1 Bebidas            │  │
│  │ Válido hasta 23:00     │  │
│  └─────────────────────────┘  │
└───────────────────────────────┘
```

---

## 🎨 TAB 3: DISEÑO

### **Layout 2 Columnas (50/50)**

**Columna Izquierda: Controles de Diseño**

```
┌─────────────────────────────────────────┐
│ BRANDING                                │
├─────────────────────────────────────────┤
│                                         │
│ Logo del Restaurante                    │
│ ┌───────────────────────────────────┐   │
│ │ [Placeholder: Logo 200x200]       │   │
│ │ Gradiente coral→honey             │   │
│ │ "📸 Subir Logo"                   │   │
│ │ PNG transparente recomendado      │   │
│ └───────────────────────────────────┘   │
│                                         │
│ [Logo actual: bistro-logo.png]   [X]   │
│                                         │
├─────────────────────────────────────────┤
│ COLORES                                 │
├─────────────────────────────────────────┤
│                                         │
│ Color Principal                         │
│ ┌────────┐  #FF6B9D                    │
│ │ [Coral]│  [________________]         │
│ └────────┘   ← Color picker            │
│                                         │
│ Color Acento                            │
│ ┌──────────┐  #C5A0F9                  │
│ │[Lavender]│  [________________]       │
│ └──────────┘                            │
│                                         │
│ Vista previa:                           │
│ [Botón Primario] [Link] [Badge]        │
│                                         │
├─────────────────────────────────────────┤
│ TIPOGRAFÍA                              │
├─────────────────────────────────────────┤
│                                         │
│ Fuente del Menú                         │
│ ┌───────────────────────────────────┐   │
│ │ Poppins                    [▼]    │   │
│ └───────────────────────────────────┘   │
│                                         │
│ Otras opciones:                         │
│ • Inter                                 │
│ • Playfair Display                      │
│ • Montserrat                            │
│ • DM Sans                               │
│                                         │
├─────────────────────────────────────────┤
│ QR CODE                                 │
├─────────────────────────────────────────┤
│                                         │
│   ┌─────────────┐                       │
│   │  ▓▓▓▓▓▓▓▓  │                       │
│   │  ▓ [Logo]▓ │  200x200px            │
│   │  ▓▓▓▓▓▓▓▓  │                       │
│   └─────────────┘                       │
│                                         │
│ [Descargar PNG]  [Descargar SVG]       │
│ [Imprimir]       [Copiar Link]         │
│                                         │
└─────────────────────────────────────────┘
```

**Columna Derecha: Vista Previa**

- Mismo iPhone mockup
- Se actualiza al cambiar logo/colores/fuente
- Muestra el menú público con nuevos estilos aplicados

---

## 📊 TAB 4: ANALYTICS

### **Layout Full Width con Grid**

```
┌───────────────────────────────────────────────────┐
│ ESTADÍSTICAS - Últimos 7 días          [Filtro▼] │
├───────────────────────────────────────────────────┤
│                                                   │
│ ┌──────────────┐ ┌──────────────┐ ┌────────────┐│
│ │ Vistas Total │ │ Vistas Hoy   │ │ % Cambio   ││
│ │              │ │              │ │            ││
│ │   1,247      │ │      34      │ │  +12% ↑    ││
│ │ +12% vs ayer │ │ +18% vs ayer │ │            ││
│ └──────────────┘ └──────────────┘ └────────────┘│
│                                                   │
│ ┌──────────────────────────────────────────────┐ │
│ │ Visitas por Día (Gráfico de Línea)          │ │
│ │                                              │ │
│ │         ╱\                                   │ │
│ │       ╱    \      ╱\                        │ │
│ │     ╱        \  ╱    \                      │ │
│ │   ╱            ╱        \                    │ │
│ │ ────────────────────────────────            │ │
│ │  Lun  Mar  Mié  Jue  Vie  Sáb  Dom         │ │
│ └──────────────────────────────────────────────┘ │
│                                                   │
│ ┌────────────────────┐ ┌──────────────────────┐ │
│ │ Items Más Vistos   │ │ Búsquedas Populares  │ │
│ │                    │ │                      │ │
│ │ 1. Carbonara       │ │ #pasta  #pizza       │ │
│ │ 2. Pizza Marga     │ │ #postres #bebidas    │ │
│ │ 3. Tiramisú        │ │ #vegano #sin-gluten  │ │
│ └────────────────────┘ └──────────────────────┘ │
│                                                   │
│ ┌──────────────────────────────────────────────┐ │
│ │ Tabla: Items Populares                       │ │
│ ├──────────────┬──────────┬───────────────────┤ │
│ │ Item         │ Vistas   │ Categoría         │ │
│ ├──────────────┼──────────┼───────────────────┤ │
│ │ Carbonara    │   145    │ Principales       │ │
│ │ Pizza Marga  │   122    │ Principales       │ │
│ │ Tiramisú     │    98    │ Postres           │ │
│ └──────────────┴──────────┴───────────────────┘ │
└───────────────────────────────────────────────────┘
```

**Especificaciones de Stat Cards:**
- Background: white (claro) / dark-surface (oscuro)
- Border: 1px gray-200 / dark-border
- Radius: 12px
- Padding: 24px
- Shadow: md
- Grid: 3 columnas (desktop), 2 (tablet), 1 (mobile)
- Gap: 24px

**Elementos de Stat:**
- Número grande: 36px Bold coral-500
- Label: 14px Medium gray-600
- Cambio: 12px Medium con color según valor:
  - Positivo: mint-500 con ↑
  - Negativo: error-500 con ↓
  - Neutro: gray-500 con →

**Gráfico de Línea:**
- Ancho: Full width
- Alto: 280px
- Línea: coral-500, 2px thickness
- Puntos: circles 6px en cada data point
- Grid: gray-200/20 horizontal lines
- Ejes: gray-600, 12px
- Padding: 32px alrededor
- Tooltip on hover: white card con shadow-lg

**Tabla:**
- Header: gray-100 (claro) / dark-surface (oscuro)
- Header text: 14px Medium gray-800 / white
- Rows: hover gray-50 / dark-hover
- Padding row: 16px 20px
- Border bottom: 1px gray-200 / dark-border
- Números destacados: Bold coral-500

---

## 🧩 COMPONENTES UI REUTILIZABLES

### **Buttons**

#### **Primary**
```css
Background: coral-500
Text: white
Padding: 12px 24px
Radius: 8px
Font: DM Sans Medium 15px
Shadow: md
Hover: coral-600 + shadow-lg + scale(1.02)
Active: scale(0.98)
Transition: all 200ms
```

#### **Secondary**
```css
Background: cream-dark (claro) / dark-surface (oscuro)
Text: gray-800 / white
Hover: gray-100 / dark-hover + scale(1.02)
```

#### **Ghost**
```css
Background: transparent
Text: coral-500
Hover: bg-coral-50 / dark-hover
Border: none
```

#### **Destructive**
```css
Background: error-500
Text: white
Hover: error-600 + shadow-lg
```

### **Inputs**

#### **Text Input**
```css
Background: cream (claro) / dark-surface (oscuro)
Border: 1px gray-400/50 / dark-border
Radius: 8px
Padding: 12px 16px
Font: DM Sans Regular 15px
Placeholder: gray-500

Focus:
  Ring: 2px coral-400
  Border: transparent
  Shadow: sm
```

#### **Textarea**
```css
Same as input pero:
Min height: 120px
Resize: vertical
```

#### **Select/Dropdown**
```css
Same as input pero:
Icon chevron-down derecha: 16px gray-600
Padding right: 40px
```

### **Cards**

```css
Background: white (claro) / dark-surface (oscuro)
Border: 1px gray-200 / dark-border
Radius: 12px
Padding: 16px-24px
Shadow: md
Hover: shadow-lg + translateY(-2px)
Transition: all 250ms ease
```

### **Modals**

```css
Overlay:
  Background: black/40
  Backdrop blur: 8px
  Z-index: 100

Content:
  Background: white / dark-surface
  Radius: 16px
  Shadow: 2xl
  Max width: 500px
  Padding: 32px
  Margin: auto (centrado)

Animation In:
  Scale: 0.95 → 1
  Opacity: 0 → 1
  Duration: 250ms
  Easing: ease-out

Animation Out:
  Scale: 1 → 0.95
  Opacity: 1 → 0
  Duration: 200ms
```

### **Toasts/Notifications**

```css
Position: fixed top-20px right-20px
Width: min 320px
Padding: 16px 20px
Radius: 12px
Shadow: lg

Tipos:
  Success: bg-mint-50 border-mint-400 text-mint-800
  Error: bg-error-50 border-error-400 text-error-800
  Warning: bg-warning-50 border-warning-400 text-warning-800
  Info: bg-info-50 border-info-400 text-info-800

Layout:
  Icon: 24px (izquierda)
  Text: flex-1
  Close button: 16px (derecha)

Auto dismiss: 5s con progress bar
Animation: slideInRight + fadeOut
```

---

## 📱 RESPONSIVE BEHAVIOR

### **Desktop (> 1280px)**
- Layout 3 columnas: 40% / 35% / 25%
- Nav tabs visibles
- Todas las features disponibles

### **Tablet (768-1280px)**
- Layout 2 columnas: 60% / 40%
- Controles panel colapsable en sidebar
- Nav tabs con overflow scroll horizontal

### **Mobile (< 768px)**
- Layout single column
- Vista previa en modal flotante (botón "Ver Preview")
- Tabs convertidos en dropdown selector
- Bottom nav con iconos:
  - 🍽️ Menú
  - 📢 Banners
  - 🎨 Diseño
  - 📊 Stats

---

## ✨ MICROINTERACCIONES Y ANIMACIONES

### **Hover States**
- Cards: shadow-md → shadow-lg + translateY(-2px), 200ms
- Botones: scale(1.02) + brightness(1.1), 150ms
- Links: color shift + underline, 200ms

### **Focus States**
- Inputs: ring 2px coral-400 + shadow-sm
- Buttons: ring 2px coral-400/50 + outline none

### **Loading States**
- Skeleton screens para cards con shimmer
- Spinners coral-500 para acciones async
- Progress bars lineales en top de página

### **Empty States**
- Ilustraciones minimalistas (SVG)
- Texto amigable: "Aún no hay categorías. ¡Crea la primera!"
- CTA destacado debajo

### **Drag & Drop**
- Item opacity: 0.5 al arrastrar
- Drop zone: border dashed coral-400 + bg-coral-50
- Snap animation al soltar

### **Accordion Expand**
- Height: 0 → auto (con max-height)
- Chevron: rotate 0deg → 180deg
- Contenido: opacity 0 → 1 con delay
- Easing: cubic-bezier(0.4, 0, 0.2, 1)
- Duration: 300ms

---

## 🎯 ENTREGABLES ESPERADOS

### **Figma File Structure**

```
📁 MENUNU Dashboard
  📄 Page 1: Cover + Project Info
  📄 Page 2: Design System
    - Colores (todas las variables)
    - Tipografía (scale completa)
    - Componentes base (buttons, inputs, cards)
  📄 Page 3: Mobile Screens (375px)
    - Tab Menú
    - Tab Banners
    - Vista previa modal
  📄 Page 4: Desktop Screens (1440px)
    - Tab Menú (layout 3 columnas)
    - Tab Banners (layout 2 columnas)
    - Tab Diseño
    - Tab Analytics
  📄 Page 5: Modales y Overlays
    - Modal editar categoría
    - Modal editar item
    - Modal editar promoción
    - Toasts
  📄 Page 6: Estados Especiales
    - Empty states
    - Loading states
    - Error states
```

### **Componentes de Figma (Component Sets)**

- [ ] Button (variantes: Primary, Secondary, Ghost, Destructive)
- [ ] Input (estados: Default, Focus, Error, Disabled)
- [ ] Card (modos: Light, Dark)
- [ ] Navbar (con tabs activas 1-4)
- [ ] iPhone Mockup (con contenido scrolleable)
- [ ] Accordion Category (estados: Collapsed, Expanded)
- [ ] Product Item (estados: Default, Hover, Editing)
- [ ] Banner Card (modos: Empty, With Image, Loading)
- [ ] Promo Item (estados: Default, Active, Inactive)
- [ ] Stat Card (tipos: Number, Graph, List)
- [ ] Modal Base (sizes: Small, Medium, Large)
- [ ] Toast (tipos: Success, Error, Warning, Info)
- [ ] Toggle Switch (tamaños: Small, Medium, Large)
- [ ] Pill Button (estados: Default, Active)

### **Estilos de Figma**

**Color Styles:**
- [ ] Primary/Coral (50-500)
- [ ] Secondary/Lavender (50-500)
- [ ] Honey (50-400)
- [ ] Mint (400-500)
- [ ] Gray (50-800)
- [ ] Dark (bg, surface, border, hover)
- [ ] Semantic (success, warning, error, info)

**Text Styles:**
- [ ] H1-H4 (Poppins SemiBold/Bold)
- [ ] Body, Small, Tiny (DM Sans Regular/Medium)

**Effect Styles:**
- [ ] Shadow sm, md, lg, xl, 2xl
- [ ] Blur backdrop (para modals)

**Grid Styles:**
- [ ] Desktop: 12 columnas, gap 24px
- [ ] Tablet: 8 columnas, gap 16px
- [ ] Mobile: 4 columnas, gap 12px

### **Prototipado Interactivo**

- [ ] Flow: Menú → Editar categoría → Agregar item → Preview
- [ ] Flow: Banners → Seleccionar día → Editar banner → Ver en preview
- [ ] Transiciones: Smart animate para accordions
- [ ] Overlay: Modales con backdrop blur
- [ ] Scroll: Overflow en preview mockup

---

## 📝 NOTAS FINALES PARA EL DISEÑADOR

### **Filosofía de Diseño**
✨ **Luminoso y Acogedor** - No corporativo, no serio
🎨 **Colorido pero Sutil** - Pasteles, no neón
😊 **Amigable y Accesible** - Para personas sin conocimientos técnicos
📱 **Desktop-first** - Pero responsive completo

### **Inspiraciones**
- **Notion:** Limpio, organizado, espacioso
- **Linear:** Minimalista, rápido, transiciones suaves
- **Canva:** Amigable, colorido, accesible
- **Figma mismo:** UI moderna y funcional

### **Reglas de Oro**
1. **NO usar imágenes de internet** - Solo gradientes con texto referencia
2. **Consistencia** - Mismo spacing, radius, shadows en todo
3. **Accesibilidad** - Contraste AA mínimo, touch targets 44px+
4. **Modo oscuro** - No es opcional, es igual de importante que claro
5. **Mobile-ready** - Aunque desktop-first, debe verse bien en móvil

### **Placeholders para Imágenes**
Cuando necesites mostrar dónde va una imagen:
```
┌─────────────────────────────────┐
│ [Gradiente suave coral→lavender]│
│                                 │
│   📷 Ícono centrado             │
│   "PLACEHOLDER: [Tipo]"         │ ← Texto descriptivo
│   "Banner Promocional Lunes"    │
│                                 │
└─────────────────────────────────┘
```

---

## 🚀 PROMPT FINAL RESUMIDO (Para Figma AI)

**"Diseña un dashboard SaaS para MENUNU (gestor de menús digitales) con estética minimalista, amigable y pastel:**

**LAYOUT:**
- Desktop: 3 columnas (Editor 40% | Preview iPhone 35% | Controles 25%)
- 4 tabs: Menú | Banners | Diseño | Analytics
- Vista previa iPhone mockup sticky con scroll interno

**ESTILO:**
- Colores: Coral pastel (#FF6B9D), Lavender (#C5A0F9), Honey (#FEC368), Mint (#6DDCCF)
- Modo claro (cream #FFFBF5) + Modo oscuro (#0A0A0A) completos
- Tipografía: Poppins (headings) + DM Sans (body)
- Border radius generoso (8-16px), sombras suaves
- Componentes con glassmorphism ocasional

**TAB MENÚ:**
- Accordions de categorías con items de productos
- Thumbnails 60x60px, info compacta, precio destacado
- Botón + Agregar items estilo ghost
- Preview se actualiza en vivo

**TAB BANNERS (NUEVO):**
- Selector de día (L M X J V S D) tipo pills
- Cards de banners editables por día (max 3)
- Sección de promociones múltiples colapsable
- **Placeholders con gradientes** (NO imágenes de internet)
- Preview muestra banners del día seleccionado

**TAB DISEÑO:**
- Controles: Logo upload, color pickers, font selector, QR generator
- Preview se actualiza con cambios en tiempo real

**TAB ANALYTICS:**
- Stat cards grid, gráfico de línea, tabla de items populares
- Números destacados en coral-500

**COMPONENTES:**
- Buttons: Primary (coral), Secondary (gray), Ghost (transparent)
- Inputs: con focus ring coral, radius 8px
- Cards: white/dark-surface, shadow md→lg on hover
- Modals: backdrop blur, center screen, shadow 2xl
- Toasts: top-right, auto-dismiss 5s

**RESPONSIVE:**
- Desktop (3 cols) → Tablet (2 cols) → Mobile (1 col + modal preview)

**MICROINTERACCIONES:**
- Hover: scale 1.02, shadow upgrade
- Accordions: smooth expand 300ms
- Drag & drop: opacity 0.5, dashed border on target

**ENTREGABLES:**
- Design system completo (colores, typo, componentes)
- 30+ componentes reutilizables con variantes dark/light
- 4 tabs principales en desktop + mobile
- Prototipo interactivo básico

Inspiración: Notion (organización) + Linear (minimalismo) + Canva (amigable). **Clave: Luminoso, espacioso, colorido pero sutil, NO corporativo.**"

---

**Versión:** 2.0 Final - Menunu + Lealta Hybrid  
**Fecha:** Octubre 2025  
**Autor:** Equipo Menunu/Lealta
