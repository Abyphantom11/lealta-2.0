import { NextRequest } from 'next/server';

export type TestRole = 'SUPERADMIN' | 'ADMIN' | 'STAFF' | 'CLIENTE';

export interface TestSession {
  userId: string;
  email: string;
  role: TestRole;
  businessId: string;
  businessName: string;
  sessionToken: string;
}

/**
 * Crea una sesión de prueba con valores por defecto
 */
export function createTestSession(role: TestRole = 'ADMIN'): TestSession {
  return {
    userId: `test-user-${role.toLowerCase()}`,
    email: `${role.toLowerCase()}@test.com`,
    role,
    businessId: 'test-business-id-123',
    businessName: 'Test Business',
    sessionToken: `test-token-${role.toLowerCase()}-${Date.now()}`,
  };
}

/**
 * Crea un NextRequest mock para testing
 */
export function createMockRequest(options: {
  url?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  session?: TestSession;
  body?: any;
  headers?: Record<string, string>;
  searchParams?: Record<string, string>;
}): NextRequest {
  const {
    url = 'http://localhost:3001/api/test',
    method = 'GET',
    session,
    body,
    headers = {},
    searchParams = {},
  } = options;

  // Construir URL con query params
  const urlWithParams = new URL(url);
  Object.entries(searchParams).forEach(([key, value]) => {
    urlWithParams.searchParams.set(key, value);
  });

  // Crear headers
  const requestHeaders = new Headers(headers);
  if (body) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  // Crear request
  const request = new NextRequest(urlWithParams.toString(), {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Agregar session cookie si existe
  if (session) {
    const sessionString = JSON.stringify(session);
    const encoded = encodeURIComponent(sessionString);
    (request.cookies as any).set('session', encoded);
  }

  return request;
}

/**
 * Crea un mock de usuario de Prisma
 */
export function createMockUser(overrides?: Partial<any>) {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: 'ADMIN',
    businessId: 'test-business-id',
    sessionToken: 'test-token',
    sessionExpires: new Date(Date.now() + 3600000), // 1 hora en el futuro
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Crea un mock de cliente de Prisma
 */
export function createMockCliente(overrides?: Partial<any>) {
  return {
    id: 'test-cliente-id',
    nombre: 'Juan Test',
    email: 'juan@test.com',
    telefono: '1234567890',
    cedula: '123456789',
    puntos: 100,
    nivel: 'Bronce',
    businessId: 'test-business-id',
    createdAt: new Date(),
    updatedAt: new Date(),
    tarjeta: null,
    ...overrides,
  };
}

/**
 * Crea un mock de business de Prisma
 */
export function createMockBusiness(overrides?: Partial<any>) {
  return {
    id: 'test-business-id',
    name: 'Test Business',
    slug: 'test-business',
    subdomain: 'test',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Crea un mock de reserva de Prisma
 */
export function createMockReserva(overrides?: Partial<any>) {
  return {
    id: 'test-reserva-id',
    nombreCliente: 'Juan Test',
    telefonoCliente: '1234567890',
    fecha: '2025-10-15',
    hora: '19:00',
    personas: 4,
    mesa: '5',
    estado: 'PENDIENTE',
    businessId: 'test-business-id',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Extrae JSON de una Response
 */
export async function getResponseJson(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * Espera un tiempo determinado (útil para tests async)
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
