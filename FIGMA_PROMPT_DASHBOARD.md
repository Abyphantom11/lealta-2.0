# 🎨 Prompt para Diseño en Figma - Dashboard Menunu

## 📊 Dashboard de Administración - Owner

---

## 🎯 PROMPT COMPLETO PARA FIGMA/IA

```
Design a modern, light-mode dashboard for a digital menu SaaS platform called "Menunu".

TECHNICAL STACK (IMPORTANT - Design must be compatible with):
- Framework: Next.js 14+ (App Router with React Server Components)
- Styling: Tailwind CSS v3+ (utility-first, responsive classes)
- Components: shadcn/ui (Radix UI primitives + Tailwind)
- Typography: next/font (Poppins & DM Sans with font optimization)
- Icons: Lucide React (tree-shakeable, TypeScript)
- Charts: Recharts (React charts library)
- Animations: Framer Motion (for smooth transitions)
- Grid: CSS Grid + Flexbox (NO Bootstrap, NO Material UI)

DESIGN CONSTRAINTS FOR DEVELOPMENT:
- All components must map to shadcn/ui components
- Use Tailwind spacing scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64px
- Breakpoints: sm(640px), md(768px), lg(1024px), xl(1280px), 2xl(1536px)
- Design for auto-layout (converts to flex/grid easily)
- Avoid absolute positioning (use flex/grid instead)
- All interactive elements: min 44px height (touch-friendly)

STYLE & MOOD:
- Light, airy, and welcoming aesthetic
- Soft shadows and rounded corners (8-12px radius)
- Spacious layout with plenty of white space
- Color palette: Coral pink (#FF6B9D) as primary, Lavender (#C5A0F9) as secondary, Honey gold (#FEC368) as accent
- Background: Cream (#FFFBF5)
- Typography: Poppins for headings, DM Sans for body text
- Icons: Lucide style (rounded, friendly)
- Overall vibe: Approachable, not corporate. Like Notion meets Canva

LAYOUT STRUCTURE:
- Top navigation bar (60px height) with logo, main navigation, and user avatar
- Main content area split into: 
  * Left side (60%): Metrics cards and quick actions
  * Right side (40%): Live phone preview of the menu
- Grid-based layout with 24px spacing between cards

TOP NAVIGATION BAR:
- Left: "menunu" logo (lowercase, playful font)
- Center: Navigation tabs (Menú, Diseño, Analytics, QR Code)
- Right: Plan badge (PRO), Notifications bell, User avatar with dropdown

METRICS CARDS TO INCLUDE (priority order):

1. HERO STATS ROW (3 cards horizontal):
   - Total Views (last 30 days)
     * Large number (e.g., "2,847")
     * Small trend indicator ("+12% vs last month")
     * Icon: Eye
   
   - Menu Items
     * Number of items (e.g., "42 items")
     * Small text: "En 8 categorías"
     * Icon: Utensils
   
   - Active Categories
     * Number (e.g., "8")
     * Small text: "3 subcategorías"
     * Icon: Folder

2. VIEWS GRAPH (large card):
   - Title: "Visitas al menú"
   - Time selector: [7d] [30d] [90d] [1y]
   - Line/area chart showing daily views
   - Smooth curve, gradient fill
   - Y-axis: number of views
   - X-axis: dates
   - Hover state: tooltip with exact numbers
   - Color: Gradient from coral to lavender

3. TOP ITEMS CARD:
   - Title: "Productos más vistos"
   - List of top 5 items:
     * Small thumbnail image
     * Item name
     * Category badge (small pill)
     * View count with icon
     * Mini bar chart showing relative popularity
   - Card style: Light background, soft shadow

4. SEARCH TRENDS CARD:
   - Title: "Búsquedas populares"
   - List of top search terms:
     * Search query text
     * Number of searches
     * Trend indicator (up/down/same)
   - Useful for menu optimization
   - Icon: Search

5. QUICK ACTIONS WIDGET:
   - Title: "Acciones rápidas"
   - Grid of 4 buttons:
     * "Agregar Item" (Plus icon)
     * "Nueva Categoría" (Folder Plus icon)
     * "Editar Diseño" (Palette icon)
     * "Descargar QR" (QR Code icon)
   - Buttons: Soft colored backgrounds, icons + text

6. RECENT ACTIVITY FEED:
   - Title: "Actividad reciente"
   - Timeline list:
     * Timestamp (e.g., "Hace 2 horas")
     * Action description (e.g., "Agregaste 'Pizza Margarita'")
     * User avatar (if team feature)
   - Max 5 items, scroll if more
   - Subtle gray dividers

PHONE PREVIEW (RIGHT SIDEBAR):
- iPhone mockup (375x812px)
- Live preview of the public menu
- Sticky position (follows scroll)
- Shows real menu with current branding
- "Vista en vivo" label at top
- Small "Actualizar" button

ADDITIONAL METRICS (SECONDARY):

7. PEAK HOURS HEATMAP:
   - Title: "Horarios pico"
   - Grid showing busiest hours (7am-11pm)
   - Days of week (Mon-Sun) on Y-axis
   - Hours on X-axis
   - Color intensity: Light coral (low) to Dark coral (high)
   - Helps understand when people view the menu

8. DEVICE BREAKDOWN:
   - Title: "Dispositivos"
   - Donut chart or simple percentage bars:
     * Mobile: 78%
     * Desktop: 18%
     * Tablet: 4%
   - Icons for each device type

9. QR SCANS VS DIRECT VISITS:
   - Title: "Fuente de visitas"
   - Split view:
     * QR Code scans: 65%
     * Direct URL: 35%
   - Stacked bar or simple comparison

10. MENU HEALTH SCORE:
    - Title: "Salud del menú"
    - Score out of 100 (e.g., "87/100")
    - Breakdown:
      * "15 items con imagen ✓"
      * "3 items sin precio ⚠️"
      * "2 categorías vacías ⚠️"
    - Action button: "Optimizar menú"

STATES TO DESIGN:
- Empty state (first-time user, no data yet)
- Loading state (skeleton screens)
- Error state (if data fails to load)
- Mobile responsive version (collapsed sidebar)

INTERACTIONS TO INDICATE:
- Hover states on cards (subtle lift + shadow increase)
- Active navigation tab (underline or background)
- Dropdown menus (user avatar, time selectors)
- Tooltips on graph data points

DESIGN PRINCIPLES:
1. Data should be scannable at a glance
2. Most important metrics (views, top items) prominent
3. Actionable insights, not just numbers
4. Progressive disclosure (don't overwhelm)
5. Consistent card style throughout
6. Use color sparingly for emphasis
7. Icons reinforce meaning
8. Empty states guide next action

EXPORT SPECS:
- Desktop: 1440px width (standard laptop)
- Tablet: 768px width
- Mobile: 375px width
- Components: Export as reusable components
- Spacing system: 4px base (4, 8, 12, 16, 24, 32, 48)
```

---

## 📊 Métricas Clave Priorizadas

### **TIER 1: Métricas Críticas (Siempre visibles)**

#### 1. **Total de Visitas** 🎯
**Por qué es importante:**
- KPI #1 para medir engagement
- Indica si la promoción del menú funciona
- Trend month-over-month muestra crecimiento

**Datos a mostrar:**
```
┌─────────────────────────────┐
│  👁️  Total de Visitas      │
│                             │
│     2,847                   │
│     +12% vs mes pasado      │
│                             │
│     Hoy: 94 visitas         │
└─────────────────────────────┘
```

---

#### 2. **Productos Más Vistos** 🏆
**Por qué es importante:**
- Identifica qué items generan más interés
- Ayuda a optimizar inventario
- Puede sugerir qué promocionar

**Datos a mostrar:**
```
┌─────────────────────────────────────┐
│  🏆 Productos más vistos           │
│                                     │
│  1. [img] Pizza Margarita           │
│     Platos • 142 vistas             │
│     ████████████░░ 68%              │
│                                     │
│  2. [img] Hamburguesa Clásica       │
│     Platos • 98 vistas              │
│     ████████░░░░░░ 47%              │
│                                     │
│  3. [img] Cerveza Artesanal         │
│     Bebidas • 87 vistas             │
│     ███████░░░░░░░ 42%              │
│                                     │
│  4. [img] Ensalada César            │
│     Entradas • 64 vistas            │
│     █████░░░░░░░░░ 31%              │
│                                     │
│  5. [img] Cheesecake                │
│     Postres • 51 vistas             │
│     ████░░░░░░░░░░ 24%              │
└─────────────────────────────────────┘
```

**Insight accionable:**
- "Pizza Margarita es tu estrella ⭐ - Considera agregarla como 'Favorito del Chef'"

---

#### 3. **Gráfico de Visitas** 📈
**Por qué es importante:**
- Visualiza tendencias en el tiempo
- Identifica días/períodos de alto tráfico
- Ayuda a planear promociones

**Vista:**
```
┌───────────────────────────────────────────┐
│  📈 Visitas al menú                       │
│  [7d] [30d] [90d] [Todo]                  │
│                                           │
│  200│        ╱╲                           │
│     │       ╱  ╲      ╱╲                 │
│  150│      ╱    ╲    ╱  ╲                │
│     │     ╱      ╲  ╱    ╲               │
│  100│    ╱        ╲╱      ╲╱╲            │
│     │   ╱                    ╲           │
│   50│  ╱                      ╲          │
│     └─────────────────────────────────   │
│      L  M  M  J  V  S  D                 │
│                                           │
│  Promedio: 127 visitas/día               │
│  Mejor día: Viernes (198 visitas)        │
└───────────────────────────────────────────┘
```

---

### **TIER 2: Métricas Importantes (Segunda fila)**

#### 4. **Búsquedas Populares** 🔍
**Por qué es importante:**
- Entiende qué buscan tus clientes
- Identifica productos faltantes
- Optimiza nombres de productos

**Datos:**
```
┌─────────────────────────────────┐
│  🔍 Búsquedas populares         │
│                                 │
│  1. "pizza"        48 búsquedas │
│     ↑ +12                       │
│                                 │
│  2. "vegano"       32 búsquedas │
│     ↑ +8                        │
│                                 │
│  3. "sin gluten"   24 búsquedas │
│     → igual                     │
│                                 │
│  4. "promociones"  19 búsquedas │
│     ↓ -3                        │
│                                 │
│  5. "cerveza"      15 búsquedas │
│     ↑ +5                        │
└─────────────────────────────────┘
```

**Insight accionable:**
- "32 personas buscaron 'vegano' - ¿Tienes opciones veganas destacadas?"

---

#### 5. **Horarios Pico** ⏰
**Por qué es importante:**
- Identifica cuándo la gente consulta el menú
- Ayuda a programar promociones
- Optimiza horarios de atención

**Vista:**
```
┌─────────────────────────────────────┐
│  ⏰ Horarios pico                   │
│                                     │
│         8am 12pm 4pm  8pm 12am      │
│  Lun    ░░░ ████ ███  ████ ░░░     │
│  Mar    ░░░ ████ ███  █████ ░░░    │
│  Mie    ░░░ ████ ███  █████ ░░░    │
│  Jue    ░░░ ████ ████ █████ ██░    │
│  Vie    ░░░ ████ ████ █████ ███    │
│  Sab    ░░░ ████ ████ █████ ████   │
│  Dom    ░░░ ████ ███  ████ ███░    │
│                                     │
│  Hora más activa: Viernes 8-10pm   │
└─────────────────────────────────────┘
```

---

#### 6. **Salud del Menú** 💚
**Por qué es importante:**
- Gamificación para completar el menú
- Identifica mejoras rápidas
- Aumenta calidad del menú

**Vista:**
```
┌─────────────────────────────────────┐
│  💚 Salud del menú                  │
│                                     │
│      ██████████████████░░  87/100   │
│                                     │
│  ✓ 42 items con descripción         │
│  ✓ 35 items con imagen              │
│  ✓ 8 categorías activas             │
│  ⚠️ 7 items sin imagen              │
│  ⚠️ 2 items sin precio              │
│                                     │
│  [Optimizar menú] →                 │
└─────────────────────────────────────┘
```

---

### **TIER 3: Métricas Avanzadas (Analytics tab)**

#### 7. **Fuente de Visitas**
```
┌─────────────────────────────┐
│  📱 Fuente de visitas       │
│                             │
│  QR Code      65%  ████████ │
│  URL Directa  28%  ███░░░░░ │
│  Redes        7%   █░░░░░░░ │
└─────────────────────────────┘
```

#### 8. **Dispositivos**
```
┌─────────────────────────────┐
│  📱 Dispositivos            │
│                             │
│  📱 Móvil     78%           │
│  💻 Desktop   18%           │
│  📱 Tablet     4%           │
└─────────────────────────────┘
```

#### 9. **Categorías Populares**
```
┌─────────────────────────────┐
│  📂 Categorías populares    │
│                             │
│  Platos Principales  45%    │
│  Bebidas            32%     │
│  Postres            15%     │
│  Entradas            8%     │
└─────────────────────────────┘
```

#### 10. **Tasa de Rebote**
```
┌─────────────────────────────┐
│  ↩️ Engagement              │
│                             │
│  Tiempo promedio: 3m 42s    │
│  Visitas >1 min:    78%     │
│  Productos vistos:  4.2     │
└─────────────────────────────┘
```

---

## 🎨 Wireframe ASCII del Dashboard

```
┌─────────────────────────────────────────────────────────────────────────┐
│  [Logo] menunu    Menú  Diseño  Analytics  QR       [PRO] 🔔 [Avatar▼] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─ Dashboard ───────────────────────┐  ┌─ Vista en Vivo ─────────┐  │
│  │                                    │  │                         │  │
│  │  ┌─────────┐ ┌─────────┐ ┌──────┐│  │   ┌───────────────┐     │  │
│  │  │👁️ 2,847 │ │🍽️ 42    │ │📂 8  ││  │   │  iPhone Mock  │     │  │
│  │  │Visitas  │ │Items    │ │Cats  ││  │   │               │     │  │
│  │  │+12% ↑   │ │En 8 cat │ │3 sub ││  │   │  [MenuNunu]   │     │  │
│  │  └─────────┘ └─────────┘ └──────┘│  │   │               │     │  │
│  │                                    │  │   │  Categories:  │     │  │
│  │  ┌────────────────────────────────┐│  │   │  • Entradas   │     │  │
│  │  │ 📈 Visitas al menú             ││  │   │  • Platos     │     │  │
│  │  │ [7d] [30d] [90d] [1y]          ││  │   │  • Bebidas    │     │  │
│  │  │        ╱╲        ╱╲             ││  │   │  • Postres    │     │  │
│  │  │       ╱  ╲      ╱  ╲            ││  │   │               │     │  │
│  │  │      ╱    ╲    ╱    ╲           ││  │   │  Search: 🔍   │     │  │
│  │  │     ╱      ╲  ╱      ╲          ││  │   │               │     │  │
│  │  │    ╱        ╲╱        ╲         ││  │   └───────────────┘     │  │
│  │  │   L  M  M  J  V  S  D           ││  │                         │  │
│  │  └────────────────────────────────┘│  │   [Actualizar preview]  │  │
│  │                                    │  └─────────────────────────┘  │
│  │  ┌───────────────┐ ┌──────────────┐│                              │
│  │  │🏆 Top Items   │ │🔍 Búsquedas  ││                              │
│  │  │               │ │              ││                              │
│  │  │1. Pizza 142   │ │1. pizza  48  ││                              │
│  │  │2. Burger 98   │ │2. vegano 32  ││                              │
│  │  │3. Beer 87     │ │3. gluten 24  ││                              │
│  │  │4. Salad 64    │ │              ││                              │
│  │  └───────────────┘ └──────────────┘│                              │
│  │                                    │                              │
│  │  ┌────────────────────────────────┐│                              │
│  │  │ ⚡ Acciones rápidas            ││                              │
│  │  │                                ││                              │
│  │  │ [+ Item] [+ Cat] [🎨] [📱]    ││                              │
│  │  └────────────────────────────────┘│                              │
│  │                                    │                              │
│  └────────────────────────────────────┘                              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📐 Specs Técnicas para Figma

### Dimensiones:
```css
Canvas: 1440px × 900px (viewport estándar)
Top Nav: 1440px × 60px
Main Content: 1152px width (con padding 144px cada lado)
Phone Preview: 375px × 812px (iPhone 13 Pro)
Card Radius: 12px
Button Radius: 8px
```

### Grid System:
```
Columns: 12
Gutter: 24px
Margin: 144px
```

### Typography:
```
H1 (Dashboard title): Poppins 32px Bold
H2 (Card titles): Poppins 18px Semibold
Body: DM Sans 14px Regular
Small text: DM Sans 12px Regular
Numbers (metrics): Poppins 36px Bold
```

### Colors:
```css
/* Primary */
--coral: #FF6B9D
--lavender: #C5A0F9
--honey: #FEC368

/* Neutrals */
--cream: #FFFBF5
--cream-dark: #F5F1E8
--gray-800: #2D3436
--gray-600: #636E72
--gray-400: #B2BEC3

/* Semantic */
--success: #00B894
--warning: #FDCB6E
--error: #D63031
```

### Shadows:
```css
Card: 0 2px 8px rgba(0,0,0,0.08)
Card Hover: 0 4px 12px rgba(0,0,0,0.12)
Button: 0 1px 3px rgba(0,0,0,0.1)
```

---

## 🎯 Estados a Diseñar

### 1. **Empty State** (Usuario nuevo sin datos)
```
┌─────────────────────────────────┐
│                                 │
│        📊                       │
│                                 │
│    Aún no hay datos             │
│                                 │
│    Crea tu primer menú para     │
│    comenzar a ver estadísticas  │
│                                 │
│    [Crear mi menú] →            │
│                                 │
└─────────────────────────────────┘
```

### 2. **Loading State** (Skeleton)
```
┌─────────────────────────────────┐
│  ████████ ████░░░ ░░░░          │
│                                 │
│  ██████████████████░░░░         │
│  ██████░░░░░░░░░░░░             │
│  ░░░░░░░░░░                     │
└─────────────────────────────────┘
```

### 3. **Error State**
```
┌─────────────────────────────────┐
│        ⚠️                       │
│                                 │
│    Error cargando datos         │
│                                 │
│    [Reintentar]                 │
└─────────────────────────────────┘
```

---

## 💡 Insights Accionables (Smart Suggestions)

El dashboard debe mostrar sugerencias inteligentes basadas en los datos:

### Ejemplos:

```
┌─────────────────────────────────────────────┐
│  💡 Sugerencias                             │
│                                             │
│  • "Pizza Margarita" no tiene imagen       │
│    → [Agregar foto] →                      │
│                                             │
│  • 32 búsquedas de "vegano", pero solo     │
│    tienes 2 items veganos                  │
│    → [Agregar opciones veganas] →          │
│                                             │
│  • Tu menú recibe más visitas los viernes  │
│    8-10pm. ¿Consideras promociones?        │
│    → [Crear promoción] →                   │
└─────────────────────────────────────────────┘
```

---

## 📱 Responsive Breakpoints

```
Desktop:  1440px+ (full layout)
Laptop:   1024px  (condensed sidebar)
Tablet:   768px   (stacked layout, no preview)
Mobile:   375px   (single column, bottom nav)
```

---

## ✅ Checklist de Diseño

### Antes de comenzar:
- [ ] Instalar Poppins y DM Sans en Figma
- [ ] Crear color styles con los valores exactos
- [ ] Setup grid system (12 columns, 24px gutter)
- [ ] Importar iconos de Lucide (o Figma plugin)

### Durante el diseño:
- [ ] Mantener consistencia en spacing (múltiplos de 4)
- [ ] Usar auto-layout para todo (responsive)
- [ ] Nombrar layers claramente
- [ ] Crear componentes reutilizables (cards, buttons)
- [ ] Documentar interacciones (hover, active states)

### Al finalizar:
- [ ] Exportar specs para developers
- [ ] Crear prototype con flujos principales
- [ ] Validar accesibilidad (contraste, tamaños)
- [ ] Probar en diferentes tamaños de pantalla

---

**¿Listo para diseñar?** Copia el prompt principal y pégalo en:
- Figma AI (si está disponible)
- ChatGPT/Claude para generar más detalles
- Midjourney/Stable Diffusion para inspiración visual

**Próximo paso:** Crear los mockups high-fidelity siguiendo estas specs 🎨

---

## 🧩 Mapeo de Componentes: Figma → Código

### shadcn/ui Components a Usar:

#### Cards (Para métricas):
```tsx
// Figma: Card frame con border radius 12px
// Código:
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Total de Visitas</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-3xl font-bold">2,847</p>
    <p className="text-sm text-green-600">+12% vs mes pasado</p>
  </CardContent>
</Card>
```

#### Buttons:
```tsx
// Figma: Botón con bg coral, radius 8px, padding 16px
// Código:
import { Button } from "@/components/ui/button"

<Button variant="default" size="default">
  Crear Menú
</Button>

// Variants disponibles:
// - default (coral solid)
// - secondary (light gray)
// - ghost (transparent)
// - outline (border only)
```

#### Charts:
```tsx
// Figma: Área chart con gradient coral → lavender
// Código:
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

<ResponsiveContainer width="100%" height={300}>
  <LineChart data={data}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="date" />
    <YAxis />
    <Tooltip />
    <Line type="monotone" dataKey="views" stroke="#FF6B9D" strokeWidth={2} />
  </LineChart>
</ResponsiveContainer>
```

#### Tabs (Para navegación):
```tsx
// Figma: Tab navigation con underline activo
// Código:
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

<Tabs defaultValue="menu">
  <TabsList>
    <TabsTrigger value="menu">Menú</TabsTrigger>
    <TabsTrigger value="design">Diseño</TabsTrigger>
    <TabsTrigger value="analytics">Analytics</TabsTrigger>
  </TabsList>
</Tabs>
```

#### Avatar (User profile):
```tsx
// Figma: Circle con imagen + dropdown
// Código:
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

<DropdownMenu>
  <DropdownMenuTrigger>
    <Avatar>
      <AvatarImage src="/avatar.jpg" />
      <AvatarFallback>AB</AvatarFallback>
    </Avatar>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Perfil</DropdownMenuItem>
    <DropdownMenuItem>Configuración</DropdownMenuItem>
    <DropdownMenuItem>Cerrar sesión</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

#### Badge (Para tags, pills):
```tsx
// Figma: Small pill con bg lavender
// Código:
import { Badge } from "@/components/ui/badge"

<Badge variant="secondary">PRO</Badge>
<Badge variant="outline">Bebidas</Badge>
```

#### Skeleton (Loading states):
```tsx
// Figma: Gray blocks para loading
// Código:
import { Skeleton } from "@/components/ui/skeleton"

<Skeleton className="h-12 w-full" />
<Skeleton className="h-4 w-3/4" />
```

---

## 📐 Tailwind CSS Classes Guide

### Spacing (Usar múltiplos de 4):
```css
p-0    /* 0px */
p-1    /* 4px */
p-2    /* 8px */
p-3    /* 12px */
p-4    /* 16px */
p-6    /* 24px */
p-8    /* 32px */
p-12   /* 48px */
p-16   /* 64px */

/* Aplicar a: padding (p), margin (m), gap (gap) */
/* Direcciones: t (top), r (right), b (bottom), l (left), x (horizontal), y (vertical) */
```

### Colors (Theme personalizado):
```css
/* Figma: Use estos colores exactos */
bg-coral      /* #FF6B9D (primary) */
bg-lavender   /* #C5A0F9 (secondary) */
bg-honey      /* #FEC368 (accent) */
bg-cream      /* #FFFBF5 (background) */
bg-cream-dark /* #F5F1E8 (card bg) */

text-gray-800 /* #2D3436 (text primary) */
text-gray-600 /* #636E72 (text secondary) */
text-gray-400 /* #B2BEC3 (borders) */

/* Semantic */
bg-success    /* #00B894 */
bg-warning    /* #FDCB6E */
bg-error      /* #D63031 */
```

### Responsive Design:
```css
/* Mobile First approach */
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  /* 1 column móvil, 2 tablet, 3 desktop */
</div>

/* Breakpoints en Figma frames: */
/* Mobile:  375px  (sm) */
/* Tablet:  768px  (md) */
/* Laptop:  1024px (lg) */
/* Desktop: 1440px (xl) */
```

### Shadows (Predefinidos):
```css
shadow-sm     /* Card default */
shadow-md     /* Card hover */
shadow-lg     /* Modals */
shadow-xl     /* Dropdowns */
shadow-none   /* Remove shadow */
```

### Border Radius:
```css
rounded-none  /* 0px */
rounded-sm    /* 2px */
rounded       /* 4px */
rounded-md    /* 6px */
rounded-lg    /* 8px */
rounded-xl    /* 12px */
rounded-2xl   /* 16px */
rounded-full  /* 9999px (circle) */
```

---

## 🎨 Design Tokens para Figma

### 1. Crear Color Styles:

```
Nombre en Figma           Valor HEX    Variable Tailwind
──────────────────────────────────────────────────────────
Primary/Coral             #FF6B9D      bg-coral
Primary/Coral-Light       #FF8AB3      bg-coral/80
Primary/Coral-Dark        #E55485      bg-coral/120

Secondary/Lavender        #C5A0F9      bg-lavender
Secondary/Lavender-Light  #D9BFFA      bg-lavender/80

Accent/Honey              #FEC368      bg-honey

Background/Cream          #FFFBF5      bg-cream
Background/Cream-Dark     #F5F1E8      bg-cream-dark

Neutral/Gray-800          #2D3436      text-gray-800
Neutral/Gray-600          #636E72      text-gray-600
Neutral/Gray-400          #B2BEC3      border-gray-400

Semantic/Success          #00B894      bg-success
Semantic/Warning          #FDCB6E      bg-warning
Semantic/Error            #D63031      bg-error
```

### 2. Crear Text Styles:

```
Nombre                     Font           Size    Weight   Line Height
─────────────────────────────────────────────────────────────────────
Display/Large              Poppins        48px    Bold     1.2
Display/Medium             Poppins        36px    Bold     1.2

Heading/H1                 Poppins        32px    Bold     1.3
Heading/H2                 Poppins        24px    Semibold 1.3
Heading/H3                 Poppins        20px    Semibold 1.4
Heading/H4                 Poppins        18px    Medium   1.4

Body/Large                 DM Sans        16px    Regular  1.5
Body/Default               DM Sans        14px    Regular  1.5
Body/Small                 DM Sans        12px    Regular  1.5

Label/Default              DM Sans        14px    Medium   1.4
Label/Small                DM Sans        12px    Medium   1.4

Number/Metric              Poppins        36px    Bold     1.2
Number/Small               Poppins        24px    Bold     1.2
```

### 3. Crear Effect Styles (Shadows):

```
Nombre                Drop Shadow
──────────────────────────────────────
Shadow/Card-Default   X:0 Y:2 Blur:8  Spread:0 Color:#00000014 (8% black)
Shadow/Card-Hover     X:0 Y:4 Blur:12 Spread:0 Color:#0000001F (12% black)
Shadow/Button         X:0 Y:1 Blur:3  Spread:0 Color:#0000001A (10% black)
Shadow/Dropdown       X:0 Y:8 Blur:16 Spread:0 Color:#00000029 (16% black)
```

---

## 🔧 Configuración del Proyecto Figma

### Plugins Recomendados:

1. **Tailwind CSS Color Generator**
   - Genera paleta completa desde color base
   - Exporta como CSS variables

2. **Iconify**
   - Acceso a Lucide icons
   - Buscar: "lucide"
   - Usar variante "rounded"

3. **Stark** (Accesibilidad)
   - Chequear contraste de colores
   - Asegurar WCAG AA compliance

4. **Autoflow**
   - Crear diagramas de flujo
   - Documentar interacciones

5. **Content Reel**
   - Generar datos de prueba realistas
   - Nombres, números, textos

6. **HTML to Figma** (Dev Mode)
   - Inspector de código
   - Exportar CSS/Tailwind classes

---

## 📦 Estructura de Frames en Figma

```
Menunu Dashboard (Page)
│
├── 🎨 Design System (Frame)
│   ├── Colors
│   ├── Typography
│   ├── Shadows
│   └── Components
│       ├── Buttons
│       ├── Cards
│       ├── Inputs
│       └── Icons
│
├── 🖥️ Desktop (1440px)
│   ├── Dashboard - Home
│   ├── Dashboard - Menu Editor
│   ├── Dashboard - Design
│   ├── Dashboard - Analytics
│   └── Dashboard - Empty State
│
├── 📱 Tablet (768px)
│   ├── Dashboard - Home
│   └── Dashboard - Collapsed
│
├── 📱 Mobile (375px)
│   ├── Dashboard - Home
│   └── Dashboard - Bottom Nav
│
└── 🧩 Components (Frame)
    ├── MetricCard
    ├── ChartCard
    ├── TopItemsCard
    ├── PhonePreview
    └── QuickActions
```

---

## 🎯 Auto Layout Settings (Importante para Developers)

### Card Component:
```
Frame: "MetricCard"
├── Auto Layout: Vertical
├── Padding: 24px (p-6)
├── Gap: 16px (gap-4)
├── Width: Fill container
├── Height: Hug contents
├── Border Radius: 12px (rounded-xl)
├── Fill: #FFFFFF
├── Effect: Shadow/Card-Default
```

### Button Component:
```
Frame: "Button"
├── Auto Layout: Horizontal
├── Padding Horizontal: 16px (px-4)
├── Padding Vertical: 12px (py-3)
├── Gap: 8px (gap-2)
├── Width: Hug contents
├── Height: 44px (h-11)
├── Border Radius: 8px (rounded-lg)
├── Fill: #FF6B9D (bg-coral)
```

### Grid Layout (Main Content):
```
Frame: "Dashboard"
├── Auto Layout: Horizontal
├── Padding: 24px (p-6)
├── Gap: 24px (gap-6)
├── Width: 1440px
├── Height: Fill viewport
│
├── Left Column (60%)
│   ├── Auto Layout: Vertical
│   ├── Gap: 24px
│   └── Cards...
│
└── Right Column (40%)
    ├── Auto Layout: Vertical
    └── Phone Preview (sticky)
```

---

## 🚀 Export Settings para Developers

### Para cada componente:
1. **Nombrar layers claramente:**
   ```
   ✅ Correcto: "MetricCard/Header/Title"
   ❌ Incorrecto: "Rectangle 47"
   ```

2. **Usar Auto Layout siempre:**
   - Convierte automáticamente a Flexbox
   - Facilita responsive design

3. **Export Assets:**
   ```
   Icons:    SVG (para Lucide)
   Images:   WebP (optimizado)
   Logos:    SVG (escalable)
   ```

4. **Dev Mode handoff:**
   - Activar "Dev Mode" en Figma
   - Developers pueden inspeccionar:
     * Tailwind classes sugeridas
     * Spacing values
     * Color variables
     * Typography

---

## 📝 Anotaciones para el Developer

En cada frame importante, agregar comentarios:

```
┌─────────────────────────────────┐
│  💬 NOTA PARA DEV:              │
│                                 │
│  Este card usa:                 │
│  - shadcn/ui Card component     │
│  - bg-white shadow-sm           │
│  - p-6 rounded-xl               │
│  - Recharts LineChart           │
│                                 │
│  Data source:                   │
│  - GET /api/analytics/views     │
│  - React Query hook             │
└─────────────────────────────────┘
```

---

## 🔄 Sync Design → Code Workflow

### Fase de Diseño (Figma):
1. ✅ Diseñar con auto-layout
2. ✅ Usar design tokens consistentes
3. ✅ Nombrar layers semánticamente
4. ✅ Anotar componentes shadcn/ui
5. ✅ Documentar interacciones

### Fase de Desarrollo:
1. ✅ Extraer componentes de shadcn/ui
2. ✅ Aplicar clases Tailwind del diseño
3. ✅ Conectar con APIs (React Query)
4. ✅ Implementar estados (loading, error)
5. ✅ Agregar animaciones (Framer Motion)

### Loop de Feedback:
```
Figma Design → Dev → QA → Feedback → Update Figma → Repeat
```

---

## 🎨 Ejemplo: Card de Métrica Completo

### En Figma:
```
Frame: "MetricCard/TotalViews"
├── Auto Layout: Vertical
├── Padding: 24px
├── Gap: 12px
├── Width: Fill (responsive)
├── Height: Hug (auto)
│
├── Icon (Eye)
│   └── Lucide icon, 24px, coral
│
├── Text: "Total de Visitas"
│   └── Body/Default, gray-600
│
├── Number: "2,847"
│   └── Number/Metric, gray-800
│
└── Badge: "+12% ↑"
    └── Text: success color
```

### En Código:
```tsx
import { Card, CardContent } from "@/components/ui/card"
import { Eye, TrendingUp } from "lucide-react"

export function MetricCard() {
  return (
    <Card className="p-6">
      <CardContent className="space-y-3">
        <Eye className="h-6 w-6 text-coral" />
        <p className="text-sm text-gray-600">Total de Visitas</p>
        <p className="text-3xl font-bold text-gray-800">2,847</p>
        <div className="flex items-center gap-1 text-sm text-success">
          <TrendingUp className="h-4 w-4" />
          <span>+12% vs mes pasado</span>
        </div>
      </CardContent>
    </Card>
  )
}
```

---

## ✅ Checklist Final: Diseño Listo para Desarrollo

Antes de pasar a código, asegurar:

- [ ] Todos los frames tienen auto-layout
- [ ] Spacing usa múltiplos de 4px (Tailwind scale)
- [ ] Colores matchean con design tokens
- [ ] Tipografía usa Poppins/DM Sans correctamente
- [ ] Componentes mapeados a shadcn/ui
- [ ] Icons son de Lucide
- [ ] Responsive breakpoints definidos (375, 768, 1024, 1440)
- [ ] Estados diseñados (hover, active, disabled, loading, error, empty)
- [ ] Anotaciones para developers agregadas
- [ ] Export settings configurados
- [ ] Dev Mode activado con CSS inspector

---

**Con esto, el handoff Figma → Código será 10x más rápido y preciso** 🚀
