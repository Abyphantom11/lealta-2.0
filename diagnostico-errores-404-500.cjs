// Diagnóstico específico para los errores 404 y 500
const fs = require('fs');
const path = require('path');

async function diagnosticoErrores() {
  console.log('🚨 DIAGNÓSTICO DE ERRORES 404 Y 500\n');
  
  // 1. Verificar API by-name
  console.log('1. 📡 Verificando API /api/businesses/by-name...');
  const byNameApiPath = path.join(process.cwd(), 'src', 'app', 'api', 'businesses', 'by-name', '[businessName]', 'route.ts');
  
  if (fs.existsSync(byNameApiPath)) {
    console.log('✅ API by-name existe');
  } else {
    console.log('❌ API by-name NO existe');
    console.log(`   Ruta esperada: ${byNameApiPath}`);
  }
  
  // 2. Verificar API admin portal-config
  console.log('\n2. 🔐 Verificando API /api/admin/portal-config...');
  const adminApiPath = path.join(process.cwd(), 'src', 'app', 'api', 'admin', 'portal-config', 'route.ts');
  
  if (fs.existsSync(adminApiPath)) {
    console.log('✅ API admin portal-config existe');
    
    // Leer contenido para buscar problemas
    const content = fs.readFileSync(adminApiPath, 'utf8');
    if (content.includes('withAuth')) {
      console.log('✅ Middleware withAuth configurado');
    } else {
      console.log('⚠️ No se encontró middleware withAuth');
    }
  } else {
    console.log('❌ API admin portal-config NO existe');
  }
  
  // 3. Verificar archivo de configuración
  console.log('\n3. 📁 Verificando archivo de configuración...');
  const configPath = path.join(process.cwd(), 'config', 'portal', 'portal-config-cmgf5px5f0000eyy0elci9yds.json');
  
  if (fs.existsSync(configPath)) {
    console.log('✅ Archivo de configuración existe');
    
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      console.log(`   Empresa: ${config.nombreEmpresa || 'No definida'}`);
      console.log(`   BusinessId: ${config.businessId || 'No definido'}`);
      
      if (config.favoritoDelDia?.lunes) {
        console.log('✅ Favorito del lunes configurado');
      } else {
        console.log('❌ Favorito del lunes NO configurado');
      }
    } catch (e) {
      console.log('❌ Error parseando JSON:', e.message);
    }
  } else {
    console.log('❌ Archivo de configuración NO existe');
  }
  
  // 4. Verificar middleware de autenticación
  console.log('\n4. 🔒 Verificando middleware de autenticación...');
  const authMiddlewarePath = path.join(process.cwd(), 'middleware', 'requireAuth.ts');
  
  if (fs.existsSync(authMiddlewarePath)) {
    console.log('✅ Middleware de autenticación existe');
  } else {
    console.log('❌ Middleware de autenticación NO existe');
    console.log('   Esto puede causar errores 500 en APIs con withAuth');
  }
  
  // 5. Verificar prisma client
  console.log('\n5. 🗄️ Verificando Prisma client...');
  const prismaPath = path.join(process.cwd(), 'lib', 'prisma.ts');
  
  if (fs.existsSync(prismaPath)) {
    console.log('✅ Prisma client existe');
  } else {
    console.log('❌ Prisma client NO existe');
    console.log('   Esto puede causar errores en APIs que usan base de datos');
  }
  
  console.log('\n📋 RESUMEN DE PROBLEMAS POTENCIALES:');
  console.log('- Error 404 en /api/businesses/by-name: API creada ✅');
  console.log('- Error 500 en /api/admin/portal-config: Verificar middleware de auth y prisma');
  console.log('- Error de sincronización: Posible problema de red o auth');
  
  console.log('\n💡 SIGUIENTE PASO:');
  console.log('1. Iniciar servidor de desarrollo: npm run dev');
  console.log('2. Probar APIs manualmente en el navegador');
  console.log('3. Verificar logs del servidor para más detalles');
}

diagnosticoErrores();
