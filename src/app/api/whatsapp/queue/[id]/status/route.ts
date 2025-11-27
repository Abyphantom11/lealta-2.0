import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * 📊 GET /api/whatsapp/queue/[id]/status
 * Obtener estado actual de una cola de mensajes
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = params;

    // Obtener cola con estadísticas
    const queue = await prisma.whatsAppQueue.findFirst({
      where: {
        id,
        businessId: session.user.businessId,
      },
      include: {
        _count: {
          select: {
            QueueJobs: true,
          },
        },
      },
    });

    if (!queue) {
      return NextResponse.json(
        { error: 'Cola no encontrada' },
        { status: 404 }
      );
    }

    // Obtener estadísticas de jobs
    const jobStats = await prisma.whatsAppQueueJob.groupBy({
      by: ['status'],
      where: { queueId: id },
      _count: true,
    });

    const statusCounts = jobStats.reduce((acc, curr) => {
      acc[curr.status] = curr._count;
      return acc;
    }, {} as Record<string, number>);

    // Obtener últimos errores
    const recentErrors = await prisma.whatsAppQueueJob.findMany({
      where: {
        queueId: id,
        status: 'FAILED',
        lastError: { not: null },
      },
      select: {
        targetPhone: true,
        lastError: true,
        failedAt: true,
      },
      orderBy: { failedAt: 'desc' },
      take: 20,
    });

    const total = queue._count.QueueJobs;
    const sent = statusCounts['COMPLETED'] || 0;
    const failed = statusCounts['FAILED'] || 0;
    const pending = statusCounts['PENDING'] || 0;
    const processing = statusCounts['PROCESSING'] || 0;

    // Calcular tiempo estimado restante
    let estimatedCompletion = null;
    if (queue.status === 'PROCESSING' && queue.startedAt && sent > 0) {
      const elapsedMs = Date.now() - new Date(queue.startedAt).getTime();
      const msPerMessage = elapsedMs / sent;
      const remainingMessages = pending + processing;
      const remainingMs = remainingMessages * msPerMessage;
      
      // Formatear tiempo restante
      const remainingMinutes = Math.ceil(remainingMs / 60000);
      if (remainingMinutes < 60) {
        estimatedCompletion = `${remainingMinutes} min`;
      } else {
        const hours = Math.floor(remainingMinutes / 60);
        const mins = remainingMinutes % 60;
        estimatedCompletion = `${hours}h ${mins}min`;
      }
    }

    // Calcular batch actual
    const batchSize = 10; // Mismo que en whatsapp-queue.ts
    const currentBatch = Math.ceil(sent / batchSize);
    const totalBatches = Math.ceil(total / batchSize);

    return NextResponse.json({
      campaignId: queue.id,
      name: queue.name,
      status: queue.status,
      total,
      sent,
      failed,
      pending,
      processing,
      startedAt: queue.startedAt?.toISOString(),
      completedAt: queue.completedAt?.toISOString(),
      estimatedCompletion,
      currentBatch,
      totalBatches,
      errors: recentErrors.map(e => `${e.targetPhone}: ${e.lastError}`),
      stats: {
        successRate: sent > 0 ? Math.round(((sent - failed) / sent) * 100) : 0,
        failureRate: sent > 0 ? Math.round((failed / sent) * 100) : 0,
      },
    });

  } catch (error: any) {
    console.error('Error getting queue status:', error);
    
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}
