const fs = require('fs');

async function generarSQLClientesOsado() {
  try {
    console.log('🚀 Generando SQL para tabla Cliente (modelo correcto)...\n');
    
    // Leer los datos extraídos
    const datosOsado = JSON.parse(fs.readFileSync('clientes-osado-extraidos.json', 'utf8'));
    console.log(`📊 Total de clientes Osado: ${datosOsado.length}`);
    
    // Crear archivo SQL para importación directa
    let sqlInserts = [];
    
    // Business ID de Love Me Sky 
    const businessId = 'cmgh621rd0012lb0aixrzpvrw';
    
    console.log('📝 Generando inserts SQL para modelo Cliente...\n');
    
    let validClientes = 0;
    
    for (let i = 0; i < datosOsado.length; i++) {
      const cliente = datosOsado[i];
      
      // Validar que tenga al menos nombre o contacto
      if (!cliente.nombre && !cliente.email && !cliente.telefono) {
        continue;
      }
      
      const nombre = (cliente.nombre || 'Cliente Osado').replaceAll("'", "''");
      const correo = (cliente.email || '').replaceAll("'", "''");
      const telefono = (cliente.telefono || '').replaceAll("'", "''");
      const cedula = (cliente.cedula || '').replaceAll("'", "''");
      const ahora = new Date().toISOString();
      
      // Generar ID único
      const id = `osado_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`;
      
      const sqlInsert = `INSERT INTO "Cliente" ("id", "businessId", "cedula", "nombre", "correo", "telefono", "registeredAt") VALUES ('${id}', '${businessId}', '${cedula}', '${nombre}', '${correo}', '${telefono}', '${ahora}');`;
      
      sqlInserts.push(sqlInsert);
      validClientes++;
      
      if (i % 500 === 0) {
        console.log(`✅ Procesado cliente ${i + 1}: ${cliente.nombre || 'Sin nombre'}`);
      }
    }
    
    // Guardar archivo SQL
    const sqlContent = sqlInserts.join('\n');
    fs.writeFileSync('importar-clientes-osado-final.sql', sqlContent);
    
    console.log(`\n📊 RESUMEN:`);
    console.log(`✅ Clientes válidos para importar: ${validClientes}`);
    console.log(`📁 Archivo SQL generado: importar-clientes-osado-final.sql`);
    console.log(`\n🎯 Para importar ejecuta:`);
    console.log(`   npx prisma db execute --file ./importar-clientes-osado-final.sql --schema ./prisma/schema.prisma`);
    
    // También crear un archivo de verificación
    const resumen = {
      totalExtraidos: datosOsado.length,
      validosParaImportar: validClientes,
      businessId: businessId,
      businessName: 'Love Me Sky',
      fechaGeneracion: new Date().toISOString(),
      comando: 'npx prisma db execute --file ./importar-clientes-osado-final.sql --schema ./prisma/schema.prisma',
      modeloUsado: 'Cliente',
      camposImportados: ['id', 'businessId', 'cedula', 'nombre', 'correo', 'telefono', 'registeredAt']
    };
    
    fs.writeFileSync('resumen-importacion-final.json', JSON.stringify(resumen, null, 2));
    console.log(`📋 Resumen guardado en: resumen-importacion-final.json`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

generarSQLClientesOsado();
