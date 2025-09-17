const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function importToPostgreSQL() {
  // Cliente para PostgreSQL (usando nueva URL)
  const postgresPrisma = new PrismaClient();

  try {
    console.log('🗄️ Iniciando importación a PostgreSQL...');

    // Buscar archivo de backup más reciente
    const backupFiles = fs.readdirSync(process.cwd())
      .filter(file => file.startsWith('backup-data-') && file.endsWith('.json'))
      .sort()
      .reverse();

    if (backupFiles.length === 0) {
      throw new Error('❌ No se encontró archivo de backup. Ejecuta export-sqlite-data.js primero.');
    }

    const backupFile = backupFiles[0];
    console.log(`📂 Usando backup: ${backupFile}`);

    const data = JSON.parse(fs.readFileSync(backupFile, 'utf8'));

    console.log('📊 Datos a importar:');
    Object.entries(data.statistics || {}).forEach(([key, value]) => {
      console.log(`   ${key}: ${value} registros`);
    });

    // Verificar conexión a PostgreSQL
    await postgresPrisma.$connect();
    console.log('✅ Conexión a PostgreSQL establecida');

    // Limpiar datos existentes (¡CUIDADO EN PRODUCCIÓN!)
    console.log('🧹 Limpiando datos existentes...');
    await postgresPrisma.visita.deleteMany();
    await postgresPrisma.historialCanje.deleteMany();
    await postgresPrisma.consumo.deleteMany();
    await postgresPrisma.tarjetaLealtad.deleteMany();
    await postgresPrisma.cliente.deleteMany();
    await postgresPrisma.menuItem.deleteMany();
    await postgresPrisma.menuCategory.deleteMany();
    await postgresPrisma.location.deleteMany();
    await postgresPrisma.user.deleteMany();
    await postgresPrisma.business.deleteMany();

    // Importar en orden correcto
    console.log('📥 Importando datos...');

    // 1. Businesses
    console.log('📊 Importando businesses...');
    for (const business of data.businesses || []) {
      await postgresPrisma.business.create({
        data: {
          id: business.id,
          name: business.name,
          slug: business.slug,
          subdomain: business.subdomain,
          description: business.description,
          address: business.address,
          phone: business.phone,
          email: business.email,
          website: business.website,
          settings: business.settings,
          isActive: business.isActive,
          trialEndsAt: business.trialEndsAt ? new Date(business.trialEndsAt) : null,
          subscriptionStatus: business.subscriptionStatus,
          createdAt: new Date(business.createdAt),
          updatedAt: new Date(business.updatedAt)
        }
      });
    }

    // 2. Users
    console.log('👥 Importando users...');
    for (const user of data.users || []) {
      await postgresPrisma.user.create({
        data: {
          id: user.id,
          businessId: user.businessId,
          email: user.email,
          password: user.password,
          name: user.name,
          role: user.role,
          isActive: user.isActive,
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt)
        }
      });
    }

    // 3. Locations
    console.log('📍 Importando locations...');
    for (const location of data.locations || []) {
      await postgresPrisma.location.create({
        data: {
          id: location.id,
          businessId: location.businessId,
          name: location.name,
          address: location.address,
          phone: location.phone,
          isActive: location.isActive,
          createdAt: new Date(location.createdAt),
          updatedAt: new Date(location.updatedAt)
        }
      });
    }

    // 4. MenuCategories
    console.log('📋 Importando categorías de menú...');
    for (const category of data.menuCategories || []) {
      await postgresPrisma.menuCategory.create({
        data: {
          id: category.id,
          businessId: category.businessId,
          name: category.name,
          description: category.description,
          order: category.order,
          isActive: category.isActive,
          createdAt: new Date(category.createdAt),
          updatedAt: new Date(category.updatedAt)
        }
      });
    }

    // 5. MenuItems
    console.log('🍽️ Importando items de menú...');
    for (const item of data.menuItems || []) {
      await postgresPrisma.menuItem.create({
        data: {
          id: item.id,
          categoryId: item.categoryId,
          name: item.name,
          description: item.description,
          price: item.price,
          image: item.image,
          puntosRequeridos: item.puntosRequeridos,
          isActive: item.isActive,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt)
        }
      });
    }

    // 6. Clientes
    console.log('👤 Importando clientes...');
    for (const cliente of data.clientes || []) {
      await postgresPrisma.cliente.create({
        data: {
          id: cliente.id,
          businessId: cliente.businessId,
          cedula: cliente.cedula,
          nombre: cliente.nombre,
          telefono: cliente.telefono,
          email: cliente.email,
          fechaNacimiento: cliente.fechaNacimiento ? new Date(cliente.fechaNacimiento) : null,
          puntosAcumulados: cliente.puntosAcumulados,
          isActive: cliente.isActive,
          createdAt: new Date(cliente.createdAt),
          updatedAt: new Date(cliente.updatedAt)
        }
      });
    }

    // 7. TarjetaLealtad
    console.log('💳 Importando tarjetas de lealtad...');
    for (const tarjeta of data.tarjetasLealtad || []) {
      await postgresPrisma.tarjetaLealtad.create({
        data: {
          id: tarjeta.id,
          clienteId: tarjeta.clienteId,
          puntos: tarjeta.puntos,
          nivel: tarjeta.nivel,
          fechaUltimaActividad: new Date(tarjeta.fechaUltimaActividad),
          isActive: tarjeta.isActive,
          createdAt: new Date(tarjeta.createdAt),
          updatedAt: new Date(tarjeta.updatedAt)
        }
      });
    }

    // 8. Consumos
    console.log('🛒 Importando consumos...');
    for (const consumo of data.consumos || []) {
      await postgresPrisma.consumo.create({
        data: {
          id: consumo.id,
          clienteId: consumo.clienteId,
          amount: consumo.amount,
          points: consumo.points,
          description: consumo.description,
          registeredAt: new Date(consumo.registeredAt),
          createdAt: new Date(consumo.createdAt)
        }
      });
    }

    // 9. HistorialCanje
    console.log('🎁 Importando historial de canjes...');
    for (const historial of data.historialCanjes || []) {
      await postgresPrisma.historialCanje.create({
        data: {
          id: historial.id,
          clienteId: historial.clienteId,
          menuItemId: historial.menuItemId,
          puntosUtilizados: historial.puntosUtilizados,
          fechaCanje: new Date(historial.fechaCanje),
          createdAt: new Date(historial.createdAt)
        }
      });
    }

    // 10. Visitas
    console.log('📅 Importando visitas...');
    for (const visita of data.visitas || []) {
      await postgresPrisma.visita.create({
        data: {
          id: visita.id,
          clienteId: visita.clienteId,
          fecha: new Date(visita.fecha),
          notas: visita.notas,
          createdAt: new Date(visita.createdAt)
        }
      });
    }

    console.log('✅ Importación completada exitosamente!');

    // Validar datos importados
    console.log('\n🔍 Validando datos importados...');
    const importedStats = {
      businesses: await postgresPrisma.business.count(),
      users: await postgresPrisma.user.count(),
      locations: await postgresPrisma.location.count(),
      menuCategories: await postgresPrisma.menuCategory.count(),
      menuItems: await postgresPrisma.menuItem.count(),
      clientes: await postgresPrisma.cliente.count(),
      tarjetasLealtad: await postgresPrisma.tarjetaLealtad.count(),
      consumos: await postgresPrisma.consumo.count(),
      historialCanjes: await postgresPrisma.historialCanje.count(),
      visitas: await postgresPrisma.visita.count()
    };

    console.log('📊 Comparación de datos:');
    Object.entries(data.statistics || {}).forEach(([key, originalValue]) => {
      const importedValue = importedStats[key] || 0;
      const status = originalValue === importedValue ? '✅' : '❌';
      console.log(`${status} ${key}: Original(${originalValue}) vs Importado(${importedValue})`);
    });

    return { success: true, stats: importedStats };

  } catch (error) {
    console.error('❌ Error durante la importación:', error);
    return { success: false, error: error.message };
  } finally {
    await postgresPrisma.$disconnect();
  }
}

// Función de verificación de conexión PostgreSQL
async function testPostgreSQLConnection() {
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Conexión a PostgreSQL exitosa');
    return true;
  } catch (error) {
    console.error('❌ Error de conexión a PostgreSQL:', error.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Función principal
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--test-connection')) {
    await testPostgreSQLConnection();
  } else {
    console.log('🔗 Verificando conexión PostgreSQL...');
    const connectionOk = await testPostgreSQLConnection();
    
    if (!connectionOk) {
      console.log('\n❌ No se puede conectar a PostgreSQL. Verifica:');
      console.log('1. PostgreSQL está ejecutándose');
      console.log('2. DATABASE_URL en .env.local es correcta');
      console.log('3. Base de datos existe');
      console.log('4. Credenciales son válidas');
      return;
    }

    const result = await importToPostgreSQL();
    
    if (result.success) {
      console.log('\n🎯 Migración completada exitosamente!');
      console.log('\n🔄 Próximos pasos:');
      console.log('1. Ejecutar: npm run test');
      console.log('2. Verificar funcionalidades críticas');
      console.log('3. Ejecutar validación completa');
    }
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { importToPostgreSQL, testPostgreSQLConnection };
