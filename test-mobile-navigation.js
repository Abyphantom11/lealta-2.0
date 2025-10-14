/**
 * Test para verificar que la navegación móvil con gesto "regresar" funciona correctamente
 * 
 * Esta prueba simula:
 * 1. Abrir el menú
 * 2. Navegar a una categoría (productos)
 * 3. Usar el gesto "regresar" para volver a categorías
 * 4. Usar el gesto "regresar" nuevamente para cerrar el menú
 */

console.log('🧪 Test: Navegación móvil con gesto "regresar"');
console.log('======================================================');

// Simular las variables del estado del componente
let isMenuDrawerOpen = false;
let activeMenuSection = 'categories'; // 'categories' | 'products'
let selectedCategory = null;
let searchQuery = '';

// Simular productos de muestra
const menuProducts = [
  { id: 1, nombre: 'Arepa Reina Pepiada', categoria: 'Entradas' },
  { id: 2, nombre: 'Pabellón Criollo', categoria: 'Platillos Principales' },
];

// Simular categorías
const allCategories = [
  { id: 1, nombre: 'Entradas', productos: [menuProducts[0]] },
  { id: 2, nombre: 'Platillos Principales', productos: [menuProducts[1]] },
];

// Simular las funciones del componente
const setIsMenuDrawerOpen = (value) => {
  isMenuDrawerOpen = value;
  console.log(`📱 Menu drawer abierto: ${value}`);
};

const setActiveMenuSection = (value) => {
  activeMenuSection = value;
  console.log(`🔄 Sección activa: ${value}`);
};

const setSelectedCategory = (value) => {
  selectedCategory = value;
  console.log(`📂 Categoría seleccionada: ${value ? value.nombre : 'ninguna'}`);
};

const setSearchQuery = (value) => {
  searchQuery = value;
  console.log(`🔍 Búsqueda: "${value}"`);
};

const setFilteredProducts = (products) => {
  console.log(`🍽️ Productos filtrados: ${products.length} productos`);
};

const setMenuCategories = (categories) => {
  console.log(`📋 Categorías del menú: ${categories.length} categorías`);
};

// Función handleBackNavigation (copiada del componente)
const handleBackNavigation = async () => {
  console.log('\n⬅️ Ejecutando handleBackNavigation...');
  
  // Limpiar búsqueda primero si está activa
  if (searchQuery) {
    setSearchQuery('');
    setFilteredProducts(menuProducts);
    return;
  }
  
  if (activeMenuSection === 'products') {
    // Si estamos en productos, volver a categorías
    setActiveMenuSection('categories');
    setSelectedCategory(null);
    
    // Recargar categorías principales
    const mainCategories = allCategories.filter((cat) => !cat.parentId);
    setMenuCategories(mainCategories);
  } else if (selectedCategory) {
    // Si estamos en subcategorías, volver a categorías principales
    const mainCategories = allCategories.filter((cat) => !cat.parentId);
    setMenuCategories(mainCategories);
    setSelectedCategory(null);
  } else {
    // Cerrar el drawer
    setIsMenuDrawerOpen(false);
  }
};

// Función para simular navegación
const simularNavegacion = async () => {
  console.log('\n🚀 Iniciando simulación de navegación...\n');
  
  // Paso 1: Abrir menú
  console.log('1️⃣ PASO 1: Abrir menú');
  setIsMenuDrawerOpen(true);
  setActiveMenuSection('categories');
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Paso 2: Seleccionar una categoría (ir a productos)
  console.log('\n2️⃣ PASO 2: Seleccionar categoría "Entradas"');
  setSelectedCategory(allCategories[0]);
  setActiveMenuSection('products');
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Paso 3: Gesto "regresar" - debería volver a categorías
  console.log('\n3️⃣ PASO 3: Gesto "regresar" (productos → categorías)');
  await handleBackNavigation();
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Paso 4: Gesto "regresar" nuevamente - debería cerrar el menú
  console.log('\n4️⃣ PASO 4: Gesto "regresar" (categorías → cerrar menú)');
  await handleBackNavigation();
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Verificar estado final
  console.log('\n✅ VERIFICACIÓN FINAL:');
  console.log(`- Menu abierto: ${isMenuDrawerOpen} (debería ser false)`);
  console.log(`- Sección activa: ${activeMenuSection} (debería ser categories)`);
  console.log(`- Categoría seleccionada: ${selectedCategory ? selectedCategory.nombre : 'ninguna'} (debería ser ninguna)`);
  
  if (!isMenuDrawerOpen && activeMenuSection === 'categories' && !selectedCategory) {
    console.log('\n🎉 ¡PRUEBA EXITOSA! La navegación móvil funciona correctamente.');
  } else {
    console.log('\n❌ PRUEBA FALLIDA. Revisar la lógica de navegación.');
  }
};

// Ejecutar prueba
simularNavegacion().catch(console.error);
