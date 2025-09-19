const fetch = require('node-fetch');

async function testFullPromocionesFlow() {
  try {
    const businessId = 'cmfqhepmq0000ey4slyms4knv';
    
    console.log('🧪 PRUEBA COMPLETA: Admin → Cliente Promociones');
    console.log('===============================================');
    
    // 1. Estado inicial del cliente
    console.log('\n📋 1. Estado inicial del cliente...');
    let clientResponse = await fetch(`http://localhost:3001/api/portal/config-v2?businessId=${businessId}`);
    let clientData = await clientResponse.json();
    
    console.log(`📊 Promociones iniciales: ${clientData.promotions?.length || 0}`);
    if (clientData.promotions?.length > 0) {
      clientData.promotions.forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.title} (${p.discount})`);
      });
    }
    
    // 2. Simular agregar una promoción desde el admin
    console.log('\n🔧 2. Agregando promoción desde admin...');
    
    const nuevaPromocion = {
      titulo: 'Test Promoción Nueva',
      descripcion: 'Promoción de prueba agregada desde test',
      descuento: '50',
      imagenUrl: '',
      activo: true
    };
    
    // Obtener promociones actuales del admin primero
    const adminGetResponse = await fetch(`http://localhost:3001/api/admin/portal-config`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-business-id': businessId
      }
    });
    
    const adminData = await adminGetResponse.json();
    console.log(`📊 Admin tiene ${adminData.promociones?.length || 0} promociones`);
    
    // Agregar la nueva promoción a las existentes
    const promocionesActualizadas = [
      ...(adminData.promociones || []),
      nuevaPromocion
    ];
    
    // Enviar actualización al admin
    const adminUpdateResponse = await fetch(`http://localhost:3001/api/admin/portal-config`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-business-id': businessId
      },
      body: JSON.stringify({
        promociones: promocionesActualizadas
      })
    });
    
    if (adminUpdateResponse.ok) {
      console.log('✅ Promoción agregada exitosamente en el admin');
    } else {
      const error = await adminUpdateResponse.text();
      console.error('❌ Error al agregar promoción:', error);
      return;
    }
    
    // 3. Verificar que aparezca en el cliente
    console.log('\n🔍 3. Verificando sincronización en cliente...');
    
    // Esperar un momento para la sincronización
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    clientResponse = await fetch(`http://localhost:3001/api/portal/config-v2?businessId=${businessId}`);
    clientData = await clientResponse.json();
    
    console.log(`📊 Promociones después del cambio: ${clientData.promotions?.length || 0}`);
    if (clientData.promotions?.length > 0) {
      clientData.promotions.forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.title} (${p.discount})`);
      });
      
      // Verificar si nuestra nueva promoción está ahí
      const nuevaEncontrada = clientData.promotions.find(p => p.title === nuevaPromocion.titulo);
      if (nuevaEncontrada) {
        console.log('✅ ¡Nueva promoción encontrada en el cliente!');
      } else {
        console.log('❌ Nueva promoción NO encontrada en el cliente');
      }
    }
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
  }
}

testFullPromocionesFlow();
