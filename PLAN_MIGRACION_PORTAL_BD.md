# 🚀 PLAN DE MIGRACIÓN COMPLETA: PORTAL CLIENTE A BASE DE DATOS

## 📊 **ANÁLISIS DEL SISTEMA DE IMÁGENES**

### **✅ SISTEMA ACTUAL DE IMÁGENES**

El sistema **SÍ maneja imágenes correctamente** y **NO las guarda en BD**, sino en el **file system**:

#### **🔧 Arquitectura Actual de Imágenes:**
```
📁 ALMACENAMIENTO FÍSICO:
/public/uploads/ 
├── timestamp-randomstring.jpg  (Staff consumos)
├── businessId_timestamp-hash.ext (Admin uploads) 
└── multi/multi_timestamp_index.png (Múltiples imágenes)

💾 BASE64 EMBEBIDO:
- Branding carrusel → JSON files (base64)
- Algunos previews → Base64 en forms

🌐 URLs PÚBLICAS:
- /uploads/filename.ext → Acceso directo desde web
```

#### **📱 APIs de Upload Actuales:**
```typescript
// Admin uploads (protegido)
POST /api/admin/upload → /public/uploads/{businessId}_{timestamp}.ext

// Staff uploads (automático) 
POST /api/staff/consumo → /public/uploads/ticket_{timestamp}.png

// Branding (base64 embebido)
POST /api/branding → JSON files con base64
```

### **✅ DECISIÓN: MANTENER FILE SYSTEM**

**Las imágenes quedan en `/public/uploads/`** porque:
- ✅ **Rendimiento superior** vs BLOB en BD
- ✅ **CDN-friendly** para escalabilidad
- ✅ **Backup más simple** (archivos independientes)
- ✅ **No sobrecarga la BD** con binarios grandes

---

## 🗃️ **ESQUEMA DE MIGRACIÓN DE BD**

### **📋 NUEVAS TABLAS A CREAR**

```sql
-- ==========================================
-- PORTAL CLIENTE - NUEVAS TABLAS
-- ==========================================

-- 🖼️ BANNERS
CREATE TABLE portal_banners (
  id                VARCHAR(255) PRIMARY KEY,
  business_id       VARCHAR(255) NOT NULL,
  titulo            VARCHAR(255) NOT NULL,
  descripcion       TEXT,
  imagen_url        VARCHAR(500),  -- URL del archivo físico
  dia               VARCHAR(20),   -- lunes, martes, etc
  hora_publicacion  VARCHAR(5),    -- formato HH:MM
  activo            BOOLEAN DEFAULT true,
  orden             INTEGER DEFAULT 0,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by        VARCHAR(255),
  
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  INDEX idx_business_dia_activo (business_id, dia, activo),
  INDEX idx_business_activo (business_id, activo)
);

-- 🎯 PROMOCIONES  
CREATE TABLE portal_promociones (
  id                VARCHAR(255) PRIMARY KEY,
  business_id       VARCHAR(255) NOT NULL,
  titulo            VARCHAR(255) NOT NULL,
  descripcion       TEXT,
  descuento         DECIMAL(5,2), -- 0.00-999.99
  imagen_url        VARCHAR(500),
  dia               VARCHAR(20),
  hora_inicio       VARCHAR(5),   -- formato HH:MM
  hora_termino      VARCHAR(5),   -- formato HH:MM  
  fecha_inicio      DATE,
  fecha_fin         DATE,
  codigo_promo      VARCHAR(50),
  activo            BOOLEAN DEFAULT true,
  orden             INTEGER DEFAULT 0,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by        VARCHAR(255),
  
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  INDEX idx_business_dia_activo (business_id, dia, activo),
  INDEX idx_business_fechas (business_id, fecha_inicio, fecha_fin)
);

-- 🎁 RECOMPENSAS
CREATE TABLE portal_recompensas (
  id                VARCHAR(255) PRIMARY KEY,
  business_id       VARCHAR(255) NOT NULL,
  nombre            VARCHAR(255) NOT NULL,
  descripcion       TEXT,
  puntos_requeridos INTEGER NOT NULL,
  imagen_url        VARCHAR(500),
  stock             INTEGER, -- NULL = ilimitado
  categoria         VARCHAR(100),
  activo            BOOLEAN DEFAULT true,
  orden             INTEGER DEFAULT 0,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by        VARCHAR(255),
  
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  INDEX idx_business_activo (business_id, activo),
  INDEX idx_business_puntos (business_id, puntos_requeridos)
);

-- ⭐ FAVORITOS DEL DIA
CREATE TABLE portal_favoritos_dia (
  id                VARCHAR(255) PRIMARY KEY,
  business_id       VARCHAR(255) NOT NULL,
  nombre            VARCHAR(255) NOT NULL,
  descripcion       TEXT,
  precio            DECIMAL(10,2),
  imagen_url        VARCHAR(500),
  dia               VARCHAR(20),   -- lunes, martes, etc
  hora_publicacion  VARCHAR(5),    -- formato HH:MM
  categoria         VARCHAR(100),
  activo            BOOLEAN DEFAULT true,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by        VARCHAR(255),
  
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  INDEX idx_business_dia_activo (business_id, dia, activo),
  UNIQUE KEY unique_business_dia (business_id, dia) -- Solo 1 favorito por día
);

-- 🎨 CONFIGURACION TARJETAS (mejorada)
CREATE TABLE portal_tarjetas_config (
  id                VARCHAR(255) PRIMARY KEY,
  business_id       VARCHAR(255) NOT NULL,
  nivel             VARCHAR(50) NOT NULL, -- Bronce, Plata, Oro, etc
  nombre_personalizado VARCHAR(255),
  texto_calidad     VARCHAR(255),
  color_primario    VARCHAR(7),   -- #FFFFFF
  color_secundario  VARCHAR(7),   -- #000000
  gradiente_inicio  VARCHAR(7),   -- Para gradientes
  gradiente_fin     VARCHAR(7),
  puntos_minimos    INTEGER DEFAULT 0,
  gastos_minimos    DECIMAL(10,2) DEFAULT 0.00,
  visitas_minimas   INTEGER DEFAULT 0,
  beneficios        JSON,         -- Array de beneficios
  descuento         DECIMAL(5,2) DEFAULT 0.00,
  activo            BOOLEAN DEFAULT true,
  orden             INTEGER DEFAULT 0,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by        VARCHAR(255),
  
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  UNIQUE KEY unique_business_nivel (business_id, nivel),
  INDEX idx_business_activo (business_id, activo)
);
```

---

## 🔄 **APIS A CREAR/MODIFICAR**

### **📱 NUEVAS APIs CLIENTE (Públicas)**

```typescript
// ==========================================
// APIS PÚBLICAS ESPECÍFICAS (como el menú)
// ==========================================

// 🖼️ BANNERS
GET /api/portal/banners?businessId=X&dia=lunes
POST (NO - solo admin)

// 🎯 PROMOCIONES
GET /api/portal/promociones?businessId=X&dia=martes
POST (NO - solo admin)

// 🎁 RECOMPENSAS  
GET /api/portal/recompensas?businessId=X
POST (NO - solo admin)

// ⭐ FAVORITOS DEL DIA
GET /api/portal/favoritos?businessId=X&dia=miercoles
POST (NO - solo admin)

// 🎨 TARJETAS
GET /api/portal/tarjetas?businessId=X&nivel=Oro
POST (NO - solo admin)
```

### **🔒 NUEVAS APIs ADMIN (Protegidas)**

```typescript
// ==========================================
// APIS ADMIN ESPECÍFICAS CRUD 
// ==========================================

// 🖼️ BANNERS ADMIN
GET    /api/admin/portal/banners
POST   /api/admin/portal/banners
PUT    /api/admin/portal/banners/:id  
DELETE /api/admin/portal/banners/:id

// 🎯 PROMOCIONES ADMIN
GET    /api/admin/portal/promociones
POST   /api/admin/portal/promociones
PUT    /api/admin/portal/promociones/:id
DELETE /api/admin/portal/promociones/:id

// 🎁 RECOMPENSAS ADMIN
GET    /api/admin/portal/recompensas
POST   /api/admin/portal/recompensas  
PUT    /api/admin/portal/recompensas/:id
DELETE /api/admin/portal/recompensas/:id

// ⭐ FAVORITOS ADMIN
GET    /api/admin/portal/favoritos
POST   /api/admin/portal/favoritos
PUT    /api/admin/portal/favoritos/:id
DELETE /api/admin/portal/favoritos/:id

// 🎨 TARJETAS ADMIN  
GET    /api/admin/portal/tarjetas
POST   /api/admin/portal/tarjetas
PUT    /api/admin/portal/tarjetas/:id
DELETE /api/admin/portal/tarjetas/:id
```

---

## 📁 **ESTRUCTURA DE ARCHIVOS A CREAR**

```
src/
├── app/
│   ├── api/
│   │   ├── portal/                    # 📱 APIs CLIENTE (PÚBLICAS)
│   │   │   ├── banners/
│   │   │   │   └── route.ts          # GET banners por business/día
│   │   │   ├── promociones/
│   │   │   │   └── route.ts          # GET promociones por business/día
│   │   │   ├── recompensas/
│   │   │   │   └── route.ts          # GET recompensas por business
│   │   │   ├── favoritos/
│   │   │   │   └── route.ts          # GET favorito del día
│   │   │   └── tarjetas/
│   │   │       └── route.ts          # GET config tarjetas
│   │   │
│   │   └── admin/
│   │       └── portal/                # 🔒 APIs ADMIN (PROTEGIDAS)
│   │           ├── banners/
│   │           │   ├── route.ts       # CRUD banners
│   │           │   └── [id]/
│   │           │       └── route.ts   # PUT/DELETE específico
│   │           ├── promociones/       # Similar estructura...
│   │           ├── recompensas/       # Similar estructura...
│   │           ├── favoritos/         # Similar estructura...
│   │           └── tarjetas/          # Similar estructura...
│   │
├── types/
│   └── portal/                        # 📝 TIPOS ESPECÍFICOS
│       ├── banners.ts
│       ├── promociones.ts  
│       ├── recompensas.ts
│       ├── favoritos.ts
│       └── tarjetas.ts
│
├── lib/
│   └── prisma/
│       └── portal/                    # 🗃️ QUERIES ESPECÍFICAS
│           ├── banners.ts
│           ├── promociones.ts
│           ├── recompensas.ts
│           ├── favoritos.ts
│           └── tarjetas.ts
│
└── components/
    ├── cliente/
    │   └── portal/                    # 📱 COMPONENTES CLIENTE
    │       ├── BannersSection.tsx     # REFACTORIZADO
    │       ├── PromocionesSection.tsx # REFACTORIZADO
    │       ├── RecompensasSection.tsx # REFACTORIZADO
    │       └── FavoritosSection.tsx   # REFACTORIZADO
    │
    └── admin-v2/
        └── portal/                    # 🔒 COMPONENTES ADMIN  
            ├── BannersManager.tsx     # REFACTORIZADO
            ├── PromocionesManager.tsx # REFACTORIZADO
            ├── RecompensasManager.tsx # REFACTORIZADO
            └── FavoritosManager.tsx   # REFACTORIZADO
```

---

## 🎯 **COMPONENTES A REFACTORIZAR**

### **📱 LADO CLIENTE (Remover Polling)**

```typescript
// ❌ ANTES (con polling cada 30s)
const { getPromociones } = useAutoRefreshPortalConfig({
  businessId,
  refreshInterval: 15000 // 15 segundos
});

// ✅ DESPUÉS (carga directa como el menú)
const [promociones, setPromociones] = useState([]);

useEffect(() => {
  const fetchPromociones = async () => {
    const response = await fetch(`/api/portal/promociones?businessId=${businessId}&dia=${diaActual}`);
    const data = await response.json();
    setPromociones(data);
  };
  
  fetchPromociones();
}, [businessId, diaActual]); // Solo recarga al cambiar día
```

### **🔒 LADO ADMIN (Conectar a BD)**

```typescript
// ❌ ANTES (guardado en JSON)
const handleSyncToClient = async () => {
  const response = await fetch('/api/admin/portal-config', {
    method: 'PUT',
    body: JSON.stringify(config)
  });
};

// ✅ DESPUÉS (guardado específico)
const handleAddPromocion = async (promocion) => {
  const response = await fetch('/api/admin/portal/promociones', {
    method: 'POST',
    body: JSON.stringify(promocion)
  });
  // Actualización inmediata en cliente (sin polling)
};
```

---

## 📋 **PLAN DE EJECUCIÓN**

### **🏗️ FASE 1: INFRAESTRUCTURA (1-2 días)**
1. ✅ Crear schema de BD (Prisma)
2. ✅ Ejecutar migraciones
3. ✅ Crear tipos TypeScript
4. ✅ Crear librerías de queries

### **🔧 FASE 2: APIs BACKEND (2-3 días)**
5. ✅ APIs cliente públicas específicas
6. ✅ APIs admin protegidas CRUD
7. ✅ Migrar datos JSON → BD (script)
8. ✅ Testing de endpoints

### **🎨 FASE 3: FRONTEND (2-3 días)** 
9. ✅ Refactorizar componentes cliente
10. ✅ Refactorizar managers admin
11. ✅ Remover polling/auto-refresh
12. ✅ Testing end-to-end

### **🚀 FASE 4: DESPLIEGUE (1 día)**
13. ✅ Deprecar APIs JSON viejas
14. ✅ Cleanup archivos obsoletos
15. ✅ Documentación final

---

## 🎯 **BENEFICIOS ESPERADOS**

### **⚡ RENDIMIENTO**
- ❌ Polling cada 15-30s → ✅ Carga bajo demanda
- ❌ Descarga config completa → ✅ Solo datos necesarios
- ❌ Cache de archivos → ✅ Cache de BD optimizado

### **🔄 SINCRONIZACIÓN**
- ❌ Hasta 30s retraso → ✅ Inmediato (como menú)
- ❌ Problemas de cache → ✅ Sin cache issues
- ❌ Inconsistencias → ✅ Single source of truth

### **📊 ARQUITECTURA** 
- ✅ **Consistencia** con el sistema de menú
- ✅ **Escalabilidad** con business isolation  
- ✅ **Mantenibilidad** con APIs específicas
- ✅ **Auditabilidad** con logs en BD

---

## ✅ **¿EMPEZAMOS CON LA MIGRACIÓN?**

El plan está completo. Solo necesitas confirmar para comenzar con:

1. **🗃️ Schema de BD** (Prisma)
2. **📝 Tipos TypeScript** 
3. **🔧 APIs Backend**
4. **🎨 Refactor Frontend**

¿Arrancamos? 🚀
