/**
 * 📦 API: ACCIONES DE CAMPAÑA POR LOTES
 * Endpoints para iniciar, pausar, reanudar, cancelar y ver estado
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/requireAuth';
import { batchCampaignManager, formatTimeRemaining } from '@/lib/whatsapp-batch-sender';

interface RouteParams {
  params: { id: string; action: string };
}

/**
 * POST /api/whatsapp/batch-campaign/[id]/[action]
 * Ejecutar acción en una campaña: start, pause, resume, cancel
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth(request, {
      allowedRoles: ['admin', 'staff', 'superadmin']
    });
    
    if (!authResult.success) {
      return authResult.response;
    }

    const { id, action } = params;

    switch (action) {
      case 'start':
        await batchCampaignManager.startCampaign(id);
        return NextResponse.json({
          success: true,
          message: 'Campaña iniciada',
          campaignId: id
        });

      case 'pause':
        await batchCampaignManager.pauseCampaign(id);
        return NextResponse.json({
          success: true,
          message: 'Campaña pausada',
          campaignId: id
        });

      case 'resume':
        await batchCampaignManager.resumeCampaign(id);
        return NextResponse.json({
          success: true,
          message: 'Campaña reanudada',
          campaignId: id
        });

      case 'cancel':
        await batchCampaignManager.cancelCampaign(id);
        return NextResponse.json({
          success: true,
          message: 'Campaña cancelada',
          campaignId: id
        });

      default:
        return NextResponse.json(
          { error: `Acción desconocida: ${action}` },
          { status: 400 }
        );
    }

  } catch (error: any) {
    console.error(`Error ejecutando acción ${params.action}:`, error);
    return NextResponse.json(
      { error: error.message || 'Error ejecutando acción' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/whatsapp/batch-campaign/[id]/status
 * Obtener estado actual de una campaña
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth(request, {
      allowedRoles: ['admin', 'staff', 'superadmin']
    });
    
    if (!authResult.success) {
      return authResult.response;
    }

    const { id, action } = params;

    if (action !== 'status') {
      return NextResponse.json(
        { error: 'Use GET solo para /status' },
        { status: 400 }
      );
    }

    const campaign = batchCampaignManager.getCampaignStatus(id);

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaña no encontrada' },
        { status: 404 }
      );
    }

    const { progress } = campaign;

    return NextResponse.json({
      success: true,
      campaign: {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        createdAt: campaign.createdAt,
        startedAt: campaign.startedAt,
        completedAt: campaign.completedAt,
      },
      progress: {
        totalRecipients: progress.totalRecipients,
        sent: progress.sent,
        failed: progress.failed,
        pending: progress.pending,
        percentComplete: Math.round((progress.sent + progress.failed) / progress.totalRecipients * 100),
        currentBatch: progress.currentBatch,
        totalBatches: progress.totalBatches,
        currentBatchProgress: Math.round(progress.currentBatchProgress),
        estimatedTimeRemaining: formatTimeRemaining(progress.estimatedTimeRemaining),
        lastUpdated: progress.lastUpdated,
      },
      stats: {
        successRate: progress.sent > 0 
          ? Math.round((progress.sent / (progress.sent + progress.failed)) * 100) 
          : 0,
        messagesPerMinute: campaign.startedAt 
          ? Math.round(progress.sent / ((Date.now() - campaign.startedAt.getTime()) / 60000)) 
          : 0,
      }
    });

  } catch (error: any) {
    console.error('Error obteniendo estado de campaña:', error);
    return NextResponse.json(
      { error: error.message || 'Error obteniendo estado' },
      { status: 500 }
    );
  }
}
