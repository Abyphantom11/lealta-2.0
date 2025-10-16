#!/usr/bin/env node

/**
 * Script para hacer un resumen de errores de ESLint
 */

const { execSync } = require('child_process');

console.log('📊 RESUMEN DE CALIDAD DE CÓDIGO - ESLint\n');

try {
  // Ejecutar ESLint y capturar output
  const result = execSync('npx eslint . --ext .ts,.tsx --format json', { encoding: 'utf8' });
  const eslintResults = JSON.parse(result);
  
  let totalErrors = 0;
  let totalWarnings = 0;
  let errorTypes = {};
  let warningTypes = {};
  
  eslintResults.forEach(file => {
    file.messages.forEach(message => {
      if (message.severity === 2) { // Error
        totalErrors++;
        errorTypes[message.ruleId] = (errorTypes[message.ruleId] || 0) + 1;
      } else if (message.severity === 1) { // Warning
        totalWarnings++;
        warningTypes[message.ruleId] = (warningTypes[message.ruleId] || 0) + 1;
      }
    });
  });
  
  console.log(`🔴 ERRORES: ${totalErrors}`);
  if (totalErrors > 0) {
    console.log('   Top errores:');
    Object.entries(errorTypes)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .forEach(([rule, count]) => {
        console.log(`   - ${rule}: ${count}`);
      });
  }
  
  console.log(`\n🟡 WARNINGS: ${totalWarnings}`);
  if (totalWarnings > 0) {
    console.log('   Top warnings:');
    Object.entries(warningTypes)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .forEach(([rule, count]) => {
        console.log(`   - ${rule}: ${count}`);
      });
  }
  
  console.log(`\n📈 PUNTUACIÓN DE CALIDAD:`);
  const totalIssues = totalErrors + totalWarnings;
  const score = Math.max(0, 100 - (totalErrors * 2 + totalWarnings));
  console.log(`   ${score}% (${totalIssues} issues total)`);
  
  if (score >= 90) {
    console.log('   🎉 EXCELENTE calidad de código!');
  } else if (score >= 80) {
    console.log('   ✅ BUENA calidad de código');
  } else if (score >= 70) {
    console.log('   ⚠️  ACEPTABLE - necesita mejoras');
  } else {
    console.log('   🔴 CRÍTICO - requiere atención inmediata');
  }
  
} catch (error) {
  console.log('❌ Error ejecutando ESLint:', error.message);
  console.log('💡 Esto puede significar que no hay errores críticos');
}
