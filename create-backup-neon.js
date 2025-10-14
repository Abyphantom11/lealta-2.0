const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const zlib = require('zlib');

const prisma = new PrismaClient();

class NeonBackupManager {
  constructor() {
    this.backupDir = path.join(__dirname, 'backups');
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Crear carpeta de backups si no existe
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  /**
   * Extrae los parámetros de conexión de la DATABASE_URL de Neon
   */
  parseNeonConnectionString() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL no encontrada en variables de entorno');
    }

    // Formato típico de Neon: postgresql://user:password@host:port/database?sslmode=require
    const url = new URL(databaseUrl);
    
    return {
      host: url.hostname,
      port: url.port || 5432,
      database: url.pathname.slice(1), // Remover el '/' inicial
      username: url.username,
      password: url.password,
      ssl: url.searchParams.get('sslmode') === 'require'
    };
  }

  /**
   * Verifica si pg_dump está disponible en el sistema
   */
  async checkPgDumpAvailable() {
    return new Promise((resolve) => {
      const pgDump = spawn('pg_dump', ['--version'], { stdio: 'pipe' });
      
      pgDump.on('close', (code) => {
        resolve(code === 0);
      });
      
      pgDump.on('error', () => {
        resolve(false);
      });
    });
  }

  /**
   * Instala PostgreSQL client tools en Windows
   */
  async installPostgreSQLTools() {
    console.log('🔧 PostgreSQL tools no encontradas. Instalando...');
    console.log('\n📋 INSTRUCCIONES DE INSTALACIÓN:');
    console.log('═══════════════════════════════════════════════');
    console.log('1. Visita: https://www.postgresql.org/download/windows/');
    console.log('2. Descarga "Command Line Tools" o PostgreSQL completo');
    console.log('3. Durante instalación, asegúrate de incluir "Command Line Tools"');
    console.log('4. Agrega PostgreSQL bin folder al PATH del sistema');
    console.log('   Ejemplo: C:\\Program Files\\PostgreSQL\\15\\bin');
    console.log('═══════════════════════════════════════════════');
    console.log('\n💡 Alternativamente, usa Chocolatey:');
    console.log('   choco install postgresql --params "/Password:mypassword"');
    console.log('\n📦 O usa el backup JSON como alternativa (más lento pero funcional)');
    
    throw new Error('pg_dump no disponible. Instala PostgreSQL client tools.');
  }

  /**
   * Ejecuta pg_dump para crear backup SQL completo
   */
  async createSQLBackup() {
    const connectionParams = this.parseNeonConnectionString();
    const filename = `backup_sql_${this.timestamp}.sql`;
    const filepath = path.join(this.backupDir, filename);

    console.log('🐘 Creando backup SQL con pg_dump...');
    console.log(`   📡 Conectando a: ${connectionParams.host}:${connectionParams.port}`);
    console.log(`   🗄️  Base de datos: ${connectionParams.database}`);

    return new Promise((resolve, reject) => {
      // Configurar variables de entorno para pg_dump
      const env = {
        ...process.env,
        PGPASSWORD: connectionParams.password,
        PGSSLMODE: 'require' // Neon requiere SSL
      };

      // Parámetros para pg_dump
      const args = [
        '--host', connectionParams.host,
        '--port', connectionParams.port.toString(),
        '--username', connectionParams.username,
        '--format', 'custom', // Formato comprimido y optimizado
        '--verbose',
        '--no-owner', // No incluir comandos de ownership
        '--no-privileges', // No incluir comandos de privilegios
        '--file', filepath,
        connectionParams.database
      ];

      const pgDump = spawn('pg_dump', args, { 
        env,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      pgDump.stdout.on('data', (data) => {
        output += data.toString();
      });

      pgDump.stderr.on('data', (data) => {
        errorOutput += data.toString();
        // pg_dump envía progreso a stderr, no es necesariamente error
        if (data.toString().includes('dumping')) {
          process.stdout.write('.');
        }
      });

      pgDump.on('close', (code) => {
        if (code === 0) {
          const stats = fs.statSync(filepath);
          const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
          
          console.log('\n   ✅ Backup SQL completado!');
          console.log(`   📁 Archivo: ${filename}`);
          console.log(`   📊 Tamaño: ${fileSizeMB} MB`);
          
          resolve({
            success: true,
            filepath,
            filename,
            size: fileSizeMB,
            type: 'SQL'
          });
        } else {
          console.error('\n   ❌ Error en pg_dump:');
          console.error(errorOutput);
          reject(new Error(`pg_dump falló con código: ${code}`));
        }
      });

      pgDump.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Crea backup JSON usando Prisma (fallback)
   */
  async createJSONBackup() {
    console.log('📋 Creando backup JSON con Prisma...');
    
    // Usar el mismo código del script original pero optimizado
    const businesses = await prisma.business.findMany({
      include: {
        users: true,
        locations: true,
      }
    });

    const clientes = await prisma.cliente.findMany({
      include: {
        tarjetaLealtad: true,
      }
    });

    const reservations = await prisma.reservation.findMany({
      include: {
        qrCodes: true,
      }
    });

    const consumos = await prisma.consumo.findMany({
      take: 5000, // Aumentado de 1000
      orderBy: {
        registeredAt: 'desc'
      }
    });

    const promotores = await prisma.promotor.findMany();
    const services = await prisma.reservationService.findMany();
    
    const slots = await prisma.reservationSlot.findMany({
      take: 2000, // Aumentado de 500
      orderBy: {
        date: 'desc'
      }
    });

    const hostTrackings = await prisma.hostTracking.findMany({
      include: {
        guestConsumos: true
      }
    });

    const backup = {
      metadata: {
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        source: 'Neon PostgreSQL',
        backupType: 'JSON',
        totalRecords: {
          businesses: businesses.length,
          clientes: clientes.length,
          reservations: reservations.length,
          consumos: consumos.length,
          promotores: promotores.length,
          services: services.length,
          slots: slots.length,
          hostTrackings: hostTrackings.length
        }
      },
      data: {
        businesses,
        clientes,
        reservations,
        consumos,
        promotores,
        services,
        slots,
        hostTrackings
      }
    };

    const filename = `backup_json_${this.timestamp}.json`;
    const filepath = path.join(this.backupDir, filename);
    
    // Guardar comprimido
    const compressed = zlib.gzipSync(JSON.stringify(backup, null, 2));
    const compressedFilename = `backup_json_${this.timestamp}.json.gz`;
    const compressedFilepath = path.join(this.backupDir, compressedFilename);
    
    fs.writeFileSync(filepath, JSON.stringify(backup, null, 2));
    fs.writeFileSync(compressedFilepath, compressed);
    
    const stats = fs.statSync(filepath);
    const compressedStats = fs.statSync(compressedFilepath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    const compressedSizeMB = (compressedStats.size / (1024 * 1024)).toFixed(2);

    console.log(`   ✅ Backup JSON completado!`);
    console.log(`   📁 Archivo: ${filename} (${fileSizeMB} MB)`);
    console.log(`   🗜️  Comprimido: ${compressedFilename} (${compressedSizeMB} MB)`);
    
    return {
      success: true,
      filepath,
      filename,
      size: fileSizeMB,
      compressedSize: compressedSizeMB,
      type: 'JSON'
    };
  }

  /**
   * Función principal que ejecuta el backup
   */
  async executeBackup(forceJSON = false) {
    try {
      console.log('🚀 Iniciando backup de base de datos Neon...\n');
      
      const results = [];

      if (!forceJSON) {
        // Intentar backup SQL primero
        const pgDumpAvailable = await this.checkPgDumpAvailable();
        
        if (pgDumpAvailable) {
          try {
            const sqlResult = await this.createSQLBackup();
            results.push(sqlResult);
          } catch (error) {
            console.log(`\n⚠️  Backup SQL falló: ${error.message}`);
            console.log('📋 Continuando con backup JSON...\n');
          }
        } else {
          console.log('⚠️  pg_dump no disponible. Usando backup JSON como alternativa...\n');
          console.log('💡 Para instalar PostgreSQL tools ejecuta: .\\install-pg-simple.ps1\n');
        }
      }

      // Backup JSON (siempre como respaldo o si SQL falla)
      const jsonResult = await this.createJSONBackup();
      results.push(jsonResult);

      // Crear backup "latest" del JSON
      const latestPath = path.join(this.backupDir, 'backup_latest.json');
      fs.copyFileSync(jsonResult.filepath, latestPath);

      // Resumen final
      this.printSummary(results);
      
      return results;

    } catch (error) {
      console.error('\n❌ Error durante el backup:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }

  /**
   * Imprime resumen de backups creados
   */
  printSummary(results) {
    console.log('\n📊 RESUMEN DE BACKUPS COMPLETADOS:');
    console.log('═══════════════════════════════════════════════');
    
    results.forEach((result, index) => {
      console.log(`\n${index + 1}. Backup ${result.type}:`);
      console.log(`   📁 Archivo: ${result.filename}`);
      console.log(`   📊 Tamaño: ${result.size} MB`);
      if (result.compressedSize) {
        console.log(`   🗜️  Comprimido: ${result.compressedSize} MB`);
      }
      console.log(`   📍 Ubicación: ${result.filepath}`);
    });

    console.log('\n💡 RECOMENDACIONES:');
    console.log('═══════════════════════════════════════════════');
    console.log('• Sube los backups a cloud storage (AWS S3, Google Drive)');
    console.log('• Programa este script para ejecutarse automáticamente');
    console.log('• Prueba restauraciones regularmente');
    console.log('• Para producción, usa el backup SQL (más completo)');
  }
}

// Función para uso directo
async function createNeonBackup(forceJSON = false) {
  const backupManager = new NeonBackupManager();
  return await backupManager.executeBackup(forceJSON);
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const forceJSON = process.argv.includes('--json-only');
  createNeonBackup(forceJSON).catch(console.error);
}

module.exports = { NeonBackupManager, createNeonBackup };
