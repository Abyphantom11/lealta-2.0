// Script para migrar promociones de JSON a PostgreSQL
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const businessId = 'cmgf5px5f0000eyy0elci9yds'; // La Casa del Sabor - Demo

async function migrateFromJsonToPostgreSQL() {
  try {
    console.log('🔄 Migrando promociones de JSON a PostgreSQL...\n');
    
    // Leer archivo JSON
    const configPath = path.join(process.cwd(), 'config', 'portal', `portal-config-${businessId}.json`);
    
    if (!fs.existsSync(configPath)) {
      console.log('❌ Archivo JSON no encontrado:', configPath);
      return;
    }
    
    const fileContent = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(fileContent);
    
    console.log('📄 Datos encontrados en JSON:');
    console.log(`   - Banners: ${config.banners?.length || 0}`);
    console.log(`   - Promociones: ${config.promociones?.length || 0}`);
    console.log(`   - Recompensas: ${config.recompensas?.length || 0}\n`);
    
    // Migrar banners
    if (config.banners && config.banners.length > 0) {
      console.log('🎨 Migrando banners...');
      
      // Limpiar banners existentes
      await prisma.portalBanner.deleteMany({
        where: { businessId }
      });
      
      for (let i = 0; i < config.banners.length; i++) {
        const banner = config.banners[i];
        await prisma.portalBanner.create({
          data: {
            businessId,
            title: banner.title || `Banner ${i + 1}`,
            description: banner.description || '',
            imageUrl: banner.imageUrl || '',
            active: banner.isActive !== false,
            orden: i
          }
        });
      }
      console.log(`✅ ${config.banners.length} banners migrados`);
    }
    
    // Migrar promociones
    if (config.promociones && config.promociones.length > 0) {
      console.log('🔥 Migrando promociones...');
      
      // Limpiar promociones existentes
      await prisma.portalPromocion.deleteMany({
        where: { businessId }
      });
      
      for (let i = 0; i < config.promociones.length; i++) {
        const promo = config.promociones[i];
        await prisma.portalPromocion.create({
          data: {
            businessId,
            title: promo.title || `Promoción ${i + 1}`,
            description: promo.description || '',
            imageUrl: promo.imageUrl || '',
            discount: promo.discount ? `${promo.discount}%` : null,
            validUntil: promo.validTo ? new Date(promo.validTo) : null,
            active: promo.isActive !== false,
            orden: i
          }
        });
      }
      console.log(`✅ ${config.promociones.length} promociones migradas`);
    }
    
    // Migrar recompensas
    if (config.recompensas && config.recompensas.length > 0) {
      console.log('🎁 Migrando recompensas...');
      
      // Limpiar recompensas existentes
      await prisma.portalRecompensa.deleteMany({
        where: { businessId }
      });
      
      for (let i = 0; i < config.recompensas.length; i++) {
        const recompensa = config.recompensas[i];
        await prisma.portalRecompensa.create({
          data: {
            businessId,
            title: recompensa.title || recompensa.nombre || `Recompensa ${i + 1}`,
            description: recompensa.description || recompensa.descripcion || '',
            imageUrl: recompensa.imageUrl || '',
            pointsCost: recompensa.puntosNecesarios || recompensa.pointsCost || 100,
            stock: recompensa.stock || 10,
            active: recompensa.isActive !== false && recompensa.activo !== false,
            orden: i
          }
        });
      }
      console.log(`✅ ${config.recompensas.length} recompensas migradas`);
    }
    
    // Crear configuración básica del portal si no existe
    const existingConfig = await prisma.portalConfig.findUnique({
      where: { businessId }
    });
    
    if (!existingConfig) {
      console.log('⚙️ Creando configuración del portal...');
      await prisma.portalConfig.create({
        data: {
          businessId,
          promocionesTitle: 'Promociones Especiales',
          recompensasTitle: 'Recompensas',
          banners: {},
          promociones: {},
          eventos: {},
          recompensas: {},
          favoritoDelDia: {},
          updatedBy: 'migration-script'
        }
      });
      console.log('✅ Configuración del portal creada');
    }
    
    console.log('\n🎉 MIGRACIÓN COMPLETADA');
    console.log('✅ Los datos ahora están en PostgreSQL');
    console.log('✅ El endpoint config-v2 debería mostrar las promociones');
    console.log('✅ El cliente debería ver las ediciones del admin');
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Verificar resultados después de la migración
async function verifyMigration() {
  try {
    console.log('\n🔍 Verificando migración...');
    
    const [banners, promociones, recompensas] = await Promise.all([
      prisma.portalBanner.findMany({ where: { businessId } }),
      prisma.portalPromocion.findMany({ where: { businessId } }),
      prisma.portalRecompensa.findMany({ where: { businessId } })
    ]);
    
    console.log('📊 Datos en PostgreSQL después de la migración:');
    console.log(`   - Banners: ${banners.length}`);
    console.log(`   - Promociones: ${promociones.length}`);
    console.log(`   - Recompensas: ${recompensas.length}`);
    
    if (promociones.length > 0) {
      console.log('\n🔥 Promociones verificadas:');
      promociones.forEach((promo, i) => {
        console.log(`   ${i + 1}. ${promo.title} - ${promo.active ? 'activa' : 'inactiva'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error verificando migración:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar migración
(async () => {
  await migrateFromJsonToPostgreSQL();
  await verifyMigration();
})();
