#!/usr/bin/env node

/**
 * 🚀 Script para registrar cuenta de WhatsApp en el sistema
 * Uso: node setup-whatsapp-account.js
 */

import { prisma } from '@/lib/prisma.js'

async function setupWhatsAppAccount() {
  try {
    console.log('📱 Configurando cuenta de WhatsApp...\n')

    // 1. Obtener negocio principal (Love Me Sky)
    const business = await prisma.business.findFirst({
      where: {
        name: {
          contains: 'Love'
        }
      }
    })

    if (!business) {
      console.error('❌ No se encontró negocio. Asegúrate de tener un negocio creado.')
      process.exit(1)
    }

    console.log(`✅ Negocio encontrado: ${business.name}`)
    console.log(`   ID: ${business.id}\n`)

    // 2. Crear cuenta de WhatsApp
    const account = await prisma.whatsAppAccount.create({
      data: {
        businessId: business.id,
        name: 'Número Principal - Pruebas',
        phoneNumber: '+15558848359',
        twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
        twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
        whatsappBusinessId: '151983672258977220', // De tu screenshot
        status: 'ACTIVE',
        isDefault: true,
        isPrimary: true,
        maxDailyMessages: 1000,
        maxConcurrentMessages: 10,
        verificationStatus: 'VERIFIED',
        verifiedAt: new Date(),
        qualityRating: 'GREEN'
      }
    })

    console.log('✅ Cuenta de WhatsApp creada exitosamente!')
    console.log(`   📱 Número: ${account.phoneNumber}`)
    console.log(`   🏢 Negocio: ${business.name}`)
    console.log(`   🎯 Estado: ${account.status}`)
    console.log(`   ⭐ Primaria: ${account.isPrimary ? 'Sí' : 'No'}`)
    console.log(`   📊 Limit diario: ${account.maxDailyMessages} mensajes\n`)

    // 3. Crear template de prueba
    const template = await prisma.whatsAppTemplate.create({
      data: {
        businessId: business.id,
        name: 'Bienvenida de Prueba',
        category: 'UTILITY',
        language: 'es',
        status: 'APPROVED',
        content: {
          body: 'Hola {nombre}! 👋\n\nBienvenido a Love Me Sky. Tenemos {puntos} puntos disponibles para ti. ¡Disfruta!',
          footer: 'Love Me Sky - Sistema de Lealtad'
        },
        whatsappTemplateId: 'test_template_001',
        approvedAt: new Date()
      }
    })

    console.log('✅ Template de prueba creado!')
    console.log(`   📝 Nombre: ${template.name}`)
    console.log(`   🎯 Categoría: ${template.category}`)
    console.log(`   ✔️ Estado: ${template.status}\n`)

    // 4. Crear cola de prueba
    const queue = await prisma.whatsAppQueue.create({
      data: {
        businessId: business.id,
        accountId: account.id,
        name: 'Campaña de Prueba',
        description: 'Prueba inicial del sistema WhatsApp',
        templateId: template.id,
        priority: 10,
        maxRetries: 3,
        retryDelayMinutes: 5,
        batchSize: 10,
        rateLimitPerHour: 50,
        status: 'DRAFT',
        audienceFilters: {
          puntosMinimos: 0,
          ultimaVisitaDias: 365
        }
      }
    })

    console.log('✅ Cola de prueba creada!')
    console.log(`   🎯 Nombre: ${queue.name}`)
    console.log(`   📊 Prioridad: ${queue.priority}/10`)
    console.log(`   ⏱️ Estado: ${queue.status}\n`)

    // 5. Mostrar credenciales de Twilio
    console.log('📋 CREDENCIALES TWILIO:\n')
    console.log(`   Account SID: ${process.env.TWILIO_ACCOUNT_SID?.substring(0, 10)}...`)
    console.log(`   Auth Token: ${process.env.TWILIO_AUTH_TOKEN?.substring(0, 10)}...\n`)

    // 6. Mostrar comandos siguientes
    console.log('🚀 PRÓXIMOS PASOS:\n')
    console.log('1️⃣  Enviar mensaje de prueba a un teléfono:')
    console.log('   curl -X POST http://localhost:3000/api/whatsapp/send-message \\')
    console.log('     -H "Content-Type: application/json" \\')
    console.log("     -d '{")
    console.log('       "phoneNumber": "+593XXXXXXXXX",')
    console.log('       "message": "¡Hola! Esto es una prueba"')
    console.log('     }\'')
    console.log()

    console.log('2️⃣  Procesar la cola de prueba:')
    console.log(`   curl -X POST http://localhost:3000/api/whatsapp/queue/${queue.id}/process`)
    console.log()

    console.log('3️⃣  Ver cuentas registradas:')
    console.log('   curl http://localhost:3000/api/whatsapp/accounts')
    console.log()

    console.log('✅ ¡Sistema listo para pruebas!')

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

await setupWhatsAppAccount()
