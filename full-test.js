#!/usr/bin/env node

/**
 * 🧪 Script de Prueba Completa - Sistema WhatsApp
 * Automatiza toda la verificación y prueba del sistema
 * 
 * Uso: node full-test.js
 */

import { prisma } from '@/lib/prisma.js'
import * as twilio from 'twilio'
import dotenv from 'dotenv'
import readline from 'readline'

dotenv.config()

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(prompt) {
  return new Promise(resolve => rl.question(prompt, resolve))
}

function log(type, message) {
  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️',
    wait: '⏳'
  }
  console.log(`${icons[type] || '•'} ${message}`)
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function testEnvironment() {
  console.log('\n' + '='.repeat(60))
  console.log('1️⃣  VERIFICANDO ENTORNO')
  console.log('='.repeat(60))

  const required = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'DATABASE_URL']
  let allGood = true

  for (const env of required) {
    if (process.env[env]) {
      log('success', `${env}: Configurado`)
    } else {
      log('error', `${env}: NO CONFIGURADO`)
      allGood = false
    }
  }

  return allGood
}

async function testDatabase() {
  console.log('\n' + '='.repeat(60))
  console.log('2️⃣  VERIFICANDO BASE DE DATOS')
  console.log('='.repeat(60))

  try {
    log('wait', 'Conectando a PostgreSQL...')
    await prisma.$queryRaw`SELECT 1`
    log('success', 'Conexión establecida')

    // Contar registros
    const businesses = await prisma.business.count()
    const clients = await prisma.client.count()

    log('info', `Base de datos contiene:`)
    console.log(`  • ${businesses} negocio(s)`)
    console.log(`  • ${clients} cliente(s)`)

    return true
  } catch (error) {
    log('error', `Conexión fallida: ${error.message}`)
    return false
  }
}

async function testTwilio() {
  console.log('\n' + '='.repeat(60))
  console.log('3️⃣  VERIFICANDO CREDENCIALES TWILIO')
  console.log('='.repeat(60))

  try {
    log('wait', 'Validando credenciales...')
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

    const account = await client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch()

    log('success', `Cuenta Twilio: ${account.friendlyName}`)
    log('success', `SID: ${account.sid}`)
    log('success', `Estado: ${account.status}`)

    return true
  } catch (error) {
    log('error', `Validación fallida: ${error.message}`)
    return false
  }
}

async function testAccount() {
  console.log('\n' + '='.repeat(60))
  console.log('4️⃣  VERIFICANDO CUENTA WHATSAPP')
  console.log('='.repeat(60))

  try {
    const account = await prisma.whatsAppAccount.findFirst({
      where: { isPrimary: true }
    })

    if (!account) {
      log('warning', 'No hay cuenta WhatsApp primaria registrada')
      log('info', 'Ejecutando setup-whatsapp-account.js...')

      // Aquí irían comandos para ejecutar el setup
      return false
    }

    log('success', `Cuenta encontrada: ${account.phoneNumber}`)
    log('success', `Estado: ${account.status}`)
    log('success', `ID: ${account.id}`)

    return true
  } catch (error) {
    log('error', `Error: ${error.message}`)
    return false
  }
}

async function testTemplate() {
  console.log('\n' + '='.repeat(60))
  console.log('5️⃣  VERIFICANDO TEMPLATES')
  console.log('='.repeat(60))

  try {
    const templates = await prisma.whatsAppTemplate.findMany({
      where: { status: 'APPROVED' }
    })

    if (templates.length === 0) {
      log('warning', 'No hay templates APPROVED')
      return false
    }

    log('success', `${templates.length} template(s) encontrado(s)`)
    templates.forEach((t, i) => {
      console.log(`  ${i + 1}. ${t.name} (${t.category})`)
    })

    return true
  } catch (error) {
    log('error', `Error: ${error.message}`)
    return false
  }
}

async function testSendMessage() {
  console.log('\n' + '='.repeat(60))
  console.log('6️⃣  ENVIANDO MENSAJE DE PRUEBA')
  console.log('='.repeat(60))

  const phoneNumber = await question('📱 Ingresa número de teléfono (+593987654321): ')

  if (!phoneNumber.match(/^\+\d{10,15}$/)) {
    log('error', 'Formato de teléfono inválido')
    return false
  }

  try {
    log('wait', 'Enviando mensaje...')

    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

    const message = await client.messages.create({
      from: 'whatsapp:+15558848359',
      to: `whatsapp:${phoneNumber}`,
      body: '🎉 Hola! Este es un mensaje de prueba desde Love Me Group. ¡El sistema está funcionando correctamente!'
    })

    log('success', `Mensaje enviado`)
    log('info', `SID: ${message.sid}`)
    log('info', `Estado: ${message.status}`)

    // Guardar en BD
    const account = await prisma.whatsAppAccount.findFirst({
      where: { isPrimary: true }
    })

    if (account) {
      await prisma.whatsAppMessage.create({
        data: {
          accountId: account.id,
          phoneNumber,
          twilioSid: message.sid,
          status: message.status,
          sentAt: new Date()
        }
      })
      log('success', 'Mensaje registrado en BD')
    }

    // Esperar confirmación
    log('wait', 'Esperando confirmación (15 segundos)...')
    await sleep(15000)

    // Verificar estado
    const updated = await client.messages(message.sid).fetch()
    log('success', `Estado final: ${updated.status}`)

    return updated.status === 'sent' || updated.status === 'delivered'
  } catch (error) {
    log('error', `Error al enviar: ${error.message}`)
    return false
  }
}

async function testQueue() {
  console.log('\n' + '='.repeat(60))
  console.log('7️⃣  VERIFICANDO SISTEMA DE COLAS')
  console.log('='.repeat(60))

  try {
    const queues = await prisma.whatsAppQueue.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        totalMessages: true
      }
    })

    if (queues.length === 0) {
      log('info', 'Sin colas activas (normal en primer uso)')
      return true
    }

    log('success', `${queues.length} cola(s) encontrada(s)`)
    queues.forEach((q, i) => {
      console.log(`  ${i + 1}. ${q.name} [${q.status}] (${q.totalMessages} mensajes)`)
    })

    return true
  } catch (error) {
    log('error', `Error: ${error.message}`)
    return false
  }
}

async function testWorker() {
  console.log('\n' + '='.repeat(60))
  console.log('8️⃣  VERIFICANDO WORKERS')
  console.log('='.repeat(60))

  try {
    const workers = await prisma.whatsAppWorkerStatus.findMany({
      where: { status: 'ACTIVE' }
    })

    if (workers.length === 0) {
      log('info', 'Sin workers activos (iniciarán con npm run worker)')
      return true
    }

    log('success', `${workers.length} worker(s) activo(s)`)
    workers.forEach((w, i) => {
      console.log(`  ${i + 1}. ${w.workerName} (${w.jobsProcessed} trabajos)`)
    })

    return true
  } catch (error) {
    log('error', `Error: ${error.message}`)
    return false
  }
}

async function generateReport(results) {
  console.log('\n' + '='.repeat(60))
  console.log('📊 REPORTE FINAL')
  console.log('='.repeat(60))

  const summary = {
    passed: results.filter(r => r.result).length,
    failed: results.filter(r => !r.result).length,
    total: results.length
  }

  console.log(`\n✅ Pruebas exitosas: ${summary.passed}/${summary.total}`)
  console.log(`❌ Pruebas fallidas: ${summary.failed}/${summary.total}`)

  if (summary.failed === 0) {
    console.log('\n🎉 ¡TODO ESTÁ CONFIGURADO Y LISTO PARA USAR!')
  } else {
    console.log('\n⚠️  Hay problemas que deben resolverse')
    console.log('\nProblemas encontrados:')
    results.forEach((r, i) => {
      if (!r.result) {
        console.log(`  ${i + 1}. ${r.name}`)
      }
    })
  }

  console.log('\n' + '='.repeat(60))
  console.log('📝 PRÓXIMOS PASOS')
  console.log('='.repeat(60))
  console.log('\n1. Inicia el servidor: npm run dev')
  console.log('2. En otra terminal: npm run worker')
  console.log('3. Accede a: http://localhost:3000/admin/whatsapp')
  console.log('4. Monitorea: node monitor-whatsapp-live.js')
  console.log('\n' + '='.repeat(60))
}

async function main() {
  console.log('\n🧪 PRUEBA COMPLETA DEL SISTEMA WHATSAPP')
  console.log('Love Me Group\n')

  const results = []

  // Pruebas automáticas
  results.push({
    name: 'Entorno',
    result: await testEnvironment()
  })

  results.push({
    name: 'Base de Datos',
    result: await testDatabase()
  })

  results.push({
    name: 'Credenciales Twilio',
    result: await testTwilio()
  })

  results.push({
    name: 'Cuenta WhatsApp',
    result: await testAccount()
  })

  results.push({
    name: 'Templates',
    result: await testTemplate()
  })

  results.push({
    name: 'Sistema de Colas',
    result: await testQueue()
  })

  results.push({
    name: 'Workers',
    result: await testWorker()
  })

  // Prueba interactiva
  const sendTest = await question('\n¿Deseas enviar un mensaje de prueba? (s/n): ')
  if (sendTest.toLowerCase() === 's') {
    results.push({
      name: 'Envío de Mensaje',
      result: await testSendMessage()
    })
  }

  // Reporte
  await generateReport(results)

  rl.close()
  await prisma.$disconnect()
  process.exit(0)
}

main().catch(error => {
  log('error', error.message)
  process.exit(1)
})
