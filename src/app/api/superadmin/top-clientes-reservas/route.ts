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

      // ✅ FILTRAR POR MES ACTUAL (igual que el módulo de reservas)
      // Obtener mes y año actual
      const now = new Date();
      const añoActual = now.getFullYear();
      const mesActual = now.getMonth() + 1; // getMonth() retorna 0-11
      
      // Rango del mes actual (UTC para consistencia)
      const fechaInicio = new Date(Date.UTC(añoActual, mesActual - 1, 1, 0, 0, 0, 0));
      const fechaFin = new Date(Date.UTC(añoActual, mesActual, 1, 0, 0, 0, 0));

      console.log('📅 Filtrando reservas del mes actual:', {
        mes: mesActual,
        año: añoActual,
        fechaInicio: fechaInicio.toISOString(),
        fechaFin: fechaFin.toISOString()
      });

      // Obtener reservas del mes actual con HostTracking
      // Ya NO requerimos Cliente porque usaremos customerName
      const reservas = await prisma.reservation.findMany({
        where: {
          ...(businessId && { businessId }),
          reservedAt: {
            gte: fechaInicio,
            lt: fechaFin
          }
        },
        include: {
          Cliente: {
            select: {
              id: true,
              nombre: true,
              cedula: true,
            },
          },
          HostTracking: {
            select: {
              guestCount: true, // Número real de personas que asistieron
            },
          },
        },
      });

      // ✅ CORRECCIÓN: Agrupar por customerName (nombre real de la reserva)
      // No por Cliente.id, ya que "Cliente Express" es un registro genérico
      const clientesMap = new Map<string, {
        id: string;
        nombre: string;
        cedula: string;
        totalReservas: number;
        totalAsistentes: number;
        reservasConAsistencia: number;
        ultimaReserva: Date;
      }>();

      reservas.forEach(reserva => {
        // Usar customerName como identificador único (nombre real de quien reservó)
        const customerName = reserva.customerName || 'Sin nombre';
        
        if (!clientesMap.has(customerName)) {
          clientesMap.set(customerName, {
            id: customerName, // Usar customerName como ID único
            nombre: customerName,
            cedula: reserva.Cliente?.cedula || '',
            totalReservas: 0,
            totalAsistentes: 0,
            reservasConAsistencia: 0,
            ultimaReserva: reserva.reservedAt,
          });
        }

        const cliente = clientesMap.get(customerName)!;
        cliente.totalReservas++;
        
        // ✅ ALINEADO CON MÓDULO DE RESERVAS: Solo contar asistencia REAL
        // Solo reservas CHECKED_IN con HostTracking.guestCount > 0 (personas que realmente asistieron)
        if (reserva.status === 'CHECKED_IN') {
          const asistentesReales = reserva.HostTracking?.guestCount || 0;
          
          if (asistentesReales > 0) {
            cliente.totalAsistentes += asistentesReales;
            cliente.reservasConAsistencia++;
          }
        }

        // Actualizar última reserva
        if (reserva.reservedAt > cliente.ultimaReserva) {
          cliente.ultimaReserva = reserva.reservedAt;
        }
      });

      // Convertir a array y ordenar
      let clientes = Array.from(clientesMap.values());

      // Ordenar según el criterio
      switch (sortBy) {
        case 'invitados':
          clientes.sort((a, b) => b.totalAsistentes - a.totalAsistentes);
          break;
        case 'asistencias':
          clientes.sort((a, b) => b.reservasConAsistencia - a.reservasConAsistencia);
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
