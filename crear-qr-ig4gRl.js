const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function crearQR() {
  try {
    console.log('🔗 CREANDO QR: ig4gRl');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    // Verificar si ya existe
    const existe = await prisma.qRLink.findUnique({
      where: { shortId: 'ig4gRl' }
    });

    if (existe) {
      console.log('⚠️  El QR ig4gRl ya existe. Actualizando...');
      
      const actualizado = await prisma.qRLink.update({
        where: { shortId: 'ig4gRl' },
        data: {
          name: 'Menú Digital - Abyphantom11',
          description: 'QR para acceder al menú digital del negocio',
          targetUrl: 'https://abyphantom11.github.io/Men-/',
          backupUrl: null,
          businessId: null, // Sin business específico (uso general)
          isActive: true,
          updatedAt: new Date()
        }
      });

      console.log('✅ QR ACTUALIZADO EXITOSAMENTE');
      console.log('');
      console.log('📊 Detalles:');
      console.log(`  ID: ${actualizado.id}`);
      console.log(`  Short ID: ${actualizado.shortId}`);
      console.log(`  Nombre: ${actualizado.name}`);
      console.log(`  URL Destino: ${actualizado.targetUrl}`);
      console.log(`  Estado: ${actualizado.isActive ? '✅ ACTIVO' : '❌ INACTIVO'}`);
      console.log(`  Clicks Totales: ${actualizado.clickCount}`);
      console.log('');
      console.log('🌐 URL del QR:');
      console.log(`  https://lealta.app/r/${actualizado.shortId}`);
      
    } else {
      // Crear nuevo
      const nuevo = await prisma.qRLink.create({
        data: {
          shortId: 'ig4gRl',
          name: 'Menú Digital - Abyphantom11',
          description: 'QR para acceder al menú digital del negocio',
          targetUrl: 'https://abyphantom11.github.io/Men-/',
          backupUrl: null,
          businessId: null, // Sin business específico (uso general)
          isActive: true,
          clickCount: 0
        }
      });

      console.log('✅ QR CREADO EXITOSAMENTE');
      console.log('');
      console.log('📊 Detalles:');
      console.log(`  ID: ${nuevo.id}`);
      console.log(`  Short ID: ${nuevo.shortId}`);
      console.log(`  Nombre: ${nuevo.name}`);
      console.log(`  URL Destino: ${nuevo.targetUrl}`);
      console.log(`  Estado: ${nuevo.isActive ? '✅ ACTIVO' : '❌ INACTIVO'}`);
      console.log('');
      console.log('🌐 URL del QR:');
      console.log(`  https://lealta.app/r/${nuevo.shortId}`);
    }

    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('✨ ¡Listo! El QR está activo y funcionando.');
    console.log('');
    console.log('📱 Puedes probarlo visitando:');
    console.log('   https://lealta.app/r/ig4gRl');
    console.log('');
    console.log('🎯 Redirigirá a:');
    console.log('   https://abyphantom11.github.io/Men-/');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

crearQR();
