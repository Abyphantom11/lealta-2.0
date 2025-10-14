// Script para optimizar imports y reducir tiempo de build
const fs = require('fs');
const path = require('path');

async function optimizeImports() {
  console.log('🔧 OPTIMIZANDO IMPORTS PARA BUILD MÁS RÁPIDO');
  console.log('='.repeat(50));
  
  // Buscar imports problemáticos que pueden ser optimizados
  const findFiles = (dir, ext) => {
    let results = [];
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        results = results.concat(findFiles(filePath, ext));
      } else if (file.endsWith(ext)) {
        results.push(filePath);
      }
    }
    
    return results;
  };
  
  const tsFiles = findFiles('./src', '.ts').concat(findFiles('./src', '.tsx'));
  
  console.log(`📁 Analizando ${tsFiles.length} archivos TypeScript/React...`);
  
  const problemImports = {
    'lodash': 0,
    'moment': 0,
    'entire-libraries': 0,
    'barrel-exports': 0
  };
  
  const optimizationSuggestions = [];
  
  for (const file of tsFiles.slice(0, 50)) { // Analizar primeros 50 archivos
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // Detectar imports problemáticos
      if (content.includes("import * as")) {
        problemImports['entire-libraries']++;
        optimizationSuggestions.push(`⚠️ ${file}: Usar imports específicos en lugar de import *`);
      }
      
      if (content.includes("import lodash") || content.includes("from 'lodash'")) {
        problemImports['lodash']++;
        optimizationSuggestions.push(`📦 ${file}: Usar lodash-es o imports específicos`);
      }
      
      if (content.includes("from 'moment'")) {
        problemImports['moment']++;
        optimizationSuggestions.push(`📅 ${file}: Considerar date-fns o dayjs en lugar de moment`);
      }
      
      // Detectar posibles barrel exports problemáticos
      const importLines = content.split('\n').filter(line => line.trim().startsWith('import'));
      for (const line of importLines) {
        if (line.includes('./') && line.includes('{') && line.split(',').length > 5) {
          problemImports['barrel-exports']++;
          optimizationSuggestions.push(`🎯 ${file}: Import barrel con muchos elementos`);
          break;
        }
      }
      
    } catch (error) {
      // Ignorar errores de lectura
    }
  }
  
  console.log('\n📊 PROBLEMAS ENCONTRADOS:');
  Object.entries(problemImports).forEach(([problem, count]) => {
    if (count > 0) {
      console.log(`   ${problem}: ${count} ocurrencias`);
    }
  });
  
  if (optimizationSuggestions.length > 0) {
    console.log('\n💡 SUGERENCIAS DE OPTIMIZACIÓN:');
    optimizationSuggestions.slice(0, 10).forEach(suggestion => {
      console.log(`   ${suggestion}`);
    });
    
    if (optimizationSuggestions.length > 10) {
      console.log(`   ... y ${optimizationSuggestions.length - 10} más`);
    }
  } else {
    console.log('\n✅ No se encontraron imports problemáticos evidentes');
  }
  
  // Generar configuración de optimización
  console.log('\n🚀 CONFIGURACIÓN RECOMENDADA:');
  console.log('1. Agregar a next.config.js:');
  console.log(`   experimental: {
     optimizePackageImports: ['lucide-react', 'framer-motion', 'date-fns']
   }`);
  
  console.log('\n2. Usar imports específicos:');
  console.log('   ❌ import * as React from "react"');
  console.log('   ✅ import { useState, useEffect } from "react"');
  
  console.log('\n3. Optimizar dependencias pesadas:');
  console.log('   📦 lodash → lodash-es + import específicos');
  console.log('   📅 moment → date-fns (más liviano)');
  console.log('   🎨 Material-UI → solo componentes necesarios');
}

optimizeImports().catch(console.error);
