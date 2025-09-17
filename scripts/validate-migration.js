const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function validateMigration() {
  const postgresPrisma = new PrismaClient();

  try {
    console.log('🔍 Iniciando validación completa de migración...');

    // Buscar archivo de backup más reciente
    const backupFiles = fs.readdirSync(process.cwd())
      .filter(file => file.startsWith('backup-data-') && file.endsWith('.json'))
      .sort()
      .reverse();

    if (backupFiles.length === 0) {
      throw new Error('❌ No se encontró archivo de backup para comparar.');
    }

    const backupFile = backupFiles[0];
    const originalData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));

    console.log(`📂 Comparando con: ${backupFile}`);

    // Verificar conexión
    await postgresPrisma.$connect();
    console.log('✅ Conexión a PostgreSQL establecida');

    // Comparar conteos de registros
    console.log('\n📊 Comparando cantidad de registros...');
    
    const postgresStats = {
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

    const originalStats = originalData.statistics || {};
    let allMatch = true;

    Object.entries(originalStats).forEach(([key, originalValue]) => {
      const postgresValue = postgresStats[key] || 0;
      const matches = originalValue === postgresValue;
      const status = matches ? '✅' : '❌';
      
      if (!matches) allMatch = false;
      
      console.log(`${status} ${key}: Original(${originalValue}) vs PostgreSQL(${postgresValue})`);
    });

    // Validaciones de integridad referencial
    console.log('\n🔗 Validando integridad referencial...');
    const referentialChecks = [];

    // 1. Todos los users tienen businessId válido
    const orphanUsers = await postgresPrisma.user.findMany({
      where: {
        business: null
      }
    });
    
    if (orphanUsers.length > 0) {
      referentialChecks.push({
        type: 'error',
        message: `${orphanUsers.length} users sin business válido`
      });
    } else {
      referentialChecks.push({
        type: 'success',
        message: 'Todos los users tienen business válido'
      });
    }

    // 2. Todos los clientes tienen businessId válido
    const orphanClientes = await postgresPrisma.cliente.findMany({
      where: {
        business: null
      }
    });
    
    if (orphanClientes.length > 0) {
      referentialChecks.push({
        type: 'error',
        message: `${orphanClientes.length} clientes sin business válido`
      });
    } else {
      referentialChecks.push({
        type: 'success',
        message: 'Todos los clientes tienen business válido'
      });
    }

    // 3. Todas las tarjetas tienen cliente válido
    const orphanTarjetas = await postgresPrisma.tarjetaLealtad.findMany({
      where: {
        cliente: null
      }
    });
    
    if (orphanTarjetas.length > 0) {
      referentialChecks.push({
        type: 'error',
        message: `${orphanTarjetas.length} tarjetas sin cliente válido`
      });
    } else {
      referentialChecks.push({
        type: 'success',
        message: 'Todas las tarjetas tienen cliente válido'
      });
    }

    // 4. Todos los consumos tienen cliente válido
    const orphanConsumos = await postgresPrisma.consumo.findMany({
      where: {
        cliente: null
      }
    });
    
    if (orphanConsumos.length > 0) {
      referentialChecks.push({
        type: 'error',
        message: `${orphanConsumos.length} consumos sin cliente válido`
      });
    } else {
      referentialChecks.push({
        type: 'success',
        message: 'Todos los consumos tienen cliente válido'
      });
    }

    // Mostrar resultados de integridad
    referentialChecks.forEach(check => {
      const icon = check.type === 'error' ? '❌' : '✅';
      console.log(`${icon} ${check.message}`);
    });

    // Validaciones de negocio específicas
    console.log('\n🏪 Validando reglas de negocio...');
    const businessChecks = [];

    // 1. Verificar unicidad de cédulas por business
    const duplicateCedulas = await postgresPrisma.$queryRaw`
      SELECT "businessId", "cedula", COUNT(*) as count
      FROM "Cliente"
      GROUP BY "businessId", "cedula"
      HAVING COUNT(*) > 1
    `;

    if (duplicateCedulas.length > 0) {
      businessChecks.push({
        type: 'warning',
        message: `${duplicateCedulas.length} cédulas duplicadas por business`
      });
    } else {
      businessChecks.push({
        type: 'success',
        message: 'Cédulas únicas por business verificadas'
      });
    }

    // 2. Verificar consistencia de puntos
    const inconsistentPoints = await postgresPrisma.cliente.findMany({
      where: {
        OR: [
          { puntosAcumulados: { lt: 0 } },
          { puntosAcumulados: null }
        ]
      }
    });

    if (inconsistentPoints.length > 0) {
      businessChecks.push({
        type: 'warning',
        message: `${inconsistentPoints.length} clientes con puntos inconsistentes`
      });
    } else {
      businessChecks.push({
        type: 'success',
        message: 'Puntos de clientes consistentes'
      });
    }

    // 3. Verificar fechas válidas
    const futureDates = await postgresPrisma.consumo.findMany({
      where: {
        registeredAt: {
          gt: new Date()
        }
      }
    });

    if (futureDates.length > 0) {
      businessChecks.push({
        type: 'warning',
        message: `${futureDates.length} consumos con fecha futura`
      });
    } else {
      businessChecks.push({
        type: 'success',
        message: 'Fechas de consumos válidas'
      });
    }

    // Mostrar resultados de negocio
    businessChecks.forEach(check => {
      const icon = check.type === 'warning' ? '⚠️' : '✅';
      console.log(`${icon} ${check.message}`);
    });

    // Pruebas funcionales básicas
    console.log('\n⚡ Ejecutando pruebas funcionales...');
    
    // 1. Buscar cliente específico
    const sampleBusiness = await postgresPrisma.business.findFirst();
    if (sampleBusiness) {
      const clienteCount = await postgresPrisma.cliente.count({
        where: { businessId: sampleBusiness.id }
      });
      console.log(`✅ Business "${sampleBusiness.name}" tiene ${clienteCount} clientes`);
    }

    // 2. Verificar joins complejos
    const clienteWithData = await postgresPrisma.cliente.findFirst({
      include: {
        business: true,
        tarjetaLealtad: true,
        consumos: true,
        historialCanjes: true
      }
    });

    if (clienteWithData) {
      console.log(`✅ Joins complejos funcionando - Cliente con ${clienteWithData.consumos.length} consumos`);
    }

    // Performance básico
    console.log('\n⏱️ Midiendo performance básico...');
    
    const startTime = Date.now();
    await postgresPrisma.cliente.findMany({
      take: 100,
      include: {
        business: true,
        tarjetaLealtad: true
      }
    });
    const queryTime = Date.now() - startTime;
    
    console.log(`⚡ Query complejo (100 clientes con relaciones): ${queryTime}ms`);

    // Resumen final
    console.log('\n📋 RESUMEN DE VALIDACIÓN:');
    
    const hasErrors = referentialChecks.some(c => c.type === 'error') || 
                     businessChecks.some(c => c.type === 'error');
    const hasWarnings = referentialChecks.some(c => c.type === 'warning') || 
                       businessChecks.some(c => c.type === 'warning');

    if (hasErrors) {
      console.log('❌ Migración tiene ERRORES críticos que deben corregirse');
    } else if (hasWarnings) {
      console.log('⚠️ Migración completada con ADVERTENCIAS - revisar issues');
    } else if (allMatch) {
      console.log('✅ Migración EXITOSA - todos los datos migrados correctamente');
    } else {
      console.log('⚠️ Migración completada con diferencias en conteos');
    }

    return {
      success: !hasErrors,
      allMatch,
      hasWarnings,
      stats: postgresStats,
      originalStats,
      referentialChecks,
      businessChecks,
      queryTime
    };

  } catch (error) {
    console.error('❌ Error durante validación:', error);
    return { success: false, error: error.message };
  } finally {
    await postgresPrisma.$disconnect();
  }
}

// Función de health check rápido
async function quickHealthCheck() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🏥 Health check rápido...');
    
    // Test básico de conexión
    await prisma.$connect();
    console.log('✅ Conexión establecida');
    
    // Test de query
    const businessCount = await prisma.business.count();
    console.log(`✅ Query exitoso: ${businessCount} businesses`);
    
    // Test de relaciones
    const businessWithUsers = await prisma.business.findFirst({
      include: { users: true }
    });
    
    if (businessWithUsers) {
      console.log(`✅ Relaciones funcionando: Business con ${businessWithUsers.users.length} users`);
    }
    
    console.log('✅ Health check completado exitosamente');
    return true;
    
  } catch (error) {
    console.error('❌ Health check falló:', error.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Función principal
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--quick')) {
    await quickHealthCheck();
  } else {
    const result = await validateMigration();
    
    if (result.success) {
      console.log('\n🎯 Validación completada. Base de datos lista para uso.');
    } else {
      console.log('\n❌ Validación falló. Revisar errores antes de continuar.');
    }
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { validateMigration, quickHealthCheck };
