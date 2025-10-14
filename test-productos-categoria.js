// Test del endpoint de productos con filtro por categoría
const businessId = 'cmgf5px5f0000eyy0elci9yds';

async function testProductosPorCategoria() {
  console.log('🧪 TESTING PRODUCTOS POR CATEGORÍA');
  console.log('==================================');
  
  try {
    // 1. Primero obtener las categorías disponibles
    console.log('📂 Obteniendo categorías...');
    const categoriasResponse = await fetch(`http://localhost:3001/api/menu/categorias`, {
      headers: { 'x-business-id': businessId }
    });
    
    if (!categoriasResponse.ok) {
      console.error('❌ Error obteniendo categorías:', categoriasResponse.status);
      return;
    }
    
    const categorias = await categoriasResponse.json();
    console.log(`✅ Encontradas ${categorias.length} categorías`);
    
    // Mostrar solo las categorías principales (sin parentId)
    const categoriasPrincipales = categorias.filter(cat => !cat.parentId);
    console.log('\n📋 CATEGORÍAS PRINCIPALES:');
    categoriasPrincipales.forEach((cat, i) => {
      console.log(`  ${i + 1}. ${cat.nombre} (ID: ${cat.id})`);
    });
    
    // 2. Probar obtener TODOS los productos (sin filtro)
    console.log('\n🔍 OBTENIENDO TODOS LOS PRODUCTOS:');
    const todosProductosResponse = await fetch(`http://localhost:3001/api/admin/menu/productos`, {
      headers: { 
        'x-business-id': businessId,
        'Authorization': 'Bearer test-token' // Simular auth para testing
      }
    });
    
    if (todosProductosResponse.ok) {
      const todosProductos = await todosProductosResponse.json();
      console.log(`✅ Total productos en el business: ${todosProductos.productos?.length || 0}`);
      
      // Agrupar por categoría para análisis
      const productosPorCategoria = {};
      todosProductos.productos?.forEach(producto => {
        const catName = producto.category.nombre;
        if (!productosPorCategoria[catName]) {
          productosPorCategoria[catName] = [];
        }
        productosPorCategoria[catName].push(producto.nombre);
      });
      
      console.log('\n📊 DISTRIBUCIÓN POR CATEGORÍA:');
      Object.keys(productosPorCategoria).forEach(catName => {
        console.log(`  ${catName}: ${productosPorCategoria[catName].length} productos`);
        productosPorCategoria[catName].forEach(prodName => {
          console.log(`    - ${prodName}`);
        });
      });
    } else {
      console.error('❌ Error obteniendo todos los productos:', todosProductosResponse.status);
    }
    
    // 3. Probar filtro por categoría específica
    if (categoriasPrincipales.length > 0) {
      const primeraCategoria = categoriasPrincipales[0];
      console.log(`\n🎯 PROBANDO FILTRO POR CATEGORÍA: "${primeraCategoria.nombre}"`);
      
      const productosCategoria = await fetch(
        `http://localhost:3001/api/admin/menu/productos?categoriaId=${primeraCategoria.id}`, 
        {
          headers: { 
            'x-business-id': businessId,
            'Authorization': 'Bearer test-token'
          }
        }
      );
      
      if (productosCategoria.ok) {
        const resultado = await productosCategoria.json();
        console.log(`✅ Productos en "${primeraCategoria.nombre}": ${resultado.productos?.length || 0}`);
        
        resultado.productos?.forEach((producto, i) => {
          console.log(`  ${i + 1}. ${producto.nombre} (Categoría: ${producto.category.nombre})`);
        });
        
        // Verificar que TODOS los productos pertenecen a la categoría correcta
        const todosSonDeLaCategoria = resultado.productos?.every(p => p.categoryId === primeraCategoria.id);
        console.log(`🔍 ¿Todos los productos son de la categoría correcta? ${todosSonDeLaCategoria ? '✅ SÍ' : '❌ NO'}`);
        
      } else {
        console.error('❌ Error obteniendo productos de categoría:', productosCategoria.status);
      }
    }
    
  } catch (error) {
    console.error('❌ Error en test:', error);
  }
}

testProductosPorCategoria();
