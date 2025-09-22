// src/middleware/subdomain.ts
import { NextRequest } from 'next/server';
import { prisma } from '../lib/prisma';

// Tipo para el business
type Business = {
  id: string;
  name: string;
  slug: string;
  subdomain: string;
  isActive: boolean;
};

// Tipos para las funciones de cache
type CachedBusinessFunction = (businessId: string) => Promise<Business | null>;
type SetCachedBusinessFunction = (businessId: string, data: Business) => void;

// Variables para las funciones de cache
let cachedBusinessFunction: CachedBusinessFunction | null = null;
let setCachedBusinessFunction: SetCachedBusinessFunction | null = null;

// Función de inicialización asíncrona para las funciones de cache
async function initializeCacheFunctions() {
  if (cachedBusinessFunction && setCachedBusinessFunction) return; // Ya inicializadas
  
  try {
    const middlewareModule = await import('../../middleware');
    cachedBusinessFunction = middlewareModule.getCachedBusiness;
    setCachedBusinessFunction = middlewareModule.setCachedBusiness;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log('Cache functions not available:', errorMessage);
  }
}

/**
 * Función optimizada para buscar business por identifier con cache
 */
async function findBusinessByIdentifier(identifier: string): Promise<BusinessContext['business'] | null> {
  // Inicializar funciones de cache si no están ya inicializadas
  await initializeCacheFunctions();
  // Crear una clave de cache específica para el identifier
  const cacheKey = `identifier:${identifier}`;
  
  // Intentar obtener del cache primero
  if (cachedBusinessFunction) {
    const cached = await cachedBusinessFunction(cacheKey);
    if (cached) {
      console.log(`🚀 CACHE HIT: Business by identifier ${identifier} found in cache`);
      return cached;
    }
  }

  // Si no está en cache, consultar base de datos
  try {
    const business = await prisma.business.findFirst({
      where: { 
        OR: [
          { subdomain: identifier },
          { slug: identifier }
        ],
        isActive: true 
      },
      select: {
        id: true,
        name: true,
        slug: true,
        subdomain: true,
        isActive: true
      }
    });

    // Guardar en cache si está disponible
    if (setCachedBusinessFunction && business) {
      setCachedBusinessFunction(cacheKey, business);
      // También cache por ID para reutilización
      setCachedBusinessFunction(business.id, business);
      console.log(`💾 CACHE SET: Business ${identifier} cached`);
    }

    return business;
  } catch (error) {
    console.error('Error finding business by identifier:', error);
    return null;
  }
}

/**
 * Extrae información del business desde la URL
 * Soporta patrones: /cafedani/admin, /cafedani/cliente, etc.
 */
export interface BusinessContext {
  businessId: string;
  subdomain: string;
  remainingPath: string;
  business?: {
    id: string;
    name: string;
    slug: string;
    subdomain: string;
    isActive: boolean;
  };
}

/**
 * Extrae el business del pathname de la URL
 * Ejemplo: /cafedani/admin -> { subdomain: 'cafedani', remainingPath: '/admin' }
 */
export function extractBusinessFromUrl(pathname: string): { 
  subdomain: string; 
  remainingPath: string; 
} | null {
  // Remover leading slash y dividir
  const pathSegments = pathname.split('/').filter(Boolean);
  
  if (pathSegments.length === 0) {
    return null;
  }
  
  const potentialSubdomain = pathSegments[0];
  
  // Verificar que no sea una ruta pública o estática
  const publicRoutes = [
    'login', 'signup', 'api', '_next', 'favicon.ico', 
    'manifest.json', 'sw.js', 'icons', 'images'
  ];
  
  if (publicRoutes.includes(potentialSubdomain)) {
    return null;
  }
  
  // Validar formato de subdomain (solo letras, números, guiones)
  const subdomainRegex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;
  if (!subdomainRegex.test(potentialSubdomain)) {
    return null;
  }
  
  return {
    subdomain: potentialSubdomain,
    remainingPath: '/' + pathSegments.slice(1).join('/')
  };
}

/**
 * Valida si un subdomain o slug corresponde a un business activo
 */
export async function validateBusinessSubdomain(identifier: string): Promise<BusinessContext['business'] | null> {
  try {
    // Buscar por subdomain O por slug usando cache
    const business = await findBusinessByIdentifier(identifier);
    
    return business;
  } catch (error) {
    console.error('Error validating business identifier:', error);
    return null;
  }
}

/**
 * Obtiene el contexto completo del business desde la URL
 */
export async function getBusinessContext(request: NextRequest): Promise<BusinessContext | null> {
  const pathname = request.nextUrl.pathname;
  
  // Extraer subdomain del path
  const urlData = extractBusinessFromUrl(pathname);
  if (!urlData) {
    return null;
  }
  
  // Validar que el business existe (buscar por subdomain o slug)
  const business = await validateBusinessSubdomain(urlData.subdomain);
  if (!business) {
    return null;
  }
  
  return {
    businessId: business.id,
    subdomain: business.subdomain,
    remainingPath: urlData.remainingPath,
    business
  };
}

/**
 * Verifica si una ruta requiere contexto de business
 */
export function requiresBusinessContext(pathname: string): boolean {
  // Rutas que NO requieren business context
  const publicPaths = [
    '/login',
    '/signup', 
    '/api/auth/signup',
    '/api/auth/signin',
    // '/api/emails', // 🚫 TEMPORALMENTE DESACTIVADO
    '/_next',
    '/favicon',
    '/manifest',
    '/sw.js'
  ];
  
  return !publicPaths.some(path => pathname.startsWith(path));
}

/**
 * Rutas protegidas que requieren autenticación
 */
export function isProtectedRoute(pathname: string): boolean {
  const protectedPaths = [
    '/admin',
    '/staff', 
    '/superadmin',
    '/dashboard'
  ];
  
  return protectedPaths.some(path => pathname.startsWith(path));
}

/**
 * Cache simple para businesses (evitar queries repetidas)
 */
const businessCache = new Map<string, BusinessContext['business']>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

interface CachedBusiness {
  business: BusinessContext['business'];
  timestamp: number;
}

export async function getCachedBusiness(subdomain: string): Promise<BusinessContext['business'] | null> {
  const cached = businessCache.get(subdomain) as CachedBusiness | undefined;
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return cached.business;
  }
  
  const business = await validateBusinessSubdomain(subdomain);
  
  if (business) {
    const cachedEntry: CachedBusiness = {
      business,
      timestamp: Date.now()
    };
    businessCache.set(subdomain, cachedEntry.business);
  }
  
  return business;
}
