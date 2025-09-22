/**
 * Script de prueba para el sistema de día comercial
 * Ejecutar: node test-business-day.mjs
 */

import { getCurrentBusinessDay, getBusinessDayDebugInfo } from './src/lib/business-day-utils.ts';

async function testBusinessDaySystem() {
  console.log('🧪 Iniciando pruebas del sistema de día comercial...\n');

  try {
    // Test 1: Configuración por defecto
    console.log('📋 Test 1: Configuración por defecto');
    const defaultDay = await getCurrentBusinessDay();
    console.log(`Día comercial actual (sin businessId): ${defaultDay}`);

    // Test 2: Debug info
    console.log('\n📋 Test 2: Información de debug');
    const debugInfo = await getBusinessDayDebugInfo();
    console.log('Debug info:', JSON.stringify(debugInfo, null, 2));

    // Test 3: Comparación hora límite
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    console.log(`\n📋 Test 3: Análisis de horario`);
    console.log(`Hora actual: ${hour}:${minute.toString().padStart(2, '0')}`);
    
    if (hour < 4 || (hour === 4 && minute === 0)) {
      console.log('✅ Estamos ANTES del reseteo (4:00 AM) - usando día anterior');
    } else {
      console.log('✅ Estamos DESPUÉS del reseteo (4:00 AM) - usando día actual');
    }

    console.log('\n🎉 Todas las pruebas completadas exitosamente!');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
  }
}

// Ejecutar pruebas
testBusinessDaySystem();
