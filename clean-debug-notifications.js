// Script para limpiar notificaciones de debug del localStorage
console.log('🧹 Limpiando notificaciones de debug...');

// Limpiar todas las versiones de notificaciones en localStorage
const keys = [
  'client-notifications',
  'client-notifications-v2', 
  'client-notifications-v3',
  'notifications',
  'lealta-notifications',
  'pwa-notifications'
];

keys.forEach(key => {
  if (localStorage.getItem(key)) {
    console.log(`🗑️ Eliminando ${key}`);
    localStorage.removeItem(key);
  }
});

// Limpiar cualquier clave que contenga "notification" o "debug" o "pwa"
Object.keys(localStorage).forEach(key => {
  if (key.toLowerCase().includes('notification') || 
      key.toLowerCase().includes('debug') || 
      key.toLowerCase().includes('pwa-debug')) {
    console.log(`🗑️ Eliminando clave relacionada: ${key}`);
    localStorage.removeItem(key);
  }
});

console.log('✅ Limpieza completa terminada');
console.log('📊 Claves restantes en localStorage:', Object.keys(localStorage).length);
