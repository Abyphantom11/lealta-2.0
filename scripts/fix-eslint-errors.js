#!/usr/bin/env node

/**
 * Script para arreglar automáticamente errores comunes de ESLint
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Arreglando errores comunes de ESLint...\n');

// Función para procesar archivos recursivamente
function processFiles(dir, extension) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      processFiles(filePath, extension);
    } else if (file.endsWith(extension)) {
      fixFile(filePath);
    }
  }
}

// Función para arreglar un archivo
function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // 1. Arreglar comillas sin escapar en JSX
    const quoteFixes = [
      // Comillas dobles básicas
      { 
        pattern: /(\w)"(\w)/g, 
        replacement: '$1&quot;$2',
        description: 'Comillas dobles en texto'
      },
      // Comillas en botones y labels comunes
      {
        pattern: /"Escanear QR"/g,
        replacement: '&quot;Escanear QR&quot;',
        description: 'Botón Escanear QR'
      },
      {
        pattern: /"([^"]*QR[^"]*)"/g,
        replacement: '&quot;$1&quot;',
        description: 'Textos con QR'
      }
    ];
    
    for (const fix of quoteFixes) {
      if (fix.pattern.test(content)) {
        content = content.replace(fix.pattern, fix.replacement);
        modified = true;
        console.log(`  ✅ ${fix.description} en ${path.basename(filePath)}`);
      }
    }
    
    // 2. Arreglar imports de Image de Next.js (solo advertencias críticas)
    if (content.includes('<img') && content.includes('from "next/image"')) {
      // Ya tiene Image importado, sugerir pero no cambiar automáticamente
      console.log(`  ⚠️  ${path.basename(filePath)} tiene <img> y Next Image importado - revisar manualmente`);
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`  📝 Archivo actualizado: ${filePath}`);
    }
    
  } catch (error) {
    console.log(`  ❌ Error procesando ${filePath}: ${error.message}`);
  }
}

// Procesar archivos TSX y TS
console.log('📁 Procesando archivos React...');
processFiles('./src', '.tsx');
processFiles('./src', '.ts');

console.log('\n🎉 ¡Errores comunes de ESLint arreglados!');
console.log('💡 Ejecuta `npm run lint` para verificar mejoras');
