/**
 * 📦 WHATSAPP BATCH SENDER
 * Sistema de envío por lotes con control de velocidad
 * 
 * Características:
 * - Envío en lotes configurables (ej: 10 mensajes por lote)
 * - Delay entre lotes (ej: 3 minutos)
 * - Monitoreo en tiempo real del progreso
 * - Pausar/Reanudar/Cancelar campaña
 * - Persistencia de estado para recuperación
 */

import { prisma } from '@/lib/prisma';
import { enviarMensajeWhatsApp } from '@/lib/whatsapp';

// ============================================
// 📋 TIPOS E INTERFACES
// ============================================

export interface BatchConfig {
  batchSize: number;        // Mensajes por lote (default: 10)
  delayBetweenBatches: number; // Milisegundos entre lotes (default: 180000 = 3 min)
  delayBetweenMessages: number; // Milisegundos entre mensajes dentro del lote (default: 1000 = 1 seg)
  maxRetries: number;       // Reintentos por mensaje fallido
  retryDelay: number;       // Delay antes de reintentar
}

export interface BatchRecipient {
  id: string;
  phoneNumber: string;
  name: string;
  variables?: Record<string, any>;
}

export interface BatchCampaign {
  id: string;
  businessId: string;
  name: string;
  recipients: BatchRecipient[];
  message: string;
  templateId?: string;
  config: BatchConfig;
  status: 'PENDING' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'CANCELLED' | 'FAILED';
  progress: BatchProgress;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface BatchProgress {
  totalRecipients: number;
  totalBatches: number;
  currentBatch: number;
  sent: number;
  failed: number;
  pending: number;
  currentBatchProgress: number;
  estimatedTimeRemaining: number; // segundos
  lastUpdated: Date;
}

export interface BatchResult {
  recipient: BatchRecipient;
  success: boolean;
  messageId?: string;
  error?: string;
  sentAt: Date;
  attempts: number;
}

// ============================================
// 🎯 CONFIGURACIÓN POR DEFECTO
// ============================================

export const DEFAULT_BATCH_CONFIG: BatchConfig = {
  batchSize: 10,                    // 10 mensajes por lote
  delayBetweenBatches: 3 * 60 * 1000, // 3 minutos entre lotes
  delayBetweenMessages: 1000,       // 1 segundo entre mensajes
  maxRetries: 2,                    // 2 reintentos
  retryDelay: 5000,                 // 5 segundos antes de reintentar
};

// Configuraciones predefinidas según el tier
export const BATCH_PRESETS = {
  // Conservador: Para cuentas nuevas o sandbox
  CONSERVATIVE: {
    batchSize: 5,
    delayBetweenBatches: 5 * 60 * 1000, // 5 minutos
    delayBetweenMessages: 2000,
    maxRetries: 3,
    retryDelay: 10000,
  },
  // Normal: Para cuentas verificadas
  NORMAL: {
    batchSize: 10,
    delayBetweenBatches: 3 * 60 * 1000, // 3 minutos
    delayBetweenMessages: 1000,
    maxRetries: 2,
    retryDelay: 5000,
  },
  // Agresivo: Para cuentas con alto volumen aprobado
  AGGRESSIVE: {
    batchSize: 20,
    delayBetweenBatches: 2 * 60 * 1000, // 2 minutos
    delayBetweenMessages: 500,
    maxRetries: 1,
    retryDelay: 3000,
  },
};

// ============================================
// 🏭 CLASE PRINCIPAL: BATCH CAMPAIGN MANAGER
// ============================================

export class BatchCampaignManager {
  private campaigns: Map<string, BatchCampaign> = new Map();
  private runningCampaigns: Map<string, AbortController> = new Map();
  private listeners: Map<string, ((progress: BatchProgress) => void)[]> = new Map();

  /**
   * Crear una nueva campaña por lotes
   */
  async createCampaign(
    businessId: string,
    name: string,
    recipients: BatchRecipient[],
    message: string,
    config: Partial<BatchConfig> = {},
    templateId?: string
  ): Promise<BatchCampaign> {
    const finalConfig = { ...DEFAULT_BATCH_CONFIG, ...config };
    const totalBatches = Math.ceil(recipients.length / finalConfig.batchSize);

    const campaign: BatchCampaign = {
      id: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      businessId,
      name,
      recipients,
      message,
      templateId,
      config: finalConfig,
      status: 'PENDING',
      progress: {
        totalRecipients: recipients.length,
        totalBatches,
        currentBatch: 0,
        sent: 0,
        failed: 0,
        pending: recipients.length,
        currentBatchProgress: 0,
        estimatedTimeRemaining: this.calculateEstimatedTime(recipients.length, finalConfig),
        lastUpdated: new Date(),
      },
      createdAt: new Date(),
    };

    // Guardar en base de datos
    await this.saveCampaignToDB(campaign);
    this.campaigns.set(campaign.id, campaign);

    console.log(`📦 Campaña por lotes creada: ${campaign.id}`);
    console.log(`   📊 ${recipients.length} destinatarios en ${totalBatches} lotes`);
    console.log(`   ⏱️ Tiempo estimado: ${Math.round(campaign.progress.estimatedTimeRemaining / 60)} minutos`);

    return campaign;
  }

  /**
   * Iniciar una campaña
   */
  async startCampaign(campaignId: string): Promise<void> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) {
      throw new Error(`Campaña no encontrada: ${campaignId}`);
    }

    if (campaign.status === 'RUNNING') {
      throw new Error('La campaña ya está en ejecución');
    }

    const abortController = new AbortController();
    this.runningCampaigns.set(campaignId, abortController);

    campaign.status = 'RUNNING';
    campaign.startedAt = new Date();
    await this.updateCampaignInDB(campaign);

    console.log(`🚀 Iniciando campaña: ${campaign.name}`);

    // Ejecutar en segundo plano
    this.processCampaign(campaign, abortController.signal).catch(error => {
      console.error(`❌ Error en campaña ${campaignId}:`, error);
      campaign.status = 'FAILED';
      this.updateCampaignInDB(campaign);
    });
  }

  /**
   * Pausar una campaña
   */
  async pauseCampaign(campaignId: string): Promise<void> {
    const campaign = this.campaigns.get(campaignId);
    const controller = this.runningCampaigns.get(campaignId);

    if (!campaign || campaign.status !== 'RUNNING') {
      throw new Error('No hay campaña en ejecución para pausar');
    }

    controller?.abort();
    campaign.status = 'PAUSED';
    await this.updateCampaignInDB(campaign);

    console.log(`⏸️ Campaña pausada: ${campaignId}`);
  }

  /**
   * Reanudar una campaña pausada
   */
  async resumeCampaign(campaignId: string): Promise<void> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign || campaign.status !== 'PAUSED') {
      throw new Error('No hay campaña pausada para reanudar');
    }

    await this.startCampaign(campaignId);
    console.log(`▶️ Campaña reanudada: ${campaignId}`);
  }

  /**
   * Cancelar una campaña
   */
  async cancelCampaign(campaignId: string): Promise<void> {
    const campaign = this.campaigns.get(campaignId);
    const controller = this.runningCampaigns.get(campaignId);

    if (!campaign) {
      throw new Error(`Campaña no encontrada: ${campaignId}`);
    }

    controller?.abort();
    campaign.status = 'CANCELLED';
    campaign.completedAt = new Date();
    await this.updateCampaignInDB(campaign);

    console.log(`🛑 Campaña cancelada: ${campaignId}`);
  }

  /**
   * Obtener el estado actual de una campaña
   */
  getCampaignStatus(campaignId: string): BatchCampaign | undefined {
    return this.campaigns.get(campaignId);
  }

  /**
   * Suscribirse a actualizaciones de progreso
   */
  onProgress(campaignId: string, callback: (progress: BatchProgress) => void): () => void {
    if (!this.listeners.has(campaignId)) {
      this.listeners.set(campaignId, []);
    }
    this.listeners.get(campaignId)!.push(callback);

    // Retornar función para cancelar suscripción
    return () => {
      const listeners = this.listeners.get(campaignId);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  // ============================================
  // 🔧 MÉTODOS PRIVADOS
  // ============================================

  /**
   * Procesar la campaña por lotes
   */
  private async processCampaign(
    campaign: BatchCampaign,
    signal: AbortSignal
  ): Promise<void> {
    const { recipients, config, message } = campaign;
    const results: BatchResult[] = [];

    // Dividir en lotes
    const batches = this.chunkArray(recipients, config.batchSize);
    
    console.log(`📦 Procesando ${batches.length} lotes de ${config.batchSize} mensajes`);

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      // Verificar si fue cancelado/pausado
      if (signal.aborted) {
        console.log('⏹️ Campaña detenida por señal de aborto');
        return;
      }

      const batch = batches[batchIndex];
      campaign.progress.currentBatch = batchIndex + 1;
      campaign.progress.currentBatchProgress = 0;

      console.log(`\n📤 Procesando lote ${batchIndex + 1}/${batches.length} (${batch.length} mensajes)`);

      // Procesar cada mensaje del lote
      for (let msgIndex = 0; msgIndex < batch.length; msgIndex++) {
        if (signal.aborted) return;

        const recipient = batch[msgIndex];
        const result = await this.sendWithRetry(recipient, message, config);
        results.push(result);

        // Actualizar progreso
        if (result.success) {
          campaign.progress.sent++;
        } else {
          campaign.progress.failed++;
        }
        campaign.progress.pending--;
        campaign.progress.currentBatchProgress = ((msgIndex + 1) / batch.length) * 100;
        campaign.progress.estimatedTimeRemaining = this.calculateRemainingTime(campaign);
        campaign.progress.lastUpdated = new Date();

        // Notificar listeners
        this.notifyListeners(campaign.id, campaign.progress);

        // Delay entre mensajes
        if (msgIndex < batch.length - 1) {
          await this.delay(config.delayBetweenMessages);
        }
      }

      // Guardar resultados parciales
      await this.saveBatchResults(campaign.id, results.slice(-batch.length));
      await this.updateCampaignInDB(campaign);

      // Delay entre lotes (excepto después del último)
      if (batchIndex < batches.length - 1) {
        const delayMinutes = Math.round(config.delayBetweenBatches / 60000);
        console.log(`⏳ Esperando ${delayMinutes} minutos antes del siguiente lote...`);
        
        // Esperar con verificación periódica de cancelación
        const checkInterval = 5000; // Verificar cada 5 segundos
        let waited = 0;
        while (waited < config.delayBetweenBatches && !signal.aborted) {
          await this.delay(Math.min(checkInterval, config.delayBetweenBatches - waited));
          waited += checkInterval;
        }
      }
    }

    // Campaña completada
    campaign.status = 'COMPLETED';
    campaign.completedAt = new Date();
    campaign.progress.estimatedTimeRemaining = 0;
    await this.updateCampaignInDB(campaign);

    console.log(`\n✅ Campaña completada: ${campaign.name}`);
    console.log(`   📊 Enviados: ${campaign.progress.sent}/${campaign.progress.totalRecipients}`);
    console.log(`   ❌ Fallidos: ${campaign.progress.failed}`);
    console.log(`   📈 Tasa de éxito: ${Math.round((campaign.progress.sent / campaign.progress.totalRecipients) * 100)}%`);

    // Notificar finalización
    this.notifyListeners(campaign.id, campaign.progress);
  }

  /**
   * Enviar mensaje con reintentos
   */
  private async sendWithRetry(
    recipient: BatchRecipient,
    messageTemplate: string,
    config: BatchConfig
  ): Promise<BatchResult> {
    let attempts = 0;
    let lastError = '';

    // Procesar variables en el mensaje
    let personalizedMessage = messageTemplate;
    if (recipient.variables) {
      Object.entries(recipient.variables).forEach(([key, value]) => {
        personalizedMessage = personalizedMessage.replace(
          new RegExp(`{{${key}}}`, 'g'),
          String(value)
        );
      });
    }
    // Reemplazar nombre
    personalizedMessage = personalizedMessage.replace(/{{nombre}}/g, recipient.name);

    while (attempts <= config.maxRetries) {
      attempts++;

      try {
        const result = await enviarMensajeWhatsApp(
          recipient.phoneNumber,
          personalizedMessage
        );

        if (result.success) {
          console.log(`  ✅ [${attempts}/${config.maxRetries + 1}] Enviado a ${recipient.name}`);
          return {
            recipient,
            success: true,
            messageId: result.messageId,
            sentAt: new Date(),
            attempts,
          };
        } else {
          lastError = result.error || 'Error desconocido';
          console.log(`  ⚠️ [${attempts}/${config.maxRetries + 1}] Fallo: ${lastError}`);
        }
      } catch (error: any) {
        lastError = error.message || 'Error de conexión';
        console.log(`  ❌ [${attempts}/${config.maxRetries + 1}] Error: ${lastError}`);
      }

      // Delay antes de reintentar
      if (attempts <= config.maxRetries) {
        await this.delay(config.retryDelay);
      }
    }

    return {
      recipient,
      success: false,
      error: lastError,
      sentAt: new Date(),
      attempts,
    };
  }

  /**
   * Calcular tiempo estimado inicial
   */
  private calculateEstimatedTime(totalRecipients: number, config: BatchConfig): number {
    const totalBatches = Math.ceil(totalRecipients / config.batchSize);
    // Tiempo total = (mensajes * delay entre mensajes) + (lotes-1 * delay entre lotes)
    return ((totalBatches - 1) * config.delayBetweenBatches + totalRecipients * config.delayBetweenMessages) / 1000;
  }

  /**
   * Calcular tiempo restante
   */
  private calculateRemainingTime(campaign: BatchCampaign): number {
    const { progress, config } = campaign;
    const remainingMessages = progress.pending;
    const remainingBatches = Math.ceil(remainingMessages / config.batchSize);
    
    const timeForMessages = remainingMessages * config.delayBetweenMessages;
    const timeForDelays = (remainingBatches - 1) * config.delayBetweenBatches;
    
    return (timeForMessages + timeForDelays) / 1000;
  }

  /**
   * Dividir array en chunks
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Notificar a los listeners
   */
  private notifyListeners(campaignId: string, progress: BatchProgress): void {
    const listeners = this.listeners.get(campaignId);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(progress);
        } catch (error) {
          console.error('Error notificando listener:', error);
        }
      });
    }
  }

  // ============================================
  // 💾 PERSISTENCIA EN BASE DE DATOS
  // ============================================

  /**
   * Guardar campaña en BD
   */
  private async saveCampaignToDB(campaign: BatchCampaign): Promise<void> {
    try {
      await prisma.whatsAppCampaign.create({
        data: {
          id: campaign.id,
          businessId: campaign.businessId,
          name: campaign.name,
          templateId: campaign.templateId || null,
          customMessage: campaign.message,
          status: campaign.status,
          totalTargeted: campaign.progress.totalRecipients,
          filters: JSON.parse(JSON.stringify({
            batchConfig: campaign.config,
            recipients: campaign.recipients.map(r => r.id),
          })),
          variables: {},
        },
      });
    } catch (error) {
      console.error('Error guardando campaña en BD:', error);
    }
  }

  /**
   * Actualizar campaña en BD
   */
  private async updateCampaignInDB(campaign: BatchCampaign): Promise<void> {
    try {
      await prisma.whatsAppCampaign.update({
        where: { id: campaign.id },
        data: {
          status: campaign.status,
          totalSent: campaign.progress.sent,
          totalFailed: campaign.progress.failed,
          startedAt: campaign.startedAt,
          completedAt: campaign.completedAt,
        },
      });
    } catch (error) {
      console.error('Error actualizando campaña en BD:', error);
    }
  }

  /**
   * Guardar resultados de lote
   */
  private async saveBatchResults(campaignId: string, results: BatchResult[]): Promise<void> {
    try {
      const campaign = this.campaigns.get(campaignId);
      if (!campaign) return;

      await prisma.whatsAppMessage.createMany({
        data: results.map(result => ({
          campaignId,
          businessId: campaign.businessId,
          clienteId: result.recipient.id,
          phoneNumber: result.recipient.phoneNumber,
          customMessage: campaign.message,
          status: result.success ? 'SENT' : 'FAILED',
          twilioMessageId: result.messageId || null,
          errorMessage: result.error || null,
          sentAt: result.sentAt,
          priority: 'MEDIUM',
        })),
        skipDuplicates: true,
      });
    } catch (error) {
      console.error('Error guardando resultados de lote:', error);
    }
  }
}

// ============================================
// 📊 SINGLETON INSTANCE
// ============================================

export const batchCampaignManager = new BatchCampaignManager();

// ============================================
// 🛠️ FUNCIONES HELPER
// ============================================

/**
 * Formatear tiempo restante en texto legible
 */
export function formatTimeRemaining(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)} segundos`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${minutes}m ${secs}s`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.round((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
}

/**
 * Calcular configuración recomendada según cantidad de destinatarios
 */
export function getRecommendedConfig(recipientCount: number): {
  preset: keyof typeof BATCH_PRESETS;
  config: BatchConfig;
  estimatedTime: string;
  explanation: string;
} {
  let preset: keyof typeof BATCH_PRESETS;
  let explanation: string;

  if (recipientCount <= 50) {
    preset = 'CONSERVATIVE';
    explanation = 'Lotes pequeños para evitar bloqueos en cuentas nuevas';
  } else if (recipientCount <= 500) {
    preset = 'NORMAL';
    explanation = 'Balance entre velocidad y seguridad';
  } else {
    preset = 'AGGRESSIVE';
    explanation = 'Mayor velocidad para grandes volúmenes (requiere cuenta verificada)';
  }

  const config = BATCH_PRESETS[preset];
  const totalBatches = Math.ceil(recipientCount / config.batchSize);
  const totalSeconds = 
    (recipientCount * config.delayBetweenMessages / 1000) +
    ((totalBatches - 1) * config.delayBetweenBatches / 1000);

  return {
    preset,
    config,
    estimatedTime: formatTimeRemaining(totalSeconds),
    explanation,
  };
}
