const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Cliente para SQLite actual
const sqlitePrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./prisma/dev.db'
    }
  }
});

async function exportSQLiteData() {
  try {
    console.log('🗄️ Iniciando exportación de datos SQLite...');

    // Verificar que el archivo SQLite existe
    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
    if (!fs.existsSync(dbPath)) {
      throw new Error('❌ No se encuentra el archivo dev.db');
    }

    console.log('📊 Extrayendo datos...');

    // Exportar todos los datos en orden correcto (respetando foreign keys)
    const data = {
      metadata: {
        exportDate: new Date().toISOString(),
        source: 'SQLite',
        dbPath: dbPath
      },
      
      // 1. Businesses (no tienen dependencias)
      businesses: await sqlitePrisma.business.findMany({
        orderBy: { createdAt: 'asc' }
      }),

      // 2. Users (dependen de Business)
      users: await sqlitePrisma.user.findMany({
        orderBy: { createdAt: 'asc' }
      }),

      // 3. Locations (dependen de Business)
      locations: await sqlitePrisma.location.findMany({
        orderBy: { createdAt: 'asc' }
      }),

      // 4. MenuCategories (dependen de Business)
      menuCategories: await sqlitePrisma.menuCategory.findMany({
        orderBy: { order: 'asc' }
      }),

      // 5. MenuItems (dependen de MenuCategory)
      menuItems: await sqlitePrisma.menuItem.findMany({
        orderBy: { createdAt: 'asc' }
      }),

      // 6. Clientes (dependen de Business)
      clientes: await sqlitePrisma.cliente.findMany({
        orderBy: { createdAt: 'asc' }
      }),

      // 7. TarjetaLealtad (dependen de Cliente)
      tarjetasLealtad: await sqlitePrisma.tarjetaLealtad.findMany({
        orderBy: { createdAt: 'asc' }
      }),

      // 8. Consumos (dependen de Cliente)
      consumos: await sqlitePrisma.consumo.findMany({
        orderBy: { registeredAt: 'asc' }
      }),

      // 9. HistorialCanje (dependen de Cliente)
      historialCanjes: await sqlitePrisma.historialCanje.findMany({
        orderBy: { fechaCanje: 'asc' }
      }),

      // 10. Visitas (dependen de Cliente)
      visitas: await sqlitePrisma.visita.findMany({
        orderBy: { fecha: 'asc' }
      })
    };

    // Generar estadísticas
    const stats = {
      businesses: data.businesses.length,
      users: data.users.length,
      locations: data.locations.length,
      menuCategories: data.menuCategories.length,
      menuItems: data.menuItems.length,
      clientes: data.clientes.length,
      tarjetasLealtad: data.tarjetasLealtad.length,
      consumos: data.consumos.length,
      historialCanjes: data.historialCanjes.length,
      visitas: data.visitas.length
    };

    data.statistics = stats;

    // Guardar datos
    const backupFileName = `backup-data-${new Date().toISOString().split('T')[0]}.json`;
    const backupPath = path.join(process.cwd(), backupFileName);
    
    fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));
    
    console.log('✅ Exportación completada:');
    console.log(`📁 Archivo: ${backupFileName}`);
    console.log('📊 Estadísticas:');
    Object.entries(stats).forEach(([key, value]) => {
      console.log(`   ${key}: ${value} registros`);
    });

    // Crear también un backup simple del archivo SQLite
    const sqliteBackupName = `backup-sqlite-${new Date().toISOString().split('T')[0]}.db`;
    fs.copyFileSync(dbPath, sqliteBackupName);
    console.log(`💾 Backup SQLite: ${sqliteBackupName}`);

    return { success: true, backupFile: backupFileName, stats };

  } catch (error) {
    console.error('❌ Error durante la exportación:', error);
    return { success: false, error: error.message };
  } finally {
    await sqlitePrisma.$disconnect();
  }
}

// Función de validación de integridad
async function validateDataIntegrity() {
  try {
    console.log('🔍 Validando integridad de datos...');

    // Verificar relaciones críticas
    const businesses = await sqlitePrisma.business.findMany();
    const users = await sqlitePrisma.user.findMany();
    const clientes = await sqlitePrisma.cliente.findMany();

    const validations = [];

    // 1. Verificar que todos los users tienen businessId válido
    for (const user of users) {
      const businessExists = businesses.find(b => b.id === user.businessId);
      if (!businessExists) {
        validations.push({
          type: 'error',
          message: `User ${user.id} tiene businessId inválido: ${user.businessId}`
        });
      }
    }

    // 2. Verificar que todos los clientes tienen businessId válido
    for (const cliente of clientes) {
      const businessExists = businesses.find(b => b.id === cliente.businessId);
      if (!businessExists) {
        validations.push({
          type: 'error',
          message: `Cliente ${cliente.id} tiene businessId inválido: ${cliente.businessId}`
        });
      }
    }

    // 3. Verificar unicidad de cédulas por business
    const cedulasByBusiness = {};
    for (const cliente of clientes) {
      const key = `${cliente.businessId}-${cliente.cedula}`;
      if (cedulasByBusiness[key]) {
        validations.push({
          type: 'warning',
          message: `Cédula duplicada en business ${cliente.businessId}: ${cliente.cedula}`
        });
      }
      cedulasByBusiness[key] = true;
    }

    console.log(`📋 Validaciones completadas: ${validations.length} issues encontrados`);
    validations.forEach(v => {
      const icon = v.type === 'error' ? '❌' : '⚠️';
      console.log(`${icon} ${v.message}`);
    });

    return validations;

  } catch (error) {
    console.error('❌ Error durante validación:', error);
    return [{ type: 'error', message: error.message }];
  }
}

// Función principal
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--validate-only')) {
    await validateDataIntegrity();
  } else {
    const result = await exportSQLiteData();
    
    if (result.success) {
      console.log('\n🔍 Ejecutando validación de integridad...');
      await validateDataIntegrity();
      
      console.log('\n🎯 Próximos pasos:');
      console.log('1. Configurar PostgreSQL de desarrollo');
      console.log('2. Actualizar schema.prisma provider a "postgresql"');
      console.log('3. Actualizar DATABASE_URL en .env.local');
      console.log('4. Ejecutar: npm run import-to-postgres');
    }
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { exportSQLiteData, validateDataIntegrity };
