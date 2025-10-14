// Diagnóstico del Portal Config después de optimización
const fs = require('fs');
const path = require('path');

const BUSINESS_ID = 'cmfnkcc1f0000eyj0dq0lcjji'; // Del URL en la imagen

async function diagnosticoPortalConfig() {
  console.log('🔍 DIAGNÓSTICO PORTAL CONFIG POST-OPTIMIZACIÓN\n');
  
  // 1. Verificar archivo de configuración
  const configPath = path.join(process.cwd(), 'config', 'portal', `portal-config-${BUSINESS_ID}.json`);
  console.log(`📁 Verificando archivo: portal-config-${BUSINESS_ID}.json`);
  console.log(`📍 Ruta: ${configPath}`);
  
  if (!fs.existsSync(configPath)) {
    console.log('❌ PROBLEMA: Archivo de configuración NO EXISTE');
    console.log('\n📋 Archivos disponibles:');
    const portalDir = path.join(process.cwd(), 'config', 'portal');
    if (fs.existsSync(portalDir)) {
      const files = fs.readdirSync(portalDir);
      files.forEach(file => console.log(`  - ${file}`));
    }
    return;
  }
  
  console.log('✅ Archivo de configuración encontrado');
  
  // 2. Leer y analizar contenido
  try {
    const fileContent = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(fileContent);
    
    console.log('\n📊 ANÁLISIS DEL CONTENIDO:');
    console.log(`- Empresa: ${config.nombreEmpresa || 'No definida'}`);
    console.log(`- Banners: ${config.banners?.length || 0}`);
    console.log(`- Promociones: ${config.promociones?.length || 0}`);
    console.log(`- Recompensas: ${config.recompensas?.length || 0}`);
    console.log(`- Tarjetas: ${config.tarjetas?.length || 0}`);
    console.log(`- Favorito del día: ${config.favoritoDelDia ? 'Configurado' : 'No configurado'}`);
    
    // 3. Verificar estructura del favorito del día
    if (config.favoritoDelDia) {
      console.log('\n🌟 FAVORITO DEL DÍA:');
      console.log(`- Días configurados: ${Object.keys(config.favoritoDelDia).length}`);
      Object.keys(config.favoritoDelDia).forEach(dia => {
        const fav = config.favoritoDelDia[dia];
        console.log(`  ${dia}: ${fav?.title || 'Sin título'} (${fav?.active ? 'Activo' : 'Inactivo'})`);
      });
    }
    
    // 4. Verificar dayConfigs (simulación)
    if (config.dayConfigs) {
      console.log('\n📅 CONFIGURACIONES POR DÍA:');
      Object.keys(config.dayConfigs).forEach(dia => {
        const dayConfig = config.dayConfigs[dia];
        console.log(`  ${dia}: ${JSON.stringify(dayConfig).length} caracteres`);
      });
    }
    
    // 5. Probar APIs
    console.log('\n🧪 PROBANDO APIs...');
    
    // API Pública
    try {
      const publicResponse = await fetch(`http://localhost:3000/api/portal/config?businessId=${BUSINESS_ID}`);
      console.log(`📡 API Pública (/api/portal/config): ${publicResponse.status}`);
      if (publicResponse.ok) {
        const data = await publicResponse.json();
        console.log(`  - Banners recibidos: ${data.data?.banners?.length || 0}`);
        console.log(`  - Promociones recibidas: ${data.data?.promociones?.length || 0}`);
        console.log(`  - Recompensas recibidas: ${data.data?.recompensas?.length || 0}`);
        console.log(`  - Favorito del día: ${data.data?.favoritoDelDia ? 'Presente' : 'Ausente'}`);
      } else {
        console.log(`  ❌ Error: ${await publicResponse.text()}`);
      }
    } catch (e) {
      console.log(`  ❌ Error conectando a API pública: ${e.message}`);
    }
    
    // API Admin
    try {
      const adminResponse = await fetch(`http://localhost:3000/api/admin/portal-config?businessId=${BUSINESS_ID}`);
      console.log(`🔐 API Admin (/api/admin/portal-config): ${adminResponse.status}`);
      if (adminResponse.ok) {
        const data = await adminResponse.json();
        console.log(`  - Banners recibidos: ${data.data?.banners?.length || 0}`);
        console.log(`  - Promociones recibidas: ${data.data?.promociones?.length || 0}`);
      } else {
        console.log(`  ❌ Error: ${await adminResponse.text()}`);
      }
    } catch (e) {
      console.log(`  ❌ Error conectando a API admin: ${e.message}`);
    }
    
    // 6. Verificar simulación de lunes
    try {
      const lunesResponse = await fetch(`http://localhost:3000/api/portal/config?businessId=${BUSINESS_ID}&simulateDay=lunes`);
      console.log(`🎭 Simulación Lunes: ${lunesResponse.status}`);
      if (lunesResponse.ok) {
        const data = await lunesResponse.json();
        console.log(`  - Favorito del día (lunes): ${data.data?.favoritoDelDia ? 'Presente' : 'Ausente'}`);
      }
    } catch (e) {
      console.log(`  ❌ Error en simulación: ${e.message}`);
    }
    
  } catch (error) {
    console.error('❌ Error parseando JSON:', error);
  }
}

// Función para verificar referencias en el código
function verificarReferenciasAPIs() {
  console.log('\n🔍 VERIFICANDO REFERENCIAS EN EL CÓDIGO...\n');
  
  const archivosAVerificar = [
    'src/app/cliente/components/AuthHandler.tsx',
    'src/hooks/useAutoRefreshPortalConfig.ts',
    'src/components/admin-v2/portal/PortalContentManager.tsx'
  ];
  
  archivosAVerificar.forEach(archivo => {
    const fullPath = path.join(process.cwd(), archivo);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Buscar referencias a APIs
      const refsPortalConfig = (content.match(/\/api\/portal\/config/g) || []).length;
      const refsAdminConfig = (content.match(/\/api\/admin\/portal-config/g) || []).length;
      const refsOldConfig = (content.match(/\/api\/portal\/config-v2/g) || []).length;
      
      console.log(`📄 ${archivo}:`);
      console.log(`  - /api/portal/config: ${refsPortalConfig} referencias`);
      console.log(`  - /api/admin/portal-config: ${refsAdminConfig} referencias`);
      console.log(`  - /api/portal/config-v2 (OBSOLETO): ${refsOldConfig} referencias ${refsOldConfig > 0 ? '❌' : '✅'}`);
    } else {
      console.log(`❌ ${archivo}: NO ENCONTRADO`);
    }
  });
}

// Ejecutar diagnóstico
diagnosticoPortalConfig()
  .then(() => {
    verificarReferenciasAPIs();
  })
  .catch(console.error);
