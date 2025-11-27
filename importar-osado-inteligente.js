const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function verificarEImportarOsado() {
  try {
    console.log('🔍 Verificando clientes existentes y preparando importación...\n');
    
    const datosOsado = JSON.parse(fs.readFileSync('clientes-osado-extraidos.json', 'utf8'));
    const businessId = 'cmgh621rd0012lb0aixrzpvrw';
    
    console.log(`📊 Total clientes Osado: ${datosOsado.length}`);
    
    // Obtener clientes existentes
    const clientesExistentes = await prisma.cliente.findMany({
      where: { businessId },
      select: { cedula: true, correo: true, telefono: true }
    });
    
    console.log(`🏢 Clientes existentes en Love Me Sky: ${clientesExistentes.length}`);
    
    const cedulasExistentes = new Set(clientesExistentes.map(c => c.cedula));
    const emailsExistentes = new Set(clientesExistentes.map(c => c.correo).filter(Boolean));
    const telefonosExistentes = new Set(clientesExistentes.map(c => c.telefono).filter(Boolean));
    
    let clientesNuevos = [];
    let duplicados = 0;
    let sinNombre = 0;
    
    console.log('🔄 Filtrando clientes nuevos...\n');
    
    for (let i = 0; i < datosOsado.length; i++) {
      const cliente = datosOsado[i];
      
      if (!cliente.nombre) {
        sinNombre++;
        continue;
      }
      
      // Verificar duplicados
      const esDuplicado = 
        (cliente.cedula && cedulasExistentes.has(cliente.cedula)) ||
        (cliente.email && emailsExistentes.has(cliente.email)) ||
        (cliente.telefono && telefonosExistentes.has(cliente.telefono));
      
      if (esDuplicado) {
        duplicados++;
        continue;
      }
      
      // Generar cédula única si no tiene
      let cedula = cliente.cedula || `OSADO_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 5)}`;
      
      // Asegurar que la cédula sea única
      let contador = 0;
      while (cedulasExistentes.has(cedula)) {
        contador++;
        cedula = `OSADO_${Date.now()}_${i}_${contador}_${Math.random().toString(36).substr(2, 5)}`;
      }
      
      cedulasExistentes.add(cedula);
      
      clientesNuevos.push({
        id: `osado_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`,
        businessId,
        cedula,
        nombre: cliente.nombre,
        correo: cliente.email || '',
        telefono: cliente.telefono || '',
        registeredAt: new Date()
      });
      
      if (i % 500 === 0) {
        console.log(`✅ Procesado ${i + 1} clientes...`);
      }
    }
    
    console.log(`\n📊 ANÁLISIS:`);
    console.log(`✅ Clientes nuevos para importar: ${clientesNuevos.length}`);
    console.log(`⚠️  Clientes duplicados omitidos: ${duplicados}`);
    console.log(`❌ Sin nombre omitidos: ${sinNombre}`);
    
    if (clientesNuevos.length > 0) {
      console.log(`\n🚀 Iniciando importación de ${clientesNuevos.length} clientes nuevos...`);
      
      // Importar en batches de 100
      const batchSize = 100;
      let importados = 0;
      
      for (let i = 0; i < clientesNuevos.length; i += batchSize) {
        const batch = clientesNuevos.slice(i, i + batchSize);
        
        try {
          await prisma.cliente.createMany({
            data: batch,
            skipDuplicates: true
          });
          
          importados += batch.length;
          console.log(`✅ Importados ${importados}/${clientesNuevos.length} clientes`);
          
        } catch (error) {
          console.log(`❌ Error en batch ${i/batchSize + 1}:`, error.message);
        }
      }
      
      // Verificar total final
      const totalFinal = await prisma.cliente.count({
        where: { businessId }
      });
      
      console.log(`\n🎯 RESULTADO FINAL:`);
      console.log(`📈 Total clientes en Love Me Sky: ${totalFinal}`);
      console.log(`➕ Clientes agregados de Osado: ${importados}`);
      console.log(`💾 Base de datos actualizada exitosamente!`);
      
    } else {
      console.log(`\n⚠️ No hay clientes nuevos para importar`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificarEImportarOsado();
