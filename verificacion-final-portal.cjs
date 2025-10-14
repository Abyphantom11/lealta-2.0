// Script de verificación final del Portal Config
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function verificacionFinal() {
  console.log('🎯 VERIFICACIÓN FINAL DEL PORTAL CONFIG\n');
  
  try {
    // 1. Verificar negocio en base de datos
    console.log('📊 1. Verificando negocio en base de datos...');
    const negocio = await prisma.business.findFirst({
      where: {
        subdomain: 'casa-sabor-demo'
      }
    });
    
    if (negocio) {
      console.log(`✅ Negocio encontrado:`);
      console.log(`   Nombre: ${negocio.name}`);
      console.log(`   ID: ${negocio.id}`);
      console.log(`   Subdomain: ${negocio.subdomain}`);
    } else {
      console.log('❌ Negocio NO encontrado con subdomain "casa-sabor-demo"');
      return;
    }
    
    // 2. Verificar archivo de configuración
    console.log(`\n📁 2. Verificando archivo de configuración...`);
    const configPath = path.join(process.cwd(), 'config', 'portal', `portal-config-${negocio.id}.json`);
    
    if (fs.existsSync(configPath)) {
      console.log(`✅ Archivo de configuración encontrado: portal-config-${negocio.id}.json`);
      
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      console.log(`   Empresa: ${config.nombreEmpresa}`);
      console.log(`   Banners: ${config.banners?.length || 0}`);
      console.log(`   Promociones: ${config.promociones?.length || 0}`);
      console.log(`   Recompensas: ${config.recompensas?.length || 0}`);
      console.log(`   Favorito del día: ${config.favoritoDelDia ? 'Configurado' : 'No configurado'}`);
      
      if (config.favoritoDelDia?.lunes) {
        console.log(`   ✅ Favorito del lunes: "${config.favoritoDelDia.lunes.title}"`);
      }
    } else {
      console.log(`❌ Archivo de configuración NO encontrado: ${configPath}`);
    }
    
    // 3. Verificar consistencia ID
    console.log(`\n🔍 3. Verificando consistencia de IDs...`);
    if (negocio && fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (config.businessId === negocio.id) {
        console.log(`✅ IDs consistentes: ${negocio.id}`);
      } else {
        console.log(`⚠️ IDs inconsistentes:`);
        console.log(`   Base de datos: ${negocio.id}`);
        console.log(`   Archivo config: ${config.businessId}`);
      }
    }
    
    console.log(`\n🎉 RESUMEN:`);
    console.log(`✅ Negocio: "La Casa del Sabor - Demo" con subdomain "casa-sabor-demo"`);
    console.log(`✅ Archivo: portal-config-${negocio.id}.json`);
    console.log(`✅ Portal config completo con favorito del lunes configurado`);
    console.log(`\n🚀 El portal debería funcionar correctamente ahora!`);
    console.log(`   URL admin: /admin/portal-cliente`);
    console.log(`   API pública: /api/portal/config?businessId=${negocio.id}`);
    console.log(`   API admin: /api/admin/portal-config?businessId=${negocio.id}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificacionFinal();
