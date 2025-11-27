import { NextRequest, NextResponse } from 'next/server';
import { enviarMensajeWhatsApp, limpiarNumeroTelefono } from '@/lib/whatsapp';
import { requireAuth } from '@/middleware/requireAuth';
import { prisma } from '@/lib/prisma';

/**
 * 📱 POST /api/whatsapp/send-message
 * Enviar mensaje individual de WhatsApp
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const authResult = await requireAuth(request, {
      allowedRoles: ['admin', 'staff', 'superadmin']
    });
    
    if (!authResult.success) {
      return authResult.response;
    }

    const body = await request.json();
    const { telefono, mensaje, clienteId, mediaUrl, templateSid } = body;

    // Validaciones
    if (!telefono || (!mensaje && !templateSid)) {
      return NextResponse.json(
        { error: 'Teléfono y mensaje (o templateSid) son requeridos' },
        { status: 400 }
      );
    }

    // Limpiar número de teléfono
    const numeroLimpio = limpiarNumeroTelefono(telefono);
    if (!numeroLimpio) {
      return NextResponse.json(
        { error: 'Número de teléfono inválido' },
        { status: 400 }
      );
    }

    // Si se proporciona clienteId, validar que existe
    let cliente = null;
    if (clienteId) {
      cliente = await prisma.cliente.findUnique({
        where: { id: clienteId },
        select: {
          id: true,
          nombre: true,
          telefono: true,
          businessId: true
        }
      });

      if (!cliente) {
        return NextResponse.json(
          { error: 'Cliente no encontrado' },
          { status: 404 }
        );
      }
    }

    console.log(`📤 Enviando WhatsApp a ${numeroLimpio}...`);

    // Enviar mensaje
    const resultado = await enviarMensajeWhatsApp(numeroLimpio, mensaje, mediaUrl, templateSid);

    if (resultado.success) {
      console.log('✅ Mensaje enviado exitosamente');
      
      return NextResponse.json({
        success: true,
        message: 'Mensaje enviado exitosamente',
        messageId: resultado.messageId,
        phone: resultado.phone,
        cliente: cliente ? {
          id: cliente.id,
          nombre: cliente.nombre
        } : null
      });
    } else {
      console.log('❌ Error enviando mensaje:', resultado.error);
      
      return NextResponse.json(
        { 
          success: false,
          error: resultado.error,
          phone: resultado.phone 
        },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('❌ Error en send-message:', error);
    
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
 * 📋 GET /api/whatsapp/send-message
 * Obtener información sobre el servicio
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
      service: 'WhatsApp Individual Message Service',
      endpoint: '/api/whatsapp/send-message',
      methods: ['POST'],
      required_fields: ['telefono', 'mensaje o templateSid'],
      optional_fields: ['clienteId', 'mediaUrl', 'templateSid'],
      ejemplo_texto_libre: {
        telefono: '+593987654321',
        mensaje: '¡Hola! Gracias por ser parte de nuestro programa de fidelización.',
        clienteId: 'optional_client_id',
        mediaUrl: 'https://ejemplo.com/imagen.jpg'
      },
      ejemplo_con_template: {
        telefono: '+593987654321',
        templateSid: 'HX2e1e6f8cea11d2c18c1761ac48c0ca29',
        clienteId: 'optional_client_id'
      },
      templates_disponibles: {
        estamos_abiertos: 'HX2e1e6f8cea11d2c18c1761ac48c0ca29'
      },
      formatos_telefono_aceptados: [
        '+593987654321',
        '593987654321', 
        '0987654321',
        '987654321'
      ]
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
