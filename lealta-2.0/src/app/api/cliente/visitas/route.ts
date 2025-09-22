import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Función auxiliar para determinar businessId del request body
function getBusinessIdFromBody(businessId?: string): string | null {
  if (businessId) {
    console.log(`✅ BusinessId from request body: ${businessId}`);
    return businessId;
  }
  return null;
}

// Función auxiliar para determinar businessId del header
function getBusinessIdFromHeader(request: NextRequest): string | null {
  const businessId = request.headers.get('x-business-id');
  if (businessId) {
    console.log(`✅ BusinessId from header: ${businessId}`);
    return businessId;
  }
  return null;
}

// Función auxiliar para determinar businessId del referer
async function getBusinessIdFromReferer(request: NextRequest): Promise<string | null> {
  const refererHeader = request.headers.get('referer');
  if (!refererHeader) return null;

  try {
    const refererUrl = new URL(refererHeader);
    const pathSegments = refererUrl.pathname.split('/').filter(Boolean);
    
    if (pathSegments.length <= 1 || pathSegments[1] !== 'cliente') {
      return null;
    }

    const potentialBusinessSlug = pathSegments[0];
    const business = await prisma.business.findFirst({
      where: {
        OR: [
          { slug: potentialBusinessSlug },
          { subdomain: potentialBusinessSlug },
          { id: potentialBusinessSlug }
        ],
        isActive: true
      }
    });

    if (business) {
      console.log(`✅ BusinessId from referer: ${potentialBusinessSlug} → ${business.id}`);
      return business.id;
    }
  } catch (error) {
    console.error('Error parsing referer URL:', error);
  }

  return null;
}

// Función auxiliar para resolver businessId con múltiples métodos
async function resolveBusinessId(request: NextRequest, bodyBusinessId?: string): Promise<string | null> {
  console.log('📊 Cliente Visita: Determinando business context...');

  // Método 1: Del cuerpo de la petición
  let businessId = getBusinessIdFromBody(bodyBusinessId);
  if (businessId) return businessId;

  // Método 2: Del header
  businessId = getBusinessIdFromHeader(request);
  if (businessId) return businessId;

  // Método 3: Del referer
  businessId = await getBusinessIdFromReferer(request);
  if (businessId) return businessId;

  return null;
}

// Función auxiliar para crear la visita
async function createVisita(data: {
  sessionId: string;
  clienteId?: string;
  path?: string;
  referrer?: string;
  businessId: string;
  request: NextRequest;
}) {
  return await prisma.visita.create({
    data: {
      sessionId: data.sessionId,
      clienteId: data.clienteId || null,
      path: data.path || '/',
      referrer: data.referrer || null,
      businessId: data.businessId,
      timestamp: new Date(),
      userAgent: data.request.headers.get('user-agent') || '',
      ip: data.request.headers.get('x-forwarded-for') || data.request.headers.get('x-real-ip') || 'unknown'
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId, clienteId, path, referrer, businessId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID es requerido' },
        { status: 400 }
      );
    }

    const actualBusinessId = await resolveBusinessId(request, businessId);

    if (!actualBusinessId) {
      console.error('❌ No se pudo determinar el business context para la visita');
      return NextResponse.json(
        { error: 'No se pudo determinar el contexto del negocio' },
        { status: 400 }
      );
    }

    const visita = await createVisita({
      sessionId,
      clienteId,
      path,
      referrer,
      businessId: actualBusinessId,
      request
    });

    console.log(`📊 Visita registrada para business ${actualBusinessId}:`, {
      id: visita.id,
      sessionId: visita.sessionId,
      path: visita.path,
      clienteId: visita.clienteId
    });

    return NextResponse.json({
      success: true,
      visitaId: visita.id
    });

  } catch (error) {
    console.error('Error registrando visita:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
