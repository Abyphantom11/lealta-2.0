/**
 * 🔄 MIGRACIÓN BASE64 A ARCHIVOS
 * Convierte imágenes base64 del carrusel a archivos
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Función para extraer extensión de base64
function getImageExtension(base64String) {
  if (base64String.includes('data:image/jpeg')) return 'jpg';
  if (base64String.includes('data:image/jpg')) return 'jpg';
  if (base64String.includes('data:image/png')) return 'png';
  if (base64String.includes('data:image/gif')) return 'gif';
  if (base64String.includes('data:image/webp')) return 'webp';
  return 'jpg'; // default
}

// Función para generar nombre único
function generateFileName(businessId, extension) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${businessId}_${timestamp}_${random}.${extension}`;
}

async function migrateBase64ToFiles() {
  console.log('🔄 Iniciando migración de Base64 a archivos...\n');
  
  try {
    // Crear directorio si no existe
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'branding');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log('📁 Directorio de uploads creado');
    }

    const brandingConfigs = await prisma.brandingConfig.findMany({
      select: {
        id: true,
        businessId: true,
        businessName: true,
        carouselImages: true
      }
    });

    console.log(`📊 Procesando ${brandingConfigs.length} configuraciones...\n`);

    for (const config of brandingConfigs) {
      if (!config.carouselImages || config.carouselImages.length === 0) {
        continue;
      }

      console.log(`🏢 ${config.businessName || config.businessId}`);
      let hasChanges = false;
      const newImages = [];

      for (let i = 0; i < config.carouselImages.length; i++) {
        const image = config.carouselImages[i];
        
        // Si ya es URL, mantener
        if (image.startsWith('http') || image.startsWith('/uploads/')) {
          newImages.push(image);
          console.log(`   ${i + 1}. ✅ URL mantenida: ${image.substring(0, 60)}...`);
          continue;
        }

        // Si es base64, convertir
        if (image.startsWith('data:image/')) {
          try {
            // Extraer datos base64
            const base64Data = image.split(',')[1];
            if (!base64Data) {
              console.log(`   ${i + 1}. ❌ Base64 inválido, removiendo`);
              hasChanges = true;
              continue;
            }

            // Generar archivo
            const extension = getImageExtension(image);
            const fileName = generateFileName(config.businessId, extension);
            const filePath = path.join(uploadDir, fileName);
            const fileUrl = `/uploads/branding/${fileName}`;

            // Escribir archivo
            const buffer = Buffer.from(base64Data, 'base64');
            fs.writeFileSync(filePath, buffer);

            newImages.push(fileUrl);
            console.log(`   ${i + 1}. 🔄 Base64 → ${fileName} (${Math.round(buffer.length / 1024)}KB)`);
            hasChanges = true;

          } catch (error) {
            console.log(`   ${i + 1}. ❌ Error convirtiendo base64: ${error.message}`);
            hasChanges = true;
          }
        } else {
          // Tipo desconocido, remover
          console.log(`   ${i + 1}. ❌ Tipo desconocido removido: ${image.substring(0, 40)}...`);
          hasChanges = true;
        }
      }

      // Actualizar si hay cambios
      if (hasChanges) {
        await prisma.brandingConfig.update({
          where: { id: config.id },
          data: { carouselImages: newImages }
        });
        console.log(`   ✅ Actualizado: ${config.carouselImages.length} → ${newImages.length} imágenes`);
      } else {
        console.log(`   ✅ Sin cambios necesarios`);
      }
      
      console.log('');
    }

    console.log('🎉 Migración completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateBase64ToFiles();
