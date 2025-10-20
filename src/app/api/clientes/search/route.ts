import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { validateBusinessAccess } from '../../../../utils/business-validation';

const prisma = new PrismaClient();

// Indicar a Next.js que esta ruta es dinámica
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Intentar obtener business ID desde headers o usar método alternativo
    let businessId: string | null = null;
    
    try {
      businessId = validateBusinessAccess(request);
    } catch (authError) {
      // Si no está en el context del middleware, intentar obtener desde headers directos
      console.log('⚠️ No middleware context, using direct headers:', authError instanceof Error ? authError.message : 'Unknown error');
      businessId = request.headers.get('x-business-id');
      
      if (!businessId) {
        console.error('❌ No business ID found in request:', {
          headers: Object.fromEntries(request.headers.entries()),
          url: request.url
        });
        return NextResponse.json(
          { error: 'Business ID required for search' },
          { status: 400 }
        );
      }
    }
    
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }

    console.log('🔍 Searching clients:', { businessId, query });

    // Buscar clientes por nombre, correo, teléfono o cédula dentro del business
    const clientes = await prisma.cliente.findMany({
      where: {
        businessId, // Filtrar por business
        OR: [
          { nombre: { contains: query } },
          { correo: { contains: query } },
          { telefono: { contains: query } },
          { cedula: { contains: query } },
        ],
      },
      select: {
        id: true,
        nombre: true,
        cedula: true,
        correo: true,
        telefono: true,
        puntos: true,
        totalGastado: true,
        totalVisitas: true,
        // Incluir consumos para calcular estadísticas actualizadas
        Consumo: {
          select: {
            total: true,
            puntos: true,
            registeredAt: true,
          },
        },
        // Incluir información de tarjeta si existe
        TarjetaLealtad: {
          select: {
            nivel: true,
            activa: true,
            asignacionManual: true,
            fechaAsignacion: true,
          },
        },
      },
      take: 10, // Limitar resultados
    });

    // Procesar datos para incluir estadísticas actualizadas y info de tarjeta
    const clientesConStats = clientes.map(cliente => {
      // Usar datos ya calculados del modelo, pero también verificar consumos recientes
      const gastoTotal = cliente.totalGastado;
      const puntosActuales = cliente.puntos;
      const visitasTotal = cliente.totalVisitas;

      // Información de tarjeta de lealtad
      const tarjetaInfo = cliente.TarjetaLealtad
        ? {
            nivel: cliente.TarjetaLealtad.nivel,
            activa: cliente.TarjetaLealtad.activa,
            asignacionManual: cliente.TarjetaLealtad.asignacionManual,
            fechaAsignacion: cliente.TarjetaLealtad.fechaAsignacion,
          }
        : null;

      return {
        id: cliente.id,
        nombre: cliente.nombre,
        cedula: cliente.cedula,
        email: cliente.correo,
        telefono: cliente.telefono,
        puntos: puntosActuales,
        gastoTotal,
        visitas: visitasTotal,
        tarjetaLealtad: tarjetaInfo, // Cambiar 'tarjeta' por 'tarjetaLealtad'
      };
    });

    return NextResponse.json(clientesConStats);
  } catch (error) {
    console.error('Error buscando clientes:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
