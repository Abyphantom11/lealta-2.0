#!/usr/bin/env node

/**
 * Script para limpiar caracteres problemáticos en archivos TSX
 */

const fs = require('fs');
const path = require('path');

const file = process.argv[2] || 'src/app/reservas/ReservasApp.tsx';

console.log(`🧹 Limpiando caracteres problemáticos en ${file}...\n`);

try {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;
  
  // 1. Reemplazar entidades HTML mal formateadas
  const htmlEntityFixes = [
    { from: /&quot;/g, to: '"', desc: 'Entidades quote' },
    { from: /&amp;/g, to: '&', desc: 'Entidades ampersand' },
    { from: /&lt;/g, to: '<', desc: 'Entidades menor que' },
    { from: /&gt;/g, to: '>', desc: 'Entidades mayor que' },
  ];
  
  for (const fix of htmlEntityFixes) {
    if (fix.from.test(content)) {
      const matches = content.match(fix.from);
      content = content.replace(fix.from, fix.to);
      modified = true;
      console.log(`  ✅ ${fix.desc}: ${matches?.length || 0} reemplazos`);
    }
  }
  
  // 2. Normalizar comillas
  const quoteFixes = [
    { from: /"|"/g, to: '"', desc: 'Comillas curvadas' },
    { from: /'/g, to: "'", desc: 'Comillas simples curvadas' },
  ];
  
  for (const fix of quoteFixes) {
    if (fix.from.test(content)) {
      const matches = content.match(fix.from);
      content = content.replace(fix.from, fix.to);
      modified = true;
      console.log(`  ✅ ${fix.desc}: ${matches?.length || 0} reemplazos`);
    }
  }
  
  // 3. Limpiar espacios problemáticos
  const spaceFixes = [
    { from: /\u00A0/g, to: ' ', desc: 'Espacios no rompibles' },
    { from: /\u2028/g, to: '\n', desc: 'Separadores de línea' },
    { from: /\u2029/g, to: '\n', desc: 'Separadores de párrafo' },
  ];
  
  for (const fix of spaceFixes) {
    if (fix.from.test(content)) {
      const matches = content.match(fix.from);
      content = content.replace(fix.from, fix.to);
      modified = true;
      console.log(`  ✅ ${fix.desc}: ${matches?.length || 0} reemplazos`);
    }
  }
  
  if (modified) {
    fs.writeFileSync(file, content);
    console.log(`\n📝 Archivo limpio guardado: ${file}`);
  } else {
    console.log(`\n✅ Archivo ya está limpio: ${file}`);
  }
  
} catch (error) {
  console.log(`❌ Error: ${error.message}`);
}
