import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

// Función para obtener sesión desde cookie
function getSessionFromCookie(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) return null;
    
    // Parsear cookies manualmente
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    
    const sessionCookie = cookies['session'];
    if (!sessionCookie) return null;
    
    // Decodificar y parsear la sesión
    const decoded = decodeURIComponent(sessionCookie);
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Error parsing session cookie:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // 🔒 SECURITY: Verificar autenticación desde cookie de sesión
    const session = getSessionFromCookie(request);
    
    console.log('🔍 LISTA CLIENTES: Session check:', {
      hasSession: !!session,
      userId: session?.userId,
      userEmail: session?.email,
      userBusinessId: session?.businessId,
      userRole: session?.role
    });
    
    if (!session?.userId) {
      console.error('❌ LISTA CLIENTES: Usuario no autenticado - No valid session found');
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // 🔥 BUSINESS CONTEXT: Determinar businessId desde múltiples fuentes
    let businessId = session.businessId; // Desde la sesión
    
    // Método 1: Desde query parameter (para compatibilidad con rutas dinámicas)
    const url = new URL(request.url);
    const queryBusinessId = url.searchParams.get('businessId');
    
    // Método 2: Desde header (enviado por el frontend)
    const headerBusinessId = request.headers.get('x-business-id');
    
    // Método 3: Desde referer (extraer de la URL)
    const referer = request.headers.get('referer');
    let refererBusinessId = null;
    if (referer) {
      try {
        const refererUrl = new URL(referer);
        const pathSegments = refererUrl.pathname.split('/').filter(Boolean);
        if (pathSegments.length >= 2 && pathSegments[1] === 'admin') {
          refererBusinessId = pathSegments[0];
        }
      } catch (error) {
        console.warn('Error parsing referer:', error);
      }
    }

    // Prioridad: query > header > referer > session
    if (queryBusinessId) businessId = queryBusinessId;
    else if (headerBusinessId) businessId = headerBusinessId;
    else if (refererBusinessId) businessId = refererBusinessId;

    console.log('🔍 LISTA CLIENTES: BusinessId resolution:', {
      final: businessId,
      sessionBusinessId: session.businessId,
      queryBusinessId,
      headerBusinessId,
      refererBusinessId,
      match: businessId === session.businessId
    });

    // 🔒 SECURITY: Verificar que el usuario tiene acceso al business solicitado
    if (businessId !== session.businessId) {
      // Solo SUPERADMIN puede acceder a otros businesses
      if (session.role !== 'SUPERADMIN') {
        console.error('❌ LISTA CLIENTES: Usuario no tiene acceso al business', {
          userBusinessId: session.businessId,
          requestedBusinessId: businessId,
          userRole: session.role
        });
        return NextResponse.json(
          { error: 'No autorizado - Sin acceso al business solicitado' },
          { status: 403 }
        );
      }
    }

    if (!businessId) {
      console.error('❌ LISTA CLIENTES: No se pudo determinar businessId', {
        sessionBusinessId: session.businessId,
        queryBusinessId,
        headerBusinessId,
        refererBusinessId
      });
      return NextResponse.json(
        { error: 'No autorizado - Business ID requerido' },
        { status: 401 }
      );
    }
    
    console.log('🔍 LISTA CLIENTES DEBUG:', {
      adminBusinessId: businessId,
      adminEmail: session.email,
      timestamp: new Date().toISOString()
    });

    // 🔒 SECURITY: Obtener SOLO clientes del business del usuario autenticado
    const clientes = await prisma.cliente.findMany({
      where: {
        businessId: businessId, // ✅ FILTRO CRÍTICO POR BUSINESS
      },
      orderBy: {
        registeredAt: 'desc',
      },
      select: {
        id: true,
        cedula: true,
        nombre: true,
        telefono: true,
        correo: true,
        puntos: true,
        totalVisitas: true,
        totalGastado: true,
        registeredAt: true,
        lastLogin: true,
        businessId: true, // 🔍 Agregar businessId para debug
        tarjetaLealtad: {
          select: {
            nivel: true,
            activa: true,
            asignacionManual: true,
            fechaAsignacion: true,
          },
        },
      },
    });

    console.log('📊 CLIENTES ENCONTRADOS:', {
      count: clientes.length,
      businessId,
      clientes: clientes.map(c => ({
        cedula: c.cedula,
        nombre: c.nombre,
        businessId: c.businessId
      }))
    });

    return NextResponse.json({
      success: true,
      clientes,
    });
  } catch (error) {
    console.error('Error obteniendo clientes:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
