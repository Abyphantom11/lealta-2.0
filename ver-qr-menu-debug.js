const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verQRMenu() {
  try {
    console.log('🔍 BUSCANDO TODOS LOS QR CODES...\n');
    
    // Primero, buscar todos los QR codes para encontrar el que tiene problemas
    const todosLosQRs = await prisma.qRLink.findMany({
      include: {
        Business: {
          select: { 
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`📊 Total QR codes encontrados: ${todosLosQRs.length}\n`);

    for (const qr of todosLosQRs) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📱 QR CODE: ${qr.name || 'Sin nombre'}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🆔 ID:', qr.id);
      console.log('🔗 Short ID:', qr.shortId);
      console.log('🎯 Target URL:', qr.targetUrl);
      console.log('✅ Estado:', qr.isActive ? '🟢 ACTIVO' : '🔴 INACTIVO');
      console.log('🏪 Business:', qr.Business?.name || 'Sin negocio');
      
      // VERIFICAR EXPIRACIÓN
      const ahora = new Date();
      console.log('📅 Fecha actual:', ahora.toISOString());
      
      if (qr.expiresAt) {
        console.log('⏰ Fecha de expiración:', qr.expiresAt.toISOString());
        
        const msParaExpirar = qr.expiresAt.getTime() - ahora.getTime();
        const diasParaExpirar = Math.floor(msParaExpirar / (1000 * 60 * 60 * 24));
        const horasParaExpirar = Math.floor(msParaExpirar / (1000 * 60 * 60));
        
        if (msParaExpirar > 0) {
          console.log(`⏳ Expira en: ${diasParaExpirar} días (${horasParaExpirar} horas)`);
          console.log('✅ QR VÁLIDO');
        } else {
          console.log(`❌ EXPIRADO hace: ${Math.abs(diasParaExpirar)} días (${Math.abs(horasParaExpirar)} horas)`);
          console.log('🚨 ESTE QR ESTÁ VENCIDO');
        }
      } else {
        console.log('♾️ Sin fecha de expiración (permanente)');
        console.log('✅ QR VÁLIDO (nunca expira)');
      }
      
      console.log('📈 Total clicks:', qr.clickCount);
      console.log('');
    }

    // Buscar QR específico si hay uno problemático
    const ahora = new Date();
    const qrsExpirados = todosLosQRs.filter(qr => qr.expiresAt && qr.expiresAt.getTime() < ahora.getTime());
    
    if (qrsExpirados.length > 0) {
      console.log('🚨 QRS EXPIRADOS ENCONTRADOS:');
      console.log('═'.repeat(50));
      
      for (const qr of qrsExpirados) {
        const diasExpirado = Math.floor((ahora.getTime() - qr.expiresAt.getTime()) / (1000 * 60 * 60 * 24));
        console.log(`❌ ${qr.name || qr.shortId} - Expirado hace ${diasExpirado} días`);
        console.log(`   URL: ${qr.targetUrl}`);
        console.log(`   Short ID: ${qr.shortId}`);
        
        // PROPUESTA DE SOLUCIÓN: Extender la fecha
        const nuevaFechaExpiracion = new Date(ahora);
        nuevaFechaExpiracion.setDate(nuevaFechaExpiracion.getDate() + 30); // Extender 30 días
        
        console.log(`💡 SOLUCIÓN: Actualizar expiresAt a: ${nuevaFechaExpiracion.toISOString()}`);
        console.log('');
      }
    }

    // Si mencionaste que pasaste del 25 al 26, buscar QRs con fechas específicas
    console.log('🔍 ANALIZANDO FECHAS ESPECÍFICAS (25 vs 26):');
    console.log('═'.repeat(50));
    
    const fecha25 = new Date('2024-10-25');
    const fecha26 = new Date('2024-10-26');
    const fechaHoy = new Date();
    
    console.log(`📅 Fecha 25: ${fecha25.toISOString()}`);
    console.log(`📅 Fecha 26: ${fecha26.toISOString()}`);
    console.log(`📅 Fecha hoy: ${fechaHoy.toISOString()}`);
    
    for (const qr of todosLosQRs) {
      if (qr.expiresAt) {
        const expiraDate = new Date(qr.expiresAt);
        console.log(`🔍 QR ${qr.shortId}: expira ${expiraDate.toLocaleDateString()}`);
        
        if (expiraDate.toDateString() === fecha25.toDateString()) {
          console.log('   📌 ESTE QR EXPIRABA EL 25 - ¡PUEDE SER EL PROBLEMA!');
        }
        if (expiraDate.toDateString() === fecha26.toDateString()) {
          console.log('   ✅ Este QR expira el 26 - funcionará hoy');
        }
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verQRMenu();
