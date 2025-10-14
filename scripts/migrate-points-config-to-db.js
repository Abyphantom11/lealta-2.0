#!/usr/bin/env node

/**
 * 🔄 Script de Migración: Configuración de Puntos JSON → PostgreSQL
 * 
 * Este script migra la configuración de puntos desde archivos JSON
 * hacia la tabla PuntosConfig en PostgreSQL Database.
 * 
 * Uso: node scripts/migrate-points-config-to-db.js
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');

const prisma = new PrismaClient();

async function migratePointsConfiguration() {
  console.log('🔄 Iniciando migración de configuración de puntos...\n');

  try {
    // 1. Buscar todos los archivos de configuración JSON
    const configDir = path.join(process.cwd(), 'config', 'portal');
    
    let configFiles = [];
    try {
      const files = await fs.readdir(configDir);
      configFiles = files.filter(file => file.startsWith('portal-config-') && file.endsWith('.json'));
    } catch (error) {
      console.log('⚠️ Directorio config/portal no existe. Creando configuración por defecto...');
      configFiles = [];
    }

    console.log(`📁 Encontrados ${configFiles.length} archivos de configuración`);

    // 2. Obtener todos los businesses de la DB
    const businesses = await prisma.business.findMany({
      select: {
        id: true,
        name: true,
        puntosConfig: true
      }
    });

    console.log(`🏢 Encontrados ${businesses.length} businesses en la base de datos\n`);

    let migrados = 0;
    let creados = 0;
    let omitidos = 0;

    for (const business of businesses) {
      console.log(`🔧 Procesando business: ${business.name} (${business.id})`);

      // Si ya tiene configuración en la DB, omitir
      if (business.puntosConfig) {
        console.log(`  ✅ Ya tiene configuración en DB: ${business.puntosConfig.puntosPorDolar} puntos/dólar`);
        omitidos++;
        continue;
      }

      // Buscar archivo JSON correspondiente
      const jsonFile = configFiles.find(file => file.includes(business.id));
      let puntosPorDolar = 4; // Valor por defecto
      let bonusPorRegistro = 100; // Valor por defecto

      if (jsonFile) {
        try {
          const configPath = path.join(configDir, jsonFile);
          const configContent = await fs.readFile(configPath, 'utf-8');
          const config = JSON.parse(configContent);

          if (config.configuracionPuntos) {
            puntosPorDolar = config.configuracionPuntos.puntosPorDolar || 4;
            bonusPorRegistro = config.configuracionPuntos.bonusPorRegistro || 100;
            console.log(`  📄 Encontrada configuración en JSON: ${puntosPorDolar} puntos/dólar, ${bonusPorRegistro} bonus`);
            migrados++;
          } else {
            console.log(`  ⚠️ JSON sin configuración de puntos, usando valores por defecto`);
            creados++;
          }
        } catch (error) {
          console.log(`  ❌ Error leyendo JSON: ${error.message}`);
          creados++;
        }
      } else {
        console.log(`  📝 No hay JSON, creando configuración por defecto`);
        creados++;
      }

      // Crear configuración en la DB
      try {
        const nuevaConfig = await prisma.puntosConfig.create({
          data: {
            businessId: business.id,
            puntosPorDolar,
            bonusPorRegistro,
            maxPuntosPorDolar: 10,
            maxBonusRegistro: 1000
          }
        });

        console.log(`  ✅ Configuración creada en DB: ${nuevaConfig.puntosPorDolar} puntos/dólar\n`);
      } catch (error) {
        console.log(`  ❌ Error creando configuración: ${error.message}\n`);
      }
    }

    // 3. Resumen de migración
    console.log('📊 RESUMEN DE MIGRACIÓN:');
    console.log(`  🔄 Migrados desde JSON: ${migrados}`);
    console.log(`  📝 Creados por defecto: ${creados}`);
    console.log(`  ⏭️  Omitidos (ya existían): ${omitidos}`);
    console.log(`  🏢 Total businesses: ${businesses.length}\n`);

    // 4. Verificar resultado
    const configuraciones = await prisma.puntosConfig.findMany({
      include: {
        business: {
          select: { name: true }
        }
      }
    });

    console.log('✅ CONFIGURACIONES FINALES EN DATABASE:');
    configuraciones.forEach(config => {
      console.log(`  ${config.business.name}: ${config.puntosPorDolar} puntos/dólar, ${config.bonusPorRegistro} bonus`);
    });

    console.log(`\n🎉 Migración completada exitosamente!`);
    console.log(`📊 Total configuraciones en DB: ${configuraciones.length}`);

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar migración
if (require.main === module) {
  migratePointsConfiguration()
    .then(() => {
      console.log('\n✅ Script completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script falló:', error);
      process.exit(1);
    });
}

module.exports = { migratePointsConfiguration };
