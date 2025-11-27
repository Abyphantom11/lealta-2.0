import { prisma } from '@/lib/prisma'
import { enviarMensaje } from '@/lib/whatsapp'

interface QueueWorkerOptions {
  workerName: string
  businessId?: string
  maxJobs?: number
  delayBetweenJobs?: number
  heartbeatInterval?: number
}

export class WhatsAppQueueWorker {
  private workerName: string
  private businessId?: string
  private maxJobs: number
  private delayBetweenJobs: number
  private heartbeatInterval: number
  private isRunning: boolean = false
  private heartbeatTimer?: NodeJS.Timeout
  private processTimer?: NodeJS.Timeout

  constructor(options: QueueWorkerOptions) {
    this.workerName = options.workerName
    this.businessId = options.businessId
    this.maxJobs = options.maxJobs || 100
    this.delayBetweenJobs = options.delayBetweenJobs || 1000 // 1 segundo
    this.heartbeatInterval = options.heartbeatInterval || 30000 // 30 segundos
  }

  async start() {
    if (this.isRunning) {
      console.log(`Worker ${this.workerName} ya está ejecutándose`)
      return
    }

    console.log(`🚀 Iniciando worker ${this.workerName}...`)
    this.isRunning = true

    // Registrar worker en base de datos
    await this.registerWorker()

    // Iniciar heartbeat
    this.startHeartbeat()

    // Iniciar procesamiento de trabajos
    this.startProcessing()
  }

  async stop() {
    if (!this.isRunning) {
      return
    }

    console.log(`🛑 Deteniendo worker ${this.workerName}...`)
    this.isRunning = false

    // Limpiar timers
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
    }
    if (this.processTimer) {
      clearTimeout(this.processTimer)
    }

    // Actualizar estado en base de datos
    await this.updateWorkerStatus('OFFLINE')
  }

  private async registerWorker() {
    try {
      await prisma.whatsAppWorkerStatus.upsert({
        where: { workerName: this.workerName },
        update: {
          status: 'IDLE',
          businessId: this.businessId,
          lastHeartbeat: new Date(),
          errorCount: 0,
          lastError: null
        },
        create: {
          workerName: this.workerName,
          businessId: this.businessId,
          status: 'IDLE',
          lastHeartbeat: new Date()
        }
      })
    } catch (error) {
      console.error(`Error registrando worker ${this.workerName}:`, error)
    }
  }

  private startHeartbeat() {
    this.heartbeatTimer = setInterval(async () => {
      try {
        await prisma.whatsAppWorkerStatus.update({
          where: { workerName: this.workerName },
          data: { 
            lastHeartbeat: new Date(),
            memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
            cpuUsage: process.cpuUsage().system / 1000000 // %
          }
        })
      } catch (error) {
        console.error(`Error en heartbeat del worker ${this.workerName}:`, error)
      }
    }, this.heartbeatInterval)
  }

  private startProcessing() {
    const processNext = async () => {
      if (!this.isRunning) {
        return
      }

      try {
        const job = await this.getNextJob()
        
        if (job) {
          await this.processJob(job)
        }
      } catch (error) {
        console.error(`Error en procesamiento del worker ${this.workerName}:`, error)
        await this.handleWorkerError(error)
      }

      // Programar siguiente procesamiento
      if (this.isRunning) {
        this.processTimer = setTimeout(processNext, this.delayBetweenJobs)
      }
    }

    // Iniciar procesamiento
    processNext()
  }

  private async getNextJob() {
    const where: any = {
      status: 'PENDING',
      processAt: {
        lte: new Date()
      },
      attempts: {
        lt: 3 // Máximo 3 intentos
      }
    }

    // Filtrar por negocio específico si está configurado
    if (this.businessId) {
      where.Queue = {
        businessId: this.businessId
      }
    }

    return await prisma.whatsAppQueueJob.findFirst({
      where,
      orderBy: [
        { priority: 'desc' },
        { scheduledAt: 'asc' }
      ],
      include: {
        Queue: {
          include: {
            WhatsAppAccount: true
          }
        }
      }
    })
  }

  private async processJob(job: any) {
    const jobId = job.id
    
    try {
      // Marcar trabajo como en procesamiento
      await this.updateWorkerStatus('BUSY', job.Queue.id, jobId)
      
      await prisma.whatsAppQueueJob.update({
        where: { id: jobId },
        data: {
          status: 'PROCESSING',
          startedAt: new Date(),
          attempts: job.attempts + 1,
          lastAttemptAt: new Date()
        }
      })

      console.log(`📤 Procesando trabajo ${jobId}: ${job.targetPhone}`)

      // Verificar rate limits
      const canSend = await this.checkRateLimit(job.Queue.businessId, job.Queue.accountId)
      if (!canSend) {
        // Reprogramar para más tarde
        await prisma.whatsAppQueueJob.update({
          where: { id: jobId },
          data: {
            status: 'PENDING',
            processAt: new Date(Date.now() + 3600000), // 1 hora más tarde
            lastError: 'Rate limit excedido'
          }
        })
        return
      }

      // Verificar opt-out
      const isOptedOut = await this.checkOptOut(job.Queue.businessId, job.targetPhone)
      if (isOptedOut) {
        await prisma.whatsAppQueueJob.update({
          where: { id: jobId },
          data: {
            status: 'FAILED',
            failedAt: new Date(),
            lastError: 'Cliente ha hecho opt-out'
          }
        })
        return
      }

      // Enviar mensaje
      const result = await enviarMensaje({
        phoneNumber: job.targetPhone,
        message: job.messageContent,
        accountSid: job.Queue.WhatsAppAccount.twilioAccountSid,
        authToken: job.Queue.WhatsAppAccount.twilioAuthToken
      })

      // Crear registro de mensaje
      const message = await prisma.whatsAppMessage.create({
        data: {
          businessId: job.Queue.businessId,
          accountId: job.Queue.accountId,
          clienteId: job.targetClientId,
          phoneNumber: job.targetPhone,
          templateId: job.Queue.templateId,
          customMessage: job.messageContent,
          variables: job.variables,
          status: 'SENT',
          twilioSid: result.sid,
          sentAt: new Date(),
          cost: job.cost || 0.055
        }
      })

      // Marcar trabajo como completado
      await prisma.whatsAppQueueJob.update({
        where: { id: jobId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          twilioSid: result.sid,
          messageId: message.id
        }
      })

      // Actualizar estadísticas del worker
      await this.updateWorkerStats(true)

      // Actualizar estadísticas de la cola
      await this.updateQueueStats(job.Queue.id)

      console.log(`✅ Trabajo ${jobId} completado exitosamente`)

    } catch (error) {
      console.error(`❌ Error procesando trabajo ${jobId}:`, error)
      
      // Determinar si reintentar
      const shouldRetry = job.attempts < job.maxAttempts
      const nextAttempt = shouldRetry
        ? new Date(Date.now() + (job.Queue.retryDelayMinutes * 60 * 1000))
        : null

      await prisma.whatsAppQueueJob.update({
        where: { id: jobId },
        data: {
          status: shouldRetry ? 'RETRYING' : 'FAILED',
          failedAt: shouldRetry ? null : new Date(),
          nextAttemptAt: nextAttempt,
          processAt: nextAttempt || new Date(),
          lastError: error instanceof Error ? error.message : 'Error desconocido',
          errorCount: job.errorCount + 1
        }
      })

      await this.updateWorkerStats(false)
    } finally {
      // Volver a estado IDLE
      await this.updateWorkerStatus('IDLE')
    }
  }

  private async checkRateLimit(businessId: string, accountId: string): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0]
    
    // Obtener límites de la cuenta
    const account = await prisma.whatsAppAccount.findUnique({
      where: { id: accountId }
    })

    if (!account) return false

    // Verificar uso diario
    const dailyUsage = await prisma.whatsAppRateLimit.findUnique({
      where: {
        businessId_date: {
          businessId,
          date: today
        }
      }
    })

    const usedToday = dailyUsage?.messagesCount || 0
    return usedToday < account.maxDailyMessages
  }

  private async checkOptOut(businessId: string, phoneNumber: string): Promise<boolean> {
    const optOut = await prisma.whatsAppOptOut.findUnique({
      where: {
        phoneNumber_businessId: {
          phoneNumber,
          businessId
        }
      }
    })

    return optOut ? !optOut.optedBackIn : false
  }

  private async updateWorkerStatus(status: string, currentQueueId?: string, currentJobId?: string) {
    try {
      await prisma.whatsAppWorkerStatus.update({
        where: { workerName: this.workerName },
        data: {
          status,
          currentQueueId,
          currentJobId,
          lastHeartbeat: new Date()
        }
      })
    } catch (error) {
      console.error(`Error actualizando estado del worker ${this.workerName}:`, error)
    }
  }

  private async updateWorkerStats(success: boolean) {
    try {
      const updateData: any = {
        jobsProcessed: { increment: 1 },
        lastJobAt: new Date()
      }

      if (success) {
        updateData.jobsSuccessful = { increment: 1 }
      } else {
        updateData.jobsFailed = { increment: 1 }
        updateData.errorCount = { increment: 1 }
      }

      await prisma.whatsAppWorkerStatus.update({
        where: { workerName: this.workerName },
        data: updateData
      })
    } catch (error) {
      console.error(`Error actualizando estadísticas del worker ${this.workerName}:`, error)
    }
  }

  private async updateQueueStats(queueId: string) {
    try {
      const stats = await prisma.whatsAppQueueJob.groupBy({
        by: ['status'],
        where: { queueId },
        _count: { status: true }
      })

      const completed = stats.find(s => s.status === 'COMPLETED')?._count.status || 0
      const failed = stats.find(s => s.status === 'FAILED')?._count.status || 0
      const pending = stats.find(s => s.status === 'PENDING')?._count.status || 0

      await prisma.whatsAppQueue.update({
        where: { id: queueId },
        data: {
          sentMessages: completed,
          failedMessages: failed,
          pendingMessages: pending
        }
      })

      // Si todos los trabajos están completados o fallaron, marcar cola como completada
      if (pending === 0) {
        await prisma.whatsAppQueue.update({
          where: { id: queueId },
          data: {
            status: 'COMPLETED',
            completedAt: new Date()
          }
        })
      }
    } catch (error) {
      console.error(`Error actualizando estadísticas de la cola ${queueId}:`, error)
    }
  }

  private async handleWorkerError(error: any) {
    try {
      await prisma.whatsAppWorkerStatus.update({
        where: { workerName: this.workerName },
        data: {
          status: 'ERROR',
          lastError: error instanceof Error ? error.message : 'Error desconocido',
          errorCount: { increment: 1 }
        }
      })
    } catch (dbError) {
      console.error(`Error guardando error del worker ${this.workerName}:`, dbError)
    }
  }
}

// Función para inicializar workers por defecto
export async function startDefaultWorkers() {
  const workers = [
    new WhatsAppQueueWorker({
      workerName: 'worker-general-1',
      maxJobs: 100,
      delayBetweenJobs: 1000
    }),
    new WhatsAppQueueWorker({
      workerName: 'worker-general-2',
      maxJobs: 100,
      delayBetweenJobs: 1000
    })
  ]

  for (const worker of workers) {
    await worker.start()
  }

  console.log(`🔥 ${workers.length} workers de WhatsApp iniciados`)

  // Manejar cierre limpio
  process.on('SIGINT', async () => {
    console.log('\n🛑 Deteniendo workers...')
    for (const worker of workers) {
      await worker.stop()
    }
    process.exit(0)
  })

  return workers
}
