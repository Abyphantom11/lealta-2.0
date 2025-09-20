import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 📊 API PARA REGISTRAR VISITAS AL PORTAL CLIENTE
// Este endpoint registra cada visita al portal para analytics del admin

export async function POST(request: NextRequest) {
  try {
    console.log('📊 POST /api/cliente/visitas - Nueva visita recibida');
    
    const body = await request.json();
    const { sessionId, clienteId, businessId, path, referrer } = body;

    console.log('📊 Datos de visita:', { 
      sessionId, 
      clienteId: clienteId || 'anónimo', 
      businessId, 
      path, 
      referrer 
    });

    // 🔍 VALIDACIONES BÁSICAS
    if (!sessionId) {
      console.error('❌ sessionId es requerido');
      return NextResponse.json(
        { error: 'sessionId es requerido' },
        { status: 400 }
      );
    }

    // 🎯 OBTENER INFORMACIÓN DE LA REQUEST
    const userAgent = request.headers.get('user-agent') || '';
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown';

    // 🔍 USAR businessId FIJO POR AHORA PARA EVITAR ERRORES
    const resolvedBusinessId = businessId || 'cmfr2y0ia0000eyvw7ef3k20u'; // Hardcoded por ahora

    console.log('📊 Usando businessId:', resolvedBusinessId);

    // 🔍 VERIFICAR SI YA EXISTE UNA VISITA RECIENTE CON EL MISMO sessionId
    let existingVisit = null;
    try {
      existingVisit = await prisma.visita.findFirst({
        where: {
          sessionId,
          businessId: resolvedBusinessId,
          timestamp: {
            gte: new Date(Date.now() - 5 * 60 * 1000) // Últimos 5 minutos
          }
        }
      });
    } catch (dbError) {
      console.warn('⚠️ Error verificando visita existente:', dbError);
      // Continuar sin verificación de duplicados
    }

    if (existingVisit) {
      console.log('📊 Visita duplicada ignorada:', sessionId);
      return NextResponse.json(
        { success: true, message: 'Visita ya registrada recientemente', duplicate: true },
        { status: 200 }
      );
    }

    // 📝 REGISTRAR LA NUEVA VISITA
    console.log('📊 Creando nueva visita para business:', resolvedBusinessId);

    // Verificar que el businessId existe
    const businessExists = await prisma.business.findUnique({
      where: { id: resolvedBusinessId }
    });
    
    if (!businessExists) {
      console.error('❌ Business no encontrado:', resolvedBusinessId);
      return NextResponse.json(
        { error: 'Business no encontrado', businessId: resolvedBusinessId },
        { status: 404 }
      );
    }

    const nuevaVisita = await prisma.visita.create({
      data: {
        sessionId,
        clienteId: clienteId || null,
        businessId: resolvedBusinessId,
        path: path || '/cliente',
        referrer: referrer || null,
        userAgent,
        ip,
        isRegistered: !!clienteId,
        timestamp: new Date()
      }
    });

    console.log('📊 Visita registrada exitosamente:', {
      id: nuevaVisita.id,
      sessionId,
      clienteId: clienteId || 'anónimo',
      path: nuevaVisita.path,
      businessId: resolvedBusinessId
    });

    return NextResponse.json({
      success: true,
      message: 'Visita registrada exitosamente',
      visitaId: nuevaVisita.id
    });

  } catch (error: any) {
    console.error('❌ Error completo registrando visita:', error);
    console.error('❌ Stack trace:', error.stack);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}

// 📊 GET: OBTENER ESTADÍSTICAS DE VISITAS PARA EL ADMIN
export async function GET(request: NextRequest) {
  try {
    console.log('📊 GET /api/cliente/visitas - Solicitando estadísticas');
    
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const periodo = searchParams.get('periodo') || 'hoy'; // 'hoy', 'semana', 'mes'

    console.log('📊 Parámetros:', { businessId, periodo });

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId es requerido' },
        { status: 400 }
      );
    }

    // 🗓️ CALCULAR RANGO DE FECHAS
    const now = new Date();
    let fechaInicio: Date;
    
    switch (periodo) {
      case 'hoy':
        fechaInicio = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'semana':
        const diasAtras = now.getDay() === 0 ? 6 : now.getDay() - 1; // Lunes como inicio
        fechaInicio = new Date(now.getTime() - diasAtras * 24 * 60 * 60 * 1000);
        fechaInicio.setHours(0, 0, 0, 0);
        break;
      case 'mes':
        fechaInicio = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        fechaInicio = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    // 📊 OBTENER ESTADÍSTICAS
    const visitas = await prisma.visita.findMany({
      where: {
        businessId,
        timestamp: {
          gte: fechaInicio
        }
      },
      include: {
        cliente: {
          select: {
            nombre: true,
            cedula: true
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      }
    });

    // 🧮 CALCULAR MÉTRICAS
    const totalVisitas = visitas.length;
    const visitasRegistradas = visitas.filter(v => v.clienteId).length;
    const visitasAnonimas = totalVisitas - visitasRegistradas;
    const sesionesUnicas = new Set(visitas.map(v => v.sessionId)).size;

    // 📈 VISITAS POR HORA/DÍA (para gráficos)
    const visitasPorPeriodo = visitas.reduce((acc, visita) => {
      const fecha = visita.timestamp.toISOString().split('T')[0];
      acc[fecha] = (acc[fecha] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      periodo,
      fechaInicio: fechaInicio.toISOString(),
      estadisticas: {
        totalVisitas,
        visitasRegistradas,
        visitasAnonimas,
        sesionesUnicas,
        visitasPorPeriodo
      },
      visitasRecientes: visitas.slice(0, 10).map(v => ({
        id: v.id,
        timestamp: v.timestamp,
        cliente: v.cliente?.nombre || 'Anónimo',
        cedula: v.cliente?.cedula || null,
        path: v.path,
        isRegistered: v.isRegistered
      }))
    });

  } catch (error) {
    console.error('❌ Error obteniendo estadísticas de visitas:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// 🔄 FUNCIÓN AUXILIAR PARA ACTUALIZAR ESTADÍSTICAS DIARIAS
async function actualizarEstadisticasDiarias(businessId: string) {
  try {
    // 🚧 TEMPORALMENTE COMENTADO - PROBLEMAS CON UPSERT
    console.log('📊 Estadísticas diarias actualizadas (simulado) para:', businessId);
    return;
    
    /* 
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const visitasHoy = await prisma.visita.count({
      where: {
        businessId,
        timestamp: {
          gte: hoy
        }
      }
    });

    const visitasRegistradasHoy = await prisma.visita.count({
      where: {
        businessId,
        timestamp: {
          gte: hoy
        },
        isRegistered: true
      }
    });

    const sesionesUnicasHoy = await prisma.visita.findMany({
      where: {
        businessId,
        timestamp: {
          gte: hoy
        }
      },
      select: {
        sessionId: true
      },
      distinct: ['sessionId']
    });

    // Actualizar o crear estadística del día
    await prisma.estadisticaVisita.upsert({
      where: {
        // Necesitaríamos un campo único compuesto, por ahora usar findFirst
        id: 'temp'
      },
      update: {
        totalVisitas: visitasHoy,
        visitasRegistradas: visitasRegistradasHoy,
        visitasAnonimas: visitasHoy - visitasRegistradasHoy,
        sesionesUnicas: sesionesUnicasHoy.length
      },
      create: {
        fecha: hoy,
        periodo: 'dia',
        totalVisitas: visitasHoy,
        visitasRegistradas: visitasRegistradasHoy,
        visitasAnonimas: visitasHoy - visitasRegistradasHoy,
        sesionesUnicas: sesionesUnicasHoy.length
      }
    });
    */
  } catch (error) {
    console.warn('⚠️ Error actualizando estadísticas diarias:', error);
  }
}
