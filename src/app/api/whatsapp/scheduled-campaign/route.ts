import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/requireAuth';
import { 
  createScheduledCampaign, 
  pauseCampaign, 
  resumeCampaign, 
  cancelCampaign,
  getCampaignProgress,
  getActiveCampaigns 
} from '@/lib/scheduled-campaign';
import { prisma } from '@/lib/prisma';

/**
 * 🚀 POST /api/whatsapp/scheduled-campaign
 * Crear una campaña programada con lotes
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, {
      allowedRoles: ['admin', 'superadmin']
    });
    
    if (!authResult.success) {
      return authResult.response;
    }

    const body = await request.json();
    const {
      businessId,
      contentSid,
      totalClientes,
      batchSize = 10,
      delayBetweenBatches = 5, // minutos
      startFrom = 0,
      filters = {}
    } = body;

    // Validaciones
    if (!businessId) {
      return NextResponse.json({ error: 'businessId es requerido' }, { status: 400 });
    }

    if (!contentSid) {
      return NextResponse.json({ error: 'contentSid (template aprobado) es requerido' }, { status: 400 });
    }

    if (!totalClientes || totalClientes < 1) {
      return NextResponse.json({ error: 'totalClientes debe ser mayor a 0' }, { status: 400 });
    }

    // Verificar que el negocio existe
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, name: true }
    });

    if (!business) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 });
    }

    // Contar clientes disponibles
    const clientesDisponibles = await prisma.cliente.count({
      where: {
        businessId,
        telefono: { not: '' },
      }
    });

    if (clientesDisponibles === 0) {
      return NextResponse.json({ 
        error: 'No hay clientes con teléfono registrado',
        clientesDisponibles: 0
      }, { status: 400 });
    }

    const clientesAEnviar = Math.min(totalClientes, clientesDisponibles - startFrom);

    if (clientesAEnviar <= 0) {
      return NextResponse.json({ 
        error: 'No hay más clientes disponibles desde la posición indicada',
        clientesDisponibles,
        startFrom
      }, { status: 400 });
    }

    console.log(`📋 Creando campaña: ${clientesAEnviar} clientes, lotes de ${batchSize}, delay ${delayBetweenBatches} min`);

    // Crear campaña
    const progress = await createScheduledCampaign({
      businessId,
      contentSid,
      totalClientes: clientesAEnviar,
      batchSize,
      delayBetweenBatches,
      startFrom,
      filters,
    });

    const totalBatches = Math.ceil(clientesAEnviar / batchSize);
    const tiempoEstimado = totalBatches * delayBetweenBatches;

    return NextResponse.json({
      success: true,
      message: 'Campaña programada iniciada',
      campaign: progress,
      summary: {
        clientesAEnviar,
        totalBatches,
        batchSize,
        delayBetweenBatches,
        tiempoEstimadoMinutos: tiempoEstimado,
        tiempoEstimadoHumano: tiempoEstimado >= 60 
          ? `${Math.floor(tiempoEstimado / 60)}h ${tiempoEstimado % 60}min`
          : `${tiempoEstimado} minutos`
      }
    });

  } catch (error: any) {
    console.error('❌ Error creando campaña programada:', error);
    return NextResponse.json({ 
      error: error.message || 'Error interno del servidor' 
    }, { status: 500 });
  }
}

/**
 * 📋 GET /api/whatsapp/scheduled-campaign
 * Obtener campañas activas o progreso de una específica
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, {
      allowedRoles: ['admin', 'superadmin', 'staff']
    });
    
    if (!authResult.success) {
      return authResult.response;
    }

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('id');
    const businessId = searchParams.get('businessId');

    // Si se pide una campaña específica
    if (campaignId) {
      const progress = getCampaignProgress(campaignId);
      
      if (!progress) {
        // Buscar en BD si no está en memoria (ya completada)
        const dbCampaign = await prisma.whatsAppCampaign.findUnique({
          where: { id: campaignId }
        });

        if (dbCampaign) {
          return NextResponse.json({
            success: true,
            campaign: {
              id: dbCampaign.id,
              status: dbCampaign.status,
              totalTargeted: dbCampaign.totalTargeted,
              totalSent: dbCampaign.totalSent,
              totalFailed: dbCampaign.totalFailed,
              startedAt: dbCampaign.startedAt,
              completedAt: dbCampaign.completedAt,
            }
          });
        }

        return NextResponse.json({ error: 'Campaña no encontrada' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        campaign: progress
      });
    }

    // Obtener todas las campañas activas
    const activeCampaigns = getActiveCampaigns();

    // También obtener historial de BD
    const recentCampaigns = await prisma.whatsAppCampaign.findMany({
      where: businessId ? { businessId } : {},
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        name: true,
        status: true,
        totalTargeted: true,
        totalSent: true,
        totalFailed: true,
        createdAt: true,
        completedAt: true,
      }
    });

    return NextResponse.json({
      success: true,
      activeCampaigns,
      recentCampaigns
    });

  } catch (error: any) {
    console.error('❌ Error obteniendo campañas:', error);
    return NextResponse.json({ 
      error: error.message || 'Error interno' 
    }, { status: 500 });
  }
}

/**
 * 🎮 PATCH /api/whatsapp/scheduled-campaign
 * Controlar campaña: pausar, reanudar, cancelar
 */
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, {
      allowedRoles: ['admin', 'superadmin']
    });
    
    if (!authResult.success) {
      return authResult.response;
    }

    const body = await request.json();
    const { campaignId, action } = body;

    if (!campaignId || !action) {
      return NextResponse.json({ 
        error: 'campaignId y action son requeridos' 
      }, { status: 400 });
    }

    let result;

    switch (action) {
      case 'pause':
        result = pauseCampaign(campaignId);
        if (result) {
          return NextResponse.json({ 
            success: true, 
            message: 'Campaña pausada',
            campaign: result 
          });
        }
        break;

      case 'resume':
        result = await resumeCampaign(campaignId);
        if (result) {
          return NextResponse.json({ 
            success: true, 
            message: 'Campaña reanudada',
            campaign: result 
          });
        }
        break;

      case 'cancel':
        const cancelled = await cancelCampaign(campaignId);
        if (cancelled) {
          return NextResponse.json({ 
            success: true, 
            message: 'Campaña cancelada' 
          });
        }
        break;

      default:
        return NextResponse.json({ 
          error: 'Acción no válida. Usa: pause, resume, cancel' 
        }, { status: 400 });
    }

    return NextResponse.json({ 
      error: 'No se pudo ejecutar la acción. Verifica que la campaña existe y está activa.' 
    }, { status: 400 });

  } catch (error: any) {
    console.error('❌ Error controlando campaña:', error);
    return NextResponse.json({ 
      error: error.message || 'Error interno' 
    }, { status: 500 });
  }
}
