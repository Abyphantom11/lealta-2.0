// Script para probar la creación automática de portal-config
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testPortalConfigCreation() {
  console.log('🧪 PRUEBA: Creación Automática Portal Config');
  console.log('=============================================\n');
  
  try {
    // 1. Crear un business de prueba
    console.log('📊 Creando business de prueba...');
    const testBusiness = await prisma.business.create({
      data: {
        name: "La Panadería Central",
        slug: "panaderia-central",
        subdomain: "panaderia",
        subscriptionPlan: "BASIC",
        isActive: true,
        settings: {
          theme: "bakery",
          primaryColor: "#D2691E",
          businessType: "panaderia"
        }
      }
    });
    console.log(`✅ Business creado: ${testBusiness.name} (ID: ${testBusiness.id})`);

    // 2. Simular acceso al portal config (esto debería crear el archivo)
    console.log('\n🔍 Simulando acceso al portal config...');
    const response = await fetch('http://localhost:3000/api/admin/portal-config', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'mock-session=test' // Simular autenticación
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Portal config obtenido exitosamente');
      console.log(`📋 Nombre de empresa en config: ${data.config?.nombreEmpresa}`);
      
      // Verificar que use el nombre correcto
      if (data.config?.nombreEmpresa === testBusiness.name) {
        console.log('🎯 ¡ÉXITO! Portal config usa el nombre correcto del negocio');
      } else {
        console.log('❌ Portal config usa nombre incorrecto:', data.config?.nombreEmpresa);
      }
    } else {
      console.log('❌ Error obteniendo portal config:', response.status);
    }

    // 3. Verificar que el archivo fue creado
    const fs = require('fs');
    const path = require('path');
    const configPath = path.join(process.cwd(), `portal-config-${testBusiness.id}.json`);
    
    if (fs.existsSync(configPath)) {
      console.log('✅ Archivo portal-config creado correctamente');
      const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      console.log(`📝 Nombre en archivo: ${configData.nombreEmpresa}`);
      console.log(`🏷️ Business ID en settings: ${configData.settings?.businessId}`);
    } else {
      console.log('❌ Archivo portal-config NO fue creado');
    }

    // 4. Limpiar - eliminar business de prueba
    console.log('\n🧹 Limpiando datos de prueba...');
    await prisma.business.delete({
      where: { id: testBusiness.id }
    });
    
    // Eliminar archivo de config
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
      console.log('✅ Archivo portal-config eliminado');
    }
    
    console.log('✅ Business de prueba eliminado');
    console.log('\n🎉 PRUEBA COMPLETADA');

  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  testPortalConfigCreation();
}

module.exports = testPortalConfigCreation;
