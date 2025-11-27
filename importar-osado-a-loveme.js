const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function importarOsadoALoveMe() {
  try {
    console.log('🚀 Iniciando importación de clientes Osado a Love Me Sky...\n');
    
    // Leer los datos extraídos de Osado
    const datosOsado = JSON.parse(fs.readFileSync('clientes-osado-extraidos.json', 'utf8'));
    console.log(`📊 Total de clientes Osado a importar: ${datosOsado.length}`);
    
    // Buscar el business Love Me Sky
    const loveMeBusiness = await prisma.business.findFirst({
      where: {
        name: {
          contains: 'Love Me Sky',
          mode: 'insensitive'
        }
      }
    });
    
    if (!loveMeBusiness) {
      console.log('❌ No se encontró el business Love Me Sky');
      return;
    }
    
    console.log(`✅ Business encontrado: ${loveMeBusiness.name} (ID: ${loveMeBusiness.id})`);
    
    let importados = 0;
    let errores = 0;
    let duplicados = 0;
    
    console.log('\n🔄 Comenzando importación...\n');
    
    for (let i = 0; i < datosOsado.length; i++) {
      const cliente = datosOsado[i];
      
      try {
        // Verificar si ya existe por email o teléfono
        const existeCliente = await prisma.client.findFirst({
          where: {
            businessId: loveMeBusiness.id,
            OR: [
              { email: cliente.email || undefined },
              { phone: cliente.telefono || undefined }
            ].filter(Boolean)
          }
        });
        
        if (existeCliente) {
          duplicados++;
          if (i % 100 === 0) console.log(`⚠️  Cliente ${i + 1}: Ya existe - ${cliente.nombre || 'Sin nombre'}`);
          continue;
        }
        
        // Crear nuevo cliente
        const nuevoCliente = await prisma.client.create({
          data: {
            businessId: loveMeBusiness.id,
            name: cliente.nombre || 'Cliente Osado',
            email: cliente.email || null,
            phone: cliente.telefono || null,
            identificacion: cliente.cedula || null,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        
        importados++;
        
        // Mostrar progreso cada 100 clientes
        if (i % 100 === 0) {
          console.log(`✅ Cliente ${i + 1}: ${nuevoCliente.name} - ${nuevoCliente.email || nuevoCliente.phone || 'Sin contacto'}`);
        }
        
      } catch (error) {
        errores++;
        if (i % 100 === 0) console.log(`❌ Error cliente ${i + 1}: ${error.message}`);
      }
    }
    
    console.log('\n📊 RESUMEN DE IMPORTACIÓN:');
    console.log(`✅ Clientes importados: ${importados}`);
    console.log(`⚠️  Clientes duplicados: ${duplicados}`);
    console.log(`❌ Errores: ${errores}`);
    console.log(`📈 Total procesados: ${datosOsado.length}`);
    
    // Verificar total de clientes en Love Me Sky
    const totalClientes = await prisma.client.count({
      where: { businessId: loveMeBusiness.id }
    });
    
    console.log(`\n🎯 Total clientes en Love Me Sky ahora: ${totalClientes}`);
    
  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar importación
importarOsadoALoveMe();
