/**
 * 🖼️ Script para optimizar imágenes existentes
 * 
 * Este script comprime las imágenes en /public/uploads y /public/icons
 * usando sharp para reducir el tamaño sin perder mucha calidad.
 * 
 * Uso: node optimize-images.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const DIRECTORIES = [
  path.join(__dirname, 'public', 'uploads'),
  path.join(__dirname, 'public', 'icons'),
];

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

async function optimizeImage(filePath) {
  try {
    const ext = path.extname(filePath).toLowerCase();
    
    if (!IMAGE_EXTENSIONS.includes(ext)) {
      return { skipped: true };
    }

    const originalStats = fs.statSync(filePath);
    const originalSize = originalStats.size;

    // Crear backup
    const backupPath = filePath + '.backup';
    fs.copyFileSync(filePath, backupPath);

    // Optimizar según el tipo
    const image = sharp(filePath);
    const metadata = await image.metadata();

    if (ext === '.png') {
      // PNG: Comprimir y convertir a WebP si es muy grande
      await image
        .png({ 
          quality: 80, 
          compressionLevel: 9,
          palette: true 
        })
        .toFile(filePath + '.tmp');
    } else if (ext === '.jpg' || ext === '.jpeg') {
      // JPEG: Optimizar calidad
      await image
        .jpeg({ 
          quality: 85, 
          progressive: true,
          mozjpeg: true 
        })
        .toFile(filePath + '.tmp');
    } else if (ext === '.webp') {
      // WebP: Re-optimizar
      await image
        .webp({ 
          quality: 85,
          effort: 6
        })
        .toFile(filePath + '.tmp');
    }

    // Reemplazar archivo original
    fs.unlinkSync(filePath);
    fs.renameSync(filePath + '.tmp', filePath);

    const newStats = fs.statSync(filePath);
    const newSize = newStats.size;
    const savings = ((originalSize - newSize) / originalSize * 100).toFixed(2);

    // Eliminar backup si la optimización fue exitosa
    fs.unlinkSync(backupPath);

    return {
      success: true,
      originalSize,
      newSize,
      savings: parseFloat(savings),
    };
  } catch (error) {
    console.error(`❌ Error optimizing ${filePath}:`, error.message);
    
    // Restaurar backup si existe
    const backupPath = filePath + '.backup';
    if (fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, filePath);
      fs.unlinkSync(backupPath);
    }
    
    return { error: error.message };
  }
}

async function walkDirectory(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      walkDirectory(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  }

  return fileList;
}

async function main() {
  console.log('🖼️  Iniciando optimización de imágenes...\n');

  let totalOriginalSize = 0;
  let totalNewSize = 0;
  let totalFiles = 0;
  let optimizedFiles = 0;
  let skippedFiles = 0;

  for (const directory of DIRECTORIES) {
    if (!fs.existsSync(directory)) {
      console.log(`⚠️  Directorio no encontrado: ${directory}`);
      continue;
    }

    console.log(`📁 Procesando: ${directory}\n`);

    const files = await walkDirectory(directory);

    for (const file of files) {
      const result = await optimizeImage(file);

      if (result.skipped) {
        skippedFiles++;
        continue;
      }

      if (result.error) {
        console.log(`❌ ${path.basename(file)}: ${result.error}`);
        continue;
      }

      if (result.success) {
        totalFiles++;
        totalOriginalSize += result.originalSize;
        totalNewSize += result.newSize;
        
        if (result.savings > 0) {
          optimizedFiles++;
          console.log(
            `✅ ${path.basename(file)}: ${(result.originalSize / 1024).toFixed(2)}KB → ${(result.newSize / 1024).toFixed(2)}KB (${result.savings}% reducción)`
          );
        } else {
          console.log(
            `ℹ️  ${path.basename(file)}: Ya optimizado`
          );
        }
      }
    }

    console.log('\n');
  }

  const totalSavings = ((totalOriginalSize - totalNewSize) / totalOriginalSize * 100).toFixed(2);

  console.log('📊 Resumen:');
  console.log(`   Total archivos procesados: ${totalFiles}`);
  console.log(`   Archivos optimizados: ${optimizedFiles}`);
  console.log(`   Archivos omitidos: ${skippedFiles}`);
  console.log(`   Tamaño original: ${(totalOriginalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Tamaño final: ${(totalNewSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Ahorro total: ${totalSavings}% (${((totalOriginalSize - totalNewSize) / 1024 / 1024).toFixed(2)} MB)`);
}

main().catch(console.error);
