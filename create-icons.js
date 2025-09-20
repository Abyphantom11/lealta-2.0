import fs from 'fs';
import path from 'path';

// Crear SVG simple que se puede convertir a PNG
function createIconSVG(size) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e40af;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.1}" ry="${size * 0.1}" fill="url(#grad)"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
        font-family="Arial, sans-serif" font-weight="bold" font-size="${size * 0.6}" fill="white">L</text>
</svg>`;
}

// Crear iconos SVG para diferentes tamaños
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, 'public', 'icons');

// Crear directorio si no existe
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

sizes.forEach(size => {
  const svgContent = createIconSVG(size);
  const filename = `icon-${size}.svg`;
  const filepath = path.join(iconsDir, filename);
  
  fs.writeFileSync(filepath, svgContent);
  console.log(`✅ Creado: ${filename}`);
});

console.log('🎉 Todos los íconos SVG han sido creados');
console.log('💡 Para convertir a PNG, usa un convertidor online o herramientas como ImageMagick');
console.log('💡 Alternativamente, abre generate-icons.html en tu navegador para descargar PNGs');
