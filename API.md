# 📚 Documentación de APIs - Lealta 2.0

## 📊 Resumen del Sistema de APIs

**Total de endpoints:** 127 APIs  
**Fecha de análisis:** Octubre 2025  
**Estado:** Producción Ready con recomendaciones de limpieza

---

## 🏗️ Arquitectura de APIs

### 📂 Estructura por Categorías

#### 🔐 **Autenticación y Autorización** (6 APIs)
- `POST /api/auth/login` - Inicio de sesión
- `POST /api/auth/signup` - Registro de usuarios
- `GET /api/auth/me` - Información del usuario actual
- `POST /api/auth/signin` - NextAuth signin
- `POST /api/auth/signout` - Cierre de sesión
- `[...nextauth]` - NextAuth handler

#### 👥 **Gestión de Usuarios** (1 API)
- `GET/POST/PUT/DELETE /api/users` - CRUD completo de usuarios

#### 🏢 **Gestión de Negocios** (7 APIs)
- `GET /api/businesses/list` - Listar negocios
- `GET /api/businesses/[id]/validate` - Validar negocio
- `GET /api/business/resolve/[slug]` - Resolver por slug
- `GET /api/business/info` - Información del negocio
- `GET /api/business/context` - Contexto actual
- `GET /api/business/day-config` - Configuración del día
- `GET /api/business/[id]/client-theme` - Tema personalizado

#### 📅 **Sistema de Reservas** (16 APIs)
**APIs Principales:**
- `GET/POST /api/reservas` - CRUD de reservas
- `GET /api/reservas/[id]` - Detalles de reserva específica
- `POST /api/reservas/[id]/asistencia` - Marcar asistencia
- `GET /api/reservas/[id]/qr` - Generar QR de reserva
- `GET /api/reservas/[id]/comprobante` - Comprobante de reserva

**APIs de Operación:**
- `GET /api/reservas/qr/[token]` - Validar QR
- `POST /api/reservas/scan-qr` - Escanear QR
- `GET /api/reservas/stats` - Estadísticas
- `GET /api/reservas/reportes` - Reportes
- `GET /api/reservas/clientes` - Clientes con reservas

#### 🧑‍💼 **Panel de Staff** (10 APIs)
**Gestión de Consumo:**
- `POST /api/staff/consumo/manual` - Registro manual de consumo
- `POST /api/staff/consumo/confirm` - Confirmar consumo
- `GET /api/staff/consumo/analyze` - Análisis de consumo
- `POST /api/staff/guest-consumo` - Consumo de invitados

**Búsqueda y Tracking:**
- `GET /api/staff/search-clients` - Buscar clientes
- `GET /api/staff/host-tracking/search` - Buscar eventos de anfitrión
- `POST /api/staff/host-tracking/activate` - Activar tracking

#### 👤 **Portal de Cliente** (12 APIs)
**Gestión de Cliente:**
- `POST /api/cliente/registro` - Registro de cliente
- `POST /api/cliente/verificar` - Verificar cliente
- `GET /api/cliente/lista` - Lista de clientes
- `GET /api/cliente/visitas` - Historial de visitas
- `POST /api/cliente/evaluar-nivel` - Evaluar nivel de fidelidad

**Funcionalidades Especiales:**
- `GET /api/cliente/host-stats` - Estadísticas de anfitrión
- `GET /api/cliente/favorito-del-dia` - Producto favorito
- `POST /api/cliente/verificar-ascenso` - Verificar ascenso de nivel
- `GET /api/cliente/check-notifications` - Verificar notificaciones

#### ⚙️ **Panel de Administración** (29 APIs)
**Estadísticas y Reportes:**
- `GET /api/admin/estadisticas` - Dashboard principal
- `GET /api/admin/grafico-ingresos` - Gráficos de ingresos
- `GET /api/admin/productos-tendencias` - Productos en tendencia
- `GET /api/admin/clientes/[cedula]/historial` - Historial de cliente

**Gestión de Portal:**
- `GET/POST /api/admin/portal-config` - Configuración del portal
- `GET/POST /api/admin/portal/banners` - Gestión de banners
- `GET/POST /api/admin/portal/promociones` - Gestión de promociones
- `GET/POST /api/admin/portal/recompensas` - Sistema de recompensas

**Operaciones:**
- `POST /api/admin/upload` - Subida de archivos
- `POST /api/admin/puntos` - Gestión de puntos
- `POST /api/admin/recalcular-progreso` - Recalcular progreso de clientes

#### 🍽️ **Gestión de Menú** (4 APIs)
- `GET/POST /api/menu/productos` - CRUD productos
- `GET/POST /api/menu/categorias` - CRUD categorías
- `GET/POST /api/admin/menu` - Panel admin del menú
- `GET/POST /api/admin/menu/productos` - Productos desde admin

#### 🎯 **Sistema de Promociones** (3 APIs)
- `GET/POST /api/promotores` - Gestión de promotores
- `GET /api/promotores/stats` - Estadísticas de promotores
- `GET/PUT/DELETE /api/promotores/[id]` - CRUD promotor específico

#### 📱 **APIs Públicas** (8 APIs)
- `GET /api/health` - Health check del sistema
- `GET /api/manifest` - PWA manifest
- `GET /api/metrics` - Métricas básicas
- `POST /api/security/csp-report` - Reportes de seguridad CSP
- `GET /api/loyalty/puntos-minimos` - Configuración de loyalty
- `POST /api/tickets/asociar-reserva` - Asociar tickets
- `GET /api/sin-reserva` - Walk-ins sin reserva
- `POST /api/branding/upload` - Subida de branding

---

## ⚠️ **APIs Candidatas para Eliminación**

### 🧪 **APIs de Testing (7) - ELIMINAR EN PRODUCCIÓN:**

```typescript
// ❌ APIs de Testing que deben eliminarse:
/api/debug/connection         // Test de conexión DB
/api/debug/test-upload        // Test de subida
/api/debug/migrate-seed       // Migración de prueba
/api/staff/test-gemini        // Test de Gemini API
/api/reservas/test-qr         // Test de QR codes
/api/cliente/test-visitas-business // Test de visitas
/api/admin/migrate-json-to-db // Migración de datos
```

**Impacto:** ✅ **SEGURO ELIMINAR** - No afectan funcionalidad de producción

### 🔧 **APIs de Debug (8) - REVISAR:**

```typescript
// ⚠️ APIs de Debug - mantener solo si necesarias:
/api/debug/banners           // Debug de banners
/api/debug/businesses        // Debug de negocios  
/api/debug/cliente-progress  // Debug progreso cliente
/api/debug/clientes          // Debug de clientes
/api/debug/config-status     // Debug configuración
/api/debug/env               // Debug variables entorno
/api/debug/fix-progress      // Fix de progreso
/api/debug/simple-auth       // Debug autenticación
```

**Recomendación:** Mantener solo `/api/debug/env` y `/api/debug/config-status` para troubleshooting de producción.

---

## 🔒 **Autenticación por Categoría**

### ✅ **APIs Protegidas (Requieren Auth):**
- **Admin:** Todas las `/api/admin/*` 
- **Staff:** Todas las `/api/staff/*`
- **Users:** `/api/users/*`
- **Reservas Críticas:** `/api/reservas/stats`, `/api/reservas/[id]/asistencia`

### 🌐 **APIs Públicas (Sin Auth):**
- **Health:** `/api/health`
- **Business Info:** `/api/business/resolve/*`, `/api/business/info`
- **QR Public:** `/api/reservas/qr/[token]`
- **Walk-ins:** `/api/sin-reserva`

### ⚡ **APIs Semi-Públicas (Auth Opcional):**
- **Cliente:** `/api/cliente/*` - Algunos endpoints verifican cliente existente
- **Portal:** `/api/portal/*` - Configuración pública del portal

---

## 📈 **Métricas de Uso**

### 🔥 **APIs Más Utilizadas:**
1. `/api/cliente/verificar` - Verificación de clientes en staff
2. `/api/reservas` - Sistema central de reservas  
3. `/api/staff/consumo/manual` - Registro de consumos
4. `/api/admin/estadisticas` - Dashboard de administración
5. `/api/business/resolve/[slug]` - Resolución de contexto de negocio

### 📊 **APIs por Frontend:**
- **Staff App:** 15 APIs activas
- **Admin Panel:** 29 APIs activas  
- **Client Portal:** 12 APIs activas
- **Public/QR:** 8 APIs activas

---

## 🚀 **Recomendaciones de Optimización**

### 1. **Eliminar APIs de Testing**
```bash
# Eliminar estos directorios:
rm -rf src/app/api/debug/
rm -rf src/app/api/*/test-*
rm -rf src/app/api/admin/migrate-*
```

### 2. **Consolidar APIs Similares**
- Unificar `/api/portal/*` y `/api/admin/portal/*`
- Consolidar endpoints de estadísticas en `/api/admin/estadisticas`

### 3. **Mejorar Seguridad**
- Implementar rate limiting en APIs públicas
- Agregar autenticación a APIs semi-públicas sensibles
- Audit logs para APIs administrativas

### 4. **Optimizar Performance**
- Implementar caché en APIs de configuración
- Paginar resultados en APIs de lista
- Optimizar consultas de estadísticas

---

## 🛠️ **Herramientas de Desarrollo**

### **Testing de APIs:**
```bash
npm run test:staff:simple     # Test APIs de staff
npm run test:general          # Test APIs generales  
npm run test:e2e:critical     # Test flujos críticos
```

### **Monitoreo:**
```bash
curl /api/health              # Health check
curl /api/metrics             # Métricas básicas
```

### **Debug en Desarrollo:**
```bash
curl /api/debug/env           # Variables de entorno
curl /api/debug/config-status # Estado de configuración
```

---

## 📞 **Soporte**

**Desarrollador:** Equipo Lealta  
**Versión:** 2.0  
**Última actualización:** Octubre 2025

Para reportar issues o solicitar nuevas APIs, crear un issue en el repositorio del proyecto.
