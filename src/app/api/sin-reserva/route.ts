import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

// GET - Obtener todos los registros sin reserva
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const businessIdOrSlug = searchParams.get('businessId') || 'default-business-id';
    
    console.log('📥 GET /api/sin-reserva - businessId recibido:', businessIdOrSlug);
    
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
    
    // Obtener registros sin reserva
    const sinReservas = await prisma.sinReserva.findMany({
      where: {
        businessId: business.id
      },
      orderBy: {
        createdAt: 'asc' // Orden de creación
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
    
    return NextResponse.json({ 
      success: true, 
      registros,
      count: registros.length
    });
    
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
        businessId: business.id,
        numeroPersonas,
        fecha: fechaRegistro,
        hora: horaRegistro,
        registradoPor,
        notas
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
