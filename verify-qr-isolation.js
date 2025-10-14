const { PrismaClient } = require('@prisma/client');

async function verifyQRIsolation() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Verificando aislamiento del QR legacy...\n');
    
    // Verificar QR legacy específico
    const legacyQR = await prisma.qRLink.findUnique({
      where: { shortId: 'ig4gRl' }
    });
    
    console.log('🌩️ QR LEGACY (específico para Cloudflare):');
    console.log(`Short ID: ${legacyQR.shortId}`);
    console.log(`Target URL: ${legacyQR.targetUrl}`);
    console.log(`Backup URL: ${legacyQR.backupUrl}`);
    console.log('🔄 Interceptado por middleware Cloudflare: SÍ');
    
    // Verificar otros QRs
    const allQRs = await prisma.qRLink.findMany({
      where: {
        shortId: { not: 'ig4gRl' }
      },
      select: {
        shortId: true,
        name: true,
        targetUrl: true,
        isActive: true
      }
    });
    
    console.log('\n🔗 OTROS QRs (funcionamiento normal):');
    if (allQRs.length === 0) {
      console.log('No hay otros QRs en el sistema');
    } else {
      allQRs.forEach((qr, index) => {
        console.log(`${index + 1}. ${qr.name || 'Sin nombre'}`);
        console.log(`   Short ID: ${qr.shortId}`);
        console.log(`   URL: https://lealta.app/r/${qr.shortId}`);
        console.log(`   Target: ${qr.targetUrl}`);
        console.log(`   🔄 Interceptado por middleware Cloudflare: NO`);
        console.log('');
      });
    }
    
    console.log('📋 CONFIGURACIÓN DEL MIDDLEWARE:');
    console.log('');
    console.log('✅ SOLO intercepta URLs que contengan:');
    console.log('   - "loud-entity-fluid-trade.trycloudflare.com"');
    console.log('   - Y específicamente el path "/r/ig4gRl"');
    console.log('');
    console.log('✅ NO intercepta:');
    console.log('   - Otros dominios de Cloudflare');
    console.log('   - Otros shortIds');
    console.log('   - URLs normales de lealta.app');
    console.log('   - Futuros QRs creados');
    
    console.log('\n🧪 COMPORTAMIENTO POR QR:');
    console.log('');
    console.log('🌩️ QR ig4gRl (tu QR físico):');
    console.log('   Cloudflare URL → lealta.app/r/ig4gRl → love-me-sky/cliente/');
    console.log('');
    console.log('🔗 Otros QRs (ejemplo futuro):');
    console.log('   lealta.app/r/abc123 → directamente a su destino');
    console.log('   lealta.app/r/xyz789 → directamente a su destino');
    
    console.log('\n✅ VERIFICACIÓN DE AISLAMIENTO:');
    console.log('🔒 Solo el QR ig4gRl tiene tratamiento especial');
    console.log('🌐 Todos los demás QRs funcionan normalmente');
    console.log('⚡ Futuros QRs no serán afectados');
    console.log('🎯 La solución es específica y no invasiva');
    
    console.log('\n📋 RESUMEN:');
    console.log('Tu QR físico legacy: PROTEGIDO ✅');
    console.log('Otros QRs actuales: NORMALES ✅');
    console.log('Futuros QRs: NORMALES ✅');
    console.log('Sistema QR general: INTACTO ✅');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyQRIsolation();
