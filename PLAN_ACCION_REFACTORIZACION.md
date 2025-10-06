# 🚀 PLAN DE ACCIÓN - Refactorización Lealta 2.0

**Duración Total:** 4 semanas (40-50 horas)  
**Modalidad:** Refactorización incremental sin romper producción  
**Enfoque:** Pragmático para desarrollador solo

---

## 📅 ROADMAP GENERAL

```
Semana 1: Testing Foundation     [12-16 horas] 🔴 CRÍTICO
Semana 2: Auth Unification       [8-10 horas]  🔴 CRÍTICO  
Semana 3: Validations & Schemas  [10-12 horas] 🟡 MEDIO
Semana 4: Services & Cleanup     [10-12 horas] 🟡 MEDIO
```

---

## 🗓️ SEMANA 1: TESTING FOUNDATION (12-16 horas)

### Objetivo:
Crear infraestructura de testing y cubrir flujos críticos.

### DÍA 1-2: Setup Testing (4 horas)

#### Tareas:
1. **Instalar dependencias de testing**
```bash
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom
npm install -D @testing-library/user-event msw prisma-mock
```

2. **Crear configuración de Vitest**
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.config.ts',
        '**/*.d.ts'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
```

3. **Crear setup de tests**
```typescript
// tests/setup.ts
import '@testing-library/jest-dom';
import { beforeAll, afterEach, afterAll, vi } from 'vitest';
import { server } from './mocks/server';

// Mock de variables de entorno
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.NODE_ENV = 'test';

// Setup MSW (Mock Service Worker)
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mock de Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    cliente: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn()
    },
    business: {
      findUnique: vi.fn()
    }
  }
}));
```

4. **Crear helpers de testing**
```typescript
// tests/helpers/auth.helper.ts
import { NextRequest } from 'next/server';

export function createMockRequest(options: {
  url?: string;
  method?: string;
  session?: any;
  body?: any;
  headers?: Record<string, string>;
}): NextRequest {
  const { url = 'http://localhost:3001', method = 'GET', session, body, headers = {} } = options;
  
  const request = new NextRequest(url, {
    method,
    headers: new Headers(headers),
    body: body ? JSON.stringify(body) : undefined
  });
  
  if (session) {
    request.cookies.set('session', JSON.stringify(session));
  }
  
  return request;
}

export function createTestSession(role: 'ADMIN' | 'STAFF' | 'CLIENTE' = 'ADMIN') {
  return {
    userId: 'test-user-id',
    email: `${role.toLowerCase()}@test.com`,
    role,
    businessId: 'test-business-id',
    businessName: 'Test Business',
    sessionToken: 'test-token-123'
  };
}
```

**Checklist:**
- [ ] Instalar Vitest y dependencias
- [ ] Crear vitest.config.ts
- [ ] Crear tests/setup.ts
- [ ] Crear helpers de testing
- [ ] Actualizar package.json scripts
- [ ] Verificar que `npm test` funciona

---

### DÍA 3-4: Tests de Autenticación (4 horas)

#### Crear tests para el flujo crítico de auth:

```typescript
// tests/api/auth/session.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSession, requireAuth, AuthError } from '@/lib/auth/session';
import { createMockRequest, createTestSession } from '@/tests/helpers/auth.helper';
import { prisma } from '@/lib/prisma';

describe('Auth - getSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('should return null when no session cookie', async () => {
    const request = createMockRequest({ url: 'http://localhost/api/test' });
    const session = await getSession(request);
    expect(session).toBeNull();
  });
  
  it('should return session when valid cookie exists', async () => {
    const testSession = createTestSession('ADMIN');
    const request = createMockRequest({ session: testSession });
    
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: testSession.userId,
      sessionToken: testSession.sessionToken,
      sessionExpires: new Date(Date.now() + 3600000), // 1 hora
      email: testSession.email,
      role: testSession.role
    } as any);
    
    const session = await getSession(request);
    expect(session).toEqual(testSession);
  });
  
  it('should return null when session expired', async () => {
    const testSession = createTestSession('ADMIN');
    const request = createMockRequest({ session: testSession });
    
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: testSession.userId,
      sessionExpires: new Date(Date.now() - 1000), // Expirada
    } as any);
    
    const session = await getSession(request);
    expect(session).toBeNull();
  });
});

describe('Auth - requireAuth', () => {
  it('should throw AuthError when no session', async () => {
    const request = createMockRequest({});
    await expect(requireAuth(request)).rejects.toThrow(AuthError);
  });
  
  it('should return session for authenticated request', async () => {
    const testSession = createTestSession('ADMIN');
    const request = createMockRequest({ session: testSession });
    
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: testSession.userId,
      sessionToken: testSession.sessionToken,
      sessionExpires: new Date(Date.now() + 3600000),
    } as any);
    
    const result = await requireAuth(request);
    expect(result.session).toBeDefined();
    expect(result.session.role).toBe('ADMIN');
  });
  
  it('should enforce role permissions', async () => {
    const staffSession = createTestSession('STAFF');
    const request = createMockRequest({ session: staffSession });
    
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: staffSession.userId,
      sessionExpires: new Date(Date.now() + 3600000),
    } as any);
    
    await expect(
      requireAuth(request, { roles: ['ADMIN'] })
    ).rejects.toThrow('Sin permisos');
  });
});
```

**Checklist:**
- [ ] Tests para getSession()
- [ ] Tests para requireAuth()
- [ ] Tests para validación de roles
- [ ] Tests para sesiones expiradas
- [ ] Todos los tests pasan ✅

---

### DÍA 5-6: Tests de APIs Críticas (4-6 horas)

#### Tests para Cliente API:

```typescript
// tests/api/cliente/lista.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/cliente/lista/route';
import { createMockRequest, createTestSession } from '@/tests/helpers/auth.helper';
import { prisma } from '@/lib/prisma';

describe('API /cliente/lista', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('should return 401 when not authenticated', async () => {
    const request = createMockRequest({ url: 'http://localhost/api/cliente/lista' });
    const response = await GET(request);
    expect(response.status).toBe(401);
  });
  
  it('should return clients for authenticated admin', async () => {
    const session = createTestSession('ADMIN');
    const mockClientes = [
      { id: '1', nombre: 'Juan', email: 'juan@test.com', businessId: session.businessId },
      { id: '2', nombre: 'Maria', email: 'maria@test.com', businessId: session.businessId }
    ];
    
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: session.userId,
      sessionExpires: new Date(Date.now() + 3600000),
    } as any);
    
    vi.mocked(prisma.cliente.findMany).mockResolvedValue(mockClientes as any);
    
    const request = createMockRequest({
      url: `http://localhost/api/cliente/lista?businessId=${session.businessId}`,
      session
    });
    
    const response = await GET(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data).toHaveLength(2);
    expect(data[0].nombre).toBe('Juan');
  });
  
  it('should filter clients by businessId', async () => {
    const session = createTestSession('ADMIN');
    
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: session.userId,
      sessionExpires: new Date(Date.now() + 3600000),
    } as any);
    
    vi.mocked(prisma.cliente.findMany).mockResolvedValue([]);
    
    const request = createMockRequest({
      url: `http://localhost/api/cliente/lista?businessId=${session.businessId}`,
      session
    });
    
    await GET(request);
    
    expect(prisma.cliente.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ businessId: session.businessId })
      })
    );
  });
});
```

#### Tests para Reservas API:

```typescript
// tests/api/reservas/create.test.ts
import { describe, it, expect, vi } from 'vitest';
import { POST } from '@/app/api/reservas/route';
import { createMockRequest, createTestSession } from '@/tests/helpers/auth.helper';

describe('API /reservas', () => {
  it('should create reservation with valid data', async () => {
    const session = createTestSession('CLIENTE');
    const reservaData = {
      nombreCliente: 'Test User',
      telefonoCliente: '1234567890',
      fecha: '2025-10-15',
      hora: '19:00',
      personas: 4,
      businessId: session.businessId
    };
    
    const request = createMockRequest({
      url: 'http://localhost/api/reservas',
      method: 'POST',
      session,
      body: reservaData
    });
    
    const response = await POST(request);
    expect(response.status).toBe(201);
  });
  
  it('should reject invalid phone number', async () => {
    const session = createTestSession('CLIENTE');
    const invalidData = {
      nombreCliente: 'Test',
      telefonoCliente: '123', // Inválido
      fecha: '2025-10-15',
      hora: '19:00',
      personas: 4
    };
    
    const request = createMockRequest({
      url: 'http://localhost/api/reservas',
      method: 'POST',
      session,
      body: invalidData
    });
    
    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
```

**Checklist:**
- [ ] Tests para GET /api/cliente/lista
- [ ] Tests para POST /api/reservas
- [ ] Tests para PATCH /api/reservas/[id]
- [ ] Tests para validaciones de entrada
- [ ] Coverage >50% en APIs críticas

---

### DÍA 7: Tests de Servicios (2-4 horas)

```typescript
// tests/services/clienteService.test.ts
import { describe, it, expect } from 'vitest';
import { ClienteService } from '@/services/cliente.service';

describe('ClienteService', () => {
  const service = new ClienteService();
  
  describe('calculateLevel', () => {
    it('should return Bronce for < 500 points', () => {
      expect(service.calculateLevel(100)).toBe('Bronce');
      expect(service.calculateLevel(499)).toBe('Bronce');
    });
    
    it('should return Plata for 500-999 points', () => {
      expect(service.calculateLevel(500)).toBe('Plata');
      expect(service.calculateLevel(999)).toBe('Plata');
    });
    
    it('should return Oro for 1000+ points', () => {
      expect(service.calculateLevel(1000)).toBe('Oro');
      expect(service.calculateLevel(5000)).toBe('Oro');
    });
  });
  
  describe('formatPoints', () => {
    it('should format points with thousands separator', () => {
      expect(service.formatPoints(1000)).toBe('1,000');
      expect(service.formatPoints(123456)).toBe('123,456');
    });
  });
});
```

**Checklist:**
- [ ] Tests para cliente.service.ts
- [ ] Tests para reserva.service.ts (cuando se cree)
- [ ] Tests para utilidades críticas

---

### 📊 Resultados Esperados Semana 1:

```
✅ Framework de testing configurado
✅ ~15-20 tests creados
✅ Coverage: 30-40% en código crítico
✅ CI/CD ready (opcional)
✅ Confianza para refactorizar: +50%
```

---

## 🗓️ SEMANA 2: AUTH UNIFICATION (8-10 horas)

### Objetivo:
Centralizar toda la autenticación en un solo sistema.

### DÍA 1-2: Crear Middleware Unificado (4 horas)

```typescript
// src/lib/auth/session.ts
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export type UserRole = 'SUPERADMIN' | 'ADMIN' | 'STAFF' | 'CLIENTE';

export interface Session {
  userId: string;
  email: string;
  role: UserRole;
  businessId: string;
  businessName: string;
  sessionToken: string;
}

export interface AuthContext {
  session: Session;
  user: Session; // Alias para compatibilidad
}

export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number = 401
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Obtiene la sesión desde la cookie
 */
export async function getSession(request: NextRequest): Promise<Session | null> {
  try {
    const cookieValue = request.cookies.get('session')?.value;
    if (!cookieValue) return null;
    
    const session: Session = JSON.parse(decodeURIComponent(cookieValue));
    
    // Validar en base de datos
    const user = await prisma.user.findUnique({
      where: {
        id: session.userId,
        sessionToken: session.sessionToken
      },
      select: {
        id: true,
        sessionExpires: true,
        role: true,
        businessId: true
      }
    });
    
    if (!user || !user.sessionExpires || user.sessionExpires < new Date()) {
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Error parsing session:', error);
    return null;
  }
}

/**
 * Requiere autenticación y opcionalmente valida roles
 */
export async function requireAuth(
  request: NextRequest,
  options?: {
    roles?: UserRole[];
    permissions?: string[];
  }
): Promise<AuthContext> {
  const session = await getSession(request);
  
  if (!session) {
    throw new AuthError('No autenticado', 401);
  }
  
  // Validar roles si se especificaron
  if (options?.roles && !options.roles.includes(session.role)) {
    throw new AuthError('Sin permisos', 403);
  }
  
  return {
    session,
    user: session // Alias
  };
}

/**
 * Helper para obtener businessId desde múltiples fuentes
 */
export function getBusinessIdFromRequest(
  request: NextRequest,
  session?: Session
): string | null {
  const url = new URL(request.url);
  
  // 1. Query parameter
  const query = url.searchParams.get('businessId');
  if (query) return query;
  
  // 2. Header
  const header = request.headers.get('x-business-id');
  if (header) return header;
  
  // 3. Referer
  const referer = request.headers.get('referer');
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      const segments = refererUrl.pathname.split('/').filter(Boolean);
      if (segments.length >= 2 && segments[1] === 'admin') {
        return segments[0];
      }
    } catch {}
  }
  
  // 4. Session
  if (session?.businessId) return session.businessId;
  
  return null;
}

/**
 * Wrapper para manejar errores automáticamente
 */
export function withAuth(
  handler: (request: NextRequest, context: AuthContext) => Promise<Response>,
  options?: { roles?: UserRole[] }
) {
  return async (request: NextRequest) => {
    try {
      const auth = await requireAuth(request, options);
      return await handler(request, auth);
    } catch (error) {
      if (error instanceof AuthError) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: error.statusCode, headers: { 'Content-Type': 'application/json' } }
        );
      }
      throw error;
    }
  };
}
```

**Checklist:**
- [ ] Crear src/lib/auth/session.ts
- [ ] Implementar getSession()
- [ ] Implementar requireAuth()
- [ ] Implementar withAuth() wrapper
- [ ] Tests para nuevo middleware
- [ ] Documentar uso

---

### DÍA 3-4: Migrar APIs (4-6 horas)

**Estrategia:** Migrar una API a la vez, probar, commit.

#### Ejemplo de migración:

```typescript
// ANTES: src/app/api/cliente/lista/route.ts
function getSessionFromCookie(request: NextRequest) { ... } // ← ELIMINAR
export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromCookie(request);
    if (!session?.userId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    // ...
  } catch { ... }
}

// DESPUÉS:
import { requireAuth, getBusinessIdFromRequest } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  const { session } = await requireAuth(request, { roles: ['ADMIN', 'SUPERADMIN'] });
  
  const businessId = getBusinessIdFromRequest(request, session);
  if (!businessId) {
    return NextResponse.json({ error: 'Business ID requerido' }, { status: 400 });
  }
  
  const clientes = await prisma.cliente.findMany({
    where: { businessId }
  });
  
  return NextResponse.json(clientes);
}
```

**Plan de Migración:**

1. **APIs Críticas (prioridad alta):**
   - [ ] /api/cliente/lista
   - [ ] /api/reservas
   - [ ] /api/staff/consumo
   - [ ] /api/users

2. **APIs Secundarias:**
   - [ ] /api/portal/config
   - [ ] /api/business/[id]/client-theme
   - [ ] /api/admin/* (15 endpoints)

3. **Eliminar código viejo:**
   - [ ] Eliminar getSessionFromCookie() duplicados
   - [ ] Deprecar src/middleware/requireAuth.ts viejo
   - [ ] Actualizar imports en todo el proyecto

**Checklist:**
- [ ] Migrar 5 APIs críticas
- [ ] Tests pasando para APIs migradas
- [ ] Eliminar código duplicado
- [ ] Documentar cambios

---

### 📊 Resultados Esperados Semana 2:

```
✅ Sistema de auth unificado
✅ 20+ APIs usando nuevo middleware
✅ -500 líneas de código duplicado eliminadas
✅ Tests de auth al 100%
✅ Seguridad mejorada
```

---

## 🗓️ SEMANA 3: VALIDATIONS & SCHEMAS (10-12 horas)

### Objetivo:
Validar todas las entradas con Zod y crear type-safety completo.

### DÍA 1-2: Crear Schemas (4 horas)

```typescript
// src/schemas/cliente.schema.ts
import { z } from 'zod';

export const createClienteSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido').max(100),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefono: z.string()
    .regex(/^\d{10}$/, 'Teléfono debe tener 10 dígitos')
    .optional()
    .or(z.literal('')),
  cedula: z.string().min(5, 'Cédula debe tener al menos 5 caracteres').max(20),
  businessId: z.string().cuid('Business ID inválido'),
  fechaNacimiento: z.string().datetime().optional(),
});

export const updateClienteSchema = createClienteSchema.partial().extend({
  id: z.string().cuid(),
});

export const clienteIdSchema = z.object({
  id: z.string().cuid('ID de cliente inválido'),
});

export type CreateClienteInput = z.infer<typeof createClienteSchema>;
export type UpdateClienteInput = z.infer<typeof updateClienteSchema>;
```

```typescript
// src/schemas/reserva.schema.ts
import { z } from 'zod';

export const createReservaSchema = z.object({
  nombreCliente: z.string().min(1, 'Nombre requerido'),
  telefonoCliente: z.string().regex(/^\d{10}$/, 'Teléfono inválido'),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (YYYY-MM-DD)'),
  hora: z.string().regex(/^\d{2}:\d{2}$/, 'Hora inválida (HH:MM)'),
  personas: z.number().int().min(1).max(20),
  mesa: z.string().optional(),
  notas: z.string().max(500).optional(),
  businessId: z.string().cuid(),
});

export const updateReservaSchema = createReservaSchema.partial().extend({
  id: z.string().cuid(),
  estado: z.enum(['PENDIENTE', 'CONFIRMADA', 'CANCELADA', 'COMPLETADA']).optional(),
});

export type CreateReservaInput = z.infer<typeof createReservaSchema>;
export type UpdateReservaInput = z.infer<typeof updateReservaSchema>;
```

**Schemas a crear:**
- [ ] cliente.schema.ts
- [ ] reserva.schema.ts
- [ ] promocion.schema.ts
- [ ] portal.schema.ts
- [ ] consumo.schema.ts

---

### DÍA 3-4: Aplicar Validaciones (4-6 horas)

**Helper para validación:**

```typescript
// src/lib/validation-helpers.ts
import { z } from 'zod';
import { NextResponse } from 'next/server';

export function validateRequest<T extends z.ZodType>(
  schema: T,
  data: unknown
): z.infer<T> {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(
        'Datos inválidos',
        error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      );
    }
    throw error;
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public errors: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function handleValidationError(error: unknown) {
  if (error instanceof ValidationError) {
    return NextResponse.json(
      {
        error: error.message,
        details: error.errors
      },
      { status: 400 }
    );
  }
  throw error;
}
```

**Aplicar en APIs:**

```typescript
// src/app/api/reservas/route.ts
import { createReservaSchema } from '@/schemas/reserva.schema';
import { validateRequest } from '@/lib/validation-helpers';

export async function POST(request: NextRequest) {
  const { session } = await requireAuth(request);
  
  const body = await request.json();
  const validatedData = validateRequest(createReservaSchema, body);
  
  const reserva = await prisma.reserva.create({
    data: validatedData
  });
  
  return NextResponse.json(reserva, { status: 201 });
}
```

**Checklist:**
- [ ] Validar todas las APIs POST
- [ ] Validar todas las APIs PUT/PATCH
- [ ] Tests para validaciones
- [ ] Mensajes de error user-friendly

---

### DÍA 5: Error Handling Centralizado (2 horas)

```typescript
// src/lib/api-helpers.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AuthError } from './auth/session';
import { ValidationError } from './validation-helpers';
import * as Sentry from '@sentry/nextjs';

export function withErrorHandling<T>(
  handler: (request: NextRequest, ...args: any[]) => Promise<T>
) {
  return async (request: NextRequest, ...args: any[]) => {
    try {
      return await handler(request, ...args);
    } catch (error) {
      // Auth errors
      if (error instanceof AuthError) {
        return NextResponse.json(
          { error: error.message },
          { status: error.statusCode }
        );
      }
      
      // Validation errors
      if (error instanceof ValidationError) {
        return NextResponse.json(
          { error: error.message, details: error.errors },
          { status: 400 }
        );
      }
      
      // Zod errors
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: 'Datos inválidos',
            details: error.errors.map(e => ({
              field: e.path.join('.'),
              message: e.message
            }))
          },
          { status: 400 }
        );
      }
      
      // Prisma errors
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'Registro duplicado' },
          { status: 409 }
        );
      }
      
      // Log unexpected errors
      console.error('Unhandled API error:', error);
      Sentry.captureException(error);
      
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  };
}

// Uso:
export const POST = withErrorHandling(async (request) => {
  // Tu lógica aquí
});
```

**Checklist:**
- [ ] Implementar withErrorHandling()
- [ ] Aplicar en APIs críticas
- [ ] Tests para diferentes tipos de errores

---

### 📊 Resultados Esperados Semana 3:

```
✅ Validaciones type-safe en 100% de APIs
✅ Mensajes de error consistentes
✅ -200 líneas de validación manual eliminadas
✅ Error handling centralizado
✅ Mejor DX con autocomplete
```

---

## 🗓️ SEMANA 4: SERVICES & CLEANUP (10-12 horas)

### Objetivo:
Separar lógica de negocio en servicios reutilizables.

### DÍA 1-2: Crear Repositories (4 horas)

```typescript
// src/repositories/cliente.repository.ts
import { prisma } from '@/lib/prisma';
import { CreateClienteInput, UpdateClienteInput } from '@/schemas/cliente.schema';

export class ClienteRepository {
  async findById(id: string) {
    return prisma.cliente.findUnique({
      where: { id },
      include: { tarjeta: true }
    });
  }
  
  async findByBusinessId(businessId: string) {
    return prisma.cliente.findMany({
      where: { businessId },
      include: { tarjeta: true },
      orderBy: { createdAt: 'desc' }
    });
  }
  
  async findByCedula(cedula: string, businessId: string) {
    return prisma.cliente.findFirst({
      where: { cedula, businessId }
    });
  }
  
  async create(data: CreateClienteInput) {
    return prisma.cliente.create({
      data,
      include: { tarjeta: true }
    });
  }
  
  async update(id: string, data: UpdateClienteInput) {
    return prisma.cliente.update({
      where: { id },
      data,
      include: { tarjeta: true }
    });
  }
  
  async delete(id: string) {
    return prisma.cliente.delete({ where: { id } });
  }
  
  async updatePoints(id: string, points: number) {
    return prisma.cliente.update({
      where: { id },
      data: { puntos: { increment: points } }
    });
  }
}
```

**Repositories a crear:**
- [ ] cliente.repository.ts
- [ ] reserva.repository.ts
- [ ] promocion.repository.ts
- [ ] consumo.repository.ts

---

### DÍA 3-4: Crear Services (4-6 horas)

```typescript
// src/services/cliente.service.ts
import { ClienteRepository } from '@/repositories/cliente.repository';
import { CreateClienteInput } from '@/schemas/cliente.schema';

export class ClienteService {
  constructor(private repo = new ClienteRepository()) {}
  
  async getClientesByBusiness(businessId: string) {
    const clientes = await this.repo.findByBusinessId(businessId);
    
    return clientes.map(c => ({
      ...c,
      puntosFormateados: this.formatPoints(c.puntos),
      nivelActual: this.calculateLevel(c.puntos),
      proximoNivel: this.getNextLevel(c.puntos)
    }));
  }
  
  async createCliente(data: CreateClienteInput) {
    // Validar duplicados
    const existing = await this.repo.findByCedula(data.cedula, data.businessId);
    if (existing) {
      throw new Error('Cliente ya existe con esta cédula');
    }
    
    // Crear con nivel inicial
    const cliente = await this.repo.create({
      ...data,
      puntos: 0,
      nivel: 'Bronce'
    });
    
    return cliente;
  }
  
  async addPoints(clienteId: string, points: number, reason: string) {
    const cliente = await this.repo.findById(clienteId);
    if (!cliente) {
      throw new Error('Cliente no encontrado');
    }
    
    const newPoints = cliente.puntos + points;
    const newLevel = this.calculateLevel(newPoints);
    
    // Actualizar puntos y nivel
    const updated = await this.repo.update(clienteId, {
      puntos: newPoints,
      nivel: newLevel
    });
    
    // Si subió de nivel, crear notificación
    if (newLevel !== cliente.nivel) {
      await this.notifyLevelUp(clienteId, cliente.nivel, newLevel);
    }
    
    return updated;
  }
  
  calculateLevel(puntos: number): string {
    if (puntos >= 2000) return 'Platino';
    if (puntos >= 1500) return 'Diamante';
    if (puntos >= 1000) return 'Oro';
    if (puntos >= 500) return 'Plata';
    return 'Bronce';
  }
  
  formatPoints(points: number): string {
    return points.toLocaleString('es-CO');
  }
  
  getNextLevel(points: number): { nivel: string; puntos: number } {
    if (points < 500) return { nivel: 'Plata', puntos: 500 - points };
    if (points < 1000) return { nivel: 'Oro', puntos: 1000 - points };
    if (points < 1500) return { nivel: 'Diamante', puntos: 1500 - points };
    if (points < 2000) return { nivel: 'Platino', puntos: 2000 - points };
    return { nivel: 'Platino', puntos: 0 };
  }
  
  private async notifyLevelUp(clienteId: string, oldLevel: string, newLevel: string) {
    // Implementar notificación
  }
}
```

**Services a crear:**
- [ ] cliente.service.ts
- [ ] reserva.service.ts
- [ ] promocion.service.ts
- [ ] loyalty.service.ts (cálculo de puntos)

---

### DÍA 5: Refactorizar APIs (2 horas)

**Antes:**
```typescript
export async function GET(request: NextRequest) {
  const session = await requireAuth(request);
  const clientes = await prisma.cliente.findMany({
    where: { businessId: session.businessId }
  });
  return NextResponse.json(clientes);
}
```

**Después:**
```typescript
export async function GET(request: NextRequest) {
  const { session } = await requireAuth(request);
  const clienteService = new ClienteService();
  
  const clientes = await clienteService.getClientesByBusiness(session.businessId);
  
  return NextResponse.json(clientes);
}
```

**Checklist:**
- [ ] Refactorizar 10 APIs principales
- [ ] Tests para servicios
- [ ] Tests pasando en APIs refactorizadas

---

### 📊 Resultados Esperados Semana 4:

```
✅ Lógica de negocio en servicios reutilizables
✅ APIs más limpias y simples
✅ Mejor testabilidad
✅ -400 líneas de código duplicado
✅ Fácil agregar nuevas features
```

---

## 📋 CHECKLIST FINAL

### Semana 1: Testing
- [ ] Vitest configurado
- [ ] 20+ tests críticos
- [ ] Coverage >30%

### Semana 2: Auth
- [ ] Middleware unificado
- [ ] 20+ APIs migradas
- [ ] Código duplicado eliminado

### Semana 3: Validations
- [ ] Schemas creados
- [ ] 100% APIs validadas
- [ ] Error handling centralizado

### Semana 4: Services
- [ ] 4 repositories creados
- [ ] 4 services creados
- [ ] APIs refactorizadas

---

## 🎯 MÉTRICAS DE ÉXITO

### Antes:
```
⏱️ Tiempo agregar feature: 8h
🐛 Bugs/semana: 3-4
🧪 Confianza refactorizar: 30%
📏 Líneas duplicadas: ~2,000
✅ Coverage: 5%
```

### Después (meta):
```
⏱️ Tiempo agregar feature: 4-5h (-40%)
🐛 Bugs/semana: 1 (-75%)
🧪 Confianza refactorizar: 85%
📏 Líneas duplicadas: ~500 (-75%)
✅ Coverage: 60%
```

---

## 💡 TIPS PARA ÉXITO

1. **Commits frecuentes** - Commit después de cada mejora pequeña
2. **Tests primero** - No refactorices sin tests
3. **Una cosa a la vez** - No mezcles auth + validations en un PR
4. **Mantén producción funcionando** - Feature flags si es necesario
5. **Documenta mientras avanzas** - Tu yo futuro lo agradecerá

---

## 🚨 PLAN B (Si te quedas sin tiempo)

### Prioridades críticas (mínimo viable):
1. ✅ Tests de auth (4 horas)
2. ✅ Middleware unificado (4 horas)
3. ✅ Validaciones con Zod en 5 APIs críticas (4 horas)

**Total mínimo:** 12 horas = Mayor impacto con menor inversión

---

**Documento creado:** 6 de Octubre, 2025  
**Próximo review:** Después de Semana 2  
**Contacto:** [Tu nombre/email]
