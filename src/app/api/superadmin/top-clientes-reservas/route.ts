import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../../../middleware/requireAuth';
import { prisma } from '../../../../lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/superadmin/top-clientes-reservas
 * Obtiene los clientes con más invitados, asistencias o reservas
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async (session) => {
    try {
      // Solo SuperAdmin puede acceder
      if (session.role !== 'superadmin') {
        return NextResponse.json(
          { error: 'Acceso no autorizado' },
          { status: 403 }
        );
      }

      const searchParams = request.nextUrl.searchParams;
      const businessIdOrSlug = searchParams.get('businessId');
      const sortBy = searchParams.get('sortBy') || 'invitados';

      // Resolver businessId si se pasó un slug/subdomain
      let businessId: string | null = null;
      
      if (businessIdOrSlug) {
        // Intentar buscar por ID directo o por subdomain/slug
        const business = await prisma.business.findFirst({
          where: {
            OR: [
              { id: businessIdOrSlug },
              { subdomain: businessIdOrSlug },
              { slug: businessIdOrSlug },
            ],
          },
          select: { id: true },
        });
        
        if (business) {
          businessId = business.id;
        } else {
          console.warn(`❌ Business no encontrado: ${businessIdOrSlug}`);
        }
      }

      // Obtener todas las reservas con clientes
      const reservas = await prisma.reservation.findMany({
        where: businessId ? { businessId } : {},
        include: {
          cliente: {
            select: {
              id: true,
              nombre: true,
              cedula: true,
            },
          },
        },
      });

      // Agrupar por cliente y calcular métricas
      const clientesMap = new Map<string, {
        id: string;
        nombre: string;
        cedula: string;
        totalReservas: number;
        totalInvitados: number;
        asistencias: number;
        ultimaReserva: Date;
      }>();

      reservas.forEach(reserva => {
        // Si la reserva tiene cliente asociado
        if (reserva.cliente) {
          const clienteId = reserva.cliente.id;
          
          if (!clientesMap.has(clienteId)) {
            clientesMap.set(clienteId, {
              id: reserva.cliente.id,
              nombre: reserva.cliente.nombre,
              cedula: reserva.cliente.cedula,
              totalReservas: 0,
              totalInvitados: 0,
              asistencias: 0,
              ultimaReserva: reserva.reservedAt,
            });
          }

          const cliente = clientesMap.get(clienteId)!;
          cliente.totalReservas++;
          cliente.totalInvitados += reserva.guestCount;
          
          // Contar asistencias (reservas completadas o confirmadas)
          if (reserva.status === 'COMPLETED' || reserva.status === 'CONFIRMED') {
            cliente.asistencias++;
          }

          // Actualizar última reserva
          if (reserva.reservedAt > cliente.ultimaReserva) {
            cliente.ultimaReserva = reserva.reservedAt;
          }
        }
      });

      // Convertir a array y ordenar
      let clientes = Array.from(clientesMap.values());

      // Ordenar según el criterio
      switch (sortBy) {
        case 'invitados':
          clientes.sort((a, b) => b.totalInvitados - a.totalInvitados);
          break;
        case 'asistencias':
          clientes.sort((a, b) => b.asistencias - a.asistencias);
          break;
        case 'reservas':
          clientes.sort((a, b) => b.totalReservas - a.totalReservas);
          break;
      }

      // Tomar top 10
      clientes = clientes.slice(0, 10);

      return NextResponse.json({
        success: true,
        clientes: clientes.map(c => ({
          ...c,
          ultimaReserva: c.ultimaReserva.toISOString(),
        })),
        sortBy,
      });
    } catch (error) {
      console.error('Error obteniendo top clientes reservas:', error);
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  });
}
