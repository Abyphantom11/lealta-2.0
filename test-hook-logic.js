// Script simple para probar la lógica del hook de manera aislada
console.log('🔍 TESTING getBannersForBusinessDay LOGIC');

// Simular los datos tal como llegan de la API
const mockApiResponse = {
  banners: [
    {
      id: "cmgpk9oes000zeyysycuxkcjp",
      titulo: "Banner Casa Sabor Demo",
      descripcion: "Promoción especial de Casa Sabor",
      imagenUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      dia: "lunes",
      activo: true,
      orden: 0
    }
  ]
};

console.log('📊 DATOS MOCK:', mockApiResponse);

// Simular el filtro del hook
const banners = mockApiResponse.banners || [];
console.log('📋 Banners raw:', banners);

const todasActivas = banners.filter((b) => {
  const activo = b.activo !== false;
  const tieneImagen = b.imagenUrl && b.imagenUrl.trim() !== '';
  
  console.log(`   - "${b.titulo}": activo=${activo}, imagen=${tieneImagen}`);
  
  return activo && tieneImagen;
});

console.log('✅ Banners activos con imagen:', todasActivas.length);

// Simular isItemVisibleInBusinessDay (simplificado)
const bannersVisibles = [];
const hoyEsLunes = true; // Simulamos que hoy es lunes

todasActivas.forEach(banner => {
  const diaCoincide = !banner.dia || banner.dia === 'lunes';
  console.log(`   - "${banner.titulo}": día="${banner.dia}", coincide=${diaCoincide}`);
  
  if (diaCoincide) {
    bannersVisibles.push(banner);
  }
});

console.log('🎯 RESULTADO FINAL:', bannersVisibles.length, 'banners visibles');

if (bannersVisibles.length > 0) {
  console.log('✅ DEBERÍA MOSTRARSE:');
  bannersVisibles.forEach((banner, idx) => {
    console.log(`   ${idx + 1}. "${banner.titulo}"`);
  });
} else {
  console.log('❌ NO DEBERÍA MOSTRARSE NADA');
}
