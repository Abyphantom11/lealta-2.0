import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 📊 API PARA REGISTRAR VISITAS AL PORTAL CLIENTE
// Este endpoint registra cada visita al portal para analytics del admin

// Función auxiliar para validar datos de entrada
async function validateVisitData(body: any): Promise<{ isValid: boolean; error?: string; data?: any }> {
  const { sessionId, clienteId, businessId, path, referrer } = body;

  if (!sessionId) {
    return { isValid: false, error: 'sessionId es requerido' };
  }

  return { 
    isValid: true, 
    data: { sessionId, clienteId, businessId, path, referrer } 
  };
}

// Función auxiliar para verificar visitas duplicadas
async function checkDuplicateVisit(sessionId: string, businessId: string): Promise<boolean> {
  try {
    const existingVisit = await prisma.visita.findFirst({
      where: {
        sessionId,
        businessId,
        timestamp: {
          gte: new Date(Date.now() - 5 * 60 * 1000) // Últimos 5 minutos
        }
      }
    });
    return !!existingVisit;
  } catch (dbError) {
    console.warn('⚠️ Error verificando visita existente:', dbError);
    return false;
  }
}

// Función auxiliar para validar business
async function validateBusiness(businessId: string): Promise<boolean> {
  const businessExists = await prisma.business.findUnique({
    where: { id: businessId }
  });
  return !!businessExists;
}

// Función auxiliar para crear una nueva visita
async function createVisita(data: {
  sessionId: string;
  clienteId?: string;
  businessId: string;
  path?: string;
  referrer?: string;
  userAgent: string;
  ip: string;
}) {
  return await prisma.visita.create({
    data: {
      sessionId: data.sessionId,
      clienteId: data.clienteId || null,
      businessId: data.businessId,
      path: data.path || '/cliente',
      referrer: data.referrer || null,
      userAgent: data.userAgent,
      ip: data.ip,
      isRegistered: !!data.clienteId,
      timestamp: new Date()
    }
  });
}

// Función auxiliar para procesar información de request
function extractRequestInfo(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || '';
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown';
  return { userAgent, ip };
}

// Función auxiliar para procesar POST de visita
async function processVisitPost(request: NextRequest) {
  const body = await request.json();
  
  const validation = await validateVisitData(body);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  const { sessionId, clienteId, businessId, path, referrer } = validation.data;
  const { userAgent, ip } = extractRequestInfo(request);
  const resolvedBusinessId = businessId || 'cmfr2y0ia0000eyvw7ef3k20u';

  return { sessionId, clienteId, resolvedBusinessId, path, referrer, userAgent, ip };
}

// Función auxiliar para verificar y crear visita
async function handleVisitCreation(visitData: {
  sessionId: string;
  clienteId?: string;
  businessId: string;
  path: string;
  referrer?: string;
  userAgent: string;
  ip: string;
}) {
  const { sessionId, businessId } = visitData;

  // Verificar visitas duplicadas
  const isDuplicate = await checkDuplicateVisit(sessionId, businessId);
  if (isDuplicate) {
    return { duplicate: true, visita: null };
  }

  // Verificar que el business existe
  const businessIsValid = await validateBusiness(businessId);
  if (!businessIsValid) {
    throw new Error(`Business no encontrado: ${businessId}`);
  }

  // Crear nueva visita
  const nuevaVisita = await createVisita(visitData);
  return { duplicate: false, visita: nuevaVisita };
}

export async function POST(request: NextRequest) {
  try {
    console.log('📊 POST /api/cliente/visitas - Nueva visita recibida');
    
    const visitData = await processVisitPost(request);
    console.log('📊 Usando businessId:', visitData.resolvedBusinessId);

    const result = await handleVisitCreation({
      sessionId: visitData.sessionId,
      clienteId: visitData.clienteId,
      businessId: visitData.resolvedBusinessId,
      path: visitData.path,
      referrer: visitData.referrer,
      userAgent: visitData.userAgent,
      ip: visitData.ip
    });

    if (result.duplicate) {
      console.log('📊 Visita duplicada ignorada:', visitData.sessionId);
      return NextResponse.json(
        { success: true, message: 'Visita ya registrada recientemente', duplicate: true },
        { status: 200 }
      );
    }

    console.log('📊 Visita registrada exitosamente:', {
      id: result.visita!.id,
      sessionId: visitData.sessionId,
      clienteId: visitData.clienteId || 'anónimo',
      path: result.visita!.path,
      businessId: visitData.resolvedBusinessId
    });

    return NextResponse.json({
      success: true,
      message: 'Visita registrada exitosamente',
      visitaId: result.visita!.id
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

// Función auxiliar para calcular rango de fechas
function calculateDateRange(periodo: string): Date {
  const now = new Date();
  
  switch (periodo) {
    case 'hoy':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case 'semana': {
      const diasAtras = now.getDay() === 0 ? 6 : now.getDay() - 1;
      const fechaInicio = new Date(now.getTime() - diasAtras * 24 * 60 * 60 * 1000);
      fechaInicio.setHours(0, 0, 0, 0);
      return fechaInicio;
    }
    case 'mes':
      return new Date(now.getFullYear(), now.getMonth(), 1);
    default:
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
}

// Función auxiliar para calcular métricas
function calculateMetrics(visitas: any[]) {
  const totalVisitas = visitas.length;
  const visitasRegistradas = visitas.filter(v => v.clienteId).length;
  const visitasAnonimas = totalVisitas - visitasRegistradas;
  const sesionesUnicas = new Set(visitas.map(v => v.sessionId)).size;

  const visitasPorPeriodo = visitas.reduce((acc, visita) => {
    const fecha = visita.timestamp.toISOString().split('T')[0];
    acc[fecha] = (acc[fecha] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalVisitas,
    visitasRegistradas,
    visitasAnonimas,
    sesionesUnicas,
    visitasPorPeriodo
  };
}

// 📊 GET: OBTENER ESTADÍSTICAS DE VISITAS PARA EL ADMIN
export async function GET(request: NextRequest) {
  try {
    console.log('📊 GET /api/cliente/visitas - Solicitando estadísticas');
    
    const searchParams = request.nextUrl.searchParams;
    const businessId = searchParams.get('businessId');
    const periodo = searchParams.get('periodo') || 'hoy';

    console.log('📊 Parámetros:', { businessId, periodo });

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId es requerido' },
        { status: 400 }
      );
    }

    const fechaInicio = calculateDateRange(periodo);

    const visitas = await prisma.visita.findMany({
      where: {
        businessId,
        timestamp: { gte: fechaInicio }
      },
      include: {
        cliente: {
          select: { nombre: true, cedula: true }
        }
      },
      orderBy: { timestamp: 'desc' }
    });

    const estadisticas = calculateMetrics(visitas);

    return NextResponse.json({
      success: true,
      periodo,
      fechaInicio: fechaInicio.toISOString(),
      estadisticas,
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
