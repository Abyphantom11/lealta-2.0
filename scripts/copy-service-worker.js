const fs = require('fs');
const path = require('path');

// Rutas de origen y destino
const serviceWorkerSrc = path.join(__dirname, '..', 'src', 'workers', 'service-worker.js');
const serviceWorkerDest = path.join(__dirname, '..', 'public', 'sw.js');

// Función para copiar el archivo
function copyServiceWorker() {
  try {
    // Leer el archivo de origen
    const data = fs.readFileSync(serviceWorkerSrc, 'utf8');
    
    // Escribir en el destino
    fs.writeFileSync(serviceWorkerDest, data);
    
    console.log('✅ Service Worker copiado exitosamente a public/sw.js');
  } catch (err) {
    console.error('❌ Error al copiar el Service Worker:', err);
  }
}

// Ejecutar la copia
copyServiceWorker();
