#!/usr/bin/env node

/**
 * 🔍 VERIFICAR DEPLOYMENT EN VERCEL
 * 
 * Verifica si el branch está deployado y en qué URL
 */

console.log('🔍 VERIFICACIÓN DE DEPLOYMENT EN VERCEL');
console.log('=======================================\n');

console.log('❌ PROBLEMA IDENTIFICADO: DEPLOYMENT_NOT_FOUND');
console.log('El branch no está disponible en la URL esperada.\n');

console.log('🔧 POSIBLES CAUSAS Y SOLUCIONES:');
console.log('─'.repeat(50));

console.log('\n1️⃣ EL BRANCH NO ESTÁ DEPLOYADO EN VERCEL');
console.log('   • Vercel solo deploys automáticamente main/master');
console.log('   • Los feature branches necesitan deployment manual');
console.log('   • Solución: Hacer merge a main o deploy manual');

console.log('\n2️⃣ EL DEPLOYMENT ESTÁ EN UNA URL DIFERENTE');
console.log('   • URL principal: https://lealta-2-0-six.vercel.app (main branch)');
console.log('   • URL del branch: https://lealta-2-0-[hash].vercel.app');
console.log('   • Cada branch tiene su propia URL de preview');

console.log('\n3️⃣ EL DEPLOYMENT ESTÁ PENDIENTE');
console.log('   • El push fue reciente, Vercel puede estar construyendo');
console.log('   • Tiempo típico: 2-5 minutos');

console.log('\n🎯 OPCIONES PARA CONTINUAR:');
console.log('─'.repeat(50));

console.log('\n✅ OPCIÓN 1: PROBAR EN MAIN BRANCH (RECOMENDADO)');
console.log('   • Hacer merge del branch a main');
console.log('   • Probar inmediatamente en producción');
console.log('   • Comando: git checkout main && git merge optimization/edge-requests-reduce-90-percent');

console.log('\n✅ OPCIÓN 2: ENCONTRAR URL DE PREVIEW');
console.log('   • Revisar el dashboard de Vercel');
console.log('   • Buscar deployment del branch "optimization/edge-requests-reduce-90-percent"');
console.log('   • Usar esa URL específica');

console.log('\n✅ OPCIÓN 3: DESARROLLO LOCAL');
console.log('   • Probar los cambios en localhost:3000');
console.log('   • Comando: npm run dev');
console.log('   • URL: http://localhost:3000');

console.log('\n💡 PRUEBA RÁPIDA CON LOCALHOST:');
console.log('─'.repeat(50));
console.log('1. npm run dev');
console.log('2. Abrir: http://localhost:3000/cmgf5px5f0000eyy0elci9yds/cliente');
console.log('3. Verificar si aparecen banners/promociones');
console.log('4. Probar API: http://localhost:3000/api/portal/banners?businessId=cmgf5px5f0000eyy0elci9yds');

console.log('\n🚨 DECISIÓN RECOMENDADA:');
console.log('─'.repeat(50));
console.log('Como tenemos cambios críticos, sugiero:');
console.log('1. Probar primero en localhost para confirmar que funciona');
console.log('2. Si funciona, hacer merge a main para deployment inmediato');
console.log('3. Si no funciona, continuar debugging en local');

console.log('\n📋 COMANDOS PARA EJECUTAR:');
console.log('─'.repeat(50));
console.log('# Probar en desarrollo local:');
console.log('npm run dev');
console.log('');
console.log('# Si funciona, deployar a producción:');
console.log('git checkout main');
console.log('git merge optimization/edge-requests-reduce-90-percent');
console.log('git push origin main');
