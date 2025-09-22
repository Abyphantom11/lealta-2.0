/**
 * Script de verificación: Estado del sistema de imágenes
 * 
 * Verifica el estado actual de las imágenes del carrusel
 * y reporta problemas de consistencia
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function verifyBrandingImages() {
  console.log('🔍 VERIFICANDO ESTADO DEL SISTEMA DE IMÁGENES\n');

  try {
    const brandingConfigs = await prisma.brandingConfig.findMany({
      include: {
        business: {
          select: { name: true, slug: true }
        }
      }
    });

    if (brandingConfigs.length === 0) {
      console.log('❌ No se encontraron configuraciones de branding');
      return;
    }

    console.log(`📊 Analizando ${brandingConfigs.length} configuración(es):\n`);

    let totalImages = 0;
    let validUrls = 0;
    let base64Images = 0;
    let brokenImages = 0;
    let missingFiles = 0;

    for (const config of brandingConfigs) {
      console.log(`🏢 ${config.business.name} (${config.businessId})`);
      
      if (!config.carouselImages || config.carouselImages.length === 0) {
        console.log('   📸 Sin imágenes configuradas\n');
        continue;
      }

      const images = config.carouselImages;
      totalImages += images.length;
      
      console.log(`   📸 ${images.length} imagen(es):`);

      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        
        if (typeof img !== 'string') {
          console.log(`   ❌ [${i+1}] Dato corrupto: ${typeof img}`);
          brokenImages++;
          continue;
        }

        if (img.startsWith('data:image/')) {
          console.log(`   🔢 [${i+1}] Base64 (${Math.round(img.length/1024)}KB)`);
          base64Images++;
        } else if (img.startsWith('/uploads/') || img.startsWith('http')) {
          const fileName = img.replace('/uploads/', '');
          const filePath = path.join(process.cwd(), 'public', 'uploads', fileName);
          
          if (img.startsWith('/uploads/') && fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            console.log(`   ✅ [${i+1}] URL válida: ${fileName} (${Math.round(stats.size/1024)}KB)`);
            validUrls++;
          } else if (img.startsWith('http')) {
            console.log(`   🌐 [${i+1}] URL externa: ${img}`);
            validUrls++;
          } else {
            console.log(`   ❌ [${i+1}] Archivo faltante: ${fileName}`);
            missingFiles++;
          }
        } else {
          console.log(`   ❓ [${i+1}] Formato desconocido: ${img.substring(0, 50)}...`);
          brokenImages++;
        }
      }
      console.log('');
    }

    // Resumen
    console.log('📊 RESUMEN GENERAL:');
    console.log(`   Total de imágenes: ${totalImages}`);
    console.log(`   ✅ URLs válidas: ${validUrls}`);
    console.log(`   🔢 Base64: ${base64Images}`);
    console.log(`   ❌ Datos corruptos: ${brokenImages}`);
    console.log(`   📁 Archivos faltantes: ${missingFiles}`);
    
    console.log('\n🎯 RECOMENDACIONES:');
    
    if (base64Images > 0) {
      console.log(`   🔄 Migrar ${base64Images} imagen(es) base64 usando el botón "Migrar" en el admin`);
    }
    
    if (brokenImages > 0) {
      console.log(`   🔧 Limpiar ${brokenImages} dato(s) corrupto(s) usando el botón "Reparar"`);
    }
    
    if (missingFiles > 0) {
      console.log(`   📁 Re-subir ${missingFiles} archivo(s) faltante(s)`);
    }
    
    if (validUrls === totalImages) {
      console.log('   🎉 ¡Sistema completamente consistente!');
    }

  } catch (error) {
    console.error('❌ Error durante verificación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyBrandingImages();
