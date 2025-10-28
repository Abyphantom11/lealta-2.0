console.log('🔍 DIAGNÓSTICO ESPECÍFICO - PROBLEMA DE PERSISTENCIA DE HORA');
console.log('=========================================================');

// Simular exactamente lo que pasa en móvil vs escritorio
const { calcularFechasReserva, formatearHoraMilitar } = require('./src/lib/timezone-utils.js');

console.log('\n🧪 CASOS ESPECÍFICOS REPORTADOS:');
console.log('─────────────────────────────────');

const casosProblema = [
  { input: '05:30', expected: '05:30', problema: 'Se cambia a 12:30' },
  { input: '11:30', expected: '11:30', problema: 'Se guarda como 05:30' }
];

casosProblema.forEach((caso, i) => {
  console.log(`\n📋 CASO ${i + 1}: Input ${caso.input} → ¿Debería ser ${caso.expected}?`);
  console.log(`Problema reportado: ${caso.problema}`);
  
  try {
    // Simular lo que hace el API actual
    const resultado = calcularFechasReserva("2024-01-15", caso.input);
    const horaExtracta = formatearHoraMilitar(resultado.fechaReserva);
    
    console.log('📊 RESULTADO:');
    console.log(`   Input original: ${caso.input}`);
    console.log(`   UTC calculado: ${resultado.fechaReserva.toISOString()}`);
    console.log(`   Hora extraída: ${horaExtracta}`);
    console.log(`   ¿Es correcto?: ${horaExtracta === caso.expected ? '✅ SÍ' : '❌ NO'}`);
    
    if (horaExtracta !== caso.expected) {
      const diferencia = calcularDiferenciaHoras(caso.input, horaExtracta);
      console.log(`   🔍 Diferencia: ${diferencia} horas`);
      console.log(`   🔍 Posible causa: ${diagnosticarCausa(diferencia)}`);
    }
    
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
  }
});

function calcularDiferenciaHoras(horaA, horaB) {
  const [horasA, minutosA] = horaA.split(':').map(Number);
  const [horasB, minutosB] = horaB.split(':').map(Number);
  
  const totalMinutosA = horasA * 60 + minutosA;
  const totalMinutosB = horasB * 60 + minutosB;
  
  return (totalMinutosB - totalMinutosA) / 60;
}

function diagnosticarCausa(diferencia) {
  if (diferencia === 5) return 'Conversión única UTC-5 (Colombia)';
  if (diferencia === -5) return 'Conversión inversa UTC-5';
  if (diferencia === 6) return 'Conversión UTC-6 (otro timezone)';
  if (diferencia === -6) return 'Conversión inversa UTC-6';
  if (diferencia === 7) return 'Doble conversión UTC + diferencia horaria';
  if (diferencia === -7) return 'Doble conversión inversa';
  return 'Conversión desconocida';
}

console.log('\n🔍 ANÁLISIS ADICIONAL:');
console.log('─────────────────────');

// Probar diferentes scenarios de timezone
console.log('\n1. ¿Qué pasa si el servidor está en UTC?');
const originalTZ = process.env.TZ;
process.env.TZ = 'UTC';

try {
  const resultadoUTC = calcularFechasReserva("2024-01-15", "11:30");
  const horaUTC = formatearHoraMilitar(resultadoUTC.fechaReserva);
  console.log(`   Servidor UTC: 11:30 → ${horaUTC}`);
} catch (e) {
  console.log(`   Error con UTC: ${e.message}`);
}

// Restaurar timezone
if (originalTZ) {
  process.env.TZ = originalTZ;
} else {
  delete process.env.TZ;
}

console.log('\n2. ¿Qué pasa con diferentes horarios del día?');
const horasTest = ['00:30', '06:30', '12:30', '18:30', '23:30'];
horasTest.forEach(hora => {
  try {
    const res = calcularFechasReserva("2024-01-15", hora);
    const horaOut = formatearHoraMilitar(res.fechaReserva);
    console.log(`   ${hora} → ${horaOut} (diff: ${calcularDiferenciaHoras(hora, horaOut)}h)`);
  } catch (e) {
    console.log(`   ${hora} → ERROR`);
  }
});

console.log('\n💡 SOLUCIÓN RECOMENDADA:');
console.log('────────────────────────');
console.log('1. Identificar EXACTAMENTE qué endpoint usa el móvil');
console.log('2. Verificar si hay doble conversión de timezone');
console.log('3. Asegurar que móvil y escritorio usen la misma lógica');
console.log('4. Implementar logs de debugging en el API principal');
