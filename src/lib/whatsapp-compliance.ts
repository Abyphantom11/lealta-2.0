/**
 * 🛡️ SISTEMA DE CUMPLIMIENTO WHATSAPP - META POLICIES
 * Asegura que todas las campañas cumplan con las políticas de Meta
 * y protege tu cuenta de suspensiones o penalizaciones.
 */

import { prisma } from '@/lib/prisma';

// ============================================
// 📋 CONFIGURACIÓN DE CUMPLIMIENTO
// ============================================

export const COMPLIANCE_CONFIG = {
  // Límites de seguridad (más conservadores que los de Meta)
  limits: {
    maxMessagesPerHour: 80,      // Meta permite ~100, usamos 80 por seguridad
    maxMessagesPerDay: 800,      // Meta permite ~1000 en Tier 1
    maxMessagesPerBatch: 50,     // Tamaño máximo de lote
    minDelayBetweenMessages: 1000, // 1 segundo mínimo entre mensajes
    cooldownAfterErrors: 300000,   // 5 minutos de pausa si hay errores
  },
  
  // Horarios permitidos para envío (hora local Ecuador)
  businessHours: {
    start: 8,   // 8:00 AM
    end: 21,    // 9:00 PM
    timezone: 'America/Guayaquil',
  },
  
  // Límites de calidad
  quality: {
    maxBlockRate: 0.02,      // 2% máximo de bloqueos
    maxReportRate: 0.001,    // 0.1% máximo de reportes
    minResponseRate: 0.05,   // 5% mínimo de respuestas esperadas
    warningThreshold: 0.015, // Advertencia al 1.5% de bloqueos
  },
  
  // Palabras/frases prohibidas por Meta
  prohibitedContent: [
    // Contenido engañoso
    'gratis 100%', 'sin costo alguno', 'premio garantizado',
    'ganador seleccionado', 'has sido elegido',
    // Contenido financiero no permitido
    'préstamo inmediato', 'crédito fácil', 'dinero rápido',
    'inversión garantizada', 'rendimientos asegurados',
    // Contenido médico sensible
    'cura milagrosa', 'tratamiento definitivo', 'pérdida de peso garantizada',
    // Urgencia engañosa
    'última oportunidad', 'solo hoy', 'expira en minutos',
    // Spam indicators
    'click aquí ahora', 'no te lo pierdas', 'oferta irrepetible',
  ],
  
  // Requisitos de opt-in
  optIn: {
    required: true,
    recordConsent: true,
    allowOptOut: true,
    optOutKeywords: ['STOP', 'PARAR', 'CANCELAR', 'NO', 'BAJA', 'SALIR'],
  },
};

// ============================================
// 🔍 TIPOS Y INTERFACES
// ============================================

export interface ComplianceCheck {
  passed: boolean;
  score: number; // 0-100
  issues: ComplianceIssue[];
  warnings: string[];
  recommendations: string[];
}

export interface ComplianceIssue {
  code: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  suggestion: string;
}

export interface CampaignMetrics {
  sent: number;
  delivered: number;
  read: number;
  responded: number;
  blocked: number;
  reported: number;
  failed: number;
}

export interface QualityScore {
  overall: number; // 0-100
  deliveryRate: number;
  readRate: number;
  responseRate: number;
  blockRate: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
}

// ============================================
// ✅ VALIDACIÓN DE CONTENIDO
// ============================================

/**
 * Valida el contenido del mensaje antes de enviarlo
 */
export function validateMessageContent(message: string): ComplianceCheck {
  const issues: ComplianceIssue[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];
  let score = 100;

  // 1. Verificar longitud
  if (message.length > 4096) {
    issues.push({
      code: 'MSG_TOO_LONG',
      severity: 'critical',
      message: 'El mensaje excede el límite de 4096 caracteres',
      suggestion: 'Reduce el contenido o divídelo en múltiples mensajes',
    });
    score -= 30;
  } else if (message.length > 1000) {
    warnings.push('Mensajes largos pueden tener menor tasa de lectura');
    recommendations.push('Considera mensajes más cortos y directos');
    score -= 5;
  }

  // 2. Verificar contenido prohibido
  const lowerMessage = message.toLowerCase();
  for (const prohibited of COMPLIANCE_CONFIG.prohibitedContent) {
    if (lowerMessage.includes(prohibited.toLowerCase())) {
      issues.push({
        code: 'PROHIBITED_CONTENT',
        severity: 'high',
        message: `Contenido potencialmente prohibido: "${prohibited}"`,
        suggestion: 'Reformula el mensaje sin usar frases engañosas o de urgencia falsa',
      });
      score -= 15;
    }
  }

  // 3. Verificar que tenga identificación del negocio
  const hasBusinessIdentifier = 
    message.includes('{{negocio}}') || 
    message.includes('Lealta') ||
    message.includes('equipo de');
  
  if (!hasBusinessIdentifier) {
    warnings.push('El mensaje no identifica claramente al remitente');
    recommendations.push('Incluye el nombre de tu negocio para evitar reportes de spam');
    score -= 10;
  }

  // 4. Verificar opción de opt-out
  const hasOptOut = 
    lowerMessage.includes('responde stop') ||
    lowerMessage.includes('para cancelar') ||
    lowerMessage.includes('darse de baja') ||
    lowerMessage.includes('dejar de recibir');
  
  if (!hasOptOut && message.length > 200) {
    warnings.push('Considera incluir opción de opt-out en mensajes promocionales');
    recommendations.push('Agrega: "Responde STOP para dejar de recibir mensajes"');
    score -= 5;
  }

  // 5. Verificar URLs sospechosas
  const urlPattern = /(https?:\/\/[^\s]+)/gi;
  const urls = message.match(urlPattern) || [];
  for (const url of urls) {
    if (url.includes('bit.ly') || url.includes('tinyurl') || url.includes('shorturl')) {
      warnings.push('URLs acortadas pueden parecer sospechosas');
      recommendations.push('Usa URLs completas o del dominio de tu negocio');
      score -= 5;
    }
  }

  // 6. Verificar uso excesivo de mayúsculas
  const uppercaseRatio = (message.match(/[A-Z]/g) || []).length / message.length;
  if (uppercaseRatio > 0.3) {
    warnings.push('Uso excesivo de mayúsculas puede parecer spam');
    recommendations.push('Usa mayúsculas solo para énfasis puntual');
    score -= 5;
  }

  // 7. Verificar emojis excesivos
  const emojiPattern = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/gu;
  const emojis = message.match(emojiPattern) || [];
  if (emojis.length > 10) {
    warnings.push('Demasiados emojis pueden afectar la profesionalidad');
    score -= 3;
  }

  return {
    passed: issues.filter(i => i.severity === 'critical').length === 0,
    score: Math.max(0, score),
    issues,
    warnings,
    recommendations,
  };
}

// ============================================
// 📊 VALIDACIÓN DE LISTA DE DESTINATARIOS
// ============================================

/**
 * Valida la lista de destinatarios antes de enviar
 */
export async function validateRecipientList(
  businessId: string,
  phoneNumbers: string[]
): Promise<ComplianceCheck> {
  const issues: ComplianceIssue[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];
  let score = 100;

  // 1. Verificar opt-outs
  const optOuts = await prisma.whatsAppOptOut.findMany({
    where: {
      businessId,
      phoneNumber: { in: phoneNumbers },
    },
  });

  if (optOuts.length > 0) {
    issues.push({
      code: 'OPT_OUT_INCLUDED',
      severity: 'critical',
      message: `${optOuts.length} número(s) han solicitado no recibir mensajes`,
      suggestion: 'Elimina estos números de la lista antes de enviar',
    });
    score -= 30;
  }

  // 2. Verificar números bloqueados previamente
  const blockedNumbers = await prisma.whatsAppMessage.groupBy({
    by: ['phoneNumber'],
    where: {
      businessId,
      phoneNumber: { in: phoneNumbers },
      status: 'FAILED',
    },
    _count: true,
  });

  if (blockedNumbers.length > 0) {
    issues.push({
      code: 'BLOCKED_NUMBERS',
      severity: 'high',
      message: `${blockedNumbers.length} número(s) han fallado anteriormente`,
      suggestion: 'Revisa estos números antes de enviar',
    });
    score -= 20;
  }

  // 3. Verificar tamaño de la lista vs tier
  const dailyStats = await getDailyMessageStats(businessId);
  const remainingQuota = COMPLIANCE_CONFIG.limits.maxMessagesPerDay - dailyStats.sent;
  
  if (phoneNumbers.length > remainingQuota) {
    issues.push({
      code: 'QUOTA_EXCEEDED',
      severity: 'high',
      message: `La lista (${phoneNumbers.length}) excede tu cuota diaria restante (${remainingQuota})`,
      suggestion: 'Divide la campaña en varios días o reduce la lista',
    });
    score -= 25;
  }

  // 4. Verificar duplicados
  const uniqueNumbers = new Set(phoneNumbers);
  if (uniqueNumbers.size !== phoneNumbers.length) {
    const duplicates = phoneNumbers.length - uniqueNumbers.size;
    warnings.push(`Se encontraron ${duplicates} número(s) duplicados`);
    recommendations.push('Elimina duplicados para evitar envíos múltiples');
    score -= 5;
  }

  // 5. Verificar formato de números
  const invalidFormat = phoneNumbers.filter(p => !isValidPhoneFormat(p));
  if (invalidFormat.length > 0) {
    issues.push({
      code: 'INVALID_PHONE_FORMAT',
      severity: 'medium',
      message: `${invalidFormat.length} número(s) tienen formato inválido`,
      suggestion: 'Verifica que todos los números tengan formato internacional (+593...)',
    });
    score -= 10;
  }

  // 6. Verificar clientes existentes en la base de datos
  const existingClients = await prisma.cliente.count({
    where: {
      businessId,
      telefono: { in: phoneNumbers },
    },
  });

  const notInDb = phoneNumbers.length - existingClients;
  if (notInDb > 0) {
    warnings.push(`${notInDb} número(s) no están registrados como clientes`);
    recommendations.push('Considera registrar estos contactos para mejor seguimiento');
    score -= 5;
  }

  return {
    passed: issues.filter(i => i.severity === 'critical').length === 0,
    score: Math.max(0, score),
    issues,
    warnings,
    recommendations,
  };
}

// ============================================
// ⏰ VALIDACIÓN DE HORARIO
// ============================================

/**
 * Verifica si es horario permitido para enviar
 */
export function isWithinBusinessHours(): boolean {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    hour12: false,
    timeZone: COMPLIANCE_CONFIG.businessHours.timezone,
  };
  
  const currentHour = parseInt(new Intl.DateTimeFormat('en-US', options).format(now));
  
  return currentHour >= COMPLIANCE_CONFIG.businessHours.start && 
         currentHour < COMPLIANCE_CONFIG.businessHours.end;
}

/**
 * Calcula el próximo horario disponible para enviar
 */
export function getNextAvailableTime(): Date {
  const now = new Date();
  const { start, end, timezone } = COMPLIANCE_CONFIG.businessHours;
  
  const formatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    hour12: false,
    timeZone: timezone,
  });
  
  const currentHour = parseInt(formatter.format(now));
  
  if (currentHour < start) {
    // Antes del horario de inicio - esperar hasta hoy
    const nextTime = new Date(now);
    nextTime.setHours(start, 0, 0, 0);
    return nextTime;
  } else if (currentHour >= end) {
    // Después del horario - esperar hasta mañana
    const nextTime = new Date(now);
    nextTime.setDate(nextTime.getDate() + 1);
    nextTime.setHours(start, 0, 0, 0);
    return nextTime;
  }
  
  return now; // Estamos dentro del horario
}

// ============================================
// 📈 MÉTRICAS DE CALIDAD
// ============================================

/**
 * Obtiene las métricas de calidad de un negocio
 */
export async function getQualityScore(businessId: string): Promise<QualityScore> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const messages = await prisma.whatsAppMessage.groupBy({
    by: ['status'],
    where: {
      businessId,
      createdAt: { gte: thirtyDaysAgo },
    },
    _count: true,
  });

  const stats: CampaignMetrics = {
    sent: 0,
    delivered: 0,
    read: 0,
    responded: 0,
    blocked: 0,
    reported: 0,
    failed: 0,
  };

  messages.forEach(m => {
    const status = m.status?.toLowerCase() || '';
    if (status === 'sent') stats.sent = m._count;
    else if (status === 'delivered') stats.delivered = m._count;
    else if (status === 'read') stats.read = m._count;
    else if (status === 'responded') stats.responded = m._count;
    else if (status === 'blocked') stats.blocked = m._count;
    else if (status === 'reported') stats.reported = m._count;
    else if (status === 'failed') stats.failed = m._count;
  });

  const total = stats.sent + stats.delivered + stats.read + stats.responded;
  
  if (total === 0) {
    return {
      overall: 100,
      deliveryRate: 1,
      readRate: 0,
      responseRate: 0,
      blockRate: 0,
      status: 'excellent',
    };
  }

  const deliveryRate = (stats.delivered + stats.read + stats.responded) / total;
  const readRate = (stats.read + stats.responded) / total;
  const responseRate = stats.responded / total;
  const blockRate = stats.blocked / total;

  // Calcular score general
  let overall = 100;
  
  // Penalizar por bloqueos (muy importante)
  if (blockRate > COMPLIANCE_CONFIG.quality.maxBlockRate) {
    overall -= 40;
  } else if (blockRate > COMPLIANCE_CONFIG.quality.warningThreshold) {
    overall -= 20;
  }

  // Bonificar por buena entrega
  overall += deliveryRate * 10;
  
  // Bonificar por respuestas
  overall += responseRate * 20;

  overall = Math.min(100, Math.max(0, overall));

  // Determinar estado
  let status: QualityScore['status'];
  if (blockRate > COMPLIANCE_CONFIG.quality.maxBlockRate) {
    status = 'critical';
  } else if (blockRate > COMPLIANCE_CONFIG.quality.warningThreshold || overall < 60) {
    status = 'warning';
  } else if (overall >= 80) {
    status = 'excellent';
  } else {
    status = 'good';
  }

  return {
    overall: Math.round(overall),
    deliveryRate: Math.round(deliveryRate * 100) / 100,
    readRate: Math.round(readRate * 100) / 100,
    responseRate: Math.round(responseRate * 100) / 100,
    blockRate: Math.round(blockRate * 1000) / 1000,
    status,
  };
}

/**
 * Obtiene estadísticas de envío del día
 */
export async function getDailyMessageStats(businessId: string): Promise<{ sent: number; failed: number }> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const stats = await prisma.whatsAppMessage.aggregate({
    where: {
      businessId,
      createdAt: { gte: today },
    },
    _count: true,
  });

  const failed = await prisma.whatsAppMessage.count({
    where: {
      businessId,
      createdAt: { gte: today },
      status: { in: ['FAILED', 'BLOCKED'] },
    },
  });

  return {
    sent: stats._count || 0,
    failed,
  };
}

// ============================================
// 🚫 GESTIÓN DE OPT-OUT
// ============================================

/**
 * Procesa una solicitud de opt-out
 */
export async function processOptOut(
  businessId: string,
  phone: string,
  method: string = 'MANUAL'
): Promise<boolean> {
  try {
    await prisma.whatsAppOptOut.upsert({
      where: {
        phoneNumber_businessId: { phoneNumber: phone, businessId },
      },
      create: {
        businessId,
        phoneNumber: phone,
        method,
        optedOutAt: new Date(),
      },
      update: {
        method,
        optedOutAt: new Date(),
        optedBackIn: false,
      },
    });

    console.log(`✅ Opt-out procesado: ${phone}`);
    return true;
  } catch (error) {
    console.error('Error procesando opt-out:', error);
    return false;
  }
}

/**
 * Verifica si un mensaje contiene keywords de opt-out
 */
export function isOptOutRequest(message: string): boolean {
  const upperMessage = message.toUpperCase().trim();
  return COMPLIANCE_CONFIG.optIn.optOutKeywords.some(keyword => 
    upperMessage === keyword || upperMessage.startsWith(keyword + ' ')
  );
}

// ============================================
// 🔧 UTILIDADES
// ============================================

/**
 * Valida formato de número telefónico
 */
function isValidPhoneFormat(phone: string): boolean {
  // Formato esperado: +593XXXXXXXXX
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.length >= 10 && cleanPhone.length <= 15;
}

/**
 * Genera un reporte de cumplimiento para una campaña
 */
export async function generateComplianceReport(
  businessId: string,
  campaignId: string
): Promise<{
  campaign: any;
  quality: QualityScore;
  recommendations: string[];
}> {
  const campaign = await prisma.whatsAppCampaign.findUnique({
    where: { id: campaignId },
  });

  const quality = await getQualityScore(businessId);

  const recommendations: string[] = [];

  if (quality.blockRate > 0.01) {
    recommendations.push('Tu tasa de bloqueo está elevada. Considera revisar el contenido de tus mensajes.');
  }

  if (quality.responseRate < 0.05) {
    recommendations.push('Baja tasa de respuesta. Intenta hacer tus mensajes más interactivos.');
  }

  if (quality.readRate < 0.5) {
    recommendations.push('Muchos mensajes no se leen. Prueba enviar en horarios diferentes.');
  }

  return {
    campaign,
    quality,
    recommendations,
  };
}

// ============================================
// 🎯 VALIDACIÓN COMPLETA PRE-CAMPAÑA
// ============================================

/**
 * Ejecuta todas las validaciones antes de enviar una campaña
 */
export async function validateCampaignBeforeSend(
  businessId: string,
  message: string,
  phoneNumbers: string[],
  scheduledTime?: Date
): Promise<{
  canSend: boolean;
  contentCheck: ComplianceCheck;
  recipientCheck: ComplianceCheck;
  qualityScore: QualityScore;
  hourCheck: { allowed: boolean; nextAvailable?: Date };
  summary: string;
}> {
  // 1. Validar contenido
  const contentCheck = validateMessageContent(message);

  // 2. Validar destinatarios
  const recipientCheck = await validateRecipientList(businessId, phoneNumbers);

  // 3. Obtener score de calidad
  const qualityScore = await getQualityScore(businessId);

  // 4. Verificar horario
  const isBusinessHour = scheduledTime 
    ? true // Si está programado, asumimos que el usuario eligió bien
    : isWithinBusinessHours();
  
  const hourCheck = {
    allowed: isBusinessHour,
    nextAvailable: isBusinessHour ? undefined : getNextAvailableTime(),
  };

  // 5. Determinar si puede enviar
  const canSend = 
    contentCheck.passed &&
    recipientCheck.passed &&
    qualityScore.status !== 'critical' &&
    hourCheck.allowed;

  // 6. Generar resumen
  let summary: string;
  if (canSend) {
    summary = `✅ Campaña lista para enviar a ${phoneNumbers.length} destinatarios`;
  } else {
    const blockers: string[] = [];
    if (!contentCheck.passed) blockers.push('contenido del mensaje');
    if (!recipientCheck.passed) blockers.push('lista de destinatarios');
    if (qualityScore.status === 'critical') blockers.push('calidad de cuenta');
    if (!hourCheck.allowed) blockers.push('horario de envío');
    summary = `❌ No se puede enviar. Problemas con: ${blockers.join(', ')}`;
  }

  return {
    canSend,
    contentCheck,
    recipientCheck,
    qualityScore,
    hourCheck,
    summary,
  };
}

const whatsappCompliance = {
  COMPLIANCE_CONFIG,
  validateMessageContent,
  validateRecipientList,
  isWithinBusinessHours,
  getNextAvailableTime,
  getQualityScore,
  getDailyMessageStats,
  processOptOut,
  isOptOutRequest,
  generateComplianceReport,
  validateCampaignBeforeSend,
};

export default whatsappCompliance;
