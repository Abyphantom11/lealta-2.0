import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { headers } from 'next/headers';
import { withAuth, AuthConfigs } from '../../../../middleware/requireAuth';

const prisma = new PrismaClient();

interface VisitaData {
  clienteId?: string;
  sessionId: string;
  path: string;
  referrer?: string;
}

/**
 * API para registrar visitas al portal cliente
 * Captura cada carga de página y actualiza estadísticas
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async (session) => {
  try {
    console.log(`📊 Visitas POST by: ${session.role} (${session.userId}) - Business: ${session.businessId}`);
    
    const body: VisitaData = await request.json();
    const headersList = headers();
    
    // Obtener datos de la request
    const userAgent = headersList.get('user-agent') || '';
    const forwarded = headersList.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 
               headersList.get('x-real-ip') || 
               request.ip || 
               'unknown';

    // Validar sessionId
    if (!body.sessionId) {
      return NextResponse.json(
        { error: 'SessionId es requerido' },
        { status: 400 }
      );
    }

    // Verificar si ya existe una visita en esta sesión en los últimos 5 minutos
    // (para evitar spam de visitas de la misma sesión, pero permitir recargas)
    const existingVisit = await prisma.visita.findFirst({
      where: {
        sessionId: body.sessionId,
        timestamp: {
          gte: new Date(Date.now() - 5 * 60 * 1000) // 5 minutos
        }
      }
    });

    // Si ya hay una visita muy reciente de la misma sesión, no crear otra
    if (existingVisit) {
      return NextResponse.json({ 
        message: 'Visita ya registrada recientemente',
        visitaId: existingVisit.id
      });
    }

    // Crear nueva visita
    const nuevaVisita = await prisma.visita.create({
      data: {
        businessId: session.businessId,
        clienteId: body.clienteId || null,
        sessionId: body.sessionId,
        path: body.path,
        referrer: body.referrer || null,
        userAgent,
        ip,
        isRegistered: !!body.clienteId,
        timestamp: new Date()
      }
    });

    // Actualizar estadísticas agregadas
    await actualizarEstadisticas();

    return NextResponse.json({
      success: true,
      visitaId: nuevaVisita.id,
      message: 'Visita registrada exitosamente',
      auditedBy: session.userId // ✅ AUDITORÍA
    });

  } catch (error) {
    console.error('❌ Error registrando visita:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
  }, AuthConfigs.WRITE);
}

/**
 * Actualizar estadísticas agregadas por día, semana y mes
 */
async function actualizarEstadisticas() {
  const ahora = new Date();
  
  // Fecha de hoy para estadísticas diarias
  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  
  // Calcular inicio de semana (lunes) - IMPORTANTE: usar la fecha de inicio de la semana actual
  const inicioSemana = new Date(hoy);
  const day = inicioSemana.getDay();
  const diff = inicioSemana.getDate() - day + (day === 0 ? -6 : 1); // Lunes
  inicioSemana.setDate(diff);
  
  // Calcular inicio de mes
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);

  console.log('📊 Actualizando estadísticas:');
  console.log('📅 Hoy:', hoy.toISOString().split('T')[0]);
  console.log('📅 Inicio semana:', inicioSemana.toISOString().split('T')[0]);
  console.log('📅 Inicio mes:', inicioMes.toISOString().split('T')[0]);

  // Actualizar estadísticas del día (solo hoy)
  await actualizarEstadisticaPeriodo('dia', hoy, hoy);
  
  // Actualizar estadísticas de la semana (desde lunes hasta hoy)
  await actualizarEstadisticaPeriodo('semana', inicioSemana, hoy);
  
  // Actualizar estadísticas del mes (desde día 1 hasta hoy)
  await actualizarEstadisticaPeriodo('mes', inicioMes, hoy);
}

/**
 * Actualizar estadística para un período específico
 */
async function actualizarEstadisticaPeriodo(
  periodo: string, 
  fechaInicio: Date, 
  fechaFin: Date
) {
  const finDelDia = new Date(fechaFin);
  finDelDia.setHours(23, 59, 59, 999);

  console.log(`📊 Actualizando ${periodo}: ${fechaInicio.toISOString().split('T')[0]} - ${fechaFin.toISOString().split('T')[0]}`);

  // Contar visitas en el período
  const totalVisitas = await prisma.visita.count({
    where: {
      timestamp: {
        gte: fechaInicio,
        lte: finDelDia
      }
    }
  });

  // Contar visitas registradas (con clienteId)
  const visitasRegistradas = await prisma.visita.count({
    where: {
      timestamp: {
        gte: fechaInicio,
        lte: finDelDia
      },
      clienteId: {
        not: null
      }
    }
  });

  const visitasAnonimas = totalVisitas - visitasRegistradas;

  // Contar sesiones únicas
  const sesionesUnicas = await prisma.visita.groupBy({
    by: ['sessionId'],
    where: {
      timestamp: {
        gte: fechaInicio,
        lte: finDelDia
      }
    }
  });

  const totalSesionesUnicas = sesionesUnicas.length;

  console.log(`📈 ${periodo}: ${totalVisitas} visitas, ${visitasRegistradas} registradas, ${totalSesionesUnicas} sesiones únicas`);

  // Usar fechaInicio como referencia para el registro (importante para semana y mes)
  const fechaReferencia = periodo === 'dia' ? fechaFin : fechaInicio;

  // Upsert estadística
  await prisma.estadisticaVisita.upsert({
    where: {
      fecha_periodo: {
        fecha: fechaReferencia,
        periodo
      }
    },
    update: {
      totalVisitas,
      visitasRegistradas,
      visitasAnonimas,
      sesionesUnicas: totalSesionesUnicas,
      updatedAt: new Date()
    },
    create: {
      fecha: fechaReferencia,
      periodo,
      totalVisitas,
      visitasRegistradas,
      visitasAnonimas,
      sesionesUnicas: totalSesionesUnicas
    }
  });
}

/**
 * GET - Obtener estadísticas de visitas
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async (session) => {
  try {
    console.log(`📊 Visitas GET by: ${session.role} (${session.userId}) - Business: ${session.businessId}`);
    
    const ahora = new Date();
    const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    
    // Calcular fechas de períodos
    const inicioSemana = new Date(hoy);
    const day = inicioSemana.getDay();
    const diff = inicioSemana.getDate() - day + (day === 0 ? -6 : 1);
    inicioSemana.setDate(diff);
    
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);

    console.log('📊 GET - Obteniendo estadísticas:');
    console.log('📅 Buscando día:', hoy.toISOString().split('T')[0]);
    console.log('📅 Buscando semana:', inicioSemana.toISOString().split('T')[0]);
    console.log('📅 Buscando mes:', inicioMes.toISOString().split('T')[0]);

    // Obtener estadísticas de la base de datos
    const [estadisticaDia, estadisticaSemana, estadisticaMes] = await Promise.all([
      prisma.estadisticaVisita.findUnique({
        where: { fecha_periodo: { fecha: hoy, periodo: 'dia' } }
      }),
      prisma.estadisticaVisita.findUnique({
        where: { fecha_periodo: { fecha: inicioSemana, periodo: 'semana' } }
      }),
      prisma.estadisticaVisita.findUnique({
        where: { fecha_periodo: { fecha: inicioMes, periodo: 'mes' } }
      })
    ]);

    console.log('📈 Estadísticas encontradas:');
    console.log('📅 Día:', estadisticaDia?.totalVisitas || 0);
    console.log('📅 Semana:', estadisticaSemana?.totalVisitas || 0);
    console.log('📅 Mes:', estadisticaMes?.totalVisitas || 0);

    const result = {
      visitasHoy: estadisticaDia?.totalVisitas || 0,
      visitasSemana: estadisticaSemana?.totalVisitas || 0,
      visitasMes: estadisticaMes?.totalVisitas || 0,
      tendencia: calcularTendencia(estadisticaDia, estadisticaSemana)
    };

    return NextResponse.json({
      success: true,
      data: result,
      auditedBy: session.userId // ✅ AUDITORÍA
    });

  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
  }, AuthConfigs.READ_ONLY);
}

/**
 * Calcular tendencia basada en datos históricos
 */
function calcularTendencia(
  estadisticaDia: any, 
  estadisticaSemana: any
): 'estable' | 'subiendo' | 'bajando' {
  // Lógica simple: comparar visitas de hoy con promedio de la semana
  if (!estadisticaDia || !estadisticaSemana) return 'estable';
  
  const visitasHoy = estadisticaDia.totalVisitas;
  const promedioSemana = estadisticaSemana.totalVisitas / 7;
  
  if (visitasHoy > promedioSemana * 1.2) return 'subiendo';
  if (visitasHoy < promedioSemana * 0.8) return 'bajando';
  return 'estable';
}
