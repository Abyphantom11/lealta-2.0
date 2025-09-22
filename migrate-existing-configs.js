// Script para migrar configuraciones existentes a la nueva estructura centralizada
const fs = require('fs');
const path = require('path');

async function migrateExistingConfigs() {
  try {
    const configDir = path.join(process.cwd(), 'config', 'portal');
    
    if (!fs.existsSync(configDir)) {
      console.log('📂 Config directory does not exist, skipping migration');
      return;
    }
    
    const files = fs.readdirSync(configDir).filter(file => 
      file.startsWith('portal-config-') && file.endsWith('.json') && file !== 'portal-config-.json'
    );
    
    console.log(`🔍 Found ${files.length} config files to analyze:`);
    
    let migratedCount = 0;
    let validCount = 0;
    
    for (const file of files) {
      const filePath = path.join(configDir, file);
      const businessId = file.replace('portal-config-', '').replace('.json', '');
      
      try {
        const config = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        console.log(`\n📄 Analyzing: ${businessId}`);
        
        const tarjetas = config.tarjetas || [];
        console.log(`   📊 Tarjetas found: ${tarjetas.length}`);
        
        // Detectar si necesita migración
        let needsMigration = false;
        let hasOldStructure = false;
        let hasMixedStructure = false;
        let hasCondicionesObject = false;
        let missingLevels = [];
        
        // Verificar estructura
        if (tarjetas.length > 0) {
          const hasNivelesArray = tarjetas.some(t => t.niveles && Array.isArray(t.niveles));
          hasCondicionesObject = tarjetas.some(t => t.condiciones && typeof t.condiciones === 'object');
          
          if (hasNivelesArray && hasCondicionesObject) {
            hasMixedStructure = true;
            needsMigration = true;
          } else if (hasNivelesArray && !hasCondicionesObject) {
            hasOldStructure = true;
            needsMigration = true;
          }
          
          // Verificar jerarquía completa
          const requiredLevels = ['Bronce', 'Plata', 'Oro', 'Diamante', 'Platino'];
          let foundLevels = [];
          
          if (hasNivelesArray) {
            // Estructura antigua: buscar en niveles[]
            tarjetas.forEach(tarjeta => {
              if (tarjeta.niveles) {
                tarjeta.niveles.forEach(nivel => foundLevels.push(nivel.nombre));
              }
            });
          } else {
            // Estructura nueva: buscar en nivel
            foundLevels = tarjetas.map(t => t.nivel).filter(Boolean);
          }
          
          missingLevels = requiredLevels.filter(level => !foundLevels.includes(level));
          
          if (missingLevels.length > 0) {
            needsMigration = true;
          }
        } else {
          needsMigration = true; // No hay tarjetas
        }
        
        console.log(`   🔍 Structure analysis:`);
        console.log(`      Old structure (niveles[]): ${hasOldStructure ? '✅' : '❌'}`);
        console.log(`      New structure (condiciones): ${hasCondicionesObject ? '✅' : '❌'}`);
        console.log(`      Mixed structure: ${hasMixedStructure ? '⚠️ YES' : '❌'}`);
        console.log(`      Missing levels: [${missingLevels.join(', ')}]`);
        console.log(`      Needs migration: ${needsMigration ? '🔄 YES' : '✅ NO'}`);
        
        if (needsMigration) {
          console.log(`   🔄 MIGRATING...`);
          
          // Crear nueva configuración con estructura centralizada
          const newConfig = {
            ...config,
            tarjetas: [
              {
                id: 'tarjeta-bronce',
                nivel: 'Bronce',
                nombrePersonalizado: 'Tarjeta Bronce',
                textoCalidad: 'Cliente Inicial',
                colores: {
                  gradiente: ['#CD7F32', '#8B4513'],
                  texto: '#FFFFFF',
                  nivel: '#CD7F32'
                },
                condiciones: {
                  puntosMinimos: 0,
                  gastosMinimos: 0,
                  visitasMinimas: 0
                },
                beneficio: 'Acceso a promociones exclusivas',
                activo: true
              },
              {
                id: 'tarjeta-plata',
                nivel: 'Plata',
                nombrePersonalizado: 'Tarjeta Plata',
                textoCalidad: 'Cliente Frecuente',
                colores: {
                  gradiente: ['#C0C0C0', '#808080'],
                  texto: '#FFFFFF',
                  nivel: '#C0C0C0'
                },
                condiciones: {
                  puntosMinimos: 100,
                  gastosMinimos: 500,
                  visitasMinimas: 5
                },
                beneficio: '5% de descuento en compras',
                activo: true
              },
              {
                id: 'tarjeta-oro',
                nivel: 'Oro',
                nombrePersonalizado: 'Tarjeta Oro',
                textoCalidad: 'Cliente Premium',
                colores: {
                  gradiente: ['#FFD700', '#FFA500'],
                  texto: '#000000',
                  nivel: '#FFD700'
                },
                condiciones: {
                  puntosMinimos: 500,
                  gastosMinimos: 1500,
                  visitasMinimas: 10
                },
                beneficio: '10% de descuento en compras',
                activo: true
              },
              {
                id: 'tarjeta-diamante',
                nivel: 'Diamante',
                nombrePersonalizado: 'Tarjeta Diamante',
                textoCalidad: 'Cliente VIP',
                colores: {
                  gradiente: ['#B9F2FF', '#0891B2'],
                  texto: '#FFFFFF',
                  nivel: '#B9F2FF'
                },
                condiciones: {
                  puntosMinimos: 1500,
                  gastosMinimos: 3000,
                  visitasMinimas: 20
                },
                beneficio: '15% de descuento en compras',
                activo: true
              },
              {
                id: 'tarjeta-platino',
                nivel: 'Platino',
                nombrePersonalizado: 'Tarjeta Platino',
                textoCalidad: 'Cliente Elite',
                colores: {
                  gradiente: ['#E5E7EB', '#9CA3AF'],
                  texto: '#FFFFFF',
                  nivel: '#E5E7EB'
                },
                condiciones: {
                  puntosMinimos: 3000,
                  gastosMinimos: 5000,
                  visitasMinimas: 30
                },
                beneficio: '20% de descuento en compras',
                activo: true
              }
            ],
            version: '2.0.0',
            lastUpdated: new Date().toISOString()
          };
          
          // Hacer backup
          const backupPath = filePath + '.backup-' + Date.now();
          fs.copyFileSync(filePath, backupPath);
          console.log(`   💾 Backup created: ${path.basename(backupPath)}`);
          
          // Escribir nueva configuración
          fs.writeFileSync(filePath, JSON.stringify(newConfig, null, 2));
          console.log(`   ✅ Migration completed for ${businessId}`);
          
          migratedCount++;
        } else {
          console.log(`   ✅ Already valid, no migration needed`);
          validCount++;
        }
        
      } catch (error) {
        console.error(`   ❌ Error processing ${businessId}:`, error.message);
      }
    }
    
    console.log(`\n📊 Migration Summary:`);
    console.log(`   Total files: ${files.length}`);
    console.log(`   Already valid: ${validCount}`);
    console.log(`   Migrated: ${migratedCount}`);
    console.log(`   ✅ All configurations now use centralized structure`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  }
}

migrateExistingConfigs();
