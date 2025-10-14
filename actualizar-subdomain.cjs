// Script para actualizar el subdomain del negocio La Casa del Sabor - Demo
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function actualizarSubdomain() {
  console.log('🔄 Actualizando subdomain del negocio...\n');
  
  try {
    // Buscar el negocio La Casa del Sabor - Demo
    const negocioDemo = await prisma.business.findFirst({
      where: {
        name: 'La Casa del Sabor - Demo'
      }
    });
    
    if (!negocioDemo) {
      console.log('❌ No se encontró el negocio "La Casa del Sabor - Demo"');
      return;
    }
    
    console.log(`📋 Negocio encontrado:`);
    console.log(`   ID: ${negocioDemo.id}`);
    console.log(`   Nombre: ${negocioDemo.name}`);
    console.log(`   Subdomain actual: ${negocioDemo.subdomain}`);
    
    // Actualizar el subdomain
    const negocioActualizado = await prisma.business.update({
      where: {
        id: negocioDemo.id
      },
      data: {
        subdomain: 'casa-sabor-demo'
      }
    });
    
    console.log(`\n✅ Subdomain actualizado exitosamente:`);
    console.log(`   Subdomain nuevo: ${negocioActualizado.subdomain}`);
    console.log(`   ID: ${negocioActualizado.id}`);
    
    // Verificar que ahora se puede encontrar por subdomain
    const verificacion = await prisma.business.findFirst({
      where: {
        subdomain: 'casa-sabor-demo'
      }
    });
    
    if (verificacion) {
      console.log(`\n🎯 Verificación exitosa: Negocio encontrado por subdomain`);
      console.log(`   Nombre: ${verificacion.name}`);
      console.log(`   ID: ${verificacion.id}`);
    } else {
      console.log(`\n❌ Error en verificación: No se pudo encontrar por subdomain`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    
    if (error.code === 'P2002') {
      console.log('\n💡 Ya existe un negocio con el subdomain "casa-sabor-demo".');
      
      // Buscar el negocio conflictivo
      const conflicto = await prisma.business.findFirst({
        where: {
          subdomain: 'casa-sabor-demo'
        }
      });
      
      if (conflicto) {
        console.log(`   Negocio conflictivo: ${conflicto.name} (ID: ${conflicto.id})`);
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

actualizarSubdomain();
