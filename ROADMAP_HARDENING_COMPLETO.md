# 🗺️ MAPA COMPLETO DEL ENTORNO - ROADMAP HARDENING

## 📊 **ARQUITECTURA ACTUAL**

### **🏗️ ESTRUCTURA DE RUTAS**

#### **1. RUTAS PÚBLICAS**
```
/                    → Landing page
/login               → Autenticación
/signup              → Registro  
/system-status       → Estado del sistema
/test-opera          → Diagnóstico Opera
```

#### **2. RUTAS LEGACY (BLOQUEADAS)**
```
/admin               → Redirige a /{businessSlug}/admin
/staff               → Redirige a /{businessSlug}/staff  
/superadmin          → Redirige a /{businessSlug}/superadmin
/cliente             → Redirige a /{businessSlug}/cliente
```

#### **3. RUTAS CON BUSINESS CONTEXT**
```
/{businessId}/admin      → Panel administración
/{businessId}/staff      → Panel empleados
/{businessId}/superadmin → Panel super admin
/{businessId}/cliente    → Portal cliente (PÚBLICO)
```

#### **4. RUTAS DE DESARROLLO**
```
/dashboard           → Dashboard legacy
/diagnostic          → Diagnósticos
/test-routing        → Pruebas de routing
```

## 🔐 **SISTEMA DE AUTENTICACIÓN ACTUAL**

### **🎭 ROLES Y PERMISOS**

#### **ENUM Role (Prisma):**
```typescript
enum Role {
  SUPERADMIN  // Dueño del negocio - acceso total
  ADMIN       // Administrador - gestión de staff y reportes  
  STAFF       // Empleado - solo registro de consumos
}
```

#### **PERMISOS POR ROL (unified-middleware.ts):**
```typescript
SUPERADMIN: [
  'business.manage', 'users.create', 'users.read', 'users.update', 
  'users.delete', 'locations.manage', 'clients.manage', 
  'consumos.manage', 'reports.view', 'settings.manage', 'billing.manage'
]

ADMIN: [
  'users.create', 'users.read', 'users.update', 'clients.manage',
  'consumos.manage', 'reports.view', 'settings.read'
]

STAFF: [
  'consumos.create', 'consumos.read', 'clients.read'
]

CLIENTE: [] // Sin permisos admin - solo acceso a portal cliente
```

### **🗃️ MODELO DE DATOS**

#### **User (Admin/Staff):**
```typescript
{
  id: string,
  businessId: string,           // OBLIGATORIO - FK a Business
  email: string,
  passwordHash: string,
  role: 'SUPERADMIN'|'ADMIN'|'STAFF',
  sessionToken: string?,        // Token de sesión único
  sessionExpires: DateTime?,    // Expiración de sesión
  loginAttempts: int,           // Control de intentos fallidos
  lockedUntil: DateTime?,       // Bloqueo temporal
  isActive: boolean,
  business: Business            // Relación 1:1
}
```

#### **Cliente (Portal público):**
```typescript
{
  id: string,
  businessId: string?,          // Opcional - puede ser multi-business
  cedula: string,               // Identificador único
  nombre: string,
  puntos: int,
  // SIN sessionToken - usa localStorage
}
```

## 🌐 **MAPA DE APIs**

### **🔒 APIs ADMIN (Requieren autenticación)**
```
/api/admin/
├── portal-config/           → Configuración del portal
├── clientes/               → Gestión clientes
├── estadisticas/           → Reportes y estadísticas
├── menu/                   → Gestión de menús
├── upload/                 → Subida de archivos
├── canjes/                 → Historial de canjes
├── puntos/                 → Gestión de puntos
└── visitas/                → Registro de visitas
```

### **👥 APIs STAFF (Requieren autenticación)**
```
/api/staff/
└── consumo/
    ├── route.ts            → Crear consumo
    ├── analyze/            → Analizar consumo
    ├── confirm/            → Confirmar consumo
    ├── manual/             → Consumo manual
    └── analyze-multi/      → Análisis múltiple
```

### **🔓 APIs CLIENTE (Públicas con business context)**
```
/api/cliente/
├── registro/               → Registro de cliente
├── verificar/              → Verificar cliente
└── verificar-ascenso/      → Verificar ascenso nivel
```

### **🏢 APIs BUSINESS (Context required)**
```
/api/business/
├── info/                   → Información del negocio
└── [businessId]/validate/  → Validar business
```

### **🔐 APIs AUTH (Públicas/Semi-públicas)**
```
/api/auth/
├── login/                  → Login admin/staff
├── signup/                 → Registro admin/staff
├── me/                     → Info usuario actual
├── signin/                 → Sign in alternativo
└── signout/                → Cerrar sesión
```

### **🌍 APIs GENERALES**
```
/api/
├── portal/config/          → Config portal (business aware)
├── branding/               → Branding (business aware)
├── users/                  → Gestión usuarios
├── health/                 → Health check
└── setup/                  → Configuración inicial
```

## 🛡️ **PROTECCIONES ACTUALES**

### **1. MIDDLEWARE.TS**
```typescript
✅ IMPLEMENTADO:
- Bloqueo rutas legacy → Redirige con business context
- Validación business context en APIs críticas
- getUserBusinessSlug() para obtener business del usuario

❌ FALTANTE:
- Validación de ROL en rutas admin
- Autenticación obligatoria en rutas /{businessId}/admin
- Segregación cliente vs admin sessions
```

### **2. UNIFIED-MIDDLEWARE.TS**
```typescript
✅ IMPLEMENTADO:
- getCurrentUser() con validación completa
- requireAuth() para APIs
- Control de intentos de login
- Gestión de sesiones con tokens
- Permisos granulares por rol

❌ FALTANTE:
- Integración con middleware principal
- Validación business ownership
- Rate limiting
```

### **3. CLIENT-SIDE VALIDATION**
```typescript
✅ IMPLEMENTADO:
- Validación de business existe
- Bloqueo de rutas legacy en cliente
- Redirección automática a login

❌ FALTANTE:
- Validación de rol antes de renderizar
- Protección contra bypass de JavaScript
```

## 🚨 **VECTORES DE ATAQUE IDENTIFICADOS**

### **❌ VULNERABILIDAD CRÍTICA 1: BYPASS RUTAS ADMIN**
```
ESCENARIO: Cliente va a /arepa/admin
ESTADO ACTUAL: Página se carga, validación solo client-side
RIESGO: Cliente puede ver interfaz admin
SOLUCIÓN: Middleware con auth obligatorio
```

### **❌ VULNERABILIDAD CRÍTICA 2: APIs SIN AUTH**
```
ESCENARIO: POST /api/admin/portal-config?businessId=arepa
ESTADO ACTUAL: Solo valida business context
RIESGO: Cliente puede modificar configuración
SOLUCIÓN: requireAuth() en todas las APIs admin
```

### **❌ VULNERABILIDAD CRÍTICA 3: BUSINESS HIJACKING**
```
ESCENARIO: Admin de "arepa" accede a /cafedani/admin
ESTADO ACTUAL: No hay validación de ownership
RIESGO: Cross-business access
SOLUCIÓN: hasBusinessAccess() validation
```

### **❌ VULNERABILIDAD 4: SESSION CONFUSION**
```
ESCENARIO: Cliente con localStorage puede simular admin session
ESTADO ACTUAL: No hay segregación de tipos de sesión
RIESGO: Escalation privileges
SOLUCIÓN: Diferentes tipos de sesión
```

## 🎯 **ROADMAP DE HARDENING**

### **🔥 FASE 1: MIDDLEWARE CRÍTICO (2-3 horas)**

#### **1.1 Actualizar middleware.ts**
```typescript
OBJETIVO: Validar AUTH + ROL en rutas admin
ACCIONES:
- Integrar unified-middleware en middleware principal
- Bloquear /{businessId}/admin sin sesión válida
- Validar rol ADMIN+ para acceso admin
- Validar business ownership
```

#### **1.2 Proteger APIs Admin**
```typescript
OBJETIVO: Todas las APIs /api/admin/* requieren auth
ACCIONES:
- Implementar requireAuth() en todas las rutas admin
- Validar permisos específicos por endpoint
- Asegurar business context matching
```

#### **1.3 Segregar Sesiones**
```typescript
OBJETIVO: Cliente NUNCA puede tener sesión admin
ACCIONES:
- AdminSession vs ClientSession types
- Diferentes cookies/storage
- Validación de tipo en cada request
```

### **⚡ FASE 2: API HARDENING (1-2 horas)**

#### **2.1 Rate Limiting**
```typescript
OBJETIVO: Prevenir ataques automatizados
ACCIONES:
- IP-based rate limiting
- User-based rate limiting para admin
- API key requirements para alta frecuencia
```

#### **2.2 CSRF Protection**
```typescript
OBJETIVO: Prevenir ataques cross-site
ACCIONES:
- CSRF tokens en formularios críticos
- SameSite cookies
- Origin validation
```

#### **2.3 Business Isolation**
```typescript
OBJETIVO: Zero cross-business access
ACCIONES:
- Strict business ownership validation
- API responses filtered by business
- Audit logging de accesos cross-business
```

### **🛡️ FASE 3: HARDENING AVANZADO (2-4 horas)**

#### **3.1 Session Security**
```typescript
OBJETIVO: Anti-hijacking, secure sessions
ACCIONES:
- Session rotation
- IP binding
- Device fingerprinting
- Session timeout management
```

#### **3.2 Audit & Monitoring**
```typescript
OBJETIVO: Detectar y registrar amenazas
ACCIONES:
- Access logging
- Failed attempt monitoring
- Suspicious activity detection
- Real-time alerts
```

#### **3.3 Production Hardening**
```typescript
OBJETIVO: Preparación para producción
ACCIONES:
- Environment-specific configs
- Error sanitization
- Debug info removal
- Performance optimizations
```

## 📋 **CHECKLIST DE IMPLEMENTACIÓN**

### **✅ FASE 1 - CRÍTICO**
- [ ] Middleware auth integration
- [ ] Route protection implementation  
- [ ] API protection rollout
- [ ] Session segregation
- [ ] Business ownership validation

### **✅ FASE 2 - IMPORTANTE**
- [ ] Rate limiting implementation
- [ ] CSRF protection
- [ ] API hardening
- [ ] Error handling improvement

### **✅ FASE 3 - AVANZADO**
- [ ] Session security enhancement
- [ ] Audit system implementation
- [ ] Monitoring setup
- [ ] Production readiness

---

## 🚀 **ESTADO DE IMPLEMENTACIÓN - ACTUALIZADO**

### ✅ **FASE 1.1 - MIDDLEWARE CRÍTICO [COMPLETADO]**

#### **🔥 Protecciones Implementadas:**
- **handleLegacyRouteRedirect()**: Rutas legacy bloqueadas y redirigidas con contexto business
- **handleAdminRouteProtection()**: Rutas admin protegidas con validateUserSession() y permisos
- **handleAdminApiProtection()**: APIs admin protegidas con autenticación robusta
- **business-selection blocking**: Página de selección completamente eliminada
- **handleClientRouteAccess()**: Validación business context para rutas cliente

#### **🛡️ Vulnerabilidades Críticas Corregidas:**
1. ✅ Admin Route Bypass - Cliente no puede acceder a admin routes via URL
2. ✅ Legacy Route Exploitation - Rutas legacy completamente bloqueadas
3. ✅ Business-Selection Attack - Vulnerabilidad eliminada completamente  
4. ✅ Session Validation - Validación robusta con business ownership

#### **📋 Commit:** `fa13c91` - 🔥 CRÍTICO: FASE 1.1 Middleware hardening completado

---

## 🎯 **PRÓXIMO PASO - FASE 1.2**

### **🔄 APIs ADMIN PROTECTION [SIGUIENTE]**

**Objetivo:** Proteger todas las APIs `/api/admin/*` con autenticación robusta

**Tareas:**
1. Implementar `requireAuth()` middleware en todas las APIs admin
2. Validar business ownership en cada endpoint
3. Verificar permisos específicos por endpoint
4. Logging de accesos y intentos de intrusión

**Archivos a modificar:**
- `/src/app/api/admin/*/route.ts` (50+ endpoints)
- Crear middleware `requireAuth()` centralizado
- Integrar con sistema de permisos existente

¿Procedemos con **FASE 1.2 - APIs Admin Protection**?
