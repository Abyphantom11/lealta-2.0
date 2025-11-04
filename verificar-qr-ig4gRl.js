const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verificarQR() {
  try {
    console.log('🔍 VERIFICANDO QR: ig4gRl');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    const qr = await prisma.qRLink.findUnique({
      where: { shortId: 'ig4gRl' },
      include: {
        clicks: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: { clicks: true }
        }
      }
    });

    if (qr) {
      console.log('✅ QR ENCONTRADO EN BASE DE DATOS');
      console.log('');
      console.log('📊 Información Completa:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`  🆔 ID: ${qr.id}`);
      console.log(`  🔗 Short ID: ${qr.shortId}`);
      console.log(`  📝 Nombre: ${qr.name}`);
      console.log(`  📄 Descripción: ${qr.description || 'Sin descripción'}`);
      console.log(`  🎯 URL Destino: ${qr.targetUrl}`);
      console.log(`  🔄 URL Backup: ${qr.backupUrl || 'Sin backup'}`);
      console.log(`  🏢 Business ID: ${qr.businessId || 'Sin business asignado'}`);
      console.log(`  ✅ Estado: ${qr.isActive ? 'ACTIVO' : 'INACTIVO'}`);
      console.log(`  👆 Click Count: ${qr.clickCount}`);
      console.log(`  📅 Creado: ${qr.createdAt.toISOString()}`);
      console.log(`  🔄 Actualizado: ${qr.updatedAt.toISOString()}`);
      console.log(`  ⏰ Expira: ${qr.expiresAt ? qr.expiresAt.toISOString() : 'Sin expiración'}`);
      console.log('');
      console.log('🌐 URL Pública:');
      console.log(`  https://lealta.app/r/${qr.shortId}`);
      console.log('');
      
      if (qr._count.clicks > 0) {
        console.log(`📊 Total de Clicks Registrados: ${qr._count.clicks}`);
        console.log('');
        if (qr.clicks.length > 0) {
          console.log('📋 Últimos 5 Clicks:');
          for (const [i, click] of qr.clicks.entries()) {
            console.log(`  ${i + 1}. ${click.createdAt.toISOString()}`);
            console.log(`     IP: ${click.ipAddress || 'N/A'}`);
            console.log(`     User Agent: ${click.userAgent ? click.userAgent.substring(0, 50) + '...' : 'N/A'}`);
          }
        }
      } else {
        console.log('⚠️  Sin clicks registrados todavía');
      }
      
      console.log('');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');
      console.log('✨ Estado: TODO CORRECTO');
      console.log('🚀 El QR está listo para usar');
      
    } else {
      console.log('❌ QR NO ENCONTRADO');
      console.log('');
      console.log('El QR con shortId "ig4gRl" no existe en la base de datos.');
      console.log('Ejecuta: node crear-qr-ig4gRl.js para crearlo.');
    }

    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

verificarQR();
