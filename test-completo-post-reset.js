/**
 * 🧪 TEST COMPLETO POST-RESET
 * Verificar que el sistema funciona correctamente después del reset de BD
 */

const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

async function testCompleto() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 INICIANDO TEST COMPLETO POST-RESET\n');
    
    // 1. Verificar estado de la base de datos
    console.log('1. 📊 VERIFICANDO ESTADO DE BASE DE DATOS');
    console.log('='.repeat(50));
    
    const businesses = await prisma.business.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true
      }
    });
    
    console.log(`Businesses encontrados: ${businesses.length}`);
    businesses.forEach((business, idx) => {
      console.log(`${idx + 1}. ${business.name} (${business.slug}) - ID: ${business.id}`);
    });
    
    const portalConfigs = await prisma.portalConfig.count();
    const portalBanners = await prisma.portalBanner.count();
    const portalPromociones = await prisma.portalPromocion.count();
    const portalRecompensas = await prisma.portalRecompensa.count();
    
    console.log(`\nTablas de Portal:`);
    console.log(`- PortalConfig: ${portalConfigs}`);
    console.log(`- PortalBanner: ${portalBanners}`);
    console.log(`- PortalPromocion: ${portalPromociones}`);
    console.log(`- PortalRecompensa: ${portalRecompensas}`);
    
    // 2. Verificar archivos de configuración
    console.log('\n2. 📂 VERIFICANDO ARCHIVOS DE CONFIGURACIÓN');
    console.log('='.repeat(50));
    
    const configDir = path.join(process.cwd(), 'config', 'portal');
    
    if (!fs.existsSync(configDir)) {
      console.log('❌ Directorio config/portal no existe');
      console.log('📝 Creando directorio...');
      fs.mkdirSync(configDir, { recursive: true });
    } else {
      console.log('✅ Directorio config/portal existe');
    }
    
    const configFiles = fs.readdirSync(configDir).filter(file => file.startsWith('portal-config-'));
    console.log(`Archivos de configuración encontrados: ${configFiles.length}`);
    
    configFiles.forEach((file, idx) => {
      const businessIdMatch = file.match(/portal-config-(.+)\.json/);
      const businessId = businessIdMatch ? businessIdMatch[1] : 'unknown';
      const business = businesses.find(b => b.id === businessId);
      console.log(`${idx + 1}. ${file} -> ${business ? business.name : 'Business no encontrado'}`);
    });
    
    // 3. Test de creación de portal config
    if (businesses.length > 0) {
      console.log('\n3. 🧪 TEST DE CONFIGURACIÓN CENTRAL');
      console.log('='.repeat(50));
      
      const testBusiness = businesses[0];
      console.log(`Probando con business: ${testBusiness.name} (${testBusiness.id})`);
      
      // Simular carga de configuración central
      try {
        const { getTarjetasConfigCentral } = require('./src/lib/tarjetas-config-central.ts');
        
        console.log('📥 Cargando configuración central...');
        const centralConfig = await getTarjetasConfigCentral(testBusiness.id);
        
        console.log(`✅ Config central cargado:`);
        console.log(`   - Nombre empresa: ${centralConfig.nombreEmpresa}`);
        console.log(`   - Tarjetas: ${centralConfig.tarjetas?.length || 0}`);
        console.log(`   - Jerarquía válida: ${centralConfig.jerarquiaValida ? 'SÍ' : 'NO'}`);
        console.log(`   - Errores: ${centralConfig.erroresValidacion?.length || 0}`);
        
        if (centralConfig.tarjetas && centralConfig.tarjetas.length > 0) {
          console.log('\n📋 Jerarquía de tarjetas:');
          centralConfig.tarjetas.forEach((tarjeta, idx) => {
            console.log(`   ${idx + 1}. ${tarjeta.nivel}: ${tarjeta.puntosRequeridos} puntos`);
          });
        }
        
        if (centralConfig.erroresValidacion && centralConfig.erroresValidacion.length > 0) {
          console.log('\n⚠️ Errores de validación:');
          centralConfig.erroresValidacion.forEach((error, idx) => {
            console.log(`   ${idx + 1}. ${error}`);
          });
        }
        
      } catch (centralError) {
        console.log(`❌ Error cargando config central: ${centralError.message}`);
      }
    }
    
    // 4. Test de endpoints API
    console.log('\n4. 🌐 TEST DE ENDPOINTS API');
    console.log('='.repeat(50));
    
    if (businesses.length > 0) {
      const testBusiness = businesses[0];
      
      console.log('📡 Simulando requests a APIs...');
      console.log(`   - GET /api/portal/config?businessId=${testBusiness.id}`);
      console.log(`   - GET /api/portal/config-v2?businessId=${testBusiness.id}`);
      console.log('   (Ejecutar manualmente en navegador o curl)');
    }
    
    // 5. Recomendaciones
    console.log('\n5. 📝 RECOMENDACIONES');
    console.log('='.repeat(50));
    
    console.log('Para probar completamente el sistema:');
    console.log('1. Iniciar servidor: npm run dev');
    console.log('2. Crear nuevo business via signup (simulará creación automática)');
    console.log('3. Acceder al admin panel en http://localhost:3001/admin');
    console.log('4. Navegar a Portal → Configuración');
    console.log('5. Verificar que aparezcan 5 tabs de tarjetas');
    console.log('6. Probar edición y validación jerárquica');
    
    if (businesses.length === 0) {
      console.log('\n⚠️ NO HAY BUSINESSES - Crear uno primero via signup');
    } else if (configFiles.length === 0) {
      console.log('\n⚠️ NO HAY CONFIGS - Se crearán automáticamente al acceder');
    } else {
      console.log('\n✅ SISTEMA APARENTA ESTAR LISTO PARA PRUEBAS');
    }
    
  } catch (error) {
    console.error('❌ Error durante el test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCompleto();
