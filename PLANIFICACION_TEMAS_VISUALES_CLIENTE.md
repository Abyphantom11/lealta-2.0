# 🎨 Planificación: Sistema de Temas Visuales para Portal Cliente

## 📍 Punto de Respaldo Creado

**Commit:** `e6d105c` - "feat: Implementación completa PWA iOS + Limpieza console logs + Mejoras Reservas"  
**Rama:** `reservas-funcional`  
**GitHub:** ✅ Subido exitosamente  
**Fecha:** Enero 2025

---

## 🎯 Objetivo

Implementar un sistema de temas visuales para el portal cliente similar al sistema de QR personalizado, permitiendo a los negocios elegir entre 3 estilos:

1. **Elegante** 🎩 - Diseño sofisticado y premium
2. **Moderno** 🚀 - Diseño minimalista y tech
3. **Sencillo** 📱 - Diseño limpio y funcional

---

## 📊 Componentes a Rediseñar

### 1. Balance de Puntos
**Ubicación:** Dashboard principal del cliente

**Diseño Actual:**
```tsx
<div className="bg-gradient-to-br from-purple-500 to-pink-500">
  Balance de Puntos
  ---
  Vista previa del cliente
</div>
```

**Propuesta por Tema:**

#### Elegante 🎩
- Gradientes sutiles con colores del branding
- Tipografía serif elegante
- Bordes redondeados suaves
- Animaciones smooth
- Efectos de glass morphism
- Iconografía detallada

#### Moderno 🚀
- Colores planos y vibrantes
- Tipografía sans-serif bold
- Geometría angular
- Animaciones rápidas
- Sombras pronunciadas
- Iconografía minimalista

#### Sencillo 📱
- Colores pasteles
- Tipografía clara y legible
- Bordes simples
- Sin animaciones complejas
- Diseño flat
- Iconografía simple

---

### 2. Tarjeta de Promociones
**Ubicación:** Sección de promociones activas

**Componentes:**
- Imagen de producto
- Título de promoción
- Descripción
- Badge de descuento/beneficio
- CTA button

**Variaciones por tema:**
- **Elegante:** Cards con overlay gradiente, hover effects sutiles
- **Moderno:** Cards con bordes neón, hover effects pronunciados
- **Sencillo:** Cards con bordes simples, hover scale suave

---

### 3. Sistema de Recompensas
**Ubicación:** Sección de recompensas disponibles

**Componentes:**
- Lista de recompensas
- Íconos de recompensas
- Puntos requeridos
- Estado (disponible/bloqueada)
- Progreso hacia recompensa

**Variaciones por tema:**
- **Elegante:** Progress bars con gradientes, animaciones fluidas
- **Moderno:** Progress bars geométricas, animaciones tech
- **Sencillo:** Progress bars básicas, transiciones simples

---

### 4. Ofertas del Día (Favorito del Día)
**Ubicación:** Sección destacada en dashboard

**Componentes:**
- Imagen del producto
- Badge "Favorito del Día"
- Timer countdown
- CTA de acción

**Variaciones por tema:**
- **Elegante:** Badge dorado, timer con números elegantes
- **Moderno:** Badge neón, timer digital futurista
- **Sencillo:** Badge plano, timer numérico simple

---

## 🏗️ Arquitectura Propuesta

### 1. Tipo de Tema (TypeScript)

```typescript
// src/types/client-theme.ts
export type ClientThemeStyle = 'elegante' | 'moderno' | 'sencillo';

export interface ClientTheme {
  id: string;
  businessId: string;
  style: ClientThemeStyle;
  
  // Colores personalizables
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  
  // Configuraciones específicas
  animations?: boolean;
  roundness?: 'low' | 'medium' | 'high';
  
  createdAt: Date;
  updatedAt: Date;
}
```

---

### 2. Schema de Prisma

```prisma
// Agregar a prisma/schema.prisma

model ClientTheme {
  id          String   @id @default(cuid())
  businessId  String   @unique
  business    Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
  
  style       String   @default("moderno") // 'elegante', 'moderno', 'sencillo'
  
  // Colores opcionales (JSON)
  colors      Json?
  
  // Configuraciones
  animations  Boolean  @default(true)
  roundness   String   @default("medium") // 'low', 'medium', 'high'
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@map("client_themes")
}
```

---

### 3. Componentes a Crear

#### ThemeProvider
```tsx
// src/providers/ClientThemeProvider.tsx
'use client';

import { createContext, useContext } from 'react';
import type { ClientTheme } from '@/types/client-theme';

interface ClientThemeContextValue {
  theme: ClientTheme;
  style: 'elegante' | 'moderno' | 'sencillo';
}

const ClientThemeContext = createContext<ClientThemeContextValue | null>(null);

export function ClientThemeProvider({ 
  children, 
  theme 
}: { 
  children: React.ReactNode; 
  theme: ClientTheme 
}) {
  return (
    <ClientThemeContext.Provider value={{ theme, style: theme.style as any }}>
      {children}
    </ClientThemeContext.Provider>
  );
}

export function useClientTheme() {
  const context = useContext(ClientThemeContext);
  if (!context) throw new Error('useClientTheme must be used within ClientThemeProvider');
  return context;
}
```

#### Componentes Temáticos
```tsx
// src/components/cliente/themed/ThemedBalanceCard.tsx
// src/components/cliente/themed/ThemedPromoCard.tsx
// src/components/cliente/themed/ThemedRewardCard.tsx
// src/components/cliente/themed/ThemedFavoritoDelDia.tsx
```

---

### 4. Hook Personalizado

```typescript
// src/hooks/useClientTheme.ts
import { useState, useEffect } from 'react';
import type { ClientTheme } from '@/types/client-theme';

export function useClientTheme(businessId: string) {
  const [theme, setTheme] = useState<ClientTheme | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    async function fetchTheme() {
      try {
        const response = await fetch(`/api/business/${businessId}/client-theme`);
        const data = await response.json();
        setTheme(data.theme || getDefaultTheme(businessId));
      } catch (error) {
        console.error('Error fetching theme:', error);
        setTheme(getDefaultTheme(businessId));
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchTheme();
  }, [businessId]);
  
  return { theme, isLoading };
}

function getDefaultTheme(businessId: string): ClientTheme {
  return {
    id: 'default',
    businessId,
    style: 'moderno',
    animations: true,
    roundness: 'medium',
    createdAt: new Date(),
    updatedAt: new Date()
  };
}
```

---

### 5. API Routes

```typescript
// src/app/api/business/[businessId]/client-theme/route.ts

// GET - Obtener tema actual
// PUT - Actualizar tema
// POST - Crear tema nuevo
```

---

### 6. Panel de Administración

**Ubicación:** `/[businessId]/admin/configuracion/temas-cliente`

**Características:**
- Vista previa en tiempo real de los 3 temas
- Selector de tema activo
- Personalizador de colores (opcional)
- Toggle de animaciones
- Selector de roundness (bordes redondeados)
- Preview side-by-side del portal cliente

**Componentes:**
```tsx
// src/app/[businessId]/admin/configuracion/temas-cliente/page.tsx
// src/components/admin-v2/configuracion/ClientThemeConfig.tsx
// src/components/admin-v2/configuracion/ThemePreview.tsx
// src/components/admin-v2/configuracion/ThemeSelector.tsx
```

---

## 🎨 Sistema de Estilos

### Variantes de Tailwind por Tema

```typescript
// src/utils/theme-variants.ts

export const themeVariants = {
  balanceCard: {
    elegante: "bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 rounded-2xl shadow-2xl border border-slate-600/50 backdrop-blur-lg",
    moderno: "bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-xl border-2 border-purple-400",
    sencillo: "bg-white rounded-md shadow-md border border-gray-200"
  },
  
  promoCard: {
    elegante: "group hover:scale-[1.02] transition-all duration-500 bg-white/90 backdrop-blur rounded-xl overflow-hidden shadow-lg border border-gray-200/50",
    moderno: "group hover:translate-y-[-4px] transition-transform duration-200 bg-gradient-to-br from-white to-gray-50 rounded-lg overflow-hidden shadow-lg border-l-4 border-purple-500",
    sencillo: "bg-white rounded-md overflow-hidden shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
  },
  
  rewardCard: {
    elegante: "bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl p-6 shadow-lg border border-amber-200/50",
    moderno: "bg-white rounded-lg p-5 shadow-xl border-2 border-transparent hover:border-purple-500 transition-all",
    sencillo: "bg-gray-50 rounded-md p-4 border border-gray-200"
  }
};

export function getThemeClass(component: keyof typeof themeVariants, style: ClientThemeStyle): string {
  return themeVariants[component][style];
}
```

---

## 📱 Vista Previa en Tiempo Real (Similar a QR)

### Componente de Preview

```tsx
// src/components/admin-v2/configuracion/ClientPortalPreview.tsx

'use client';

import { useState } from 'react';
import ThemedBalanceCard from '@/components/cliente/themed/ThemedBalanceCard';
import ThemedPromoCard from '@/components/cliente/themed/ThemedPromoCard';
import type { ClientThemeStyle } from '@/types/client-theme';

export default function ClientPortalPreview({ 
  selectedStyle 
}: { 
  selectedStyle: ClientThemeStyle 
}) {
  return (
    <div className="space-y-6 p-6 bg-gray-50 rounded-lg">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold">Vista Previa</h3>
        <p className="text-sm text-gray-600">
          Estilo: <span className="font-bold capitalize">{selectedStyle}</span>
        </p>
      </div>
      
      {/* Mock de datos para preview */}
      <ThemedBalanceCard 
        style={selectedStyle}
        puntos={150}
        clientName="Juan Pérez"
      />
      
      <ThemedPromoCard 
        style={selectedStyle}
        title="2x1 en Hamburguesas"
        description="Válido de lunes a viernes"
        discount="50%"
      />
      
      {/* Más componentes... */}
    </div>
  );
}
```

---

## 🔄 Flujo de Implementación

### Fase 1: Infraestructura Base (2-3 horas)
- [ ] Crear tipo TypeScript `ClientTheme`
- [ ] Actualizar schema de Prisma con modelo `ClientTheme`
- [ ] Migrar base de datos
- [ ] Crear API routes (GET/POST/PUT)
- [ ] Crear `ClientThemeProvider`
- [ ] Crear hook `useClientTheme`

### Fase 2: Componentes Temáticos (3-4 horas)
- [ ] Crear variantes de estilos en `theme-variants.ts`
- [ ] Rediseñar `ThemedBalanceCard` con 3 estilos
- [ ] Rediseñar `ThemedPromoCard` con 3 estilos
- [ ] Rediseñar `ThemedRewardCard` con 3 estilos
- [ ] Rediseñar `ThemedFavoritoDelDia` con 3 estilos

### Fase 3: Panel Admin (2-3 horas)
- [ ] Crear página `/admin/configuracion/temas-cliente`
- [ ] Crear selector de temas con previews
- [ ] Implementar vista previa en tiempo real
- [ ] Crear formulario de personalización de colores
- [ ] Implementar guardado de configuración

### Fase 4: Integración (1-2 horas)
- [ ] Integrar `ClientThemeProvider` en layout de cliente
- [ ] Reemplazar componentes actuales con componentes temáticos
- [ ] Agregar fallback a tema "moderno" por defecto
- [ ] Testing en todos los temas

### Fase 5: Polish y Optimización (1-2 horas)
- [ ] Optimizar animaciones
- [ ] Verificar responsive en todos los temas
- [ ] Agregar transiciones entre temas
- [ ] Documentación de uso

---

## 🎯 Beneficios Esperados

### Para Negocios
- ✅ Mayor personalización de su portal
- ✅ Identidad visual consistente con su marca
- ✅ Diferenciación competitiva
- ✅ Flexibilidad sin conocimientos técnicos

### Para Clientes
- ✅ Experiencia visual mejorada
- ✅ Interfaz adaptada al estilo del negocio
- ✅ Mayor engagement
- ✅ Mejor usabilidad según preferencias

### Para el Sistema
- ✅ Reutilización de componentes
- ✅ Fácil mantenimiento
- ✅ Escalable a nuevos temas
- ✅ Consistencia arquitectónica con QR branding

---

## 🔍 Inspiración de Diseño

### Elegante 🎩
- **Referencias:** Apple Store, Luxury brands, High-end restaurants
- **Colores:** Blacks, grays, golds, deep purples
- **Tipografía:** Playfair Display, Cormorant, Crimson Text
- **Efectos:** Glass morphism, subtle shadows, smooth transitions

### Moderno 🚀
- **Referencias:** Stripe, Vercel, Linear, Modern SaaS
- **Colores:** Vibrant purples, pinks, blues, high contrast
- **Tipografía:** Inter, Poppins, Space Grotesk
- **Efectos:** Sharp shadows, neon borders, fast animations

### Sencillo 📱
- **Referencias:** Google Material, Apple Human Interface
- **Colores:** Whites, light grays, pastels
- **Tipografía:** Roboto, San Francisco, System fonts
- **Efectos:** Flat design, minimal shadows, simple transitions

---

## 📊 Comparación con QR Branding

| Característica | QR Branding | Client Theme System |
|---------------|-------------|---------------------|
| **Propósito** | Personalizar QR codes | Personalizar portal completo |
| **Ubicación** | Módulo reservas | Portal cliente |
| **Estilos** | 3 (elegante, moderno, sencillo) | 3 (mismos) |
| **Almacenamiento** | JSON en Business | Tabla ClientTheme |
| **Preview** | ✅ Vista previa QR | ✅ Vista previa portal |
| **Admin UI** | Configuración > QR | Configuración > Temas |
| **Complejidad** | Media | Alta |

---

## ⚠️ Consideraciones Técnicas

### Performance
- Usar CSS-in-JS solo cuando sea necesario
- Preferir Tailwind classes (compile-time)
- Lazy load de componentes pesados
- Memoizar componentes temáticos

### Compatibilidad
- Asegurar soporte en todos los navegadores
- Testing en iOS Safari (PWA)
- Testing en Android Chrome (PWA)
- Verificar animaciones en dispositivos low-end

### Fallbacks
- Tema por defecto si falla carga
- Graceful degradation de animaciones
- Imágenes placeholder

### Cache
- Cachear tema en localStorage
- Reducir calls a API
- Invalidar cache en cambio de tema

---

## 🚀 Próximos Pasos

1. **Revisar y aprobar planificación**
2. **Decidir alcance de Fase 1** (¿empezamos con infraestructura?)
3. **Crear mockups de diseño** (opcional)
4. **Iniciar implementación por fases**

---

## 📝 Notas

- Esta es una implementación GRANDE que modificará componentes visuales core
- Tenemos punto de respaldo en commit `e6d105c`
- Podemos implementar fase por fase
- Testing exhaustivo requerido en cada fase
- Considerar crear branch separada: `feature/client-themes`

---

*Planificación creada: Enero 2025*  
*Punto de respaldo: commit e6d105c*  
*Rama actual: reservas-funcional*  
*Estado: 📋 Pendiente de aprobación*
