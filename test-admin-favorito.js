// Test simulando el request del admin con la data correcta
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testAdminFavoritoUpdate() {
  console.log('🧪 TESTING ADMIN FAVORITO UPDATE');
  console.log('=====================================');
  
  const businessId = 'cmgf5px5f0000eyy0elci9yds';
  
  // Simular exactamente lo que envía el admin con los campos correctos
  const adminPayload = {
    businessId: businessId,
    favoritoDelDia: [
      {
        id: 'fav-domingo-test',
        nombre: 'asdad', // Este es el campo que usa el admin
        descripcion: 'El favorito del domingo actualizado',
        dia: 'domingo',
        imagenUrl: '',
        activo: true,
        horaPublicacion: '09:00'
      }
    ]
  };
  
  console.log('📤 Payload del admin:', JSON.stringify(adminPayload, null, 2));
  
  try {
    // 1. Limpiar favoritos existentes
    await prisma.portalFavoritoDelDia.deleteMany({
      where: { businessId }
    });
    
    // 2. Aplicar la lógica del route.ts corregida
    for (let i = 0; i < adminPayload.favoritoDelDia.length; i++) {
      const fav = adminPayload.favoritoDelDia[i];
      await prisma.portalFavoritoDelDia.create({
        data: {
          businessId: businessId,
          productName: fav.nombre || fav.titulo || fav.productName || `Favorito ${i + 1}`,
          description: fav.descripcion || fav.description || '',
          imageUrl: fav.imagenUrl || fav.imageUrl || null,
          dia: fav.dia || null,
          active: fav.activo !== undefined ? fav.activo : true
        }
      });
    }
    
    console.log('✅ PostgreSQL actualizado');
    
    // 3. Verificar PostgreSQL
    const favoritosPG = await prisma.portalFavoritoDelDia.findMany({
      where: { businessId }
    });
    
    console.log('📊 Favoritos en PostgreSQL:', favoritosPG);
    
    // 4. Actualizar JSON
    const fs = await import('fs');
    const path = await import('path');
    
    const configPath = path.join(process.cwd(), 'config', 'portal', `portal-config-${businessId}.json`);
    
    if (fs.existsSync(configPath)) {
      const existingConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const favoritosActualizados = {};
      
      adminPayload.favoritoDelDia.forEach(fav => {
        const dia = fav.dia || 'domingo';
        favoritosActualizados[dia] = {
          id: fav.id || `fav-${dia}`,
          titulo: fav.nombre || fav.titulo || '',
          descripcion: fav.descripcion || fav.description || '',
          imageUrl: fav.imagenUrl || fav.imageUrl || '',
          activo: fav.activo !== undefined ? fav.activo : true,
          dayOfWeek: dia,
          createdAt: fav.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      });
      
      existingConfig.favoritoDelDia = favoritosActualizados;
      
      fs.writeFileSync(configPath, JSON.stringify(existingConfig, null, 2));
      console.log('✅ JSON actualizado');
      console.log('📄 Favoritos en JSON:', existingConfig.favoritoDelDia);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testAdminFavoritoUpdate()
  .then(() => {
    console.log('\n🎉 Test completado');
    process.exit(0);
  })
  .catch(console.error);
