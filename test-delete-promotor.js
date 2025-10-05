// Test para eliminar un promotor
const testDeletePromotor = async () => {
  try {
    console.log('🧪 Probando eliminación de promotor...\n');
    
    // Primero obtener la lista de promotores
    const listResponse = await fetch('http://localhost:3001/api/promotores?businessId=golom');
    const listData = await listResponse.json();
    
    if (listData.promotores && listData.promotores.length > 0) {
      const promotorToDelete = listData.promotores[0];
      console.log(`🎯 Eliminando promotor: ${promotorToDelete.nombre} (ID: ${promotorToDelete.id})\n`);
      
      const response = await fetch(`http://localhost:3001/api/promotores/${promotorToDelete.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      console.log('📊 Status:', response.status);
      console.log('📦 Response:', JSON.stringify(data, null, 2));
      
      if (response.ok) {
        console.log('\n✅ ¡Promotor eliminado exitosamente!');
      } else {
        console.log('\n❌ Error al eliminar promotor');
      }
    } else {
      console.log('⚠️  No hay promotores para eliminar');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

testDeletePromotor();
