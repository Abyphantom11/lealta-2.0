// Auditoría completa de aislamiento por cliente - Detectar clientes en múltiples negocios
const { PrismaClient } = require('@prisma/client');

async function auditClientIsolation() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 AUDITORÍA COMPLETA DE AISLAMIENTO POR CLIENTE');
    console.log('='.repeat(70));
    
    const casaSaborId = 'cmgf5px5f0000eyy0elci9yds'; // Casa del Sabor Demo
    const loveMeSkyId = 'cmgh621rd0012lb0aixrzpvrw'; // Love Me Sky (usuario real)
    
    // 1. BUSCAR TODOS LOS CLIENTES DUPLICADOS POR NOMBRE
    console.log('🔍 1. BUSCANDO CLIENTES DUPLICADOS POR NOMBRE...');
    console.log('-'.repeat(50));
    
    const clientesDuplicadosPorNombre = await prisma.$queryRaw`
      SELECT 
        LOWER(TRIM(nombre)) as nombre_normalizado,
        COUNT(*) as total_registros,
        STRING_AGG(DISTINCT "businessId", ', ') as business_ids,
        STRING_AGG(DISTINCT cedula, ', ') as cedulas,
        STRING_AGG(DISTINCT nombre, ', ') as nombres_originales
      FROM "Cliente" 
      WHERE "businessId" IN (${casaSaborId}, ${loveMeSkyId})
      GROUP BY LOWER(TRIM(nombre))
      HAVING COUNT(*) > 1
      ORDER BY COUNT(*) DESC
    `;
    
    console.log(`📊 Nombres duplicados encontrados: ${clientesDuplicadosPorNombre.length}`);
    
    for (const duplicado of clientesDuplicadosPorNombre) {
      console.log(`\n🔍 NOMBRE: "${duplicado.nombres_originales}"`);
      console.log(`   Total registros: ${duplicado.total_registros}`);
      console.log(`   Cédulas: ${duplicado.cedulas}`);
      
      // Obtener detalles de cada registro
      const detallesCliente = await prisma.cliente.findMany({
        where: {
          nombre: {
            contains: duplicado.nombre_normalizado.trim(),
            mode: 'insensitive'
          },
          businessId: {
            in: [casaSaborId, loveMeSkyId]
          }
        },
        include: {
          business: {
            select: { name: true, subdomain: true }
          },
          _count: {
            select: {
              consumos: true,
              visitas: true
            }
          }
        }
      });
      
      detallesCliente.forEach(cliente => {
        const businessName = cliente.businessId === casaSaborId ? 'Casa del Sabor Demo' : 'Love Me Sky';
        console.log(`   📋 ${businessName}:`);
        console.log(`      - ID: ${cliente.id}`);
        console.log(`      - Cédula: ${cliente.cedula}`);
        console.log(`      - Teléfono: ${cliente.telefono || 'N/A'}`);
        console.log(`      - Email: ${cliente.email || 'N/A'}`);
        console.log(`      - Puntos: ${cliente.puntos}`);
        console.log(`      - Consumos: ${cliente._count.consumos}`);
        console.log(`      - Visitas: ${cliente._count.visitas}`);
        console.log(`      - Creado: ${cliente.createdAt}`);
      });
    }
    
    // 2. BUSCAR CLIENTES DUPLICADOS POR CÉDULA
    console.log('\n\n🔍 2. BUSCANDO CLIENTES DUPLICADOS POR CÉDULA...');
    console.log('-'.repeat(50));
    
    const clientesDuplicadosPorCedula = await prisma.$queryRaw`
      SELECT 
        cedula,
        COUNT(*) as total_registros,
        STRING_AGG(DISTINCT nombre, ', ') as nombres,
        STRING_AGG(DISTINCT "businessId", ', ') as business_ids
      FROM "Cliente" 
      WHERE "businessId" IN (${casaSaborId}, ${loveMeSkyId})
        AND cedula IS NOT NULL
        AND cedula != ''
      GROUP BY cedula
      HAVING COUNT(*) > 1
      ORDER BY COUNT(*) DESC
    `;
    
    console.log(`📊 Cédulas duplicadas encontradas: ${clientesDuplicadosPorCedula.length}`);
    
    for (const duplicado of clientesDuplicadosPorCedula) {
      console.log(`\n🆔 CÉDULA: ${duplicado.cedula}`);
      console.log(`   Total registros: ${duplicado.total_registros}`);
      console.log(`   Nombres: ${duplicado.nombres}`);
      
      // Detalles por cédula
      const detallesCedula = await prisma.cliente.findMany({
        where: {
          cedula: duplicado.cedula,
          businessId: {
            in: [casaSaborId, loveMeSkyId]
          }
        },
        include: {
          business: {
            select: { name: true, subdomain: true }
          },
          _count: {
            select: {
              consumos: true,
              visitas: true
            }
          }
        }
      });
      
      detallesCedula.forEach(cliente => {
        const businessName = cliente.businessId === casaSaborId ? 'Casa del Sabor Demo' : 'Love Me Sky';
        console.log(`   📋 ${businessName}:`);
        console.log(`      - Nombre: ${cliente.nombre}`);
        console.log(`      - Teléfono: ${cliente.telefono || 'N/A'}`);
        console.log(`      - Puntos: ${cliente.puntos}`);
        console.log(`      - Actividad: ${cliente._count.consumos} consumos, ${cliente._count.visitas} visitas`);
      });
    }
    
    // 3. BUSCAR CLIENTES DUPLICADOS POR TELÉFONO
    console.log('\n\n🔍 3. BUSCANDO CLIENTES DUPLICADOS POR TELÉFONO...');
    console.log('-'.repeat(50));
    
    const clientesDuplicadosPorTelefono = await prisma.$queryRaw`
      SELECT 
        telefono,
        COUNT(*) as total_registros,
        STRING_AGG(DISTINCT nombre, ', ') as nombres,
        STRING_AGG(DISTINCT cedula, ', ') as cedulas
      FROM "Cliente" 
      WHERE "businessId" IN (${casaSaborId}, ${loveMeSkyId})
        AND telefono IS NOT NULL
        AND telefono != ''
        AND LENGTH(telefono) > 5
      GROUP BY telefono
      HAVING COUNT(*) > 1
      ORDER BY COUNT(*) DESC
    `;
    
    console.log(`📊 Teléfonos duplicados encontrados: ${clientesDuplicadosPorTelefono.length}`);
    
    for (const duplicado of clientesDuplicadosPorTelefono) {
      console.log(`\n📞 TELÉFONO: ${duplicado.telefono}`);
      console.log(`   Total registros: ${duplicado.total_registros}`);
      console.log(`   Nombres: ${duplicado.nombres}`);
      console.log(`   Cédulas: ${duplicado.cedulas}`);
    }
    
    // 4. ESTADÍSTICAS GENERALES
    console.log('\n\n📊 4. ESTADÍSTICAS GENERALES DE AISLAMIENTO');
    console.log('-'.repeat(50));
    
    const totalClientesCasaSabor = await prisma.cliente.count({
      where: { businessId: casaSaborId }
    });
    
    const totalClientesLoveMeSky = await prisma.cliente.count({
      where: { businessId: loveMeSkyId }
    });
    
    const totalDuplicadosNombre = clientesDuplicadosPorNombre.length;
    const totalDuplicadosCedula = clientesDuplicadosPorCedula.length;
    const totalDuplicadosTelefono = clientesDuplicadosPorTelefono.length;
    
    console.log(`📈 RESUMEN ESTADÍSTICO:`);
    console.log(`   Casa del Sabor Demo: ${totalClientesCasaSabor} clientes`);
    console.log(`   Love Me Sky: ${totalClientesLoveMeSky} clientes`);
    console.log(`   Duplicados por nombre: ${totalDuplicadosNombre}`);
    console.log(`   Duplicados por cédula: ${totalDuplicadosCedula}`);
    console.log(`   Duplicados por teléfono: ${totalDuplicadosTelefono}`);
    
    // 5. ANÁLISIS DE IMPACTO
    console.log('\n\n🎯 5. ANÁLISIS DE IMPACTO Y RECOMENDACIONES');
    console.log('-'.repeat(50));
    
    const porcentajeDuplicacion = ((totalDuplicadosNombre + totalDuplicadosCedula) / (totalClientesCasaSabor + totalClientesLoveMeSky)) * 100;
    
    console.log(`📊 NIVEL DE DUPLICACIÓN: ${porcentajeDuplicacion.toFixed(2)}%`);
    
    if (porcentajeDuplicacion > 10) {
      console.log('🚨 NIVEL CRÍTICO: Alta duplicación de clientes entre negocios');
    } else if (porcentajeDuplicacion > 5) {
      console.log('⚠️ NIVEL MEDIO: Duplicación moderada que requiere atención');
    } else {
      console.log('✅ NIVEL BAJO: Duplicación mínima, dentro de lo normal');
    }
    
    console.log('\n💡 RECOMENDACIONES:');
    
    if (totalDuplicadosNombre > 0) {
      console.log('1. 🔍 Revisar manualmente cada cliente duplicado');
      console.log('2. 🔄 Implementar validación cross-business en registro');
      console.log('3. 📋 Crear política de manejo de clientes multi-negocio');
    }
    
    if (totalDuplicadosCedula > 0) {
      console.log('4. 🆔 Implementar validación única de cédula por ecosistema');
      console.log('5. 🔗 Considerar sistema de cliente unificado opcional');
    }
    
    if (totalDuplicadosTelefono > 0) {
      console.log('6. 📞 Validar unicidad de teléfonos en el registro');
    }
    
    console.log('\n⚡ ACCIONES INMEDIATAS:');
    console.log('1. 📝 Documentar todos los casos encontrados');
    console.log('2. 🤝 Contactar clientes afectados para clarificar intención');
    console.log('3. 🛡️ Implementar validaciones preventivas');
    console.log('4. 📊 Monitorear duplicaciones futuras');
    
  } catch (error) {
    console.error('❌ Error en auditoría:', error);
  } finally {
    await prisma.$disconnect();
  }
}

auditClientIsolation().catch(console.error);
