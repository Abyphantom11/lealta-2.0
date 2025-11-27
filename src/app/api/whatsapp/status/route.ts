import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * 📊 GET /api/whatsapp/status
 * Verificar estado de configuración de WhatsApp
 * No requiere autenticación estricta - permite verificar estado básico
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // Verificar variables de entorno de Twilio
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

    const isConfigured = !!(accountSid && authToken);
    const isSandbox = whatsappNumber?.includes('14155238886'); // Número sandbox de Twilio
    const isDemoMode = !isConfigured;

    // Si no hay sesión, retornar estado básico sin detalles sensibles
    if (!session?.user) {
      return NextResponse.json({
        success: true,
        isConfigured,
        isDemoMode,
        message: isDemoMode 
          ? 'WhatsApp en modo demo' 
          : 'WhatsApp configurado'
      });
    }

    // Información de configuración (sin exponer tokens completos)
    const configInfo = {
      accountSidConfigured: !!accountSid,
      authTokenConfigured: !!authToken,
      whatsappNumberConfigured: !!whatsappNumber,
      isSandbox,
    };

    // Verificar conectividad con Twilio si está configurado
    let twilioStatus = 'not_configured';
    if (isConfigured) {
      try {
        const twilio = require('twilio');
        const client = twilio(accountSid, authToken);
        
        // Intentar obtener información de la cuenta
        const account = await client.api.accounts(accountSid).fetch();
        twilioStatus = account.status === 'active' ? 'connected' : 'inactive';
      } catch (error: any) {
        console.error('Error verificando Twilio:', error.message);
        twilioStatus = 'error';
      }
    }

    return NextResponse.json({
      success: true,
      isConfigured,
      isDemoMode,
      isSandbox,
      twilioStatus,
      config: configInfo,
      message: isDemoMode 
        ? 'WhatsApp está en modo demostración. Configure las credenciales de Twilio para enviar mensajes reales.'
        : isSandbox 
          ? 'WhatsApp está usando el sandbox de Twilio. Los mensajes solo se enviarán a números verificados.'
          : 'WhatsApp Business está configurado y listo para enviar mensajes.',
    });

  } catch (error: any) {
    console.error('Error en status de WhatsApp:', error);
    
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
