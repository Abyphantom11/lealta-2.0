/**
 * 📱 POST /api/whatsapp/send-campaign-invitation
 * Enviar campaña masiva de invitación a nuevo restaurante
 */

import { NextRequest, NextResponse } from 'next/server';
import { enviarMensajeWhatsApp, limpiarNumeroTelefono } from '@/lib/whatsapp';
import { requireAuth } from '@/middleware/requireAuth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const authResult = await requireAuth(request, {
      allowedRoles: ['admin', 'superadmin']
    });
    
    if (!authResult.success) {
      return authResult.response;
    }

    const body = await request.json();
    const {
      restauranteName,
      templateSid,
      clienteIds, // Array de IDs de clientes
      filtro // Opcional: filtro adicional (ej: { businessId: '...' })
    } = body;

    // Validaciones
    if (!restauranteName || !templateSid) {
      return NextResponse.json(
        { error: 'restauranteName y templateSid son requeridos' },
        { status: 400 }
      );
    }

    // Obtener clientes
    let clientes;
    
    if (clienteIds && clienteIds.length > 0) {
      // Enviar a clientes específicos
      clientes = await prisma.cliente.findMany({
        where: {
          id: {
            in: clienteIds
          }
        },
        select: {
          id: true,
          nombre: true,
          telefono: true
        }
      });
    } else {
      // Enviar a todos los clientes (con filtro opcional)
      const whereClause = filtro || {};
      clientes = await prisma.cliente.findMany({
        where: whereClause,
        select: {
          id: true,
          nombre: true,
          telefono: true
        }
      });
    }

    if (clientes.length === 0) {
      return NextResponse.json(
        { error: 'No se encontraron clientes para enviar invitaciones' },
        { status: 404 }
      );
    }

    console.log(`📤 Iniciando envío de campaña de invitación a ${clientes.length} clientes...`);

    // Enviar mensajes
    const resultados = {
      exitosos: 0,
      fallidos: 0,
      detalles: [] as any[]
    };

    for (const cliente of clientes) {
      try {
        if (!cliente.telefono) {
          resultados.fallidos++;
          resultados.detalles.push({
            clienteId: cliente.id,
            nombre: cliente.nombre,
            status: 'error',
            razon: 'Teléfono no registrado'
          });
          continue;
        }

        const numeroLimpio = limpiarNumeroTelefono(cliente.telefono);
        if (!numeroLimpio) {
          resultados.fallidos++;
          resultados.detalles.push({
            clienteId: cliente.id,
            nombre: cliente.nombre,
            status: 'error',
            razon: 'Número de teléfono inválido'
          });
          continue;
        }

        // Enviar mensaje con template
        const resultado = await enviarMensajeWhatsApp(
          numeroLimpio,
          `Invitación a ${restauranteName}`,
          undefined,
          templateSid
        );

        if (resultado.success) {
          resultados.exitosos++;
          resultados.detalles.push({
            clienteId: cliente.id,
            nombre: cliente.nombre,
            telefono: numeroLimpio,
            status: 'enviado',
            messageId: resultado.messageId
          });
        } else {
          resultados.fallidos++;
          resultados.detalles.push({
            clienteId: cliente.id,
            nombre: cliente.nombre,
            telefono: numeroLimpio,
            status: 'error',
            razon: resultado.error
          });
        }

      } catch (error: any) {
        resultados.fallidos++;
        resultados.detalles.push({
          clienteId: cliente.id,
          nombre: cliente.nombre,
          status: 'error',
          razon: error.message
        });
      }

      // Pequeña pausa para no sobrecargar la API de Twilio
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`✅ Campaña completada: ${resultados.exitosos} exitosos, ${resultados.fallidos} fallidos`);

    return NextResponse.json({
      success: true,
      mensaje: 'Campaña de invitación enviada',
      resumen: {
        totalClientes: clientes.length,
        exitosos: resultados.exitosos,
        fallidos: resultados.fallidos,
        tasa_exito: `${((resultados.exitosos / clientes.length) * 100).toFixed(2)}%`
      },
      detalles: resultados.detalles
    });

  } catch (error: any) {
    console.error('❌ Error en campaña de invitación:', error);
    
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
 * 📋 GET /api/whatsapp/send-campaign-invitation
 * Obtener información sobre el servicio
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, {
      allowedRoles: ['admin', 'superadmin']
    });
    
    if (!authResult.success) {
      return authResult.response;
    }

    return NextResponse.json({
      service: 'WhatsApp Bulk Invitation Campaign Service',
      endpoint: '/api/whatsapp/send-campaign-invitation',
      methods: ['POST'],
      required_fields: ['restauranteName', 'templateSid'],
      optional_fields: ['clienteIds', 'filtro'],
      ejemplos: {
        enviar_a_clientes_especificos: {
          restauranteName: 'Alitas Benditas La Coruña',
          templateSid: 'HX2e1e6f8cea11d2c18c1761ac48c0ca29',
          clienteIds: ['cliente_id_1', 'cliente_id_2', 'cliente_id_3']
        },
        enviar_a_todos: {
          restauranteName: 'Alitas Benditas La Coruña',
          templateSid: 'HX2e1e6f8cea11d2c18c1761ac48c0ca29',
          filtro: {
            businessId: 'business_id_xxx'
          }
        }
      },
      respuesta_ejemplo: {
        success: true,
        mensaje: 'Campaña de invitación enviada',
        resumen: {
          totalClientes: 50,
          exitosos: 48,
          fallidos: 2,
          tasa_exito: '96.00%'
        },
        detalles: [
          {
            clienteId: 'id_1',
            nombre: 'Juan Pérez',
            telefono: '+593987654321',
            status: 'enviado',
            messageId: 'SM...'
          }
        ]
      }
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
