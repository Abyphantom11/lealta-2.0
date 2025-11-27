/**
 * 📦 API: CAMPAÑAS POR LOTES
 * Endpoint para crear y manejar campañas de envío masivo por lotes
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/requireAuth';
import { prisma } from '@/lib/prisma';
import { 
  batchCampaignManager, 
  BatchRecipient, 
  BATCH_PRESETS,
  getRecommendedConfig,
  formatTimeRemaining 
} from '@/lib/whatsapp-batch-sender';

/**
 * POST /api/whatsapp/batch-campaign
 * Crear una nueva campaña por lotes
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, {
      allowedRoles: ['admin', 'staff', 'superadmin']
    });
    
    if (!authResult.success) {
      return authResult.response;
    }

    const body = await request.json();
    const {
      name,
      message,
      templateId,
      clienteIds,       // Array de IDs de clientes específicos
      filters,          // O filtros para seleccionar clientes
      batchSize = 10,   // Mensajes por lote
      delayMinutes = 3, // Minutos entre lotes
      preset,           // O usar un preset: 'CONSERVATIVE', 'NORMAL', 'AGGRESSIVE'
      autoStart = false // Iniciar automáticamente
    } = body;

    // Validaciones
    if (!message && !templateId) {
      return NextResponse.json(
        { error: 'Se requiere message o templateId' },
        { status: 400 }
      );
    }

    if (!clienteIds && !filters) {
      return NextResponse.json(
        { error: 'Se requiere clienteIds o filters para seleccionar destinatarios' },
        { status: 400 }
      );
    }

    const businessId = authResult.session?.businessId;
    if (!businessId) {
      return NextResponse.json(
        { error: 'BusinessId no encontrado en la sesión' },
        { status: 400 }
      );
    }

    // Obtener clientes
    let clientes;
    if (clienteIds && clienteIds.length > 0) {
      clientes = await prisma.cliente.findMany({
        where: {
          id: { in: clienteIds },
          businessId,
          telefono: { not: '' }
        },
        select: {
          id: true,
          nombre: true,
          telefono: true,
          puntos: true,
        }
      });
    } else {
      // Usar filtros
      const whereClause: any = {
        businessId,
        telefono: { not: '' }
      };

      if (filters?.puntosMinimos) {
        whereClause.puntos = { gte: filters.puntosMinimos };
      }

      if (filters?.ultimaVisitaDias) {
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() - filters.ultimaVisitaDias);
        whereClause.ultimaVisita = { gte: fechaLimite };
      }

      clientes = await prisma.cliente.findMany({
        where: whereClause,
        select: {
          id: true,
          nombre: true,
          telefono: true,
          puntos: true,
        }
      });
    }

    if (clientes.length === 0) {
      return NextResponse.json(
        { error: 'No se encontraron clientes con los criterios especificados' },
        { status: 400 }
      );
    }

    // Filtrar opt-outs
    const optOuts = await prisma.whatsAppOptOut.findMany({
      where: {
        businessId,
        optedBackIn: false
      },
      select: { phoneNumber: true }
    });

    const optOutSet = new Set(optOuts.map(o => o.phoneNumber.replace(/\D/g, '')));

    // Formatear destinatarios
    const recipients: BatchRecipient[] = clientes
      .filter(cliente => {
        const phoneNormalized = cliente.telefono!.replace(/\D/g, '');
        return !optOutSet.has(phoneNormalized);
      })
      .map(cliente => {
        const phoneNormalized = cliente.telefono!.replace(/\D/g, '');
        const formattedPhone = phoneNormalized.startsWith('593')
          ? `+${phoneNormalized}`
          : phoneNormalized.startsWith('09')
            ? `+593${phoneNormalized.substring(1)}`
            : `+593${phoneNormalized}`;

        return {
          id: cliente.id,
          phoneNumber: formattedPhone,
          name: cliente.nombre || 'Cliente',
          variables: {
            nombre: cliente.nombre || 'Cliente',
            puntos: cliente.puntos || 0,
          }
        };
      });

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: 'Todos los clientes seleccionados han optado por no recibir mensajes' },
        { status: 400 }
      );
    }

    // Determinar configuración
    let config;
    if (preset && BATCH_PRESETS[preset as keyof typeof BATCH_PRESETS]) {
      config = BATCH_PRESETS[preset as keyof typeof BATCH_PRESETS];
    } else {
      config = {
        batchSize: batchSize,
        delayBetweenBatches: delayMinutes * 60 * 1000,
        delayBetweenMessages: 1000,
        maxRetries: 2,
        retryDelay: 5000,
      };
    }

    // Crear campaña
    const campaign = await batchCampaignManager.createCampaign(
      businessId,
      name || `Campaña ${new Date().toLocaleDateString()}`,
      recipients,
      message || '', // TODO: Obtener contenido del template
      config,
      templateId
    );

    // Iniciar automáticamente si se solicitó
    if (autoStart) {
      await batchCampaignManager.startCampaign(campaign.id);
    }

    // Calcular estimaciones
    const totalBatches = Math.ceil(recipients.length / config.batchSize);
    const estimatedSeconds = 
      (recipients.length * config.delayBetweenMessages / 1000) +
      ((totalBatches - 1) * config.delayBetweenBatches / 1000);

    return NextResponse.json({
      success: true,
      campaign: {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        config: {
          batchSize: config.batchSize,
          delayBetweenBatches: `${config.delayBetweenBatches / 60000} minutos`,
          maxRetries: config.maxRetries,
        },
        recipients: {
          total: recipients.length,
          excluded: clientes.length - recipients.length,
        },
        batches: {
          total: totalBatches,
          messagesPerBatch: config.batchSize,
        },
        estimatedTime: formatTimeRemaining(estimatedSeconds),
        estimatedCompletion: new Date(Date.now() + estimatedSeconds * 1000).toISOString(),
      },
      actions: {
        start: `/api/whatsapp/batch-campaign/${campaign.id}/start`,
        pause: `/api/whatsapp/batch-campaign/${campaign.id}/pause`,
        resume: `/api/whatsapp/batch-campaign/${campaign.id}/resume`,
        cancel: `/api/whatsapp/batch-campaign/${campaign.id}/cancel`,
        status: `/api/whatsapp/batch-campaign/${campaign.id}/status`,
      }
    });

  } catch (error: any) {
    console.error('Error creando campaña por lotes:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/whatsapp/batch-campaign
 * Obtener información y presets disponibles
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, {
      allowedRoles: ['admin', 'staff', 'superadmin']
    });
    
    if (!authResult.success) {
      return authResult.response;
    }

    const { searchParams } = new URL(request.url);
    const recipientCount = parseInt(searchParams.get('recipients') || '0');

    // Si se proporciona cantidad de destinatarios, dar recomendación
    let recommendation = null;
    if (recipientCount > 0) {
      recommendation = getRecommendedConfig(recipientCount);
    }

    return NextResponse.json({
      success: true,
      presets: {
        CONSERVATIVE: {
          ...BATCH_PRESETS.CONSERVATIVE,
          description: 'Lotes pequeños, pausas largas. Ideal para cuentas nuevas o sandbox.',
          example: '5 mensajes cada 5 minutos'
        },
        NORMAL: {
          ...BATCH_PRESETS.NORMAL,
          description: 'Balance entre velocidad y seguridad. Recomendado para la mayoría.',
          example: '10 mensajes cada 3 minutos'
        },
        AGGRESSIVE: {
          ...BATCH_PRESETS.AGGRESSIVE,
          description: 'Mayor velocidad. Solo para cuentas con alto volumen aprobado.',
          example: '20 mensajes cada 2 minutos'
        }
      },
      recommendation,
      limits: {
        maxRecipientsPerCampaign: 1000,
        minDelayBetweenBatches: 60000, // 1 minuto mínimo
        maxBatchSize: 50,
      },
      examples: {
        create: {
          method: 'POST',
          body: {
            name: 'Campaña de prueba',
            message: '¡Hola {{nombre}}! Tienes {{puntos}} puntos acumulados.',
            clienteIds: ['cliente_id_1', 'cliente_id_2'],
            batchSize: 10,
            delayMinutes: 3,
            autoStart: false
          }
        },
        createWithFilters: {
          method: 'POST',
          body: {
            name: 'Campaña VIP',
            message: '¡Hola {{nombre}}! Como cliente VIP, tienes acceso exclusivo...',
            filters: {
              puntosMinimos: 100,
              ultimaVisitaDias: 30
            },
            preset: 'NORMAL',
            autoStart: true
          }
        }
      }
    });

  } catch (error: any) {
    console.error('Error obteniendo info de batch campaign:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}
