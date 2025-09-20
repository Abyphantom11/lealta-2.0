// Script para crear iconos PNG optimizados para PWA Android
// Los iconos SVG pueden causar problemas en Android Chrome

console.log('🔧 === GENERANDO ICONOS PNG PARA ANDROID PWA ===');

// Función para crear un canvas con el logo en PNG
function createPNGIcon(size, filename) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  canvas.width = size;
  canvas.height = size;
  
  // Fondo transparente
  ctx.clearRect(0, 0, size, size);
  
  // Crear gradiente de fondo elegante
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#3b82f6'); // Azul primary
  gradient.addColorStop(1, '#1e40af'); // Azul más oscuro
  
  // Fondo circular con gradiente
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, 2 * Math.PI);
  ctx.fill();
  
  // Texto "L" en el centro (logo simplificado)
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${size * 0.5}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('L', size / 2, size / 2);
  
  // Agregar borde sutil
  ctx.strokeStyle = '#1e40af';
  ctx.lineWidth = size * 0.02;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - ctx.lineWidth, 0, 2 * Math.PI);
  ctx.stroke();
  
  // Convertir a PNG y descargar
  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log(`✅ Generado: ${filename} (${size}x${size})`);
  }, 'image/png', 1.0);
}

// Función para crear icono maskable (Android adaptive icon)
function createMaskableIcon(size, filename) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  canvas.width = size;
  canvas.height = size;
  
  // Para iconos maskable, necesitamos usar el 80% central del canvas
  const safeZone = size * 0.8;
  const margin = size * 0.1;
  
  // Fondo sólido que se extiende a toda el área
  ctx.fillStyle = '#3b82f6';
  ctx.fillRect(0, 0, size, size);
  
  // Logo en el área segura
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${safeZone * 0.4}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('L', size / 2, size / 2);
  
  // Convertir a PNG y descargar
  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log(`✅ Generado: ${filename} (${size}x${size}) - Maskable`);
  }, 'image/png', 1.0);
}

// Generar todos los tamaños necesarios para Android
function generateAllIcons() {
  console.log('📱 Generando iconos estándar...');
  
  // Iconos estándar necesarios para Android
  const standardSizes = [72, 96, 128, 144, 152, 192, 384, 512];
  
  standardSizes.forEach(size => {
    setTimeout(() => {
      createPNGIcon(size, `icon-${size}x${size}.png`);
    }, size); // Pequeño delay para evitar saturar el navegador
  });
  
  console.log('🎭 Generando iconos maskable...');
  
  // Iconos maskable para Android adaptive icons
  const maskableSizes = [192, 512];
  
  maskableSizes.forEach(size => {
    setTimeout(() => {
      createMaskableIcon(size, `icon-${size}x${size}-maskable.png`);
    }, size + 1000); // Delay mayor para iconos maskable
  });
  
  console.log('💾 Descargando archivos...');
  console.log('📁 Guarda estos archivos en: public/icons/');
  console.log('📝 Luego actualiza el manifest.json con las nuevas rutas PNG');
}

// Función para generar manifest.json optimizado para Android
function generateOptimizedManifest() {
  const manifest = {
    "name": "Lealta",
    "short_name": "Lealta",
    "description": "Sistema de fidelización inteligente para tu negocio",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#1a1a1a",
    "theme_color": "#3b82f6",
    "orientation": "any",
    "scope": "/",
    "lang": "es",
    "dir": "ltr",
    "categories": ["business", "productivity", "utilities"],
    "prefer_related_applications": false,
    "icons": [
      {
        "src": "/icons/icon-72x72.png",
        "sizes": "72x72",
        "type": "image/png",
        "purpose": "any"
      },
      {
        "src": "/icons/icon-96x96.png",
        "sizes": "96x96",
        "type": "image/png",
        "purpose": "any"
      },
      {
        "src": "/icons/icon-128x128.png",
        "sizes": "128x128",
        "type": "image/png",
        "purpose": "any"
      },
      {
        "src": "/icons/icon-144x144.png",
        "sizes": "144x144",
        "type": "image/png",
        "purpose": "any"
      },
      {
        "src": "/icons/icon-152x152.png",
        "sizes": "152x152",
        "type": "image/png",
        "purpose": "any"
      },
      {
        "src": "/icons/icon-192x192.png",
        "sizes": "192x192",
        "type": "image/png",
        "purpose": "any"
      },
      {
        "src": "/icons/icon-192x192-maskable.png",
        "sizes": "192x192",
        "type": "image/png",
        "purpose": "maskable"
      },
      {
        "src": "/icons/icon-384x384.png",
        "sizes": "384x384",
        "type": "image/png",
        "purpose": "any"
      },
      {
        "src": "/icons/icon-512x512.png",
        "sizes": "512x512",
        "type": "image/png",
        "purpose": "any"
      },
      {
        "src": "/icons/icon-512x512-maskable.png",
        "sizes": "512x512",
        "type": "image/png",
        "purpose": "maskable"
      }
    ],
    "shortcuts": [
      {
        "name": "Dashboard Admin",
        "short_name": "Dashboard",
        "description": "Acceder al dashboard administrativo",
        "url": "/admin?shortcut=dashboard",
        "icons": [
          {
            "src": "/icons/icon-192x192.png",
            "sizes": "192x192",
            "type": "image/png"
          }
        ]
      },
      {
        "name": "Portal Staff",
        "short_name": "Staff",
        "description": "Acceso rápido para empleados",
        "url": "/staff?shortcut=staff",
        "icons": [
          {
            "src": "/icons/icon-192x192.png",
            "sizes": "192x192",
            "type": "image/png"
          }
        ]
      },
      {
        "name": "Mi Tarjeta",
        "short_name": "Cliente",
        "description": "Ver el estado de mi tarjeta de lealtad",
        "url": "/cliente?shortcut=tarjeta",
        "icons": [
          {
            "src": "/icons/icon-192x192.png",
            "sizes": "192x192",
            "type": "image/png"
          }
        ]
      }
    ]
  };
  
  console.log('📄 Manifest.json optimizado para Android:');
  console.log(JSON.stringify(manifest, null, 2));
  
  // Descargar el archivo manifest optimizado
  const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'manifest-android-optimized.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  console.log('✅ Manifest optimizado descargado como: manifest-android-optimized.json');
}

// Ejecutar generación
console.log('🚀 Para generar iconos PNG ejecuta: generateAllIcons()');
console.log('📄 Para generar manifest optimizado ejecuta: generateOptimizedManifest()');

// Exportar funciones
window.iconGenerator = {
  generateAllIcons,
  generateOptimizedManifest,
  createPNGIcon,
  createMaskableIcon
};

// Auto-ejecutar en 3 segundos si no se llama manualmente
setTimeout(() => {
  if (confirm('¿Generar iconos PNG automáticamente para mejorar compatibilidad con Android?')) {
    generateAllIcons();
    setTimeout(() => {
      generateOptimizedManifest();
    }, 3000);
  }
}, 3000);
