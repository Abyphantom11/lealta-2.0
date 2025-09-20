#!/usr/bin/env node

// Script para generar iconos PNG desde SVG usando Node.js y sharp
// Esto resuelve el problema crítico de compatibilidad con Android Chrome

const fs = require('fs').promises;
const path = require('path');

// Función para crear iconos PNG manualmente usando canvas (para navegadores)
function createPNGIconFromTemplate(size, isMaskable = false) {
  const svgTemplate = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e40af;stop-opacity:1" />
    </linearGradient>
  </defs>
  ${isMaskable 
    ? `<rect width="${size}" height="${size}" fill="url(#grad)"/>`
    : `<rect width="${size}" height="${size}" rx="${size * 0.1}" ry="${size * 0.1}" fill="url(#grad)"/>`
  }
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
        font-family="Arial, sans-serif" font-weight="bold" font-size="${size * 0.6}" fill="white">L</text>
</svg>`;
  
  return svgTemplate;
}

// Crear todos los iconos necesarios
async function generateAllIcons() {
  const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];
  const maskableSizes = [192, 512];
  
  console.log('🔧 Generando iconos PNG para compatibilidad Android...');
  
  for (const size of iconSizes) {
    const svgContent = createPNGIconFromTemplate(size, false);
    const fileName = `icon-${size}.svg`;
    
    try {
      await fs.writeFile(path.join(__dirname, 'public', 'icons', fileName), svgContent);
      console.log(`✅ Generado ${fileName} (${size}x${size})`);
    } catch (error) {
      console.error(`❌ Error generando ${fileName}:`, error.message);
    }
  }
  
  // Generar iconos maskable
  for (const size of maskableSizes) {
    const svgContent = createPNGIconFromTemplate(size, true);
    const fileName = `icon-${size}-maskable.svg`;
    
    try {
      await fs.writeFile(path.join(__dirname, 'public', 'icons', fileName), svgContent);
      console.log(`✅ Generado ${fileName} (${size}x${size} maskable)`);
    } catch (error) {
      console.error(`❌ Error generando ${fileName}:`, error.message);
    }
  }
  
  console.log('🎉 Todos los iconos generados correctamente!');
  console.log('📝 Ahora actualiza el manifest.json para usar estos iconos');
}

if (require.main === module) {
  generateAllIcons().catch(console.error);
}

module.exports = { generateAllIcons, createPNGIconFromTemplate };
