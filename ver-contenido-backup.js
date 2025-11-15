/**
 * 🔍 VER QUÉ CONTIENE EL BACKUP
 */

const fs = require('fs');
const path = require('path');

const backupPath = path.join(__dirname, 'backups', 'backup_json_2025-10-31T07-17-41Z.json');

console.log('🔍 ANALIZANDO CONTENIDO DEL BACKUP\n');

const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

console.log('📊 ESTRUCTURA DEL BACKUP:\n');
console.log('Claves principales:', Object.keys(backup));

if (backup.data) {
  console.log('\n📦 TABLAS EN backup.data:\n');
  Object.keys(backup.data).sort().forEach(tabla => {
    const registros = Array.isArray(backup.data[tabla]) ? backup.data[tabla].length : 'N/A';
    console.log(`   ${tabla}: ${registros} registros`);
  });
}

if (backup.metadata) {
  console.log('\n� METADATA:\n', JSON.stringify(backup.metadata, null, 2));
}

console.log('\n🔍 Buscando reservas y HostTracking de octubre...\n');

if (backup.data && backup.data.reservations) {
  const reservas = backup.data.reservations;
  console.log(`📊 Total reservations en backup: ${reservas.length}`);
  
  const reservasOctubre = reservas.filter(r => {
    if (!r.reservedAt) return false;
    const fecha = new Date(r.reservedAt);
    return fecha.getMonth() === 9 && fecha.getFullYear() === 2025;
  });
  
  console.log(`📅 Reservations de octubre 2025: ${reservasOctubre.length}`);
  
  // Verificar si tienen HostTracking embebido
  const conHostTracking = reservasOctubre.filter(r => r.HostTracking || r.hostTracking).length;
  console.log(`📊 Con HostTracking: ${conHostTracking}`);
  console.log(`📊 Sin HostTracking: ${reservasOctubre.length - conHostTracking}`);
  
  if (conHostTracking > 0) {
    const totalAsistentes = reservasOctubre.reduce((sum, r) => {
      const ht = r.HostTracking || r.hostTracking;
      return sum + (ht?.guestCount || 0);
    }, 0);
    console.log(`👥 Total asistentes registrados: ${totalAsistentes}`);
  }
  
  // Muestra de primeras 3 reservas de octubre
  console.log(`\n📝 MUESTRA (primeras 3 reservas de octubre):`);
  reservasOctubre.slice(0, 3).forEach((r, idx) => {
    console.log(`\n${idx + 1}. ${new Date(r.reservedAt).toLocaleDateString('es-ES')}`);
    console.log(`   Cliente: ${r.customerName || 'N/A'}`);
    console.log(`   Esperados: ${r.guestCount}`);
    console.log(`   HostTracking: ${r.HostTracking || r.hostTracking ? 'SÍ' : 'NO'}`);
    if (r.HostTracking || r.hostTracking) {
      const ht = r.HostTracking || r.hostTracking;
      console.log(`   Asistieron: ${ht.guestCount || 0}`);
    }
  });
}

// Buscar si HostTracking está como tabla separada
const todasLasTablas = Object.keys(backup.data);
console.log(`\n� Todas las tablas en el backup:`);
console.log(todasLasTablas.join(', '));

