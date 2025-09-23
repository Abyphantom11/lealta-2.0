#!/usr/bin/env node

/**
 * 🔧 SCRIPT DE VERIFICACIÓN: Estado de archivos de configuración en producción
 * Ejecuta este script en el servidor de producción para verificar los archivos
 */

const fs = require('fs');
const path = require('path');

function checkProductionFiles() {
  console.log('🔍 Checking production configuration files...\n');
  
  const configDir = path.join(process.cwd(), 'config', 'portal');
  const businessId = 'cmfw0fujf0000eyv8eyhgfzja'; // Tu business ID
  const configFile = path.join(configDir, `portal-config-${businessId}.json`);
  
  console.log('📁 Configuration directory:', configDir);
  console.log('📄 Target config file:', configFile);
  
  // Check if directory exists
  if (fs.existsSync(configDir)) {
    console.log('✅ Config directory exists');
    
    // List all files in config directory
    try {
      const files = fs.readdirSync(configDir);
      console.log('📋 Files in config directory:', files.length);
      files.forEach(file => {
        const filePath = path.join(configDir, file);
        const stats = fs.statSync(filePath);
        console.log(`  - ${file} (${stats.size} bytes, modified: ${stats.mtime.toISOString()})`);
      });
    } catch (error) {
      console.log('❌ Error reading config directory:', error.message);
    }
    
  } else {
    console.log('❌ Config directory does not exist');
    console.log('🔧 Creating directory...');
    
    try {
      fs.mkdirSync(configDir, { recursive: true });
      console.log('✅ Directory created');
    } catch (error) {
      console.log('❌ Failed to create directory:', error.message);
    }
  }
  
  // Check specific business config file
  if (fs.existsSync(configFile)) {
    console.log('\n✅ Business config file exists');
    
    try {
      const stats = fs.statSync(configFile);
      console.log('📊 File stats:', {
        size: stats.size,
        lastModified: stats.mtime.toISOString(),
        readable: fs.constants.R_OK & fs.accessSync(configFile, fs.constants.R_OK) || true
      });
      
      // Read and parse the file
      const content = fs.readFileSync(configFile, 'utf8');
      const config = JSON.parse(content);
      
      console.log('📝 Config content summary:', {
        hasTarjetas: !!config.tarjetas,
        tarjetasCount: config.tarjetas?.length || 0,
        nombreEmpresa: config.nombreEmpresa,
        lastUpdated: config.settings?.lastUpdated
      });
      
      // Check specific Plata card
      if (config.tarjetas?.length > 0) {
        const plataTarjeta = config.tarjetas.find(t => t.nivel === 'Plata');
        if (plataTarjeta) {
          console.log('🎯 Plata card in config file:', {
            beneficio: plataTarjeta.beneficio,
            nombrePersonalizado: plataTarjeta.nombrePersonalizado,
            textoCalidad: plataTarjeta.textoCalidad
          });
        } else {
          console.log('⚠️ Plata card not found in config');
        }
      }
      
    } catch (error) {
      console.log('❌ Error reading config file:', error.message);
    }
    
  } else {
    console.log('\n❌ Business config file does not exist');
    console.log('🔧 This could be the main issue!');
    console.log('📝 The admin changes are saved to JSON files, but they might not be deployed to production');
  }
  
  // Check process.cwd() and environment
  console.log('\n🌍 Environment info:');
  console.log('  Current working directory:', process.cwd());
  console.log('  Node.js version:', process.version);
  console.log('  NODE_ENV:', process.env.NODE_ENV || 'undefined');
  console.log('  Platform:', process.platform);
}

checkProductionFiles();
