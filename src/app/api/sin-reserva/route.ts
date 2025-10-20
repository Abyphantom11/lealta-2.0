import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';
import { nanoid } from 'nanoid';

export const dynamic = 'force-dynamic';

// GET - Obtener registros sin reserva con filtros de fecha
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const businessIdOrSlug = searchParams.get('businessId') || 'default-business-id';
    const fecha = searchParams.get('fecha'); // YYYY-MM-DD format
    const mes = searchParams.get('mes'); // YYYY-MM format para reportes
    const includeStats = searchParams.get('includeStats') === 'true';
    
    console.log('📥 GET /api/sin-reserva - params:', { businessIdOrSlug, fecha, mes, includeStats });
    
    // Buscar el business por ID o slug
    let business;
    try {
      business = await prisma.business.findFirst({
        where: {
          OR: [
            { id: businessIdOrSlug },
            { slug: businessIdOrSlug }
          ]
        }
      });
    } catch {
      console.log('⚠️ Error buscando business, intentando solo por slug');
      business = await prisma.business.findUnique({
        where: { slug: businessIdOrSlug }
      });
    }
    
    if (!business) {
      console.error('❌ Business no encontrado:', businessIdOrSlug);
      return NextResponse.json(
        { error: 'Business no encontrado' },
        { status: 404 }
      );
    }
    
    console.log('✅ Business encontrado:', business.name, '(ID:', business.id + ')');
    
    // Construir filtros dinámicos
    const whereClause: any = {
      businessId: business.id
    };
    
    if (fecha) {
      // Filtrar por fecha específica
      const fechaTarget = new Date(fecha + 'T00:00:00.000Z');
      const fechaEnd = new Date(fecha + 'T23:59:59.999Z');
      whereClause.fecha = {
        gte: fechaTarget,
        lte: fechaEnd
      };
      console.log(`🗓️ Filtrando por fecha: ${fecha}`);
    } else if (mes) {
      // Filtrar por mes para reportes
      const [año, mesNum] = mes.split('-');
      const inicioMes = new Date(parseInt(año), parseInt(mesNum) - 1, 1);
      const finMes = new Date(parseInt(año), parseInt(mesNum), 0, 23, 59, 59, 999);
      whereClause.fecha = {
        gte: inicioMes,
        lte: finMes
      };
      console.log(`📊 Filtrando por mes: ${mes} (${inicioMes.toISOString()} - ${finMes.toISOString()})`);
    }
    
    // Obtener registros sin reserva
    const sinReservas = await prisma.sinReserva.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc' // Más recientes primero
      }
    });

    // Mapear a nuestro formato
    const registros = sinReservas.map(registro => ({
      id: registro.id,
      businessId: registro.businessId,
      numeroPersonas: registro.numeroPersonas,
      fecha: format(new Date(registro.fecha), 'yyyy-MM-dd'),
      hora: registro.hora,
      registradoPor: registro.registradoPor,
      notas: registro.notas,
      createdAt: registro.createdAt.toISOString()
    }));

    console.log(`✅ ${registros.length} registros sin reserva encontrados`);
    
    // Calcular estadísticas si se solicitan
    let stats = null;
    if (includeStats || mes) {
      // Para reportes mensuales
      if (mes) {
        const [año, mesNum] = mes.split('-');
        const inicioMes = new Date(parseInt(año), parseInt(mesNum) - 1, 1);
        const finMes = new Date(parseInt(año), parseInt(mesNum), 0, 23, 59, 59, 999);
        
        // Obtener todos los registros del mes
        const registrosMes = await prisma.sinReserva.findMany({
          where: {
            businessId: business.id,
            fecha: {
              gte: inicioMes,
              lte: finMes
            }
          }
        });

        // Agrupar por días
        const registrosPorDia = registrosMes.reduce((acc, registro) => {
          const dia = format(new Date(registro.fecha), 'yyyy-MM-dd');
          if (!acc[dia]) {
            acc[dia] = { total: 0, registros: 0 };
          }
          acc[dia].total += registro.numeroPersonas;
          acc[dia].registros += 1;
          return acc;
        }, {} as Record<string, { total: number; registros: number }>);

        const diasConData = Object.keys(registrosPorDia).length;
        const totalPersonas = registrosMes.reduce((sum, r) => sum + r.numeroPersonas, 0);
        const promedioPersonasPorDia = diasConData > 0 ? totalPersonas / diasConData : 0;

        stats = {
          mes: mes,
          totalRegistros: registrosMes.length,
          totalPersonas: totalPersonas,
          diasConRegistros: diasConData,
          promedioPersonasPorDia: Math.round(promedioPersonasPorDia * 100) / 100,
          registrosPorDia: registrosPorDia
        };
      } else {
        // Para estadísticas generales
        const totalPersonas = registros.reduce((sum, r) => sum + r.numeroPersonas, 0);
        const hoy = format(new Date(), 'yyyy-MM-dd');
        const registrosHoy = registros.filter(r => r.fecha === hoy);
        const personasHoy = registrosHoy.reduce((sum, r) => sum + r.numeroPersonas, 0);

        stats = {
          totalRegistros: registros.length,
          totalPersonas: totalPersonas,
          registrosHoy: registrosHoy.length,
          personasHoy: personasHoy
        };
      }
    }
    
    const response: any = { 
      success: true, 
      registros,
      count: registros.length
    };
    
    if (stats) {
      response.stats = stats;
    }
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('❌ Error en GET /api/sin-reserva:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al obtener registros',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo registro sin reserva
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessId: businessIdOrSlug, numeroPersonas, fecha, hora, registradoPor, notas } = body;

    console.log('📥 POST /api/sin-reserva - datos recibidos:', body);

    // Validaciones
    if (!numeroPersonas || numeroPersonas < 1) {
      return NextResponse.json(
        { success: false, error: 'El número de personas debe ser mayor a 0' },
        { status: 400 }
      );
    }

    // Buscar business
    let business;
    try {
      business = await prisma.business.findFirst({
        where: {
          OR: [
            { id: businessIdOrSlug },
            { slug: businessIdOrSlug }
          ]
        }
      });
    } catch {
      business = await prisma.business.findUnique({
        where: { slug: businessIdOrSlug }
      });
    }

    if (!business) {
      return NextResponse.json(
        { error: 'Business no encontrado' },
        { status: 404 }
      );
    }

    // Usar fecha/hora actual si no se proporcionan
    const now = new Date();
    
    // ✅ Si se proporciona fecha, parsearla correctamente en zona horaria local
    let fechaRegistro: Date;
    if (fecha) {
      // Parsear fecha sin conversión de zona horaria (mantener local)
      const [year, month, day] = fecha.split('-').map(Number);
      fechaRegistro = new Date(year, month - 1, day, 12, 0, 0, 0); // Usar mediodía para evitar problemas de zona horaria
    } else {
      fechaRegistro = now;
    }
    
    const horaRegistro = hora || format(now, 'HH:mm');

    console.log('📅 Creando registro sin reserva:', {
      fecha: fecha || 'now',
      fechaRegistro: fechaRegistro.toString(),
      fechaRegistroISO: fechaRegistro.toISOString(),
      hora: horaRegistro
    });

    // Crear registro
    const registro = await prisma.sinReserva.create({
      data: {
        id: nanoid(),
        businessId: business.id,
        numeroPersonas,
        fecha: fechaRegistro,
        hora: horaRegistro,
        registradoPor,
        notas,
        updatedAt: now
      }
    });

    console.log('✅ Registro sin reserva creado:', registro.id);

    return NextResponse.json({
      success: true,
      registro: {
        id: registro.id,
        businessId: registro.businessId,
        numeroPersonas: registro.numeroPersonas,
        fecha: format(new Date(registro.fecha), 'yyyy-MM-dd'),
        hora: registro.hora,
        registradoPor: registro.registradoPor,
        notas: registro.notas,
        createdAt: registro.createdAt.toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error en POST /api/sin-reserva:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al crear registro',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar registro sin reserva
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID no proporcionado' },
        { status: 400 }
      );
    }

    await prisma.sinReserva.delete({
      where: { id }
    });

    console.log('✅ Registro sin reserva eliminado:', id);

    return NextResponse.json({ 
      success: true,
      message: 'Registro eliminado correctamente'
    });

  } catch (error) {
    console.error('❌ Error en DELETE /api/sin-reserva:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al eliminar registro',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
