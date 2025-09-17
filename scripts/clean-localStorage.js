// Script para limpiar localStorage contaminado de business anteriores
// Ejecutar este script en el navegador (DevTools > Console)

console.log('🧹 Iniciando limpieza de localStorage contaminado...');

// Función para limpiar localStorage de business específico
function cleanBusinessStorage(businessId) {
  const keysToClean = [];
  
  // Buscar todas las keys que contengan el businessId
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.includes(businessId)) {
      keysToClean.push(key);
    }
  }
  
  // Eliminar las keys encontradas
  keysToClean.forEach(key => {
    localStorage.removeItem(key);
    console.log(`🗑️ Eliminado: ${key}`);
  });
  
  return keysToClean.length;
}

// Limpiar business "arepa" (business anterior)
const cleanedArepa = cleanBusinessStorage('arepa');
console.log(`✅ Eliminadas ${cleanedArepa} entradas de business "arepa"`);

// Limpiar cualquier business ID que no sea "demo"
const cleanedOther = cleanBusinessStorage('cmflud5710000eyc8tkwqhi6n');
console.log(`✅ Eliminadas ${cleanedOther} entradas de business anterior`);

// Limpiar algunas keys generales que podrían estar contaminadas
const generalKeys = [
  'currentBusiness',
  'selectedBusiness', 
  'businessConfig',
  'portalConfig',
  'userSession',
  'authToken'
];

let generalCleaned = 0;
generalKeys.forEach(key => {
  if (localStorage.getItem(key)) {
    localStorage.removeItem(key);
    generalCleaned++;
    console.log(`🗑️ Eliminado: ${key}`);
  }
});

console.log(`✅ Eliminadas ${generalCleaned} entradas generales`);

// Mostrar resumen
console.log(`
🎯 Resumen de limpieza:
- Business "arepa": ${cleanedArepa} entradas
- Business anterior: ${cleanedOther} entradas  
- Entradas generales: ${generalCleaned} entradas
- Total limpiado: ${cleanedArepa + cleanedOther + generalCleaned} entradas

🔄 Recarga la página para aplicar los cambios
`);

// Opcional: recargar automáticamente la página
// window.location.reload();
