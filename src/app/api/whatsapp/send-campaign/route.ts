import { NextRequest, NextResponse } from 'next/server';
import { 
  enviarMensajesMasivos, 
  obtenerClientesParaCampana, 
  MESSAGE_TEMPLATES,
  enviarMensajeWhatsApp
} from '@/lib/whatsapp';
import { requireAuth } from '@/middleware/requireAuth';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, recordMessageUsage } from '@/app/api/whatsapp/rate-limit/route';

/**
 * 📤 POST /api/whatsapp/send-campaign
 * Enviar campaña masiva de WhatsApp
 * 
 * Soporta dos modos:
 * 1. contentSid: Usa un Content Template aprobado por Meta (recomendado)
 * 2. templateId/customMessage: Usa templates internos (legacy, puede fallar sin aprobación)
 */
export async function POST(request: NextRequest) {
  try {
    console.log('📤 [send-campaign] Iniciando petición...');
    
    // Verificar autenticación (solo admin, staff, superadmin)
    const authResult = await requireAuth(request, {
      allowedRoles: ['admin', 'staff', 'superadmin']
    });
    
    if (!authResult.success) {
      console.log('❌ [send-campaign] Auth fallida');
      return authResult.response;
    }
    
    // Obtener businessId de la sesión autenticada
    const sessionBusinessId = authResult.session.businessId;
    console.log('✅ [send-campaign] Auth exitosa, businessId:', sessionBusinessId);

    const body = await request.json();
    const {
      contentSid,       // 🆕 Content Template SID aprobado por Meta
      templateId,       // Template interno (legacy)
      customMessage,    // Mensaje personalizado (legacy)
      variables = {},
      filtros = {},
      businessId,
      phoneNumbers,     // 🆕 Lista específica de números a enviar
      batchSize = 10,         // 🆕 Tamaño del lote
      delayBetweenBatches = 3000,  // 🆕 Delay entre lotes en ms
      maxMessages,      // 🆕 Límite de mensajes a enviar
      simulationMode = false  // 🆕 Modo simulación - no envía mensajes reales
    } = body;

    console.log(`📊 Parámetros recibidos: maxMessages=${maxMessages}, phoneNumbers=${phoneNumbers?.length || 0}, simulationMode=${simulationMode}`);

    // Validaciones - Priorizar contentSid
    if (!contentSid && !templateId && !customMessage) {
      return NextResponse.json(
        { error: 'Se requiere contentSid (recomendado), templateId o customMessage' },
        { status: 400 }
      );
    }

    const useApprovedTemplate = !!contentSid;
    console.log(`🚀 Iniciando campaña WhatsApp ${useApprovedTemplate ? '(Template Aprobado)' : '(Legacy)'}...`);

    // Usar businessId de la sesión si no se proporciona en el request
    const effectiveBusinessId = businessId || filtros.businessId || sessionBusinessId;
    
    if (!effectiveBusinessId) {
      return NextResponse.json(
        { error: 'No se pudo determinar el businessId' },
        { status: 400 }
      );
    }

    // Obtener clientes según filtros
    const filtrosCompletos = {
      ...filtros,
      businessId: effectiveBusinessId
    };

    // 1. OBTENER CLIENTES
    const clientes = await obtenerClientesParaCampana(filtrosCompletos);
    
    if (clientes.length === 0) {
      return NextResponse.json(
        { 
          error: 'No se encontraron clientes con los filtros especificados',
          filtros: filtrosCompletos
        },
        { status: 400 }
      );
    }

    // 2. FILTRAR OPT-OUTS
    const optedOutNumbers = await prisma.whatsAppOptOut.findMany({
      where: {
        businessId: effectiveBusinessId,
        optedBackIn: false
      },
      select: {
        phoneNumber: true
      }
    });

    const optedOutSet = new Set(
      optedOutNumbers.map(opt => opt.phoneNumber.replace(/\D/g, ''))
    );

    let clientesFiltrados = clientes.filter(cliente => {
      const phoneNormalized = cliente.telefono.replace(/\D/g, '');
      return !optedOutSet.has(phoneNormalized);
    });

    // 🆕 3. FILTRAR COOLDOWN 24 HORAS - Evitar spam
    const hace24Horas = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const mensajesRecientes = await prisma.whatsAppMessage.findMany({
      where: {
        businessId: effectiveBusinessId,
        sentAt: {
          gte: hace24Horas
        },
        status: {
          in: ['SENT', 'DELIVERED', 'READ']
        }
      },
      select: {
        phoneNumber: true
      }
    });

    const cooldownSet = new Set(
      mensajesRecientes.map(m => m.phoneNumber.replace(/\D/g, ''))
    );

    const clientesAntesDelCooldown = clientesFiltrados.length;
    clientesFiltrados = clientesFiltrados.filter(cliente => {
      const phoneNormalized = cliente.telefono.replace(/\D/g, '');
      return !cooldownSet.has(phoneNormalized);
    });

    const excluidosPorCooldown = clientesAntesDelCooldown - clientesFiltrados.length;
    if (excluidosPorCooldown > 0) {
      console.log(`⏰ ${excluidosPorCooldown} números excluidos por cooldown de 24 horas`);
    }

    // 🆕 Filtrar por números específicos del frontend (prioridad)
    if (phoneNumbers && Array.isArray(phoneNumbers) && phoneNumbers.length > 0) {
      const phoneNumbersSet = new Set(
        phoneNumbers.map((phone: string) => phone.replace(/\D/g, ''))
      );
      clientesFiltrados = clientesFiltrados.filter(cliente => {
        const phoneNormalized = cliente.telefono.replace(/\D/g, '');
        return phoneNumbersSet.has(phoneNormalized);
      });
      console.log(`� Filtrado por ${phoneNumbers.length} números específicos del frontend, resultado: ${clientesFiltrados.length} clientes`);
    }
    // 🆕 Aplicar límite de mensajes si está configurado (fallback)
    else if (maxMessages && maxMessages > 0 && maxMessages < clientesFiltrados.length) {
      clientesFiltrados = clientesFiltrados.slice(0, maxMessages);
      console.log(`🔢 Limitando a ${maxMessages} mensajes (de ${clientes.length} disponibles)`);
    }

    console.log(`📞 ${simulationMode ? '🔬 SIMULACIÓN:' : ''} Procesando ${clientesFiltrados.length} clientes`);

    // 5. VERIFICAR RATE LIMITS (después de todo el filtrado)
    if (!simulationMode) {
      const rateLimitCheck = await checkRateLimit(effectiveBusinessId, clientesFiltrados.length);
      
      if (!rateLimitCheck.canSend) {
        return NextResponse.json({
          error: 'Límite de envío excedido',
          details: {
            dailyUsed: rateLimitCheck.dailyUsed,
            dailyLimit: rateLimitCheck.dailyLimit,
            monthlyUsed: rateLimitCheck.monthlyUsed,
            monthlyLimit: rateLimitCheck.monthlyLimit,
            tier: rateLimitCheck.tier,
            waitTime: rateLimitCheck.waitTime,
            intentando: clientesFiltrados.length
          }
        }, { status: 429 });
      }
      console.log(`✅ Rate limit OK: ${rateLimitCheck.dailyUsed}/${rateLimitCheck.dailyLimit} diarios, ${rateLimitCheck.monthlyUsed}/${rateLimitCheck.monthlyLimit} mensuales`);
    } else {
      console.log('🔬 Modo simulación: saltando verificación de rate limits');
    }

    // 🆕 MODO SIMULACIÓN - Retornar sin enviar mensajes reales
    if (simulationMode) {
      console.log('🔬 Modo simulación activo - No se enviarán mensajes reales');
      
      // Simular el proceso con un delay pequeño
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simular resultados realistas (95% éxito típico)
      const simulatedSuccessRate = 0.95;
      const simulatedSuccessful = Math.floor(clientesFiltrados.length * simulatedSuccessRate);
      const simulatedFailed = clientesFiltrados.length - simulatedSuccessful;
      
      return NextResponse.json({
        success: true,
        simulationMode: true,
        message: '🔬 SIMULACIÓN COMPLETADA - No se enviaron mensajes reales',
        resultados: {
          total: clientesFiltrados.length,
          exitosos: simulatedSuccessful,
          fallidos: simulatedFailed,
          tasa_exito: Math.round(simulatedSuccessRate * 100)
        },
        detalles: {
          template: contentSid || templateId || 'Mensaje personalizado',
          batchSize,
          delayBetweenBatches,
          tiempoEstimado: `${Math.ceil(clientesFiltrados.length / batchSize) * (delayBetweenBatches / 60000)} minutos`,
          costoEstimado: `$${(clientesFiltrados.length * 0.055).toFixed(2)}`
        },
        destinatarios: clientesFiltrados.slice(0, 20).map(c => ({
          nombre: c.nombre,
          telefono: c.telefono.replace(/(\d{3})(\d{3})(\d{4})/, '$1****$3'), // Ocultar parte del número
          puntos: c.puntos
        })),
        totalDestinatarios: clientesFiltrados.length,
        exclusiones: {
          optOuts: optedOutNumbers.length,
          cooldown24h: excluidosPorCooldown,
          total: optedOutNumbers.length + excluidosPorCooldown
        }
      });
    }

    // 4. CREAR CAMPAÑA EN BD
    const campana = await prisma.whatsAppCampaign.create({
      data: {
        businessId: effectiveBusinessId,
        name: `Campaña ${new Date().toLocaleDateString()}`,
        templateId: contentSid || templateId || null,
        customMessage: customMessage || null,
        variables: variables,
        filters: filtros,
        status: 'PROCESSING',
        totalTargeted: clientesFiltrados.length,
        estimatedCost: clientesFiltrados.length * 0.055 // $0.055 por mensaje
      }
    });

    let resultado: { total: number; successful: number; failed: number; errors: string[] };

    // 🆕 MODO 1: Usar Content Template aprobado por Meta
    if (useApprovedTemplate) {
      console.log(`📋 Usando Content Template: ${contentSid}`);
      
      resultado = { total: clientesFiltrados.length, successful: 0, failed: 0, errors: [] };
      
      // Enviar en lotes para respetar rate limits
      for (let i = 0; i < clientesFiltrados.length; i += batchSize) {
        const batch = clientesFiltrados.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (cliente) => {
          try {
            const phoneNormalized = cliente.telefono.replace(/\D/g, '');
            const formattedPhone = phoneNormalized.startsWith('593') 
              ? `+${phoneNormalized}` 
              : phoneNormalized.startsWith('0')
                ? `+593${phoneNormalized.slice(1)}`
                : `+593${phoneNormalized}`;
            
            const res = await enviarMensajeWhatsApp(formattedPhone, '', undefined, contentSid);
            
            if (res.success) {
              resultado.successful++;
            } else {
              resultado.failed++;
              resultado.errors.push(`${cliente.nombre}: ${res.error}`);
            }
          } catch (err: any) {
            resultado.failed++;
            resultado.errors.push(`${cliente.nombre}: ${err.message}`);
          }
        });
        
        await Promise.all(batchPromises);
        
        // Delay entre lotes
        if (i + batchSize < clientesFiltrados.length) {
          await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
        }
        
        console.log(`📤 Lote ${Math.floor(i / batchSize) + 1}: ${resultado.successful} enviados, ${resultado.failed} fallidos`);
      }
    } else {
      // MODO 2: Legacy - Templates internos (puede fallar sin aprobación Meta)
      console.log('⚠️ Usando modo legacy (sin Content Template aprobado)');
      
      // Obtener template o usar mensaje personalizado
      let mensajeTemplate: string;
      if (templateId) {
        const template = MESSAGE_TEMPLATES.find(t => t.id === templateId);
        if (!template) {
          return NextResponse.json(
            { error: 'Template no encontrado' },
            { status: 400 }
          );
        }
        mensajeTemplate = template.content;
      } else {
        mensajeTemplate = customMessage;
      }

      // Mapear clientes para el envío
      const destinatarios = clientesFiltrados.map(cliente => ({
        telefono: cliente.telefono,
        nombre: cliente.nombre,
        puntos: cliente.puntos,
        negocio: cliente.businessName
      }));

      // Enviar mensajes masivos (legacy)
      resultado = await enviarMensajesMasivos(
        destinatarios,
        mensajeTemplate,
        variables
      );
    }

    // 4. CREAR MENSAJES EN BD (para tracking)
    const mensajesPromises = clientesFiltrados.map(cliente => {
      const phoneNormalized = cliente.telefono.replace(/\D/g, '');
      const formattedPhone = phoneNormalized.startsWith('593') 
        ? `+${phoneNormalized}` 
        : `+593${phoneNormalized}`;

      return prisma.whatsAppMessage.create({
        data: {
          campaignId: campana.id,
          businessId: effectiveBusinessId,
          clienteId: cliente.id,
          phoneNumber: formattedPhone,
          templateId: contentSid || templateId || null,
          customMessage: customMessage || null,
          variables: variables,
          status: 'PENDING',
          priority: 'MEDIUM'
        }
      });
    });

    await Promise.all(mensajesPromises);

    // 6. ACTUALIZAR CAMPAÑA Y REGISTRAR USO
    await Promise.all([
      prisma.whatsAppCampaign.update({
        where: { id: campana.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          totalSent: resultado.successful,
          totalFailed: resultado.failed,
          actualCost: resultado.successful * 0.055
        }
      }),
      recordMessageUsage(effectiveBusinessId, resultado.successful, 0)
    ]);

    console.log('✅ Campaña completada:', {
      total: resultado.total,
      exitosos: resultado.successful,
      fallidos: resultado.failed,
      campaignId: campana.id
    });

    return NextResponse.json({
      success: true,
      message: 'Campaña enviada exitosamente',
      resultados: {
        total: resultado.total,
        exitosos: resultado.successful,
        fallidos: resultado.failed,
        tasa_exito: Math.round((resultado.successful / resultado.total) * 100)
      },
      errores: resultado.errors.slice(0, 10) // Solo primeros 10 errores
    });

  } catch (error: any) {
    console.error('❌ Error en campaña WhatsApp:', error);
    
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * 📋 GET /api/whatsapp/send-campaign
 * Obtener información de templates y filtros disponibles
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, {
      allowedRoles: ['admin', 'staff', 'superadmin']
    });
    
    if (!authResult.success) {
      return authResult.response;
    }

    return NextResponse.json({
      templates: MESSAGE_TEMPLATES,
      filtros_disponibles: {
        puntosMinimos: {
          descripcion: 'Clientes con mínimo X puntos',
          tipo: 'number',
          ejemplo: 100
        },
        ultimaVisitaDias: {
          descripcion: 'Clientes que visitaron en los últimos X días',
          tipo: 'number',
          ejemplo: 30
        },
        businessId: {
          descripcion: 'ID del negocio específico',
          tipo: 'string',
          ejemplo: 'cmfr2y0ia0000eyvw7ef3k20u'
        }
      },
      ejemplo_uso: {
        templateId: 'promotion',
        variables: {
          promocion: '2x1 en bebidas',
          fecha: '31 de Diciembre',
          negocio: 'Casa Sabor'
        },
        filtros: {
          puntosMinimos: 50,
          ultimaVisitaDias: 60
        }
      }
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
