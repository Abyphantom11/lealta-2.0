// Debug script para capturar lo que envía el admin
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugAdminRequest() {
  console.log('🔍 DEBUGGING ADMIN REQUEST');
  console.log('=====================================');
  
  const businessId = 'cmgf5px5f0000eyy0elci9yds';
  
  // 1. Revisar estado actual de PostgreSQL
  console.log('\n1. Estado actual en PostgreSQL:');
  const favoritosPG = await prisma.portalFavoritoDelDia.findMany({
    where: { businessId },
    orderBy: { createdAt: 'asc' }
  });
  
  console.log('Favoritos en PostgreSQL:', favoritosPG);
  
  // 2. Revisar estado actual del JSON
  console.log('\n2. Estado actual del JSON:');
  const fs = await import('fs');
  const path = await import('path');
  
  const configPath = path.join(process.cwd(), 'config', 'portal', `portal-config-${businessId}.json`);
  
  if (fs.existsSync(configPath)) {
    const jsonContent = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    console.log('Favoritos en JSON:', jsonContent.favoritoDelDia);
  } else {
    console.log('❌ Archivo JSON no existe');
  }
  
  // 3. Simular request del admin con datos correctos
  console.log('\n3. Simulando request del admin:');
  
  const adminRequest = {
    businessId: businessId,
    // Simular que el admin envía estos datos
    favoritoDelDia: [
      {
        id: 'sunday-favorite',
        productName: 'asdad',
        description: 'El favorito del domingo',
        dia: 'domingo',
        active: true
      }
    ]
  };
  
  console.log('Request simulado:', JSON.stringify(adminRequest, null, 2));
  
  // 4. Probar la lógica de actualización
  console.log('\n4. Probando actualización...');
  
  try {
    // Eliminar favoritos existentes
    await prisma.portalFavoritoDelDia.deleteMany({
      where: { businessId }
    });
    
    // Crear nuevo favorito
    for (const fav of adminRequest.favoritoDelDia) {
      await prisma.portalFavoritoDelDia.create({
        data: {
          businessId,
          productName: fav.productName,
          description: fav.description,
          dia: fav.dia,
          active: fav.active
        }
      });
    }
    
    console.log('✅ PostgreSQL actualizado');
    
    // Actualizar JSON también
    if (fs.existsSync(configPath)) {
      const existingConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const favoritosActualizados = {};
      
      adminRequest.favoritoDelDia.forEach(fav => {
        if (fav.dia && fav.productName) {
          favoritosActualizados[fav.dia] = {
            titulo: fav.productName,
            descripcion: fav.description || '',
            activo: fav.active !== false
          };
        }
      });
      
      existingConfig.favoritoDelDia = favoritosActualizados;
      
      fs.writeFileSync(configPath, JSON.stringify(existingConfig, null, 2));
      console.log('✅ JSON actualizado');
      console.log('Nuevo JSON favoritos:', existingConfig.favoritoDelDia);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugAdminRequest()
  .then(() => {
    console.log('\n✅ Debug completado');
    process.exit(0);
  })
  .catch(console.error);
