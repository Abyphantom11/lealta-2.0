import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withAuth } from '../../../../middleware/requireAuth';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // 🔒 Usar autenticación estándar con withAuth
  return withAuth(request, async (session) => {
    try {
      // 🔥 SINGLE SOURCE OF TRUTH: Solo usar session.businessId
      // La sesión ya fue validada por withAuth y tiene el businessId correcto
      const businessId = session.businessId;
      
      if (!businessId) {
        console.error('❌ LISTA CLIENTES: No businessId in session', {
          userId: session.userId,
          role: session.role
        });
        return NextResponse.json(
          { error: 'No business context in session' },
          { status: 403 }
        );
      }
      
      console.log('🔍 LISTA CLIENTES:', {
        businessId: businessId,
        userId: session.userId,
        role: session.role
      });

      // 🔒 SECURITY: Obtener SOLO clientes del business del usuario autenticado
      const clientes = await prisma.cliente.findMany({
        where: {
          businessId: businessId, // ✅ ÚNICO FILTRO - Session es fuente de verdad
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
          businessId: true,
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
        businessId: businessId,
      });

      return NextResponse.json({
        success: true,
        clientes,
      });
    } catch (error) {
      console.error('❌ Error obteniendo clientes:', error);
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  });
}
