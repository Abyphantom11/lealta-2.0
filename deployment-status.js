console.log('🚀 PROYECTO LEALTA - ESTADO DE DESPLIEGUE');
console.log('=========================================\n');

const urls = {
  'Producción (Actual)': 'https://lealta-1pahkaewd-themaster2648-9501s-projects.vercel.app',
  'Dashboard Vercel': 'https://vercel.com/themaster2648-9501s-projects/lealta',
  'Inspección Build': 'https://vercel.com/themaster2648-9501s-projects/lealta/BohA3wPyDr2x96CJmaeZviZmicH',
  'Settings Storage': 'https://vercel.com/themaster2648-9501s-projects/lealta/settings/storage',
  'Environment Variables': 'https://vercel.com/themaster2648-9501s-projects/lealta/settings/environment-variables'
};

console.log('🔗 URLs IMPORTANTES:');
console.log('===================');
Object.entries(urls).forEach(([name, url]) => {
  console.log(`${name}: ${url}`);
});

console.log('\n📋 PASOS PARA CONFIGURAR BLOB STORAGE:');
console.log('=====================================');
console.log('1. Ve a Settings > Storage');
console.log('2. Encuentra "lealta-storage (store_QSQoErcPWIoMxvo2)"');
console.log('3. Haz clic en "Connect to Project"');
console.log('4. Verifica en Environment Variables que aparezca "BLOB_READ_WRITE_TOKEN"');

console.log('\n🧪 DESPUÉS DE CONFIGURAR:');
console.log('========================');
console.log('Ejecuta: node test-vercel-blob.js');
console.log('Para verificar que los uploads funcionan correctamente');

console.log('\n✅ ESTADO ACTUAL:');
console.log('================');
console.log('✅ Blob Store creado: lealta-storage (store_QSQoErcPWIoMxvo2)');
console.log('🔄 Deploy en progreso');
console.log('❌ Token de Blob Store pendiente de configurar');
console.log('❌ Sistema de uploads bloqueado hasta configurar token');
