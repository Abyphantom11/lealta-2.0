const fetch = require('node-fetch');

async function monitorearDeploy() {
  console.log('🚀 MONITOREANDO DEPLOY DE VERCEL');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('📡 Push exitoso a GitHub');
  console.log('⏳ Esperando que Vercel detecte y haga el deploy...');
  console.log('');
  console.log('🔄 Testeando cada 10 segundos...');
  console.log('   (Presiona Ctrl+C para cancelar)');
  console.log('');
  
  let intentos = 0;
  const maxIntentos = 60; // 10 minutos máximo
  
  const intervalo = setInterval(async () => {
    intentos++;
    
    try {
      const response = await fetch('https://lealta.app/r/ig4gRl', {
        redirect: 'manual',
        headers: { 'User-Agent': 'Deploy-Monitor/1.0' }
      });
      
      const status = response.status;
      const timestamp = new Date().toLocaleTimeString();
      
      if (status === 302 || status === 301) {
        const location = response.headers.get('location');
        console.log(`[${timestamp}] ✅ ¡DEPLOY COMPLETADO!`);
        console.log('');
        console.log('🎉 El QR está funcionando correctamente');
        console.log(`   Redirige a: ${location}`);
        console.log('');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('');
        console.log('✨ TODO LISTO - Puedes probar el QR:');
        console.log('   https://lealta.app/r/ig4gRl');
        clearInterval(intervalo);
      } else if (status === 500) {
        console.log(`[${timestamp}] ⏳ Intento ${intentos}/${maxIntentos} - Aún desplegando (Error 500)...`);
      } else if (status === 404) {
        console.log(`[${timestamp}] ⏳ Intento ${intentos}/${maxIntentos} - Aún desplegando (404)...`);
      } else {
        console.log(`[${timestamp}] 🔍 Intento ${intentos}/${maxIntentos} - Status: ${status}`);
      }
      
      if (intentos >= maxIntentos) {
        console.log('');
        console.log('⚠️  Tiempo de espera agotado.');
        console.log('');
        console.log('Por favor verifica manualmente:');
        console.log('1. Dashboard de Vercel: https://vercel.com/dashboard');
        console.log('2. Logs del deploy');
        console.log('3. Prueba el QR: https://lealta.app/r/ig4gRl');
        clearInterval(intervalo);
      }
      
    } catch (error) {
      console.log(`[${timestamp}] ❌ Error en request: ${error.message}`);
    }
    
  }, 10000); // Cada 10 segundos
}

console.log('');
console.log('💡 INFORMACIÓN DEL DEPLOY:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');
console.log('Commit: 13e030e');
console.log('Branch: main');
console.log('Cambios: prisma/schema.prisma (modelos QRLink y QRClick)');
console.log('');
console.log('🔧 Vercel ejecutará automáticamente:');
console.log('   1. npm install');
console.log('   2. npx prisma generate (genera cliente con QRLink)');
console.log('   3. npm run build');
console.log('   4. Deploy del nuevo código');
console.log('');
console.log('⏱️  Tiempo estimado: 2-5 minutos');
console.log('');

setTimeout(monitorearDeploy, 2000); // Empezar después de 2 segundos
