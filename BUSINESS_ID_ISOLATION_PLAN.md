# 🏢 ANÁLISIS SISTEMA BUSINESS ID - AISLAMIENTO POR DOMINIO

## 📊 **ESTADO ACTUAL DEL SISTEMA**

### ✅ **LO QUE YA ESTÁ IMPLEMENTADO:**

#### 1. **Modelo de Base de Datos:**
```sql
-- Business como entidad principal
Business {
  id: String (cuid)
  name: String           // "Café Dani"
  slug: String (unique)  // "cafe-dani" 
  subdomain: String (unique) // "cafedani"
  customDomain: String?  // "pedidos.cafedani.com" (opcional)
}

-- Todas las entidades tienen businessId
User.businessId -> Business.id
Cliente.businessId -> Business.id (temporalmente opcional)
Consumo.businessId -> Business.id
Location.businessId -> Business.id
```

#### 2. **Middleware de Autenticación:**
- ✅ Extrae businessId de headers
- ✅ Valida acceso por business
- ✅ Pasa `x-business-id` a APIs

#### 3. **APIs con Business Isolation:**
- ✅ `/api/admin/*` - Todas filtran por businessId
- ✅ `/api/staff/*` - Incluye validación de business
- ✅ `/api/users` - Única combinación email+business
- ✅ Signup crea Business + subdomain único

## 🚨 **PROBLEMAS IDENTIFICADOS:**

### 1. **Routing No Implementado**
```
❌ ACTUAL: lealta.app/admin (todos los negocios)
✅ OBJETIVO: lealta.app/cafedani/admin
✅ OBJETIVO: lealta.app/cafedani/cliente
```

### 2. **Cliente Temporalmente Sin Business**
```prisma
model Cliente {
  businessId String? // ❌ Temporalmente opcional
  cedula     String @unique // ❌ Único global (debería ser por business)
}
```

### 3. **Autenticación No Usa Subdomain**
```typescript
// ❌ ACTUAL: No extrae business del URL
// ✅ NECESARIO: Parse subdomain de URL
```

### 4. **Portal Cliente Global**
```
❌ ACTUAL: /cliente (global)
✅ OBJETIVO: /cafedani/cliente
```

## 🎯 **PLAN DE ACCIÓN COMPLETO**

## **FASE 1: IMPLEMENTAR ROUTING POR SUBDOMAIN** 🚀

### 1.1 **Crear Middleware de Subdomain**
```typescript
// src/middleware/subdomain.ts
export function extractBusinessFromUrl(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const url = request.nextUrl.pathname;
  
  // Patrón: lealta.app/cafedani/admin
  const pathSegments = url.split('/').filter(Boolean);
  
  if (pathSegments.length > 0) {
    const potentialSubdomain = pathSegments[0];
    
    // Verificar si es un subdomain válido
    if (await isValidBusinessSubdomain(potentialSubdomain)) {
      return {
        subdomain: potentialSubdomain,
        remainingPath: '/' + pathSegments.slice(1).join('/')
      };
    }
  }
  
  return null;
}
```

### 1.2 **Modificar Estructura de Rutas**
```
src/app/
├── [businessId]/
│   ├── admin/
│   │   └── page.tsx
│   ├── staff/
│   │   └── page.tsx
│   ├── cliente/
│   │   └── page.tsx
│   └── layout.tsx (Business Context)
├── login/
│   └── page.tsx (detecta business del URL)
└── signup/
    └── page.tsx
```

### 1.3 **Business Context Provider**
```typescript
// src/contexts/BusinessContext.tsx
interface BusinessContext {
  businessId: string;
  businessName: string;
  subdomain: string;
  permissions: string[];
}

export function BusinessProvider({ 
  children, 
  businessId 
}: { 
  children: React.ReactNode;
  businessId: string;
}) {
  // Cargar datos del business
  // Validar permisos del usuario
  // Proveer contexto a toda la app
}
```

## **FASE 2: ARREGLAR MODELO DE DATOS** 🔧

### 2.1 **Migración Cliente -> Business**
```prisma
model Cliente {
  id           String @id @default(cuid())
  businessId   String // ❌ Hacer OBLIGATORIO
  cedula       String // ❌ Remover @unique global
  
  // ✅ Unique por business
  @@unique([businessId, cedula])
}
```

### 2.2 **Script de Migración**
```sql
-- 1. Agregar businessId a clientes existentes
UPDATE Cliente 
SET businessId = 'business_1' 
WHERE businessId IS NULL;

-- 2. Hacer campo obligatorio
ALTER TABLE Cliente ALTER COLUMN businessId SET NOT NULL;

-- 3. Crear índice único compuesto
CREATE UNIQUE INDEX Cliente_businessId_cedula_key 
ON Cliente(businessId, cedula);

-- 4. Remover índice único global de cedula
DROP INDEX Cliente_cedula_key;
```

## **FASE 3: ACTUALIZAR AUTENTICACIÓN** 🔐

### 3.1 **Login con Business Detection**
```typescript
// src/app/login/page.tsx
export default function LoginPage() {
  const { businessId } = useBusinessFromUrl();
  
  // Si no hay business en URL, mostrar selector
  if (!businessId) {
    return <BusinessSelector />;
  }
  
  // Login específico para el business
  return <LoginForm businessId={businessId} />;
}
```

### 3.2 **Session con Business Context**
```typescript
interface SessionData {
  userId: string;
  email: string;
  role: Role;
  businessId: string;    // ✅ Siempre presente
  businessName: string;  // ✅ Para UI
  subdomain: string;     // ✅ Para routing
}
```

## **FASE 4: ACTUALIZAR APIS** 🌐

### 4.1 **Middleware Business Extraction**
```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const businessData = extractBusinessFromUrl(request);
  
  if (businessData) {
    // Validar que el business existe
    const business = await validateBusiness(businessData.subdomain);
    
    // Reescribir URL interna
    const newUrl = new URL(businessData.remainingPath, request.url);
    const response = NextResponse.rewrite(newUrl);
    
    // Agregar headers de business
    response.headers.set('x-business-id', business.id);
    response.headers.set('x-business-subdomain', business.subdomain);
    
    return response;
  }
  
  return NextResponse.next();
}
```

### 4.2 **Helper para APIs**
```typescript
// src/utils/api-business.ts
export function getBusinessFromRequest(request: NextRequest): string {
  const businessId = request.headers.get('x-business-id');
  
  if (!businessId) {
    throw new Error('Business context required');
  }
  
  return businessId;
}

// Usar en todas las APIs
export async function POST(request: NextRequest) {
  const businessId = getBusinessFromRequest(request);
  
  // Filtrar por business automáticamente
  const clientes = await prisma.cliente.findMany({
    where: { businessId }
  });
}
```

## **FASE 5: PORTAL CLIENTE AISLADO** 👥

### 5.1 **Nueva Estructura Portal**
```
src/app/[businessId]/cliente/
├── page.tsx           // Dashboard principal
├── menu/
│   └── page.tsx       // Menú del negocio
├── puntos/
│   └── page.tsx       // Puntos de lealtad
├── perfil/
│   └── page.tsx       // Perfil del cliente
└── layout.tsx         // Layout específico del portal
```

### 5.2 **API Cliente por Business**
```typescript
// src/app/api/[businessId]/cliente/registro/route.ts
export async function POST(
  request: NextRequest,
  { params }: { params: { businessId: string } }
) {
  const { businessId } = params;
  
  // Crear cliente específico del business
  const cliente = await prisma.cliente.create({
    data: {
      businessId,
      cedula,
      nombre,
      // ...
    }
  });
}
```

## **FASE 6: IMPLEMENTACIÓN DE URLS** 🌍

### 6.1 **URLs Objetivo:**
```
✅ lealta.app/cafedani/admin       // Dashboard admin
✅ lealta.app/cafedani/staff       // Captura de tickets
✅ lealta.app/cafedani/cliente     // Portal cliente
✅ lealta.app/login?business=cafedani  // Login específico
✅ lealta.app/signup               // Crear nueva empresa
```

### 6.2 **Redirects y Navigation**
```typescript
// src/hooks/useBusinessNavigation.ts
export function useBusinessNavigation() {
  const { businessId, subdomain } = useBusiness();
  
  const navigate = (path: string) => {
    router.push(`/${subdomain}${path}`);
  };
  
  const getBusinessUrl = (path: string) => {
    return `/${subdomain}${path}`;
  };
  
  return { navigate, getBusinessUrl };
}
```

## **FASE 7: TESTING Y VALIDACIÓN** ✅

### 7.1 **Casos de Prueba:**
```typescript
describe('Business Isolation', () => {
  test('Cafe Dani no ve datos de Cafe Maria', async () => {
    // Login como admin de Cafe Dani
    // Intentar acceder a datos de Cafe Maria
    // Verificar que falla
  });
  
  test('URLs redirigen correctamente', async () => {
    // Visitar /cafedani/admin
    // Verificar que carga dashboard de Cafe Dani
  });
  
  test('Cliente solo ve su business', async () => {
    // Registrar cliente en Cafe Dani
    // Verificar que solo ve menú de Cafe Dani
  });
});
```

## 📈 **CRONOGRAMA DE IMPLEMENTACIÓN**

### **Semana 1: Infraestructura**
- ✅ Crear middleware de subdomain
- ✅ Implementar Business Context
- ✅ Actualizar estructura de rutas

### **Semana 2: Base de Datos**
- ✅ Migrar modelo Cliente
- ✅ Actualizar todas las queries
- ✅ Scripts de migración

### **Semana 3: APIs y Autenticación**
- ✅ Actualizar todas las APIs
- ✅ Login con business detection
- ✅ Session management

### **Semana 4: Portal Cliente**
- ✅ Portal cliente aislado
- ✅ Testing completo
- ✅ Documentación

## 🎯 **BENEFICIOS ESPERADOS**

### **Seguridad:**
- ✅ **Aislamiento completo** entre businesses
- ✅ **URLs intuitivas** para cada empresa
- ✅ **Datos protegidos** por business

### **Escalabilidad:**
- ✅ **Multi-tenancy real** 
- ✅ **Configuración independiente** por empresa
- ✅ **Subdominios personalizados** futuros

### **UX:**
- ✅ **URLs branded**: cafedani.lealta.app
- ✅ **Contexto claro** para usuarios
- ✅ **Navegación intuitiva**

---

¿Quieres que empecemos por alguna fase específica o prefieres que implemente el middleware de subdomain primero? 🚀
