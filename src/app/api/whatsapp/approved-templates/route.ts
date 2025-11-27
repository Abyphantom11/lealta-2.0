import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { requireAuth } from '@/middleware/requireAuth';

/**
 * 📋 GET /api/whatsapp/approved-templates
 * Obtiene los Content Templates aprobados desde Twilio
 * Estos son los templates que Meta ha aprobado para iniciar conversaciones
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const authResult = await requireAuth(request, {
      allowedRoles: ['admin', 'superadmin']
    });
    
    if (!authResult.success) {
      return authResult.response;
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      return NextResponse.json({
        success: false,
        error: 'Twilio no está configurado',
        templates: []
      }, { status: 500 });
    }

    const client = twilio(accountSid, authToken);

    // Obtener todos los Content Templates
    // Estos son los templates creados en Twilio Content Template Builder
    const contentTemplates = await client.content.v1.contents.list({ limit: 50 });

    // Filtrar solo templates aprobados para WhatsApp
    const approvedTemplates = contentTemplates
      .filter(template => {
        // Solo incluir templates que estén aprobados
        // Los templates de WhatsApp tienen un approval status
        const approvalStatus = (template as any).approvalRequests?.whatsapp?.status;
        const isApproved = approvalStatus === 'approved' || !approvalStatus; // Si no hay status, asumimos aprobado
        return isApproved;
      })
      .map(template => {
        // Extraer información del template
        const types = template.types || {};
        const whatsappInfo = (types as any)['twilio/text'] || 
                            (types as any)['twilio/media'] || 
                            (types as any)['twilio/quick-reply'] ||
                            (types as any)['twilio/call-to-action'] ||
                            {};
        
        return {
          id: template.sid,
          sid: template.sid,
          name: template.friendlyName || 'Sin nombre',
          description: `Template: ${template.friendlyName}`,
          language: template.language || 'es',
          variables: template.variables || {},
          previewText: whatsappInfo.body || 'Vista previa no disponible',
          dateCreated: template.dateCreated,
          dateUpdated: template.dateUpdated,
          contentType: Object.keys(types)[0] || 'unknown',
          // Estado de aprobación de WhatsApp
          approvalStatus: (template as any).approvalRequests?.whatsapp?.status || 'unknown'
        };
      });

    console.log(`📋 Templates encontrados: ${approvedTemplates.length}`);

    return NextResponse.json({
      success: true,
      templates: approvedTemplates,
      count: approvedTemplates.length,
      message: `${approvedTemplates.length} templates disponibles`
    });

  } catch (error: any) {
    console.error('❌ Error obteniendo templates:', error);
    
    // Manejar errores específicos de Twilio
    if (error.code === 20003) {
      return NextResponse.json({
        success: false,
        error: 'Credenciales de Twilio inválidas',
        templates: []
      }, { status: 401 });
    }

    return NextResponse.json({
      success: false,
      error: error.message || 'Error obteniendo templates',
      templates: []
    }, { status: 500 });
  }
}

/**
 * 🔄 POST /api/whatsapp/approved-templates
 * Sincroniza los templates desde Twilio (fuerza actualización del cache)
 */
export async function POST(request: NextRequest) {
  // Por ahora, simplemente redirige al GET
  // En el futuro podría guardar en cache/BD
  return GET(request);
}
