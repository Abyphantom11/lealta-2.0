/**
 * 📱 SERVICIO DE WHATSAPP CON TWILIO
 * Sistema completo para envío masivo de mensajes a clientes
 */

import twilio from 'twilio';
import { prisma } from '@/lib/prisma';

// Configuración de Twilio
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+15558848359'; // Love Me Group Osado

// ============================================
// 📋 TEMPLATES APROBADOS POR META
// Solo estos templates pueden usarse para iniciar conversaciones
// ============================================

export interface ApprovedTemplate {
  id: string;
  sid: string;           // Content SID de Twilio
  name: string;
  description: string;
  variables: string[];   // Variables que requiere el template
  previewText: string;   // Texto de ejemplo
}

export const APPROVED_TEMPLATES: ApprovedTemplate[] = [
  {
    id: 'estamos_abiertos',
    sid: 'HX2e1e6f8cea11d2c18c1761ac48c0ca29',
    name: '🏪 Estamos Abiertos',
    description: 'Notificación de que el restaurante está abierto',
    variables: [], // Sin variables por ahora
    previewText: '¡Osado Ya Está Abierto! Te esperamos con lo mejor de nuestra carta. 🍗🔥'
  },
  // Agregar más templates aprobados aquí cuando Meta los apruebe
];

if (!accountSid || !authToken) {
  console.warn('⚠️ Variables de Twilio no configuradas - usando modo de demostración');
}

const client = twilio(accountSid, authToken);

// Tipos TypeScript
export interface WhatsAppMessage {
  to: string;
  body: string;
  mediaUrl?: string;
}

export interface MessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
  phone: string;
}

export interface MassiveMessageResult {
  total: number;
  successful: number;
  failed: number;
  results: MessageResult[];
  errors: string[];
}

export interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  variables: string[];
}

// Templates predefinidos
export const MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    id: 'welcome',
    name: 'Bienvenida',
    content: `¡Hola {{nombre}}! 🎉

¡Bienvenido a {{negocio}}! 

Tu cuenta de fidelización ya está activa.
Empieza a acumular puntos con cada visita.

¡Nos vemos pronto! 🚀`,
    variables: ['nombre', 'negocio']
  },
  {
    id: 'promotion',
    name: 'Promoción Especial', 
    content: `¡Hola {{nombre}}! 🔥

🎁 PROMOCIÓN ESPECIAL para ti:
{{promocion}}

Válida hasta {{fecha}}
¡No te la pierdas!

Saludos,
El equipo de {{negocio}}`,
    variables: ['nombre', 'promocion', 'fecha', 'negocio']
  },
  {
    id: 'points_reminder',
    name: 'Recordatorio de Puntos',
    content: `¡Hola {{nombre}}! ⭐

Tienes {{puntos}} puntos acumulados.
¡Estás muy cerca de tu próxima recompensa!

¿Cuándo nos visitas de nuevo?

{{negocio}}`,
    variables: ['nombre', 'puntos', 'negocio']
  },
  {
    id: 'birthday',
    name: 'Cumpleaños',
    content: `¡Feliz cumpleaños {{nombre}}! 🎂🎉

En {{negocio}} queremos celebrarte.
¡Ven y disfruta de tu regalo especial!

¡Te esperamos! 🎁`,
    variables: ['nombre', 'negocio']
  }
];

/**
 * Enviar mensaje individual de WhatsApp
 * Puede usar template SID o texto libre (dependiendo de la configuración de Twilio)
 */
export async function enviarMensajeWhatsApp(
  numeroDestino: string,
  mensaje: string,
  mediaUrl?: string,
  templateSid?: string
): Promise<MessageResult> {
  try {
    // Verificar configuración
    if (!accountSid || !authToken) {
      return {
        success: false,
        error: 'Configuración de Twilio no disponible',
        phone: numeroDestino
      };
    }

    // Crear cliente con configuración verificada
    const client = twilio(accountSid, authToken);
    
    // Limpiar y formatear número
    const numeroLimpio = limpiarNumeroTelefono(numeroDestino);
    
    if (!numeroLimpio) {
      return {
        success: false,
        error: 'Número de teléfono inválido',
        phone: numeroDestino
      };
    }

    const messageData: any = {
      from: whatsappNumber,
      to: `whatsapp:${numeroLimpio}`
    };

    // Usar template si está disponible, sino usar texto libre
    if (templateSid) {
      messageData.contentSid = templateSid;
    } else {
      messageData.body = mensaje;
    }

    if (mediaUrl && !templateSid) {
      messageData.mediaUrl = [mediaUrl];
    }

    const message = await client.messages.create(messageData);

    // Guardar log en base de datos
    await guardarLogMensaje({
      phone: numeroLimpio,
      message: mensaje,
      messageId: message.sid,
      status: 'sent',
      mediaUrl,
      templateSid
    });

    return {
      success: true,
      messageId: message.sid,
      phone: numeroLimpio
    };

  } catch (error: any) {
    console.error('❌ Error enviando WhatsApp:', error);
    
    // Guardar error en log
    await guardarLogMensaje({
      phone: numeroDestino,
      message: mensaje,
      status: 'failed',
      error: error.message
    });

    return {
      success: false,
      error: error.message || 'Error desconocido',
      phone: numeroDestino
    };
  }
}

/**
 * Envío masivo de mensajes
 */
export async function enviarMensajesMasivos(
  destinatarios: Array<{
    telefono: string;
    nombre: string;
    [key: string]: any;
  }>,
  template: string,
  variables: Record<string, string> = {}
): Promise<MassiveMessageResult> {
  const results: MessageResult[] = [];
  const errors: string[] = [];
  let successful = 0;
  let failed = 0;

  console.log(`📤 Iniciando envío masivo a ${destinatarios.length} contactos...`);

  for (let i = 0; i < destinatarios.length; i++) {
    const destinatario = destinatarios[i];
    
    try {
      // Personalizar mensaje
      const mensajePersonalizado = personalizarMensaje(template, {
        ...variables,
        ...destinatario
      });

      // Enviar mensaje
      const result = await enviarMensajeWhatsApp(
        destinatario.telefono,
        mensajePersonalizado
      );

      results.push(result);

      if (result.success) {
        successful++;
        console.log(`✅ ${i + 1}/${destinatarios.length} - ${destinatario.nombre}`);
      } else {
        failed++;
        errors.push(`❌ ${destinatario.nombre}: ${result.error}`);
        console.log(`❌ ${i + 1}/${destinatarios.length} - ${destinatario.nombre}: ${result.error}`);
      }

      // Rate limiting: pausa entre mensajes
      if (i < destinatarios.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 segundo entre mensajes
      }

    } catch (error: any) {
      failed++;
      const errorMsg = `Error procesando ${destinatario.nombre}: ${error.message}`;
      errors.push(errorMsg);
      results.push({
        success: false,
        error: error.message,
        phone: destinatario.telefono
      });
    }
  }

  return {
    total: destinatarios.length,
    successful,
    failed,
    results,
    errors
  };
}

/**
 * Obtener clientes para campaña
 */
export async function obtenerClientesParaCampana(filtros: {
  businessId?: string;
  puntosMinimos?: number;
  ultimaVisitaDias?: number;
  aceptaPromociones?: boolean;
  tipoFiltro?: 'todos' | 'puntos' | 'visitas' | 'combinado';
}) {
  const where: any = {};

  console.log('🔧 Construyendo filtros WHERE...');

  if (filtros.businessId) {
    where.businessId = filtros.businessId;
    console.log(`🏢 Business ID aplicado: ${filtros.businessId}`);
  }

  // Aplicar filtros según el tipo
  if (filtros.tipoFiltro === 'puntos' || filtros.tipoFiltro === 'combinado') {
    if (filtros.puntosMinimos) {
      where.puntos = {
        gte: filtros.puntosMinimos
      };
      console.log(`⭐ Filtro puntos aplicado: >= ${filtros.puntosMinimos}`);
    }
  }

  if (filtros.tipoFiltro === 'visitas' || filtros.tipoFiltro === 'combinado') {
    if (filtros.ultimaVisitaDias) {
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() - filtros.ultimaVisitaDias);
      
      where.visitLogs = {
        some: {
          timestamp: {
            gte: fechaLimite
          }
        }
      };
      console.log(`📅 Filtro visitas aplicado: últimos ${filtros.ultimaVisitaDias} días desde ${fechaLimite.toISOString()}`);
    }
  }

  console.log('🗄️ WHERE final:', JSON.stringify(where, null, 2));

  // Solo incluir clientes con teléfono válido
  where.telefono = {
    not: null
  };

  const clientes = await prisma.cliente.findMany({
    where,
    select: {
      id: true,
      nombre: true,
      telefono: true,
      puntos: true,
      businessId: true
    }
  });

  // Obtener información de businesses
  const businesses = await prisma.business.findMany({
    select: {
      id: true,
      name: true
    }
  });

  const businessMap = businesses.reduce((acc, business) => {
    acc[business.id] = business.name;
    return acc;
  }, {} as Record<string, string>);

  // Función para formatear número ecuatoriano
  const formatEcuadorianPhone = (phone: string): string | null => {
    if (!phone) return null;
    
    const cleaned = phone.replace(/\D/g, '');
    
    // Formato 09XXXXXXXX (10 dígitos)
    if (cleaned.startsWith('09') && cleaned.length === 10) {
      return `+593${cleaned.substring(1)}`;
    }
    
    // Formato 5939XXXXXXXX (12 dígitos)
    if (cleaned.startsWith('5939') && cleaned.length === 12) {
      return `+${cleaned}`;
    }
    
    // Formato 593XXXXXXXXX donde X empieza con 9 (12 dígitos)
    if (cleaned.startsWith('593') && cleaned.length === 12) {
      const ecuadorianNumber = cleaned.substring(3);
      if (ecuadorianNumber.startsWith('9') && ecuadorianNumber.length === 9) {
        return `+${cleaned}`;
      }
    }
    
    // Formato 9XXXXXXXX (9 dígitos) - agregar 593
    if (cleaned.startsWith('9') && cleaned.length === 9) {
      return `+593${cleaned}`;
    }
    
    // Formato +5939XXXXXXXX (ya formateado)
    if (phone.startsWith('+5939') && cleaned.length === 12) {
      return phone;
    }
    
    return null; // Número no válido
  };

  // Filtrar solo números ecuatorianos válidos (09) y mapear con nombre del negocio
  const clientesValidos = clientes
    .map(cliente => {
      const telefonoFormateado = formatEcuadorianPhone(cliente.telefono);
      if (!telefonoFormateado) return null;

      return {
        ...cliente,
        telefono: telefonoFormateado,
        businessName: businessMap[cliente.businessId] || 'Sin nombre'
      };
    })
    .filter(cliente => cliente !== null) as Array<{
      id: string;
      nombre: string;
      telefono: string;
      puntos: number;
      businessId: string;
      businessName: string;
    }>;

  console.log(`📱 Filtros aplicados:`, {
    tipoFiltro: filtros.tipoFiltro || 'todos',
    businessId: filtros.businessId,
    puntosMinimos: filtros.puntosMinimos,
    ultimaVisitaDias: filtros.ultimaVisitaDias
  });
  console.log(`📊 Clientes encontrados: ${clientes.length} total, ${clientesValidos.length} con números válidos (+593 09)`);

  return clientesValidos;
}

/**
 * Personalizar mensaje con variables
 */
export function personalizarMensaje(
  template: string,
  variables: Record<string, any>
): string {
  let mensaje = template;
  
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    mensaje = mensaje.replace(regex, String(value));
  }
  
  return mensaje;
}

/**
 * Limpiar y validar número de teléfono
 */
export function limpiarNumeroTelefono(numero: string): string | null {
  if (!numero) return null;
  
  // Remover espacios y caracteres especiales
  // eslint-disable-next-line prefer-regex-literals
  let numeroLimpio = numero.replace(/[\s\-()]+/g, '');
  
  // Si empieza con 0, remover el 0 inicial y agregar código de país Ecuador (+593)
  if (numeroLimpio.startsWith('0')) {
    numeroLimpio = '593' + numeroLimpio.substring(1);
  }
  
  // Si no tiene código de país, asumir Ecuador
  if (!numeroLimpio.startsWith('593') && numeroLimpio.length === 9) {
    numeroLimpio = '593' + numeroLimpio;
  }
  
  // Agregar + al inicio si no lo tiene
  if (!numeroLimpio.startsWith('+')) {
    numeroLimpio = '+' + numeroLimpio;
  }
  
  // Validar longitud (Ecuador: +593 + 9 dígitos)
  if (numeroLimpio.length >= 12 && numeroLimpio.length <= 15) {
    return numeroLimpio;
  }
  
  return null;
}

/**
 * Guardar log de mensaje en base de datos
 */
async function guardarLogMensaje(data: {
  phone: string;
  message: string;
  messageId?: string;
  status: 'sent' | 'failed' | 'delivered' | 'read';
  error?: string;
  mediaUrl?: string;
  templateSid?: string;
}) {
  try {
    // Log en consola por ahora
    console.log('📝 Log WhatsApp:', {
      timestamp: new Date().toISOString(),
      ...data
    });
    
    // En el futuro se puede implementar una tabla de logs
    
  } catch (error) {
    console.error('Error guardando log de WhatsApp:', error);
  }
}

/**
 * Obtener estado de mensaje
 */
export async function obtenerEstadoMensaje(messageId: string) {
  try {
    const message = await client.messages(messageId).fetch();
    return {
      status: message.status,
      errorCode: message.errorCode,
      errorMessage: message.errorMessage,
      dateUpdated: message.dateUpdated
    };
  } catch (error: any) {
    console.error('Error obteniendo estado:', error);
    return { error: error.message };
  }
}

/**
 * Webhook para recibir estados de mensajes
 * Usar en /api/webhooks/whatsapp
 */
export function procesarWebhookTwilio(body: any) {
  const {
    MessageSid,
    MessageStatus,
    ErrorCode,
    ErrorMessage,
    From,
    To
  } = body;

  console.log('📱 Webhook WhatsApp:', {
    messageId: MessageSid,
    status: MessageStatus,
    from: From,
    to: To,
    error: ErrorCode ? `${ErrorCode}: ${ErrorMessage}` : null
  });

  // Aquí puedes actualizar el estado en tu base de datos
  return {
    messageId: MessageSid,
    status: MessageStatus,
    error: ErrorCode
  };
}
