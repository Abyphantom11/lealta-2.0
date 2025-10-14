/**
 * 🔍 DIAGNÓSTICO COMPLETO: Portal Cliente - Desarrollo vs Producción
 * Identifica por qué los banners, promociones y favoritos no se renderizan en producción
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function diagnoseProductionPortal() {
  console.log('🔍 DIAGNÓSTICO: PORTAL CLIENTE - DESARROLLO vs PRODUCCIÓN');
  console.log('='.repeat(65));
  
  try {
    const businessId = 'cmgf5px5f0000eyy0elci9yds'; // Casa Sabor Demo
    
    // 1. VERIFICAR BASE DE DATOS
    console.log('\n📊 1. VERIFICACIÓN DE BASE DE DATOS');
    console.log('-'.repeat(40));
    
    const banners = await prisma.portalBanner.findMany({
      where: { businessId },
      select: {
        id: true,
        title: true,
        active: true,
        dia: true,
        imageUrl: true,
        createdAt: true
      }
    });
    
    const promociones = await prisma.portalPromocion.findMany({
      where: { businessId },
      select: {
        id: true,
        title: true,
        active: true,
        dia: true,
        imageUrl: true,
        createdAt: true
      }
    });
    
    const favoritos = await prisma.portalFavoritoDelDia.findMany({
      where: { businessId },
      select: {
        id: true,
        productName: true,
        active: true,
        dia: true,
        imageUrl: true,
        createdAt: true
      }
    });
    
    console.log(`📢 Banners en BD: ${banners.length}`);
    banners.forEach(banner => {
      console.log(`   - "${banner.title}" | Activo: ${banner.active} | Día: ${banner.dia} | IMG: ${banner.imageUrl ? '✅' : '❌'}`);
    });
    
    console.log(`🎁 Promociones en BD: ${promociones.length}`);
    promociones.forEach(promo => {
      console.log(`   - "${promo.title}" | Activo: ${promo.active} | Día: ${promo.dia} | IMG: ${promo.imageUrl ? '✅' : '❌'}`);
    });
    
    console.log(`⭐ Favoritos en BD: ${favoritos.length}`);
    favoritos.forEach(fav => {
      console.log(`   - "${fav.productName}" | Activo: ${fav.active} | Día: ${fav.dia} | IMG: ${fav.imageUrl ? '✅' : '❌'}`);
    });
    
    // 2. VERIFICAR APIS
    console.log('\n🌐 2. VERIFICACIÓN DE APIs');
    console.log('-'.repeat(40));
    
    // Simular llamadas a las APIs
    console.log('📍 Simulando llamadas API...');
    console.log(`   GET /api/portal/config-v2?businessId=${businessId}`);
    console.log(`   GET /api/portal/banners?businessId=${businessId}`);
    console.log(`   GET /api/portal/promociones?businessId=${businessId}`);
    console.log(`   GET /api/portal/favorito-del-dia?businessId=${businessId}`);
    
    // 3. VERIFICAR VARIABLES DE ENTORNO
    console.log('\n🔧 3. VERIFICACIÓN DE VARIABLES DE ENTORNO');
    console.log('-'.repeat(50));
    
    const envVars = [
      'NODE_ENV',
      'DATABASE_URL',
      'NEXTAUTH_URL',
      'NEXT_PUBLIC_APP_URL'
    ];
    
    envVars.forEach(envVar => {
      const value = process.env[envVar];
      const status = value ? '✅' : '❌';
      console.log(`   ${status} ${envVar}: ${value ? (envVar.includes('URL') ? value : '[SET]') : 'NO CONFIGURADA'}`);
    });
    
    // 4. VERIFICAR CONFIGURACIÓN DEL PORTAL
    console.log('\n⚙️ 4. VERIFICACIÓN DE CONFIGURACIÓN PORTAL');
    console.log('-'.repeat(50));
    
    // Verificar archivos de configuración
    const configFiles = [
      'portal-config.json',
      `portal-config-${businessId}.json`,
      'config/portal/portal-config.json'
    ];
    
    configFiles.forEach(configFile => {
      const exists = fs.existsSync(path.join(process.cwd(), configFile));
      console.log(`   ${exists ? '✅' : '❌'} ${configFile}`);
      
      if (exists) {
        try {
          const config = JSON.parse(fs.readFileSync(path.join(process.cwd(), configFile), 'utf8'));
          console.log(`      Banners: ${config.banners?.length || 0}`);
          console.log(`      Promociones: ${config.promociones?.length || 0}`);
          console.log(`      Favorito del día: ${config.favoritoDelDia ? 'Sí' : 'No'}`);
        } catch (error) {
          console.log(`      ❌ Error leyendo archivo: ${error.message}`);
        }
      }
    });
    
    // 5. SIMULAR FLUJO DEL CLIENTE
    console.log('\n👤 5. SIMULACIÓN DE FLUJO DEL CLIENTE');
    console.log('-'.repeat(45));
    
    const currentDay = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'][new Date().getDay()];
    console.log(`🗓️ Día actual: ${currentDay}`);
    
    // Banners que deberían mostrarse
    const bannersVisibles = banners.filter(banner => 
      banner.active && 
      banner.imageUrl && 
      (!banner.dia || banner.dia === currentDay)
    );
    
    const promocionesVisibles = promociones.filter(promo => 
      promo.active && 
      promo.imageUrl && 
      (!promo.dia || promo.dia === currentDay)
    );
    
    const favoritosVisibles = favoritos.filter(fav => 
      fav.active && 
      fav.imageUrl && 
      (!fav.dia || fav.dia === currentDay)
    );
    
    console.log(`📢 Banners que DEBERÍAN mostrarse: ${bannersVisibles.length}`);
    bannersVisibles.forEach((banner, idx) => {
      console.log(`   ${idx + 1}. "${banner.title}"`);
    });
    
    console.log(`🎁 Promociones que DEBERÍAN mostrarse: ${promocionesVisibles.length}`);
    promocionesVisibles.forEach((promo, idx) => {
      console.log(`   ${idx + 1}. "${promo.title}"`);
    });
    
    console.log(`⭐ Favoritos que DEBERÍAN mostrarse: ${favoritosVisibles.length}`);
    favoritosVisibles.forEach((fav, idx) => {
      console.log(`   ${idx + 1}. "${fav.productName}"`);
    });
    
    // 6. DIAGNÓSTICO DE PROBLEMAS COMUNES
    console.log('\n🚨 6. DIAGNÓSTICO DE PROBLEMAS COMUNES');
    console.log('-'.repeat(50));
    
    const problemas = [];
    
    // Problema 1: No hay datos en BD
    if (banners.length === 0 && promociones.length === 0 && favoritos.length === 0) {
      problemas.push({
        tipo: 'CRÍTICO',
        problema: 'No hay datos en la base de datos',
        solucion: 'Crear contenido desde el admin o ejecutar create-real-admin-data.js'
      });
    }
    
    // Problema 2: Datos inactivos
    const activeBanners = banners.filter(b => b.active);
    const activePromociones = promociones.filter(p => p.active);
    const activeFavoritos = favoritos.filter(f => f.active);
    
    if (activeBanners.length === 0 && activePromociones.length === 0 && activeFavoritos.length === 0) {
      problemas.push({
        tipo: 'ADVERTENCIA',
        problema: 'Todos los elementos están desactivados',
        solucion: 'Activar elementos desde el admin o verificar lógica de activación'
      });
    }
    
    // Problema 3: Sin imágenes
    const bannersConImagen = banners.filter(b => b.imageUrl);
    const promocionesConImagen = promociones.filter(p => p.imageUrl);
    const favoritosConImagen = favoritos.filter(f => f.imageUrl);
    
    if (bannersConImagen.length === 0 && promocionesConImagen.length === 0 && favoritosConImagen.length === 0) {
      problemas.push({
        tipo: 'CRÍTICO',
        problema: 'Ningún elemento tiene imagen',
        solucion: 'Verificar sistema de subida de imágenes y URLs de imágenes'
      });
    }
    
    // Problema 4: Variables de entorno de producción
    if (process.env.NODE_ENV === 'production') {
      if (!process.env.NEXT_PUBLIC_APP_URL) {
        problemas.push({
          tipo: 'CRÍTICO',
          problema: 'NEXT_PUBLIC_APP_URL no configurada en producción',
          solucion: 'Configurar NEXT_PUBLIC_APP_URL en variables de entorno'
        });
      }
      
      if (!process.env.NEXTAUTH_URL) {
        problemas.push({
          tipo: 'CRÍTICO',
          problema: 'NEXTAUTH_URL no configurada en producción',
          solucion: 'Configurar NEXTAUTH_URL en variables de entorno'
        });
      }
    }
    
    // Problema 5: Caché
    problemas.push({
      tipo: 'INFO',
      problema: 'Posible problema de caché',
      solucion: 'Verificar que las APIs usen cache: "no-store" y headers no-cache'
    });
    
    // Mostrar problemas encontrados
    if (problemas.length > 0) {
      problemas.forEach((problema, idx) => {
        const emoji = problema.tipo === 'CRÍTICO' ? '🚨' : problema.tipo === 'ADVERTENCIA' ? '⚠️' : 'ℹ️';
        console.log(`${emoji} ${idx + 1}. ${problema.problema}`);
        console.log(`   💡 Solución: ${problema.solucion}`);
      });
    } else {
      console.log('✅ No se encontraron problemas obvios');
    }
    
    // 7. RECOMENDACIONES
    console.log('\n💡 7. RECOMENDACIONES PARA PRODUCCIÓN');
    console.log('-'.repeat(50));
    
    console.log('1. 🔍 Verificar logs del servidor en producción');
    console.log('2. 🌐 Probar APIs directamente:');
    console.log(`   curl "https://tu-dominio.com/api/portal/config-v2?businessId=${businessId}"`);
    console.log('3. 📱 Verificar que el cliente esté usando el businessId correcto');
    console.log('4. 🔄 Verificar que useAutoRefreshPortalConfig esté funcionando');
    console.log('5. 🖼️ Verificar que las URLs de imágenes sean accesibles');
    console.log('6. 🚫 Revisar si hay errores en la consola del navegador');
    console.log('7. 🔧 Verificar que las variables de entorno estén configuradas');
    
    // 8. SCRIPT DE PRUEBA RÁPIDA
    console.log('\n🧪 8. SCRIPT DE PRUEBA RÁPIDA PARA PRODUCCIÓN');
    console.log('-'.repeat(55));
    
    console.log('Ejecuta esto en la consola del navegador en producción:');
    console.log('```javascript');
    console.log(`fetch('/api/portal/config-v2?businessId=${businessId}')`);
    console.log('  .then(r => r.json())');
    console.log('  .then(data => {');
    console.log('    console.log("Banners:", data.banners?.length || 0);');
    console.log('    console.log("Promociones:", data.promociones?.length || 0);');
    console.log('    console.log("Favorito:", data.favoritoDelDia ? "Sí" : "No");');
    console.log('    console.log("Data completa:", data);');
    console.log('  })');
    console.log('  .catch(console.error);');
    console.log('```');
    
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseProductionPortal().catch(console.error);
