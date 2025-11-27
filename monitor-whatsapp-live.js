#!/usr/bin/env node

/**
 * 📊 Dashboard de Monitoreo en Tiempo Real
 * Uso: node monitor-whatsapp-live.js
 * 
 * Muestra estadísticas en vivo del sistema WhatsApp
 * Se actualiza cada 3 segundos
 */

import { prisma } from '@/lib/prisma.js'
import dotenv from 'dotenv'
import blessed from 'blessed'

dotenv.config()

// Colores
const colors = {
  success: '#00FF00',
  warning: '#FFFF00',
  error: '#FF0000',
  info: '#00FFFF',
  accent: '#FF00FF'
}

async function getDashboardData() {
  try {
    // Estadísticas generales
    const totalAccounts = await prisma.whatsAppAccount.count()
    const totalMessages = await prisma.whatsAppMessage.count()
    const totalTemplates = await prisma.whatsAppTemplate.count()
    const totalQueues = await prisma.whatsAppQueue.count()

    // Mensajes por estado
    const messageStats = await prisma.whatsAppMessage.groupBy({
      by: ['status'],
      _count: true
    })

    // Mensajes últimos 24h
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const messagesLast24h = await prisma.whatsAppMessage.count({
      where: { sentAt: { gte: last24h } }
    })

    // Colas activas
    const activeQueues = await prisma.whatsAppQueue.findMany({
      where: { status: { in: ['DRAFT', 'PROCESSING'] } },
      select: {
        id: true,
        name: true,
        status: true,
        totalMessages: true
      }
    })

    // Mensajes recientes
    const recentMessages = await prisma.whatsAppMessage.findMany({
      orderBy: { sentAt: 'desc' },
      take: 5,
      select: {
        phoneNumber: true,
        status: true,
        sentAt: true
      }
    })

    // Workers activos
    const activeWorkers = await prisma.whatsAppWorkerStatus.findMany({
      where: { status: 'ACTIVE' }
    })

    // Opt-outs
    const optOuts = await prisma.whatsAppOptOut.count()

    return {
      totalAccounts,
      totalMessages,
      totalTemplates,
      totalQueues,
      messageStats,
      messagesLast24h,
      activeQueues,
      recentMessages,
      activeWorkers,
      optOuts
    }
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return null
  }
}

async function createDashboard() {
  const screen = blessed.screen({
    smartCSR: true,
    mouse: true,
    title: '📊 Love Me WhatsApp Monitor'
  })

  // Panel principal
  const main = blessed.box({
    parent: screen,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    style: {
      bg: 'blue',
      fg: 'white'
    }
  })

  // Título
  const title = blessed.box({
    parent: main,
    top: 0,
    left: 2,
    width: '100%',
    height: 3,
    content: '{center}📊 MONITOREO EN TIEMPO REAL - Sistema WhatsApp Love Me{/center}',
    style: {
      bg: 'blue',
      fg: 'yellow',
      bold: true
    }
  })

  // Estadísticas principales (arriba)
  const stats = blessed.box({
    parent: main,
    top: 3,
    left: 1,
    width: '48%',
    height: 12,
    border: 'line',
    style: {
      border: { fg: 'cyan' }
    },
    content: 'Cargando...'
  })

  // Colas (arriba derecha)
  const queues = blessed.box({
    parent: main,
    top: 3,
    right: 1,
    width: '48%',
    height: 12,
    border: 'line',
    style: {
      border: { fg: 'green' }
    },
    content: 'Cargando...'
  })

  // Mensajes recientes (abajo izquierda)
  const recent = blessed.box({
    parent: main,
    top: 15,
    left: 1,
    width: '48%',
    height: 15,
    border: 'line',
    style: {
      border: { fg: 'magenta' }
    },
    scrollable: true,
    content: 'Cargando...'
  })

  // Workers (abajo derecha)
  const workers = blessed.box({
    parent: main,
    top: 15,
    right: 1,
    width: '48%',
    height: 15,
    border: 'line',
    style: {
      border: { fg: 'yellow' }
    },
    content: 'Cargando...'
  })

  // Pie
  const footer = blessed.box({
    parent: main,
    bottom: 0,
    left: 0,
    width: '100%',
    height: 1,
    content: '{center}Q: Salir | R: Actualizar | Actualización automática cada 3 segundos{/center}',
    style: {
      bg: 'black',
      fg: 'cyan'
    }
  })

  async function updateDashboard() {
    const data = await getDashboardData()

    if (!data) {
      stats.setContent('Error al conectar a la base de datos')
      return
    }

    // Actualizar estadísticas
    let statsContent = '{bold}📊 ESTADÍSTICAS{/bold}\n'
    statsContent += `━━━━━━━━━━━━━━━━━━━━━━━━━\n`
    statsContent += `Cuentas WhatsApp: {green}${data.totalAccounts}{/green}\n`
    statsContent += `Total Mensajes: {cyan}${data.totalMessages}{/cyan}\n`
    statsContent += `Últimas 24h: {yellow}${data.messagesLast24h}{/yellow}\n`
    statsContent += `Templates: {green}${data.totalTemplates}{/green}\n`
    statsContent += `Colas Totales: {cyan}${data.totalQueues}{/cyan}\n`
    statsContent += `Opt-outs: {red}${data.optOuts}{/red}\n`
    statsContent += `\n{bold}Por Estado:{/bold}\n`

    const stateMap = {
      queued: '{yellow}📤{/yellow}',
      sent: '{cyan}✓{/cyan}',
      delivered: '{green}✓✓{/green}',
      read: '{green}✓✓✓{/green}',
      failed: '{red}✗{/red}'
    }

    data.messageStats.forEach(stat => {
      const icon = stateMap[stat.status] || '•'
      statsContent += `  ${icon} ${stat.status}: ${stat._count}\n`
    })

    stats.setContent(statsContent)

    // Actualizar colas
    let queuesContent = '{bold}⏳ COLAS ACTIVAS{/bold}\n'
    queuesContent += `━━━━━━━━━━━━━━━━━━━━━━━━━\n`

    if (data.activeQueues.length === 0) {
      queuesContent += 'Sin colas activas'
    } else {
      data.activeQueues.forEach((q, i) => {
        const statusIcon = q.status === 'PROCESSING' ? '🔄' : '📋'
        const statusColor = q.status === 'PROCESSING' ? 'green' : 'yellow'
        queuesContent += `${i + 1}. {${statusColor}}${statusIcon} ${q.name}{/}\n`
        queuesContent += `   Estado: {white}${q.status}{/white}\n`
        queuesContent += `   Mensajes: {cyan}${q.totalMessages}{/cyan}\n\n`
      })
    }

    queues.setContent(queuesContent)

    // Actualizar mensajes recientes
    let recentContent = '{bold}📱 MENSAJES RECIENTES{/bold}\n'
    recentContent += `━━━━━━━━━━━━━━━━━━━━━━━━━\n`

    const statusIcons = {
      queued: '⏳',
      sent: '✓',
      delivered: '✓✓',
      read: '✓✓✓',
      failed: '✗'
    }

    data.recentMessages.forEach((msg, i) => {
      const icon = statusIcons[msg.status] || '•'
      const statusColor = msg.status === 'delivered' ? 'green' : msg.status === 'failed' ? 'red' : 'yellow'
      const time = msg.sentAt ? new Date(msg.sentAt).toLocaleTimeString() : 'Pendiente'

      recentContent += `${i + 1}. ${icon} {cyan}${msg.phoneNumber}{/}\n`
      recentContent += `   {${statusColor}}${msg.status}{/} - {white}${time}{/}\n\n`
    })

    recent.setContent(recentContent)

    // Actualizar workers
    let workersContent = '{bold}🔧 WORKERS ACTIVOS{/bold}\n'
    workersContent += `━━━━━━━━━━━━━━━━━━━━━━━━━\n`

    if (data.activeWorkers.length === 0) {
      workersContent += 'Sin workers activos\n\n'
      workersContent += '{yellow}💡 Inicia workers con: npm run worker{/yellow}'
    } else {
      data.activeWorkers.forEach((w, i) => {
        const heartbeatTime = new Date(w.lastHeartbeat).toLocaleTimeString()
        const isHealthy = Date.now() - new Date(w.lastHeartbeat).getTime() < 10000

        workersContent += `${i + 1}. ${isHealthy ? '{green}●{/}' : '{red}●{/}'} {bold}${w.workerName}{/bold}\n`
        workersContent += `   Trabajos: {cyan}${w.jobsProcessed}{/cyan}\n`
        workersContent += `   Latido: {white}${heartbeatTime}{/white}\n\n`
      })
    }

    workers.setContent(workersContent)
  }

  // Actualizar cada 3 segundos
  setInterval(updateDashboard, 3000)

  // Actualización inicial
  await updateDashboard()

  // Teclas
  screen.key(['q', 'C-c'], () => {
    return process.exit(0)
  })

  screen.key(['r'], () => {
    updateDashboard()
  })

  screen.render()
}

console.log('🚀 Iniciando dashboard en vivo...')
createDashboard().catch(console.error)
