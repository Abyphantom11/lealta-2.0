// Script para limpiar localStorage de datos de branding incorrectos
console.log('🧹 Limpiando localStorage de branding...');

// Función para validar si el dato es realmente del admin
function isRealBrandingData(data) {
  if (!data || typeof data !== 'object') return false;
  
  const businessName = data.businessName;
  if (!businessName || typeof businessName !== 'string') return false;
  
  // Filtrar valores por defecto o genéricos
  const defaultNames = ['Mi Negocio', 'Mi Empresa', 'LEALTA', 'LEALTA 2.0', 'Empresa', ''];
  return !defaultNames.includes(businessName.trim());
}

// Limpiar todas las claves de branding
const brandingKeys = [
  'portalBranding',
  'portalBranding_arepa',
  'portalBranding_cafedani',
  'portalBranding_default',
  'brandingConfig'
];

let cleanedCount = 0;

brandingKeys.forEach(key => {
  try {
    const data = localStorage.getItem(key);
    if (data) {
      const parsed = JSON.parse(data);
      
      if (!isRealBrandingData(parsed)) {
        console.log(`🗑️ Eliminando datos genéricos de ${key}:`, parsed.businessName);
        localStorage.removeItem(key);
        cleanedCount++;
      } else {
        console.log(`✅ Manteniendo datos válidos de ${key}:`, parsed.businessName);
      }
    }
  } catch (error) {
    console.log(`❌ Error procesando ${key}, eliminando:`, error.message);
    localStorage.removeItem(key);
    cleanedCount++;
  }
});

// Buscar cualquier otra clave que pueda contener branding
Object.keys(localStorage).forEach(key => {
  if (key.toLowerCase().includes('branding') && !brandingKeys.includes(key)) {
    try {
      const data = localStorage.getItem(key);
      const parsed = JSON.parse(data);
      
      if (!isRealBrandingData(parsed)) {
        console.log(`🗑️ Eliminando clave adicional ${key}`);
        localStorage.removeItem(key);
        cleanedCount++;
      }
    } catch (error) {
      console.log(`🗑️ Eliminando clave corrupta ${key}`);
      localStorage.removeItem(key);
      cleanedCount++;
    }
  }
});

console.log(`✅ Limpieza completada. ${cleanedCount} entradas eliminadas.`);

// Disparar evento para que los componentes recarguen
window.dispatchEvent(new StorageEvent('storage', {
  key: 'brandingTrigger',
  newValue: Date.now().toString()
}));

console.log('🔄 Eventos de recarga disparados.');
