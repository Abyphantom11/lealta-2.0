// Script para generar iconos PNG desde SVGs para PWA Android
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Tamaños requeridos para Android PWA
const iconSizes = [72, 96, 128, 144, 152, 192, 256, 384, 512];

async function generatePNGIcons() {
  const inputSVG = path.join(__dirname, 'public', 'icons', 'icon-512-new.svg');
  const outputDir = path.join(__dirname, 'public', 'icons');
  
  console.log('📱 Generando iconos PNG oficiales de Lealta para PWA Android...');
  
  if (!fs.existsSync(inputSVG)) {
    console.error('❌ No se encontró icon-512-new.svg');
    return;
  }
  
  try {
    // Generar cada tamaño
    for (const size of iconSizes) {
      const outputPath = path.join(outputDir, `icon-${size}.png`);
      
      await sharp(inputSVG)
        .resize(size, size)
        .png({
          quality: 100,
          compressionLevel: 6
        })
        .toFile(outputPath);
      
      console.log(`✅ Generado: icon-${size}.png`);
    }
    
    // Generar iconos maskable (con padding para Android)
    for (const size of [192, 512]) {
      const outputPath = path.join(outputDir, `icon-${size}-maskable.png`);
      
      await sharp(inputSVG)
        .resize(Math.round(size * 0.8), Math.round(size * 0.8)) // 80% del tamaño para padding
        .extend({
          top: Math.round(size * 0.1),
          bottom: Math.round(size * 0.1),
          left: Math.round(size * 0.1),
          right: Math.round(size * 0.1),
          background: { r: 26, g: 26, b: 26, alpha: 1 } // background_color del manifest
        })
        .png({
          quality: 100,
          compressionLevel: 6
        })
        .toFile(outputPath);
      
      console.log(`✅ Generado maskable: icon-${size}-maskable.png`);
    }
    
    console.log('🚀 Todos los iconos PNG generados exitosamente!');
    
  } catch (error) {
    console.error('❌ Error generando iconos:', error);
  }
}

// Instalar Sharp si no está disponible
async function ensureSharp() {
  try {
    require('sharp');
    return true;
  } catch (error) {
    console.log('📦 Instalando Sharp...');
    const { execSync } = require('child_process');
    try {
      execSync('npm install sharp', { stdio: 'inherit' });
      return true;
    } catch (installError) {
      console.error('❌ Error instalando Sharp:', installError);
      return false;
    }
  }
}

// Ejecutar
async function main() {
  const sharpAvailable = await ensureSharp();
  if (sharpAvailable) {
    await generatePNGIcons();
  }
}

main();
