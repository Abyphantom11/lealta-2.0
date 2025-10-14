// PLAN DE REPARACIÓN INMEDIATA - BREACH DE BUSINESS ISOLATION
const { PrismaClient } = require('@prisma/client');

async function fixBusinessIsolationBreach() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🚨 REPARACIÓN DE BREACH DE BUSINESS ISOLATION');
    console.log('='.repeat(60));
    
    const casaSaborId = 'cmgf5px5f0000eyy0elci9yds'; // Casa del Sabor Demo
    const loveMeSkyId = 'cmgh621rd0012lb0aixrzpvrw'; // Love Me Sky (usuario real)
    
    // 1. ANALIZAR EL CLIENTE COMPARTIDO
    console.log('🔍 1. ANALIZANDO CLIENTE COMPARTIDO...');
    
    const clientesCedula = '1762075776'; // José
    
    const clienteCasaSabor = await prisma.cliente.findFirst({
      where: { 
        cedula: clientesCedula,
        businessId: casaSaborId
      },
      include: {
        consumos: true,
        visitas: true
      }
    });
    
    const clienteLoveMeSky = await prisma.cliente.findFirst({
      where: { 
        cedula: clientesCedula,
        businessId: loveMeSkyId
      },
      include: {
        consumos: true,
        visitas: true
      }
    });
    
    console.log('\n📊 DETALLES DEL CLIENTE DUPLICADO:');
    console.log(`   Cédula: ${clientesCedula}`);
    
    if (clienteCasaSabor) {
      console.log(`\n   EN CASA DEL SABOR DEMO:`);
      console.log(`     - ID: ${clienteCasaSabor.id}`);
      console.log(`     - Nombre: ${clienteCasaSabor.nombre}`);
      console.log(`     - Email: ${clienteCasaSabor.email || 'N/A'}`);
      console.log(`     - Teléfono: ${clienteCasaSabor.telefono || 'N/A'}`);
      console.log(`     - Puntos: ${clienteCasaSabor.puntos}`);
      console.log(`     - Consumos: ${clienteCasaSabor.consumos?.length || 0}`);
      console.log(`     - Visitas: ${clienteCasaSabor.visitas?.length || 0}`);
      console.log(`     - Creado: ${clienteCasaSabor.createdAt}`);
    }
    
    if (clienteLoveMeSky) {
      console.log(`\n   EN LOVE ME SKY (USUARIO REAL):`);
      console.log(`     - ID: ${clienteLoveMeSky.id}`);
      console.log(`     - Nombre: ${clienteLoveMeSky.nombre}`);
      console.log(`     - Email: ${clienteLoveMeSky.email || 'N/A'}`);
      console.log(`     - Teléfono: ${clienteLoveMeSky.telefono || 'N/A'}`);
      console.log(`     - Puntos: ${clienteLoveMeSky.puntos}`);
      console.log(`     - Consumos: ${clienteLoveMeSky.consumos?.length || 0}`);
      console.log(`     - Visitas: ${clienteLoveMeSky.visitas?.length || 0}`);
      console.log(`     - Creado: ${clienteLoveMeSky.createdAt}`);
    }
    
    // 2. DETERMINAR CUÁL ES EL LEGÍTIMO
    console.log('\n🎯 2. DETERMINANDO CLIENTE LEGÍTIMO...');
    
    let clienteLegitimo, clienteDemo;
    
    if (clienteLoveMeSky && clienteCasaSabor) {
      // El que tiene más actividad o fue creado primero es probablemente el legítimo
      const actividadLoveMeSky = (clienteLoveMeSky.consumos?.length || 0) + (clienteLoveMeSky.visitas?.length || 0);
      const actividadCasaSabor = (clienteCasaSabor.consumos?.length || 0) + (clienteCasaSabor.visitas?.length || 0);
      
      console.log(`   Actividad Love Me Sky: ${actividadLoveMeSky} (consumos + visitas)`);
      console.log(`   Actividad Casa del Sabor: ${actividadCasaSabor} (consumos + visitas)`);
      console.log(`   Fecha Love Me Sky: ${clienteLoveMeSky.createdAt}`);
      console.log(`   Fecha Casa del Sabor: ${clienteCasaSabor.createdAt}`);
      
      // Love Me Sky es un negocio real, Casa del Sabor es demo
      // El cliente en Love Me Sky es probablemente el legítimo
      clienteLegitimo = clienteLoveMeSky;
      clienteDemo = clienteCasaSabor;
      
      console.log(`\n   💡 DECISIÓN: Cliente en Love Me Sky es LEGÍTIMO (negocio real)`);
      console.log(`   💡 Cliente en Casa del Sabor es DEMO/DUPLICADO (debe eliminarse)`);
    }
    
    // 3. PLAN DE ACCIÓN
    console.log('\n🛠️ 3. PLAN DE ACCIÓN RECOMENDADO:');
    console.log(`\n   OPCIÓN A - ELIMINACIÓN DEL DUPLICADO (RECOMENDADO):`);
    console.log(`     1. ❌ Eliminar cliente de Casa del Sabor Demo (ID: ${clienteDemo?.id})`);
    console.log(`     2. ❌ Eliminar consumos asociados (${clienteDemo?.consumos?.length || 0})`);
    console.log(`     3. ❌ Eliminar visitas asociadas (${clienteDemo?.visitas?.length || 0})`);
    console.log(`     4. ✅ Mantener cliente en Love Me Sky intacto`);
    
    console.log(`\n   OPCIÓN B - CAMBIO DE CÉDULA (ALTERNATIVA):`);
    console.log(`     1. 🔄 Cambiar cédula del cliente demo a una ficticia`);
    console.log(`     2. ✅ Mantener ambos clientes pero con cédulas diferentes`);
    
    // 4. VERIFICAR OTROS POSIBLES DUPLICADOS
    console.log('\n🔍 4. BUSCANDO OTROS DUPLICADOS...');
    
    const otrosDuplicados = await prisma.$queryRaw`
      SELECT c1.cedula, c1.nombre, COUNT(*) as negocios_count
      FROM "Cliente" c1
      GROUP BY c1.cedula, c1.nombre
      HAVING COUNT(*) > 1
      LIMIT 10
    `;
    
    console.log(`   Otros posibles duplicados encontrados: ${otrosDuplicados.length}`);
    otrosDuplicados.forEach(dup => {
      console.log(`     - "${dup.nombre}" (${dup.cedula}) en ${dup.negocios_count} negocios`);
    });
    
    console.log('\n⚠️ ACCIÓN REQUERIDA:');
    console.log('1. 🚨 Revisar y aprobar el plan de eliminación');
    console.log('2. 🔍 Auditar todos los duplicados encontrados');
    console.log('3. 🛡️ Implementar validaciones para prevenir futuros duplicados');
    console.log('4. 📋 Documentar el incidente de seguridad');
    
    console.log('\n❓ ¿PROCEDER CON LA ELIMINACIÓN? (Se requerirá confirmación manual)');
    
  } catch (error) {
    console.error('❌ Error en reparación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixBusinessIsolationBreach().catch(console.error);
