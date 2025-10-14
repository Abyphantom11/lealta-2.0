const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function createBackup() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, 'backups');
    
    // Crear carpeta de backups si no existe
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }

    console.log('📦 Iniciando backup de la base de datos...\n');

    // 1. Backup de Businesses
    console.log('🏢 Exportando Businesses...');
    const businesses = await prisma.business.findMany({
      include: {
        users: true,
        locations: true,
      }
    });
    console.log(`   ✓ ${businesses.length} businesses exportados`);

    // 2. Backup de Clientes
    console.log('👥 Exportando Clientes...');
    const clientes = await prisma.cliente.findMany({
      include: {
        tarjetaLealtad: true,
      }
    });
    console.log(`   ✓ ${clientes.length} clientes exportados`);

    // 3. Backup de Reservas
    console.log('📅 Exportando Reservas...');
    const reservations = await prisma.reservation.findMany({
      include: {
        qrCodes: true,
      }
    });
    console.log(`   ✓ ${reservations.length} reservas exportadas`);

    // 4. Backup de Consumos (últimos 1000 por performance)
    console.log('💰 Exportando Consumos (últimos 1000)...');
    const consumos = await prisma.consumo.findMany({
      take: 1000,
      orderBy: {
        registeredAt: 'desc'
      }
    });
    console.log(`   ✓ ${consumos.length} consumos exportados`);

    // 5. Backup de Promotores
    console.log('📱 Exportando Promotores...');
    const promotores = await prisma.promotor.findMany();
    console.log(`   ✓ ${promotores.length} promotores exportados`);

    // 6. Backup de Servicios de Reserva
    console.log('🎯 Exportando Servicios de Reserva...');
    const services = await prisma.reservationService.findMany();
    console.log(`   ✓ ${services.length} servicios exportados`);

    // 7. Backup de Slots
    console.log('⏰ Exportando Slots (últimos 500)...');
    const slots = await prisma.reservationSlot.findMany({
      take: 500,
      orderBy: {
        date: 'desc'
      }
    });
    console.log(`   ✓ ${slots.length} slots exportados`);

    // 8. Backup de HostTracking y GuestConsumo
    console.log('🎯 Exportando Host Tracking...');
    const hostTrackings = await prisma.hostTracking.findMany({
      include: {
        guestConsumos: true
      }
    });
    console.log(`   ✓ ${hostTrackings.length} host trackings exportados`);

    // Crear objeto de backup
    const backup = {
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        totalRecords: {
          businesses: businesses.length,
          clientes: clientes.length,
          reservations: reservations.length,
          consumos: consumos.length,
          promotores: promotores.length,
          services: services.length,
          slots: slots.length,
          hostTrackings: hostTrackings.length
        }
      },
      data: {
        businesses,
        clientes,
        reservations,
        consumos,
        promotores,
        services,
        slots,
        hostTrackings
      }
    };

    // Guardar backup
    const filename = `backup_${timestamp}.json`;
    const filepath = path.join(backupDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(backup, null, 2));
    
    const stats = fs.statSync(filepath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log('\n✅ Backup completado exitosamente!');
    console.log(`📁 Archivo: ${filename}`);
    console.log(`📊 Tamaño: ${fileSizeMB} MB`);
    console.log(`📍 Ubicación: ${filepath}`);
    
    // Crear también un backup "latest" para fácil acceso
    const latestPath = path.join(backupDir, 'backup_latest.json');
    fs.writeFileSync(latestPath, JSON.stringify(backup, null, 2));
    console.log(`\n🔄 También guardado como: backup_latest.json`);

    // Mostrar resumen
    console.log('\n📊 RESUMEN DEL BACKUP:');
    console.log('═══════════════════════════════════════');
    console.log(`🏢 Businesses:      ${backup.metadata.totalRecords.businesses}`);
    console.log(`👥 Clientes:        ${backup.metadata.totalRecords.clientes}`);
    console.log(`📅 Reservas:        ${backup.metadata.totalRecords.reservations}`);
    console.log(`💰 Consumos:        ${backup.metadata.totalRecords.consumos}`);
    console.log(`📱 Promotores:      ${backup.metadata.totalRecords.promotores}`);
    console.log(`🎯 Servicios:       ${backup.metadata.totalRecords.services}`);
    console.log(`⏰ Slots:           ${backup.metadata.totalRecords.slots}`);
    console.log(`🎯 Host Trackings:  ${backup.metadata.totalRecords.hostTrackings}`);
    console.log('═══════════════════════════════════════');

  } catch (error) {
    console.error('\n❌ Error durante el backup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
createBackup();
