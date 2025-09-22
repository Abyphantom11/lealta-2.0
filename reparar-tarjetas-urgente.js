// 🔧 REPARACIÓN URGENTE: Configuración de Tarjetas Corregida
// Este script regenera la configuración de tarjetas con los 5 niveles requeridos

const fs = require('fs');
const path = require('path');

console.log('🔧 REPARACIÓN URGENTE - CONFIGURACIÓN DE TARJETAS');
console.log('================================================');

const businessId = 'cmfuou55e0022ey7c3idlhx9h';
const configPath = `C:\\Users\\abrah\\lealta\\config\\portal\\portal-config-${businessId}.json`;

console.log(`📁 Archivo: ${configPath}`);

try {
  // Leer configuración actual
  const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  console.log('✅ Configuración cargada');

  // Configuración de tarjetas corregida con 5 niveles
  const tarjetasCorregidas = [
    {
      "id": "tarjeta-default",
      "nombre": "Tarjeta arepa",
      "descripcion": "Sistema de lealtad personalizado",
      "activa": true,
      "condicional": "OR",
      "niveles": [
        {
          "nombre": "Bronce",
          "puntosRequeridos": 0,
          "visitasRequeridas": 0,
          "beneficio": "Cliente Inicial",
          "descuento": 0,
          "colores": ["#CD7F32", "#B8860B"]
        },
        {
          "nombre": "Plata",
          "puntosRequeridos": 500,
          "visitasRequeridas": 10,
          "beneficio": "Cliente Frecuente",
          "descuento": 5,
          "colores": ["#C0C0C0", "#E8E8E8"]
        },
        {
          "nombre": "Oro",
          "puntosRequeridos": 1500,
          "visitasRequeridas": 25,
          "beneficio": "Cliente VIP",
          "descuento": 10,
          "colores": ["#FFD700", "#FFA500"]
        },
        {
          "nombre": "Diamante",
          "puntosRequeridos": 3000,
          "visitasRequeridas": 50,
          "beneficio": "Cliente Premium",
          "descuento": 15,
          "colores": ["#B9F2FF", "#00BFFF"]
        },
        {
          "nombre": "Platino",
          "puntosRequeridos": 5000,
          "visitasRequeridas": 100,
          "beneficio": "Cliente Exclusivo",
          "descuento": 20,
          "colores": ["#E5E4E2", "#B8B8B8"]
        }
      ]
    }
  ];

  // Actualizar configuración
  configData.tarjetas = tarjetasCorregidas;
  configData.lastUpdated = new Date().toISOString();
  configData.version = "2.1.0";

  // Crear backup
  const backupPath = `${configPath}.backup.${Date.now()}`;
  fs.writeFileSync(backupPath, JSON.stringify(configData, null, 2));
  console.log(`💾 Backup creado: ${backupPath}`);

  // Guardar configuración corregida
  fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));
  console.log('✅ Configuración corregida guardada');

  console.log('\n📊 RESUMEN DE CORRECCIÓN:');
  console.log('========================');
  console.log('✅ 5 niveles configurados: Bronce, Plata, Oro, Diamante, Platino');
  console.log('✅ Progresión lógica de puntos: 0 → 500 → 1500 → 3000 → 5000');
  console.log('✅ Progresión lógica de visitas: 0 → 10 → 25 → 50 → 100');
  console.log('✅ Descuentos progresivos: 0% → 5% → 10% → 15% → 20%');
  console.log('✅ Colores únicos para cada nivel');
  
  console.log('\n🎯 VALIDACIÓN ESPERADA:');
  console.log('✅ Jerarquía válida');
  console.log('✅ Sin errores de validación');
  console.log('✅ Compatible con sistema central');

} catch (error) {
  console.error('❌ Error en reparación:', error);
  console.log('\n🔧 RECUPERACIÓN MANUAL:');
  console.log('1. Verificar que el archivo existe');
  console.log('2. Verificar permisos de escritura');
  console.log('3. Revisar sintaxis JSON');
}

console.log('\n🏁 REPARACIÓN COMPLETADA');
console.log('========================');
console.log('🔄 Recarga la página del admin para ver los cambios');

module.exports = { businessId, configPath };
