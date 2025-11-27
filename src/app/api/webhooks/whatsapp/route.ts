import { NextRequest, NextResponse } from 'next/server';
import { procesarWebhookTwilio } from '@/lib/whatsapp';

/**
 * 📞 POST /api/webhooks/whatsapp
 * Webhook para recibir actualizaciones de estado de mensajes de Twilio
 */
export async function POST(request: NextRequest) {
  try {
    console.log('📱 Webhook WhatsApp recibido...');

    // Obtener datos del webhook
    const formData = await request.formData();
    const webhookData: Record<string, any> = {};
    
    formData.forEach((value, key) => {
      webhookData[key] = value.toString();
    });

    console.log('📝 Datos del webhook:', webhookData);

    // Procesar webhook
    const resultado = procesarWebhookTwilio(webhookData);

    console.log('✅ Webhook procesado:', resultado);

    // Twilio espera respuesta 200
    return NextResponse.json({
      success: true,
      message: 'Webhook procesado exitosamente'
    }, { status: 200 });

  } catch (error: any) {
    console.error('❌ Error procesando webhook:', error);
    
    // Aún así devolver 200 para evitar reintento de Twilio
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 200 });
  }
}

/**
 * GET /api/webhooks/whatsapp
 * Verificación de endpoint (opcional)
 */
export async function GET() {
  return NextResponse.json({
    service: 'WhatsApp Webhook Endpoint',
    status: 'active',
    description: 'Endpoint para recibir actualizaciones de estado de mensajes de Twilio',
    supported_events: [
      'message.sent',
      'message.delivered',
      'message.read',
      'message.failed'
    ]
  });
}
