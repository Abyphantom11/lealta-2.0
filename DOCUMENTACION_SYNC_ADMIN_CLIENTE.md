# 🔄 DOCUMENTACIÓN: COMPARACIÓN ADMIN-CLIENTE SYNC

## 📊 **ANÁLISIS DEL PROBLEMA**

### **✅ LO QUE FUNCIONA BIEN: MENÚ**

El sistema de **menú** funciona perfectamente en la sincronización admin→cliente porque:

#### **🔧 Arquitectura del Menú**
```
ADMIN EDITA:
📝 /admin/menu → Guarda via /api/admin/menu (PROTEGIDO)
                ↓
        💾 Prisma Database (menuCategory, menuProduct)
                ↓
CLIENTE RECIBE:
🔄 /api/menu/categorias (PÚBLICO)
🔄 /api/menu/productos?categoriaId=X (PÚBLICO)
```

#### **🎯 APIs del Menú Cliente (Público)**
```typescript
// /api/menu/categorias/route.ts
export async function GET() {
  const categorias = await prisma.menuCategory.findMany({
    where: { activo: true },
    orderBy: { orden: 'asc' }
  });
  return NextResponse.json(categorias);
}

// /api/menu/productos/route.ts  
export async function GET(request: NextRequest) {
  const categoriaId = searchParams.get('categoriaId');
  const productos = await prisma.menuProduct.findMany({
    where: { categoryId: categoriaId, disponible: true }
  });
  return NextResponse.json(productos);
}
```

#### **📱 Carga del Menú en Cliente**
```typescript
// AuthHandler.tsx - línea 467
const loadMenuCategories = useCallback(async () => {
  const response = await fetch('/api/menu/categorias');
  if (response.ok) {
    const data = await response.json();
    setMenuCategories(data);
  }
}, []);

const loadCategoryProducts = useCallback(async (categoryId: string) => {
  const response = await fetch(`/api/menu/productos?categoriaId=${categoryId}`);
  if (response.ok) {
    const data = await response.json();
    setMenuProducts(data);
  }
}, []);
```

---

### **❌ LO QUE NO FUNCIONA: PORTAL CLIENTE**

El **portal cliente** (tarjetas, promos, banners, favorito del día, recompensas) NO se sincroniza correctamente porque:

#### **🔧 Arquitectura del Portal Cliente**
```
ADMIN EDITA:
📝 /admin/portal → Guarda via /api/admin/portal-config (PROTEGIDO)
                ↓
        📁 File System (portal-config-{businessId}.json)
                ↓
CLIENTE RECIBE:
🔄 /api/portal/config?businessId=X (PÚBLICO)
```

#### **🎯 API del Portal Cliente (Único Endpoint)**
```typescript
// /api/portal/config/route.ts
export async function GET(request: NextRequest) {
  const businessId = url.searchParams.get('businessId') || 'default';
  const configPath = path.join(process.cwd(), 'config', 'portal', `portal-config-${businessId}.json`);
  
  // Cache invalidation manual
  delete require.cache[require.resolve(configPath)];
  const configData = fs.readFileSync(configPath, 'utf8');
  
  return NextResponse.json(JSON.parse(configData));
}
```

#### **📱 Carga del Portal en Cliente (CON POLLING)**
```typescript
// BannersSection.tsx - línea 52
const fetchBanners = useCallback(async () => {
  const response = await fetch(
    `/api/portal/config?businessId=${configBusinessId}&t=` + new Date().getTime(),
    {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    }
  );
  // Filtra banners de la config completa
}, []);

// Polling cada 30 segundos
useEffect(() => {
  fetchBanners();
  const interval = setInterval(fetchBanners, 30000);
  return () => clearInterval(interval);
}, [fetchBanners]);
```

---

## 🔍 **COMPARACIÓN DETALLADA**

| Aspecto | 🟢 **MENÚ** | 🔴 **PORTAL CLIENTE** |
|---------|-------------|---------------------|
| **Almacenamiento** | 💾 Base de Datos (Prisma) | 📁 Archivos JSON |
| **APIs Cliente** | 🎯 Específicas por entidad | 📦 Un solo endpoint masivo |
| | `/api/menu/categorias` | `/api/portal/config` |
| | `/api/menu/productos` | (toda la config) |
| **Sincronización** | ⚡ Inmediata (DB) | 🐌 Polling cada 30s |
| **Cache** | 🚫 Sin cache issues | 💥 Problemas de cache |
| **Granularidad** | 🎯 Solo lo que necesita | 📦 Descarga todo |
| **Eficiencia** | ⚡ Alta | 🐌 Baja |
| **Tiempo Real** | ✅ Inmediato | ❌ Hasta 30s retraso |

---

## 🎯 **HOOKS UTILIZADOS**

### **🟢 Menú (Directo)**
```typescript
// Carga directa sin polling
const loadMenuCategories = async () => {
  const response = await fetch('/api/menu/categorias');
  const data = await response.json();
  setMenuCategories(data);
};
```

### **🔴 Portal Cliente (Con Auto-Refresh)**
```typescript
// useAutoRefreshPortalConfig.ts
export const useAutoRefreshPortalConfig = (options = {}) => {
  const { refreshInterval = 30000 } = options; // 30 segundos
  
  const fetchConfig = useCallback(async () => {
    const timestamp = new Date().getTime();
    const response = await fetch(
      `/api/portal/config?businessId=${businessId}&t=${timestamp}`,
      { cache: 'no-store' }
    );
  }, [businessId]);

  useEffect(() => {
    fetchConfig();
    const interval = setInterval(fetchConfig, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchConfig, refreshInterval]);
};
```

---

## 📋 **ELEMENTOS QUE NO SE SINCRONIZAN**

### **🎨 Tarjetas de Lealtad**
- **Problema**: Configuración en archivo JSON
- **Efecto**: Cambios en niveles, colores, beneficios no se reflejan
- **Frecuencia**: Solo al recargar o cada 30s

### **🎯 Promociones**
- **Problema**: Array en portal-config.json
- **Efecto**: Nuevas promos no aparecen inmediatamente
- **Frecuencia**: Polling cada 15s (PromocionesSection)

### **🖼️ Banners**
- **Problema**: Array en portal-config.json
- **Efecto**: Banners nuevos/editados tardan en aparecer
- **Frecuencia**: Polling cada 30s (BannersSection)

### **⭐ Favorito del Día**
- **Problema**: Objeto en portal-config.json
- **Efecto**: Cambios de producto favorito no son inmediatos
- **Frecuencia**: Polling personalizado

### **🎁 Recompensas**
- **Problema**: Array en portal-config.json
- **Efecto**: Nuevas recompensas no se ven al momento
- **Frecuencia**: Polling via useAutoRefreshPortalConfig

---

## 💡 **SOLUCIÓN PROPUESTA**

### **Opción 1: Migrar Portal a Base de Datos**
```sql
-- Nuevas tablas específicas
CREATE TABLE portal_banners (...)
CREATE TABLE portal_promociones (...)
CREATE TABLE portal_recompensas (...)
CREATE TABLE portal_favoritos_dia (...)
```

### **Opción 2: Mejorar Sincronización de Archivos**
- WebSockets para notificaciones en tiempo real
- Server-Sent Events (SSE)
- Cache invalidation más agresivo

### **Opción 3: Unificar Arquitectura**
- Migrar menú a archivos JSON (no recomendado)
- O migrar portal a base de datos (recomendado)

---

## 🎯 **SIGUIENTE PASO**

¿Cuál de estas opciones prefieres que implementemos?

1. **🚀 Migración Completa**: Portal cliente → Base de datos
2. **⚡ Mejora Incremental**: Optimizar polling y cache
3. **🔄 Sistema Híbrido**: Mantener archivos pero con mejor sync

¿Con cuál empezamos?
