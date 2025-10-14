// Test del nuevo endpoint público de productos
const businessId = 'cmgf5px5f0000eyy0elci9yds';

async function testEndpointPublicoProductos() {
  console.log('🧪 TESTING ENDPOINT PÚBLICO DE PRODUCTOS');
  console.log('=======================================');
  
  try {
    // 1. Obtener categorías
    console.log('📂 Obteniendo categorías...');
    const categoriasResponse = await fetch(`http://localhost:3001/api/menu/categorias`, {
      headers: { 'x-business-id': businessId }
    });
    
    if (!categoriasResponse.ok) {
      console.error('❌ Error obteniendo categorías:', categoriasResponse.status);
      return;
    }
    
    const categorias = await categoriasResponse.json();
    const categoriasPrincipales = categorias.filter(cat => !cat.parentId);
    
    console.log(`✅ Encontradas ${categoriasPrincipales.length} categorías principales`);
    categoriasPrincipales.forEach((cat, i) => {
      console.log(`  ${i + 1}. ${cat.nombre} (ID: ${cat.id})`);
    });
    
    // 2. Probar endpoint público - TODOS los productos
    console.log('\n🔍 PROBANDO ENDPOINT PÚBLICO - TODOS LOS PRODUCTOS:');
    const todosProductosResponse = await fetch(`http://localhost:3001/api/menu/productos`, {
      headers: { 'x-business-id': businessId }
    });
    
    if (todosProductosResponse.ok) {
      const todosProductos = await todosProductosResponse.json();
      console.log(`✅ Total productos: ${todosProductos.productos?.length || 0}`);
      
      // Agrupar por categoría
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
        console.log(`  📂 ${catName}: ${productosPorCategoria[catName].length} productos`);
      });
    } else {
      console.error('❌ Error obteniendo todos los productos:', todosProductosResponse.status);
      const errorText = await todosProductosResponse.text();
      console.error('Error details:', errorText);
    }
    
    // 3. Probar filtro por categoría específica
    if (categoriasPrincipales.length > 0) {
      const primeraCategoria = categoriasPrincipales[0];
      console.log(`\n🎯 PROBANDO FILTRO POR CATEGORÍA: "${primeraCategoria.nombre}"`);
      
      const productosCategoria = await fetch(
        `http://localhost:3001/api/menu/productos?categoriaId=${primeraCategoria.id}`, 
        {
          headers: { 'x-business-id': businessId }
        }
      );
      
      if (productosCategoria.ok) {
        const resultado = await productosCategoria.json();
        console.log(`✅ Productos en "${primeraCategoria.nombre}": ${resultado.productos?.length || 0}`);
        
        resultado.productos?.forEach((producto, i) => {
          console.log(`  ${i + 1}. ${producto.nombre}`);
        });
        
        // Verificar filtrado correcto
        const todosSonDeLaCategoria = resultado.productos?.every(p => p.categoryId === primeraCategoria.id);
        console.log(`🔍 ¿Filtrado correcto? ${todosSonDeLaCategoria ? '✅ SÍ' : '❌ NO'}`);
        
      } else {
        console.error('❌ Error con filtro por categoría:', productosCategoria.status);
        const errorText = await productosCategoria.text();
        console.error('Error details:', errorText);
      }
      
      // 4. Probar otra categoría
      if (categoriasPrincipales.length > 1) {
        const segundaCategoria = categoriasPrincipales[1];
        console.log(`\n🎯 PROBANDO SEGUNDA CATEGORÍA: "${segundaCategoria.nombre}"`);
        
        const productosSegunda = await fetch(
          `http://localhost:3001/api/menu/productos?categoriaId=${segundaCategoria.id}`, 
          {
            headers: { 'x-business-id': businessId }
          }
        );
        
        if (productosSegunda.ok) {
          const resultado2 = await productosSegunda.json();
          console.log(`✅ Productos en "${segundaCategoria.nombre}": ${resultado2.productos?.length || 0}`);
          
          resultado2.productos?.forEach((producto, i) => {
            console.log(`  ${i + 1}. ${producto.nombre}`);
          });
        }
      }
    }
    
    console.log('\n🎉 TEST COMPLETADO');
    
  } catch (error) {
    console.error('❌ Error en test:', error);
  }
}

testEndpointPublicoProductos();
