const fs = require('fs');

async function generarSQLSinDuplicados() {
  try {
    console.log('🚀 Generando SQL sin duplicados ni cédulas conflictivas...\n');
    
    const datosOsado = JSON.parse(fs.readFileSync('clientes-osado-extraidos.json', 'utf8'));
    console.log(`📊 Total de clientes Osado: ${datosOsado.length}`);
    
    const businessId = 'cmgh621rd0012lb0aixrzpvrw';
    let sqlInserts = [];
    let validClientes = 0;
    let cedulasUsadas = new Set();
    
    console.log('📝 Generando inserts SQL evitando duplicados...\n');
    
    for (let i = 0; i < datosOsado.length; i++) {
      const cliente = datosOsado[i];
      
      // Validar que tenga al menos nombre
      if (!cliente.nombre) {
        continue;
      }
      
      const nombre = cliente.nombre.replaceAll("'", "''");
      const correo = (cliente.email || '').replaceAll("'", "''");
      const telefono = (cliente.telefono || '').replaceAll("'", "''");
      let cedula = (cliente.cedula || '').replaceAll("'", "''");
      
      // Si no tiene cédula o ya está usada, generar una única
      if (!cedula || cedulasUsadas.has(cedula)) {
        cedula = `OSADO_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 5)}`;
      }
      
      cedulasUsadas.add(cedula);
      
      const ahora = new Date().toISOString();
      const id = `osado_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`;
      
      const sqlInsert = `INSERT INTO "Cliente" ("id", "businessId", "cedula", "nombre", "correo", "telefono", "registeredAt") VALUES ('${id}', '${businessId}', '${cedula}', '${nombre}', '${correo}', '${telefono}', '${ahora}');`;
      
      sqlInserts.push(sqlInsert);
      validClientes++;
      
      if (i % 500 === 0) {
        console.log(`✅ Procesado cliente ${i + 1}: ${nombre}`);
      }
    }
    
    // Dividir en chunks para evitar problemas de memoria
    const chunkSize = 500;
    const chunks = [];
    for (let i = 0; i < sqlInserts.length; i += chunkSize) {
      chunks.push(sqlInserts.slice(i, i + chunkSize));
    }
    
    // Guardar archivo SQL principal
    const sqlContent = sqlInserts.join('\n');
    fs.writeFileSync('importar-osado-sin-duplicados.sql', sqlContent);
    
    // Guardar chunks separados para importación por partes
    chunks.forEach((chunk, index) => {
      const chunkContent = chunk.join('\n');
      fs.writeFileSync(`importar-osado-chunk-${index + 1}.sql`, chunkContent);
    });
    
    console.log(`\n📊 RESUMEN:`);
    console.log(`✅ Clientes válidos para importar: ${validClientes}`);
    console.log(`📁 Archivo SQL principal: importar-osado-sin-duplicados.sql`);
    console.log(`📦 Chunks generados: ${chunks.length} archivos`);
    console.log(`\n🎯 Para importar por chunks ejecuta:`);
    for (let i = 0; i < chunks.length; i++) {
      console.log(`   npx prisma db execute --file ./importar-osado-chunk-${i + 1}.sql --schema ./prisma/schema.prisma`);
    }
    
    const resumen = {
      totalExtraidos: datosOsado.length,
      validosParaImportar: validClientes,
      chunksGenerados: chunks.length,
      businessId: businessId,
      businessName: 'Love Me Sky',
      fechaGeneracion: new Date().toISOString()
    };
    
    fs.writeFileSync('resumen-chunks-osado.json', JSON.stringify(resumen, null, 2));
    console.log(`📋 Resumen guardado en: resumen-chunks-osado.json`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

generarSQLSinDuplicados();
