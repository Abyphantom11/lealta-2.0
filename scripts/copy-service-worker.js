const fs = require('fs');
const path = require('path');

// Copiar service worker al directorio público
const sourceFile = path.join(__dirname, '..', 'public', 'sw.js');
const targetFile = path.join(__dirname, '..', 'public', 'sw.js');

if (fs.existsSync(sourceFile)) {
  console.log('✅ Service Worker ya existe en public/sw.js');
} else {
  // Crear service worker básico si no existe
  const basicSW = `
// Basic service worker for PWA
const CACHE_NAME = 'lealta-v1';

self.addEventListener('install', event => {
  console.log('Service Worker: Install');
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('Service Worker: Activate');
});

self.addEventListener('fetch', event => {
  // Basic fetch handling
});
`;

  fs.writeFileSync(sourceFile, basicSW);
  console.log('✅ Service Worker básico creado en public/sw.js');
}
