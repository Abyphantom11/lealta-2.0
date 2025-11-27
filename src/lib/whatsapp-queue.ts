/**
 * 📬 SERVICIO DE COLA DE MENSAJES WHATSAPP
 * Sistema de procesamiento asíncrono con retry y backoff exponencial
 */

import { prisma } from '@/lib/prisma';
import { enviarMensajeWhatsApp, personalizarMensaje } from '@/lib/whatsapp';

// Configuración de la cola
const QUEUE_CONFIG = {
  maxRetries: 3,
  baseDelayMs: 1000,       // 1 segundo base
  maxDelayMs: 60000,       // 60 segundos máximo
  batchSize: 10,           // Mensajes por lote
  batchDelayMs: 5000,      // 5 segundos entre lotes
  rateLimitPerMinute: 30,  // Límite de tasa por minuto
};

// Estado de la cola en memoria
interface QueueState {
  isProcessing: boolean;
  currentJobId: string | null;
  processedCount: number;
  failedCount: number;
  startedAt: Date | null;
}

const queueState: QueueState = {
  isProcessing: false,
  currentJobId: null,
  processedCount: 0,
  failedCount: 0,
  startedAt: null,
};

// Tipo para mensaje en cola
interface QueuedMessage {
  id: string;
  phoneNumber: string;
  message: string;
  variables: Record<string, any>;
  retryCount: number;
  priority: number;
  clienteId?: string;
  campaignId?: string;
}

/**
 * Calcular delay con backoff exponencial
 */
function calculateBackoffDelay(retryCount: number): number {
  const delay = QUEUE_CONFIG.baseDelayMs * Math.pow(2, retryCount);
  // Agregar jitter (±20%) para evitar thundering herd
  const jitter = delay * 0.2 * (Math.random() - 0.5);
  return Math.min(delay + jitter, QUEUE_CONFIG.maxDelayMs);
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Procesar un mensaje individual con retry
 */
async function processMessageWithRetry(message: QueuedMessage): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
  retriesUsed: number;
}> {
  let lastError: string = '';
  
  for (let attempt = 0; attempt <= QUEUE_CONFIG.maxRetries; attempt++) {
    try {
      // Log del intento
      console.log(`📤 Intento ${attempt + 1}/${QUEUE_CONFIG.maxRetries + 1} para ${message.phoneNumber}`);

      // Personalizar mensaje
      const personalizedMessage = personalizarMensaje(message.message, message.variables);
      
      // Enviar mensaje
      const result = await enviarMensajeWhatsApp(message.phoneNumber, personalizedMessage);
      
      if (result.success) {
        return {
          success: true,
          messageId: result.messageId,
          retriesUsed: attempt,
        };
      }
      
      lastError = result.error || 'Error desconocido';
      
      // No reintentar errores permanentes
      if (isPermanentError(lastError)) {
        console.log(`🚫 Error permanente, no reintentando: ${lastError}`);
        break;
      }
      
    } catch (error: any) {
      lastError = error.message || 'Error de conexión';
    }
    
    // Backoff antes del siguiente intento
    if (attempt < QUEUE_CONFIG.maxRetries) {
      const backoffDelay = calculateBackoffDelay(attempt);
      console.log(`⏳ Esperando ${backoffDelay}ms antes del siguiente intento...`);
      await sleep(backoffDelay);
    }
  }
  
  return {
    success: false,
    error: lastError,
    retriesUsed: QUEUE_CONFIG.maxRetries,
  };
}

/**
 * Determinar si un error es permanente (no vale la pena reintentar)
 */
function isPermanentError(error: string): boolean {
  const permanentErrors = [
    'número inválido',
    'número no registrado',
    'opt-out',
    'bloqueado',
    'invalid phone',
    'unregistered',
    'blocked',
    'recipient not in whitelist',
  ];
  
  const lowerError = error.toLowerCase();
  return permanentErrors.some(pe => lowerError.includes(pe));
}

/**
 * Agregar mensajes a la cola de la base de datos
 */
export async function addToQueue(
  messages: Array<{
    phoneNumber: string;
    message: string;
    variables: Record<string, any>;
    clienteId?: string;
    priority?: number;
  }>,
  campaignId?: string,
  businessId?: string,
  accountId?: string
): Promise<{ queuedCount: number; queueId: string }> {
  // Crear o usar una cola existente
  const queue = await prisma.whatsAppQueue.create({
    data: {
      businessId: businessId || '',
      accountId: accountId || 'default',
      name: `Cola ${new Date().toISOString()}`,
      status: 'SCHEDULED',
      totalMessages: messages.length,
      priority: 5,
      audienceFilters: {}, // Filtros vacíos por defecto
    },
  });
  
  // Crear jobs para cada mensaje (usando nombres correctos del schema)
  const jobs = messages.map((msg) => ({
    queueId: queue.id,
    targetPhone: msg.phoneNumber,
    messageContent: msg.message,
    variables: msg.variables,
    targetClientId: msg.clienteId,
    status: 'PENDING',
    priority: msg.priority || 5,
    attempts: 0,
  }));
  
  await prisma.whatsAppQueueJob.createMany({
    data: jobs,
  });
  
  console.log(`📥 ${messages.length} mensajes agregados a la cola ${queue.id}`);
  
  return {
    queuedCount: messages.length,
    queueId: queue.id,
  };
}

/**
 * Procesar cola de mensajes
 */
export async function processQueue(
  queueId: string,
  onProgress?: (progress: {
    processed: number;
    total: number;
    successful: number;
    failed: number;
  }) => void
): Promise<{
  total: number;
  successful: number;
  failed: number;
  errors: string[];
}> {
  // Evitar procesamiento concurrente
  if (queueState.isProcessing) {
    throw new Error('Ya hay un procesamiento de cola en curso');
  }
  
  queueState.isProcessing = true;
  queueState.currentJobId = queueId;
  queueState.processedCount = 0;
  queueState.failedCount = 0;
  queueState.startedAt = new Date();
  
  const errors: string[] = [];
  let successful = 0;
  let failed = 0;
  
  try {
    // Actualizar estado de la cola
    await prisma.whatsAppQueue.update({
      where: { id: queueId },
      data: { status: 'PROCESSING', startedAt: new Date() },
    });
    
    // Obtener trabajos pendientes (usando nombres correctos del schema)
    const jobs = await prisma.whatsAppQueueJob.findMany({
      where: {
        queueId,
        status: { in: ['PENDING', 'FAILED'] },
        attempts: { lt: QUEUE_CONFIG.maxRetries },
      },
      orderBy: [
        { priority: 'desc' },
        { scheduledAt: 'asc' },
      ],
    });
    
    const total = jobs.length;
    let processed = 0;
    
    // Procesar en lotes
    for (let i = 0; i < jobs.length; i += QUEUE_CONFIG.batchSize) {
      const batch = jobs.slice(i, i + QUEUE_CONFIG.batchSize);
      
      for (const job of batch) {
        // Verificar si la cola fue pausada
        const currentQueue = await prisma.whatsAppQueue.findUnique({
          where: { id: queueId },
          select: { status: true },
        });
        
        if (currentQueue?.status === 'PAUSED') {
          console.log('⏸️ Cola pausada, deteniendo procesamiento');
          break;
        }
        
        // Procesar mensaje (usando nombres correctos del schema)
        const result = await processMessageWithRetry({
          id: job.id,
          phoneNumber: job.targetPhone,
          message: job.messageContent,
          variables: job.variables as Record<string, any>,
          retryCount: job.attempts,
          priority: job.priority,
          clienteId: job.targetClientId || undefined,
          campaignId: undefined,
        });
        
        processed++;
        
        // Actualizar job en la BD (usando nombres correctos del schema)
        await prisma.whatsAppQueueJob.update({
          where: { id: job.id },
          data: {
            status: result.success ? 'COMPLETED' : 'FAILED',
            completedAt: result.success ? new Date() : undefined,
            failedAt: !result.success ? new Date() : undefined,
            twilioSid: result.messageId,
            lastError: result.error,
            attempts: job.attempts + result.retriesUsed + 1,
          },
        });
        
        if (result.success) {
          successful++;
        } else {
          failed++;
          errors.push(`${job.targetPhone}: ${result.error}`);
        }
        
        // Notificar progreso
        if (onProgress) {
          onProgress({ processed, total, successful, failed });
        }
        
        queueState.processedCount = successful;
        queueState.failedCount = failed;
        
        // Rate limiting entre mensajes
        await sleep(QUEUE_CONFIG.baseDelayMs);
      }
      
      // Pausa entre lotes
      if (i + QUEUE_CONFIG.batchSize < jobs.length) {
        console.log(`⏳ Pausa entre lotes: ${QUEUE_CONFIG.batchDelayMs}ms`);
        await sleep(QUEUE_CONFIG.batchDelayMs);
      }
    }
    
    // Actualizar estado final de la cola
    const finalStatus = failed === total ? 'FAILED' : 'COMPLETED';
    await prisma.whatsAppQueue.update({
      where: { id: queueId },
      data: {
        status: finalStatus,
        completedAt: new Date(),
        sentMessages: successful,
        failedMessages: failed,
      },
    });
    
    console.log(`✅ Cola ${queueId} procesada: ${successful} exitosos, ${failed} fallidos`);
    
    return { total, successful, failed, errors };
    
  } finally {
    queueState.isProcessing = false;
    queueState.currentJobId = null;
  }
}

/**
 * Pausar cola en procesamiento
 */
export async function pauseQueue(queueId: string): Promise<void> {
  await prisma.whatsAppQueue.update({
    where: { id: queueId },
    data: { status: 'PAUSED' },
  });
  console.log(`⏸️ Cola ${queueId} pausada`);
}

/**
 * Reanudar cola pausada
 */
export async function resumeQueue(queueId: string): Promise<void> {
  await prisma.whatsAppQueue.update({
    where: { id: queueId },
    data: { status: 'SCHEDULED' },
  });
  console.log(`▶️ Cola ${queueId} reanudada`);
}

/**
 * Obtener estado actual de la cola
 */
export function getQueueState(): QueueState {
  return { ...queueState };
}

/**
 * Obtener estadísticas de una cola
 */
export async function getQueueStats(queueId: string) {
  const queue = await prisma.whatsAppQueue.findUnique({
    where: { id: queueId },
    include: {
      _count: {
        select: {
          QueueJobs: true,
        },
      },
    },
  });
  
  if (!queue) return null;
  
  const jobStats = await prisma.whatsAppQueueJob.groupBy({
    by: ['status'],
    where: { queueId },
    _count: true,
  });
  
  const statusCounts = jobStats.reduce((acc, curr) => {
    acc[curr.status] = curr._count;
    return acc;
  }, {} as Record<string, number>);
  
  return {
    queue,
    stats: {
      total: queue._count.QueueJobs,
      pending: statusCounts['PENDING'] || 0,
      processing: statusCounts['PROCESSING'] || 0,
      completed: statusCounts['COMPLETED'] || 0,
      failed: statusCounts['FAILED'] || 0,
    },
  };
}

/**
 * Reintentar trabajos fallidos de una cola
 */
export async function retryFailedJobs(queueId: string): Promise<number> {
  const result = await prisma.whatsAppQueueJob.updateMany({
    where: {
      queueId,
      status: 'FAILED',
      attempts: { lt: QUEUE_CONFIG.maxRetries },
    },
    data: {
      status: 'PENDING',
    },
  });
  
  console.log(`🔄 ${result.count} trabajos marcados para reintento`);
  return result.count;
}

const whatsappQueue = {
  addToQueue,
  processQueue,
  pauseQueue,
  resumeQueue,
  getQueueState,
  getQueueStats,
  retryFailedJobs,
};

export default whatsappQueue;
