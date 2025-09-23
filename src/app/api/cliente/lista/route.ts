import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 🔒 SECURITY: Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.error('❌ LISTA CLIENTES: Usuario no autenticado');
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // 🔥 BUSINESS CONTEXT: Determinar businessId desde múltiples fuentes
    let businessId = session.user.businessId;
    
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

    // 🔒 SECURITY: Verificar que el usuario tiene acceso al business solicitado
    if (businessId !== session.user.businessId) {
      // Solo SUPERADMIN puede acceder a otros businesses
      if (session.user.role !== 'SUPERADMIN') {
        console.error('❌ LISTA CLIENTES: Usuario no tiene acceso al business', {
          userBusinessId: session.user.businessId,
          requestedBusinessId: businessId,
          userRole: session.user.role
        });
        return NextResponse.json(
          { error: 'No autorizado - Sin acceso al business solicitado' },
          { status: 403 }
        );
      }
    }

    if (!businessId) {
      console.error('❌ LISTA CLIENTES: No se pudo determinar businessId', {
        sessionBusinessId: session.user.businessId,
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
      adminEmail: session.user.email,
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
