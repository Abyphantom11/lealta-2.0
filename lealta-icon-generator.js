// Generador de iconos PNG para PWA Android usando los iconos oficiales de Lealta
// Este script convierte los SVGs oficiales a PNG de alta calidad

console.log('🎨 === GENERADOR ICONOS LEALTA PARA ANDROID PWA ===');

/**
 * Crea un icono PNG desde un SVG usando canvas
 */
async function createPNGFromSVG(svgContent: string, size: number, isMaskable: boolean = false): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // Crear imagen desde SVG
    const img = new Image();
    const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = () => {
      // Crear canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('No se pudo crear contexto canvas'));
        return;
      }
      
      canvas.width = size;
      canvas.height = size;
      
      // Para iconos maskable, agregar padding de seguridad
      if (isMaskable) {
        // Android requiere que el contenido esté en el 80% central
        const safeZone = size * 0.8;
        const padding = size * 0.1;
        
        // Fondo sólido para maskable (se recortará según la forma del launcher)
        ctx.fillStyle = '#1f1f1f'; // Color de fondo del icono original
        ctx.fillRect(0, 0, size, size);
        
        // Dibujar SVG en el área segura
        ctx.drawImage(img, padding, padding, safeZone, safeZone);
      } else {
        // Icono normal - usar todo el canvas
        ctx.drawImage(img, 0, 0, size, size);
      }
      
      // Convertir a PNG de alta calidad
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('No se pudo crear PNG'));
        }
      }, 'image/png', 1.0);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo cargar SVG'));
    };
    
    img.src = url;
  });
}

/**
 * Descarga un blob como archivo
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Carga contenido de un SVG desde la URL
 */
async function loadSVGContent(svgPath: string): Promise<string> {
  try {
    const response = await fetch(svgPath);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.text();
  } catch (error) {
    console.error(`❌ Error cargando ${svgPath}:`, error);
    throw error;
  }
}

/**
 * Genera iconos PNG para PWA Android
 */
async function generatePNGIcons(): Promise<void> {
  console.log('📁 Cargando iconos SVG oficiales de Lealta...');
  
  try {
    // Cargar los SVGs oficiales
    const [baseSVG, icon192SVG, icon512SVG] = await Promise.all([
      loadSVGContent('/icons/icon-base.svg'),
      loadSVGContent('/icons/icon-192-new.svg'),
      loadSVGContent('/icons/icon-512-new.svg')
    ]);
    
    console.log('✅ SVGs cargados correctamente');
    
    // Definir tamaños requeridos para Android PWA
    const iconSizes = [
      { size: 72, name: 'icon-72x72.png', svg: baseSVG },
      { size: 96, name: 'icon-96x96.png', svg: baseSVG },
      { size: 128, name: 'icon-128x128.png', svg: baseSVG },
      { size: 144, name: 'icon-144x144.png', svg: baseSVG },
      { size: 152, name: 'icon-152x152.png', svg: baseSVG },
      { size: 192, name: 'icon-192x192.png', svg: icon192SVG },
      { size: 384, name: 'icon-384x384.png', svg: icon192SVG },
      { size: 512, name: 'icon-512x512.png', svg: icon512SVG }
    ];
    
    // Iconos maskable para Android adaptive icons
    const maskableIcons = [
      { size: 192, name: 'icon-192x192-maskable.png', svg: icon192SVG },
      { size: 512, name: 'icon-512x512-maskable.png', svg: icon512SVG }
    ];
    
    console.log('🎨 Generando iconos estándar...');
    
    // Generar iconos estándar
    for (const icon of iconSizes) {
      try {
        console.log(`⏳ Generando ${icon.name} (${icon.size}x${icon.size})...`);
        
        const pngBlob = await createPNGFromSVG(icon.svg, icon.size, false);
        downloadBlob(pngBlob, icon.name);
        
        console.log(`✅ ${icon.name} generado correctamente`);
        
        // Pequeña pausa para no saturar el navegador
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Error generando ${icon.name}:`, error);
      }
    }
    
    console.log('🎭 Generando iconos maskable...');
    
    // Generar iconos maskable
    for (const icon of maskableIcons) {
      try {
        console.log(`⏳ Generando ${icon.name} (maskable)...`);
        
        const pngBlob = await createPNGFromSVG(icon.svg, icon.size, true);
        downloadBlob(pngBlob, icon.name);
        
        console.log(`✅ ${icon.name} generado correctamente`);
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Error generando ${icon.name}:`, error);
      }
    }
    
    console.log('🎉 ¡Todos los iconos PNG generados!');
    console.log('📁 Guarda los archivos descargados en: public/icons/');
    console.log('📝 Luego actualiza el manifest.json para usar estos PNG');
    
  } catch (error) {
    console.error('❌ Error general:', error);
    console.log('💡 Asegúrate de estar en localhost o HTTPS para cargar los SVGs');
  }
}

/**
 * Genera manifest.json optimizado para Android con PNG
 */
function generateOptimizedManifest(): void {
  const manifest = {
    "name": "Lealta",
    "short_name": "Lealta", 
    "description": "Sistema de fidelización inteligente para tu negocio",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#1a1a1a",
    "theme_color": "#1f1f1f",
    "orientation": "portrait-primary",
    "scope": "/",
    "lang": "es",
    "dir": "ltr",
    "categories": ["business", "productivity"],
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
  
  console.log('📄 Manifest optimizado para Android:');
  console.log(JSON.stringify(manifest, null, 2));
  
  // Descargar manifest optimizado
  const blob = new Blob([JSON.stringify(manifest, null, 2)], { 
    type: 'application/json' 
  });
  downloadBlob(blob, 'manifest-android-optimized.json');
  
  console.log('✅ Manifest descargado como: manifest-android-optimized.json');
}

// Exportar funciones para uso global
(window as any).generatePNGIcons = generatePNGIcons;
(window as any).generateOptimizedManifest = generateOptimizedManifest;

// Auto-ejecutar
console.log('🚀 Para generar iconos PNG ejecuta: generatePNGIcons()');
console.log('📄 Para generar manifest optimizado ejecuta: generateOptimizedManifest()');

// Ejecutar automáticamente después de 3 segundos
setTimeout(() => {
  if (confirm('¿Generar automáticamente todos los iconos PNG desde los SVGs oficiales de Lealta?')) {
    generatePNGIcons().then(() => {
      setTimeout(() => {
        if (confirm('¿Generar también el manifest.json optimizado?')) {
          generateOptimizedManifest();
        }
      }, 2000);
    });
  }
}, 3000);
