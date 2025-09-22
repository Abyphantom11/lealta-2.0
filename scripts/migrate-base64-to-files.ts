/**
 * 🔧 UTILIDAD DE MIGRACIÓN: Base64 a URLs
 * Script para convertir imágenes base64 existentes a archivos en /uploads/
 */

import { PrismaClient } from '@prisma/client';
import { writeFile } from 'fs/promises';
import { join } from 'path';

const prisma = new PrismaClient();

export async function migrateBase64ToFiles() {
  console.log('🔄 Iniciando migración de base64 a archivos...');
  
  try {
    // Obtener todas las configuraciones de branding
    const brandingConfigs = await prisma.brandingConfig.findMany({
      select: {
        id: true,
        businessId: true,
        carouselImages: true
      }
    });

    console.log(`📊 Encontradas ${brandingConfigs.length} configuraciones de branding`);

    for (const config of brandingConfigs) {
      if (!config.carouselImages || config.carouselImages.length === 0) {
        continue;
      }

      console.log(`🔍 Procesando business ${config.businessId}...`);
      
      const updatedImages: string[] = [];
      let migrationCount = 0;

      for (let i = 0; i < config.carouselImages.length; i++) {
        const imageData = config.carouselImages[i];
        
        // Verificar si es base64
        if (typeof imageData === 'string' && imageData.startsWith('data:image/')) {
          try {
            // Extraer tipo y datos
            const matches = imageData.match(/data:image\/([^;]+);base64,(.+)/);
            if (!matches) {
              console.warn(`⚠️ Base64 inválido en posición ${i} para business ${config.businessId}`);
              continue;
            }

            const [, fileType, base64Data] = matches;
            const extension = fileType === 'jpeg' ? 'jpg' : fileType;
            
            // Generar nombre de archivo
            const timestamp = Date.now() + i; // Agregar índice para evitar colisiones
            const fileName = `${config.businessId}_${timestamp}_migrated.${extension}`;
            
            // Convertir base64 a buffer
            const buffer = Buffer.from(base64Data, 'base64');
            
            // Guardar archivo
            const filePath = join(process.cwd(), 'public/uploads/branding', fileName);
            await writeFile(filePath, buffer);
            
            // Generar URL
            const imageUrl = `/uploads/branding/${fileName}`;
            updatedImages.push(imageUrl);
            migrationCount++;
            
            console.log(`✅ Migrado: ${fileName} (${buffer.length} bytes)`);
            
          } catch (error) {
            console.error(`❌ Error migrando imagen ${i} para business ${config.businessId}:`, error);
          }
        } else if (typeof imageData === 'string' && (imageData.startsWith('http') || imageData.startsWith('/uploads/'))) {
          // Ya es URL válida, mantener
          updatedImages.push(imageData);
        } else {
          console.warn(`⚠️ Datos corruptos en posición ${i} para business ${config.businessId}:`, typeof imageData);
        }
      }

      // Actualizar base de datos si hubo cambios
      if (migrationCount > 0 || updatedImages.length !== config.carouselImages.length) {
        await prisma.brandingConfig.update({
          where: { id: config.id },
          data: { carouselImages: updatedImages }
        });
        
        console.log(`✅ Business ${config.businessId}: ${migrationCount} imágenes migradas, ${updatedImages.length} imágenes totales`);
      }
    }

    console.log('🎉 Migración completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error en migración:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  migrateBase64ToFiles();
}
