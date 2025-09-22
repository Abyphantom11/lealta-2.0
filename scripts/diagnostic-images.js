/**
 * 🔍 SCRIPT DE DIAGNÓSTICO
 * Analiza el estado actual de las imágenes del carrusel
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function diagnosticImages() {
  console.log('🔍 Diagnóstico del estado actual...\n');
  
  try {
    const brandingConfigs = await prisma.brandingConfig.findMany({
      select: {
        id: true,
        businessId: true,
        businessName: true,
        carouselImages: true
      }
    });

    console.log(`📊 Total configuraciones: ${brandingConfigs.length}\n`);

    for (const config of brandingConfigs) {
      console.log(`🏢 ${config.businessName || config.businessId}`);
      console.log(`   ID: ${config.id}`);
      
      if (!config.carouselImages || config.carouselImages.length === 0) {
        console.log(`   📷 Sin imágenes de carrusel\n`);
        continue;
      }

      console.log(`   📷 Total imágenes: ${config.carouselImages.length}`);
      
      config.carouselImages.forEach((image, index) => {
        if (image.startsWith('http')) {
          console.log(`   ${index + 1}. 🌐 URL Externa: ${image.substring(0, 60)}...`);
        } else if (image.startsWith('/uploads/')) {
          console.log(`   ${index + 1}. 📁 Archivo Local: ${image}`);
        } else if (image.startsWith('data:image/')) {
          const sizeKB = Math.round((image.length * 3/4) / 1024);
          console.log(`   ${index + 1}. 📋 Base64: ${sizeKB}KB - ${image.substring(0, 40)}...`);
        } else {
          console.log(`   ${index + 1}. ❓ Desconocido: ${image.substring(0, 40)}...`);
        }
      });
      
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnosticImages();
