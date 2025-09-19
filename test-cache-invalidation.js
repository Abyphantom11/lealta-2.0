// Script de prueba para verificar cache invalidation
const timestamp = Date.now();
console.log('🕐 Probando API a las:', new Date().toLocaleTimeString());

fetch(`http://localhost:3001/api/portal/config?businessId=arepa&t=${timestamp}`, {
  cache: 'no-store',
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
  }
})
.then(response => response.json())
.then(data => {
  console.log('📋 Promociones actuales:', data.promociones);
  if (data.promociones && data.promociones.length > 0) {
    console.log('🎉 Primera promoción:', data.promociones[0].titulo);
    console.log('💰 Descuento:', data.promociones[0].descuento + '%');
    console.log('📝 Descripción:', data.promociones[0].descripcion);
    
    if (data.promociones[0].titulo.includes('TIEMPO REAL')) {
      console.log('✅ ¡CACHE INVALIDATION FUNCIONA! - Los cambios se reflejan');
    } else {
      console.log('❌ Cache invalidation NO funciona - Datos antiguos');
    }
  }
})
.catch(error => {
  console.error('❌ Error:', error);
});
