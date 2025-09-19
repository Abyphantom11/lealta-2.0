import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { sessionId, clienteId, path, referrer, businessId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID es requerido' },
        { status: 400 }
      );
    }

    // 🔥 CRÍTICO: Obtener businessId con múltiples métodos para business isolation
    let actualBusinessId = null;
    
    console.log('📊 Cliente Visita: Determinando business context...');
    
    // Método 1: Del cuerpo de la petición (más confiable para rutas públicas)
    if (businessId) {
      actualBusinessId = businessId;
      console.log(`✅ BusinessId from request body: ${actualBusinessId}`);
    }
    
    // Método 2: Del header (para compatibilidad con middleware)
    if (!actualBusinessId) {
      actualBusinessId = request.headers.get('x-business-id');
      if (actualBusinessId) {
        console.log(`✅ BusinessId from header: ${actualBusinessId}`);
      }
    }
    
    // Método 3: Del referer (extraer de la URL de origen)
    if (!actualBusinessId) {
      const refererHeader = request.headers.get('referer');
      if (refererHeader) {
        const refererUrl = new URL(refererHeader);
        const pathSegments = refererUrl.pathname.split('/').filter(Boolean);
        if (pathSegments.length > 1 && pathSegments[1] === 'cliente') {
          const potentialBusinessSlug = pathSegments[0];
          
          // Validar que es un business válido consultando la DB
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
            actualBusinessId = business.id;
            console.log(`✅ BusinessId from referer: ${potentialBusinessSlug} → ${actualBusinessId}`);
          }
        }
      }
    }
    
    if (!actualBusinessId) {
      console.error('❌ No se pudo determinar el business context para la visita');
      return NextResponse.json(
        { error: 'No se pudo determinar el contexto del negocio' },
        { status: 400 }
      );
    }

    // Registrar la visita
    const visita = await prisma.visita.create({
      data: {
        sessionId,
        clienteId: clienteId || null,
        path: path || '/',
        referrer: referrer || null,
        businessId: actualBusinessId,
        timestamp: new Date(),
        userAgent: request.headers.get('user-agent') || '',
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
      }
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
