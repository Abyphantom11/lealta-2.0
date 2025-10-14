// Script para diagnosticar y optimizar el tiempo de build de Next.js
const fs = require('fs');
const path = require('path');

async function analyzeBuildPerformance() {
  console.log('🚀 DIAGNÓSTICO DE PERFORMANCE DEL BUILD');
  console.log('='.repeat(60));
  
  // 1. ANALIZAR TAMAÑO DEL PROYECTO
  console.log('📊 1. ANÁLISIS DEL TAMAÑO DEL PROYECTO');
  console.log('-'.repeat(40));
  
  const getDirectorySize = (dirPath) => {
    let totalSize = 0;
    let fileCount = 0;
    
    try {
      const files = fs.readdirSync(dirPath);
      
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isDirectory()) {
          if (!file.startsWith('.') && file !== 'node_modules' && file !== '.next') {
            const subResult = getDirectorySize(filePath);
            totalSize += subResult.size;
            fileCount += subResult.count;
          }
        } else {
          totalSize += stats.size;
          fileCount++;
        }
      }
    } catch (error) {
      // Ignorar errores de permisos
    }
    
    return { size: totalSize, count: fileCount };
  };
  
  const srcResult = getDirectorySize('./src');
  const rootFiles = fs.readdirSync('.').filter(f => 
    f.endsWith('.js') || f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.json')
  );
  
  console.log(`📁 Tamaño del directorio src: ${(srcResult.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`📄 Archivos en src: ${srcResult.count}`);
  console.log(`📄 Archivos de configuración en root: ${rootFiles.length}`);
  
  // 2. ANALIZAR CONFIGURACIONES PROBLEMÁTICAS
  console.log('\n🔍 2. ANÁLISIS DE CONFIGURACIONES');
  console.log('-'.repeat(40));
  
  // Verificar next.config.js
  try {
    const nextConfigPath = './next.config.js';
    if (fs.existsSync(nextConfigPath)) {
      const nextConfig = fs.readFileSync(nextConfigPath, 'utf8');
      console.log('✅ next.config.js encontrado');
      
      // Buscar configuraciones que pueden afectar performance
      const performanceIssues = [];
      
      if (nextConfig.includes('swcMinify: false')) {
        performanceIssues.push('❌ swcMinify está deshabilitado');
      } else if (!nextConfig.includes('swcMinify')) {
        performanceIssues.push('⚠️ swcMinify no está configurado explícitamente');
      }
      
      if (nextConfig.includes('reactStrictMode: false')) {
        performanceIssues.push('⚠️ React Strict Mode está deshabilitado');
      }
      
      if (nextConfig.includes('experimental')) {
        performanceIssues.push('⚠️ Usando configuraciones experimentales');
      }
      
      if (performanceIssues.length > 0) {
        console.log('🚨 Problemas de configuración encontrados:');
        performanceIssues.forEach(issue => console.log(`   ${issue}`));
      } else {
        console.log('✅ Configuración de Next.js parece optimizada');
      }
    }
  } catch (error) {
    console.log('❌ Error leyendo next.config.js:', error.message);
  }
  
  // Verificar tsconfig.json
  try {
    const tsconfigPath = './tsconfig.json';
    if (fs.existsSync(tsconfigPath)) {
      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
      console.log('\n✅ tsconfig.json encontrado');
      
      const compilerOptions = tsconfig.compilerOptions || {};
      
      if (compilerOptions.incremental !== true) {
        console.log('⚠️ TypeScript incremental build no está habilitado');
      }
      
      if (compilerOptions.skipLibCheck !== true) {
        console.log('⚠️ skipLibCheck no está habilitado (puede ser lento)');
      }
      
      if (!compilerOptions.baseUrl && !compilerOptions.paths) {
        console.log('💡 Considera configurar path mapping para imports más rápidos');
      }
    }
  } catch (error) {
    console.log('❌ Error leyendo tsconfig.json:', error.message);
  }
  
  // 3. ANALIZAR DEPENDENCIAS
  console.log('\n📦 3. ANÁLISIS DE DEPENDENCIAS');
  console.log('-'.repeat(40));
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    const deps = packageJson.dependencies || {};
    const devDeps = packageJson.devDependencies || {};
    
    console.log(`📦 Dependencias de producción: ${Object.keys(deps).length}`);
    console.log(`🛠️ Dependencias de desarrollo: ${Object.keys(devDeps).length}`);
    
    // Buscar dependencias pesadas conocidas
    const heavyDeps = [];
    Object.keys(deps).forEach(dep => {
      if (['lodash', 'moment', 'antd', 'material-ui'].includes(dep)) {
        heavyDeps.push(`⚠️ ${dep} (considera alternativas más ligeras)`);
      }
    });
    
    if (heavyDeps.length > 0) {
      console.log('\n📚 Dependencias pesadas detectadas:');
      heavyDeps.forEach(dep => console.log(`   ${dep}`));
    }
    
  } catch (error) {
    console.log('❌ Error leyendo package.json:', error.message);
  }
  
  // 4. GENERAR RECOMENDACIONES
  console.log('\n🎯 4. RECOMENDACIONES DE OPTIMIZACIÓN');
  console.log('-'.repeat(40));
  
  console.log('⚡ OPTIMIZACIONES INMEDIATAS:');
  console.log('1. 🔧 Habilitar SWC Minifier en next.config.js');
  console.log('2. 📁 Habilitar TypeScript incremental build');
  console.log('3. 🎯 Configurar skipLibCheck en tsconfig.json');
  console.log('4. 🗂️ Configurar path mapping para imports');
  console.log('5. 🧹 Limpiar cache y node_modules');
  
  console.log('\n💡 OPTIMIZACIONES AVANZADAS:');
  console.log('1. 🔀 Habilitar Turbopack (experimental)');
  console.log('2. 📦 Analizar bundle size con @next/bundle-analyzer');
  console.log('3. 🎪 Implementar code splitting más agresivo');
  console.log('4. 🔄 Configurar SWC para transformaciones más rápidas');
  console.log('5. 💾 Usar build cache persistente');
  
  console.log('\n🛠️ COMANDOS PARA APLICAR OPTIMIZACIONES:');
  console.log('1. npm run clean-install  # Limpiar e instalar dependencias');
  console.log('2. npm run analyze        # Analizar tamaño del bundle');
  console.log('3. npm run build:fast     # Build optimizado');
  
  // 5. GENERAR CONFIGURACIONES OPTIMIZADAS
  console.log('\n📝 5. GENERANDO CONFIGURACIONES OPTIMIZADAS...');
  console.log('-'.repeat(40));
  
  // Generar next.config.js optimizado
  const optimizedNextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  // ⚡ Optimizaciones de build
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // 🎯 Optimizaciones de desarrollo
  reactStrictMode: true,
  
  // 📦 Optimizaciones de bundle
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  
  // 🔄 Cache y build
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // 📁 Optimizaciones de archivos
  images: {
    formats: ['image/webp', 'image/avif'],
  },
  
  // 🚀 Build output
  output: 'standalone',
  
  // 🎪 Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.optimization.splitChunks.chunks = 'all';
    }
    return config;
  },
};

module.exports = nextConfig;`;

  // Generar tsconfig.json optimizado (solo las partes que faltan)
  const tsconfigOptimizations = `{
  "compilerOptions": {
    "incremental": true,
    "skipLibCheck": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/utils/*": ["./src/utils/*"]
    }
  },
  "exclude": ["node_modules", ".next", "**/*.test.ts", "**/*.test.tsx"]
}`;

  console.log('✅ Configuraciones optimizadas generadas');
  console.log('📄 next.config.optimized.js - Configuración de Next.js optimizada');
  console.log('📄 tsconfig.optimized.json - Configuración de TypeScript optimizada');
  
  // Escribir archivos de configuración optimizados
  fs.writeFileSync('./next.config.optimized.js', optimizedNextConfig);
  fs.writeFileSync('./tsconfig.optimized.json', tsconfigOptimizations);
  
  console.log('\n🎯 PRÓXIMOS PASOS:');
  console.log('1. Revisar las configuraciones generadas');
  console.log('2. Respaldar configuraciones actuales');
  console.log('3. Aplicar optimizaciones gradualmente');
  console.log('4. Medir improvement en tiempo de build');
}

analyzeBuildPerformance().catch(console.error);
