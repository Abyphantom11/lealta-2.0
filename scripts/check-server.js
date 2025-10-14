// Quick health check script
const http = require('http');

console.log('🔍 Verificando estado del servidor...');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  console.log(`✅ Servidor respondió con status: ${res.statusCode}`);
  console.log(`📡 Headers: ${JSON.stringify(res.headers, null, 2)}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(`📄 Página cargada (${data.length} caracteres)`);
    console.log('🚀 ¡El servidor está funcionando! Listo para tests E2E.');
    process.exit(0);
  });
});

req.on('error', (err) => {
  console.error(`❌ Error conectando al servidor: ${err.message}`);
  console.log('💡 Sugerencia: Ejecuta "npm run dev" en otra terminal');
  process.exit(1);
});

req.on('timeout', () => {
  console.error('⏰ Timeout - El servidor no responde');
  console.log('💡 Verifica que el servidor esté corriendo en puerto 3001');
  req.destroy();
  process.exit(1);
});

req.end();
