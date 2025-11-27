const fs = require('fs');

async function importarOsadoSimple() {
  try {
    console.log('🚀 Importación simplificada de clientes Osado...\n');
    
    // Leer los datos extraídos
    const datosOsado = JSON.parse(fs.readFileSync('clientes-osado-extraidos.json', 'utf8'));
    console.log(`📊 Total de clientes Osado: ${datosOsado.length}`);
    
    // Crear archivo SQL para importación directa
    let sqlInserts = [];
    
    // Business ID de Love Me Sky (obtenido del log anterior)
    const businessId = 'cmgh621rd0012lb0aixrzpvrw';
    
    console.log('📝 Generando inserts SQL...\n');
    
    let validClientes = 0;
    
    for (let i = 0; i < datosOsado.length; i++) {
      const cliente = datosOsado[i];
      
      // Validar que tenga al menos nombre o contacto
      if (!cliente.nombre && !cliente.email && !cliente.telefono) {
        continue;
      }
      
      const nombre = (cliente.nombre || 'Cliente Osado').replace(/'/g, "''");
      const email = cliente.email ? `'${cliente.email.replace(/'/g, "''")}'` : 'NULL';
      const telefono = cliente.telefono ? `'${cliente.telefono.replace(/'/g, "''")}'` : 'NULL';
      const cedula = cliente.cedula ? `'${cliente.cedula.replace(/'/g, "''")}'` : 'NULL';
      const ahora = new Date().toISOString();
      
      // Generar ID único (simulando cuid)
      const id = `osado_${Date.now()}_${i}`;
      
      const sqlInsert = `INSERT INTO "Client" ("id", "businessId", "name", "email", "phone", "identificacion", "createdAt", "updatedAt") VALUES ('${id}', '${businessId}', '${nombre}', ${email}, ${telefono}, ${cedula}, '${ahora}', '${ahora}');`;
      
      sqlInserts.push(sqlInsert);
      validClientes++;
      
      if (i % 500 === 0) {
        console.log(`✅ Procesado cliente ${i + 1}: ${cliente.nombre || 'Sin nombre'}`);
      }
    }
    
    // Guardar archivo SQL
    const sqlContent = sqlInserts.join('\n');
    fs.writeFileSync('importar-osado-clientes.sql', sqlContent);
    
    console.log(`\n📊 RESUMEN:`);
    console.log(`✅ Clientes válidos para importar: ${validClientes}`);
    console.log(`📁 Archivo SQL generado: importar-osado-clientes.sql`);
    console.log(`\n🎯 Para importar ejecuta:`);
    console.log(`   npx prisma db execute --file ./importar-osado-clientes.sql --schema ./prisma/schema.prisma`);
    
    // También crear un archivo de verificación
    const resumen = {
      totalExtraidos: datosOsado.length,
      validosParaImportar: validClientes,
      businessId: businessId,
      fechaGeneracion: new Date().toISOString(),
      comando: 'npx prisma db execute --file ./importar-osado-clientes.sql --schema ./prisma/schema.prisma'
    };
    
    fs.writeFileSync('resumen-importacion-osado.json', JSON.stringify(resumen, null, 2));
    console.log(`📋 Resumen guardado en: resumen-importacion-osado.json`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

importarOsadoSimple();
