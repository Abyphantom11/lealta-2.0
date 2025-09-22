/**
 * Script de migración: Base64 → Archivos físicos
 * 
 * PROPÓSITO:
 * - Migrar imágenes base64 corruptas del carrusel a archivos físicos
 * - Actualizar URLs en la base de datos
 * - Limpiar datos corruptos
 * 
 * USO:
 * node scripts/migrate-branding-images.js [businessId]
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function migrateBase64Images(businessId = null) {
  console.log('🔄 INICIANDO MIGRACIÓN DE IMÁGENES BASE64 → ARCHIVOS FÍSICOS\n');

  try {
    // Buscar configuraciones de branding
    const whereClause = businessId ? { businessId } : {};
    const brandingConfigs = await prisma.brandingConfig.findMany({
      where: whereClause,
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

    console.log(`📊 Encontradas ${brandingConfigs.length} configuración(es) de branding\n`);

    for (const config of brandingConfigs) {
      console.log(`\n🏢 Procesando: ${config.business.name} (${config.businessId})`);
      
      if (!config.carouselImages || config.carouselImages.length === 0) {
        console.log('   ➜ Sin imágenes de carrusel');
        continue;
      }

      console.log(`   📸 ${config.carouselImages.length} imagen(es) encontrada(s)`);

      // Identificar imágenes base64
      const base64Images = config.carouselImages.filter(img => 
        typeof img === 'string' && img.startsWith('data:image/')
      );

      const urlImages = config.carouselImages.filter(img => 
        typeof img === 'string' && 
        !img.startsWith('data:image/') && 
        (img.startsWith('http') || img.startsWith('/uploads/'))
      );

      console.log(`   🔢 Base64: ${base64Images.length}, URLs válidas: ${urlImages.length}`);

      if (base64Images.length === 0) {
        console.log('   ✅ No hay imágenes base64 para migrar');
        continue;
      }

      // Migrar imágenes base64
      const migratedUrls = [];
      
      for (let i = 0; i < base64Images.length; i++) {
        try {
          const base64Data = base64Images[i];
          console.log(`   🔄 Migrando imagen ${i + 1}/${base64Images.length}...`);

          // Extraer datos de la imagen base64
          const matches = base64Data.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
          if (!matches) {
            console.log(`   ❌ Formato base64 inválido para imagen ${i + 1}`);
            continue;
          }

          const [, extension, data] = matches;
          const buffer = Buffer.from(data, 'base64');

          // Generar nombre único para el archivo
          const timestamp = Date.now();
          const filename = `${config.businessId}_migrated_${timestamp}_${i}.${extension === 'jpeg' ? 'jpg' : extension}`;
          
          // Asegurar que existe el directorio uploads
          const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }

          // Guardar archivo
          const filepath = path.join(uploadsDir, filename);
          fs.writeFileSync(filepath, buffer);

          const publicUrl = `/uploads/${filename}`;
          migratedUrls.push(publicUrl);

          console.log(`   ✅ Imagen ${i + 1} migrada: ${filename}`);

        } catch (error) {
          console.log(`   ❌ Error migrando imagen ${i + 1}:`, error.message);
        }
      }

      // Actualizar base de datos con URLs migradas
      if (migratedUrls.length > 0) {
        const newCarouselImages = [...urlImages, ...migratedUrls];
        
        await prisma.brandingConfig.update({
          where: { id: config.id },
          data: { carouselImages: newCarouselImages }
        });

        console.log(`   💾 Base de datos actualizada: ${migratedUrls.length} imagen(es) migrada(s)`);
        console.log(`   📊 Total de imágenes ahora: ${newCarouselImages.length}`);
      }
    }

    console.log('\n✅ MIGRACIÓN COMPLETADA EXITOSAMENTE');

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar script
const businessId = process.argv[2];
if (businessId) {
  console.log(`🎯 Migrando solo business: ${businessId}\n`);
}

migrateBase64Images(businessId);
