// Script para probar notificaciones automáticas de ascenso
// Ejecutar con: node test-automatic-notification.js

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3001';

async function testAutomaticNotification() {
  console.log('🧪 Iniciando prueba de notificaciones automáticas...');

  try {
    // 1. Buscar un cliente de prueba
    console.log('\n1️⃣ Buscando clientes existentes...');
    const searchResponse = await fetch(`${API_BASE}/api/admin/clientes/search?q=test`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    let clienteData;
    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      if (searchData.clientes && searchData.clientes.length > 0) {
        clienteData = searchData.clientes[0];
        console.log(`✅ Cliente encontrado: ${clienteData.nombre} (${clienteData.cedula})`);
        console.log(`   Puntos actuales: ${clienteData.puntos}`);
        console.log(`   Nivel actual: ${clienteData.tarjetaLealtad?.nivel || 'Sin tarjeta'}`);
      }
    }

    // 2. Si no hay cliente, buscar cualquier cliente
    if (!clienteData) {
      console.log('\n2️⃣ Buscando cualquier cliente...');
      const anyClientResponse = await fetch(`${API_BASE}/api/admin/clientes/search?q=a`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (anyClientResponse.ok) {
        const anyClientData = await anyClientResponse.json();
        if (anyClientData.clientes && anyClientData.clientes.length > 0) {
          clienteData = anyClientData.clientes[0];
          console.log(`✅ Cliente encontrado: ${clienteData.nombre} (${clienteData.cedula})`);
          console.log(`   Puntos actuales: ${clienteData.puntos}`);
          console.log(`   Nivel actual: ${clienteData.tarjetaLealtad?.nivel || 'Sin tarjeta'}`);
        }
      }
    }

    if (!clienteData) {
      console.log('❌ No se encontraron clientes para probar');
      return;
    }

    // 3. Verificar configuración de tarjetas
    console.log('\n3️⃣ Verificando configuración de tarjetas...');
    const configResponse = await fetch(`${API_BASE}/api/portal/config`);
    if (configResponse.ok) {
      const config = await configResponse.json();
      console.log(`✅ Tarjetas configuradas: ${config.tarjetas?.length || 0}`);
      if (config.tarjetas?.length > 0) {
        config.tarjetas.forEach(tarjeta => {
          console.log(`   - ${tarjeta.nivel}: ${tarjeta.condiciones.puntosMinimos} puntos mínimos`);
        });
      }
    }

    // 4. Simular un consumo para ganar puntos
    console.log('\n4️⃣ Simulando consumo para ganar puntos...');
    const consumoResponse = await fetch(`${API_BASE}/api/staff/consumo/manual`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cedula: clienteData.cedula,
        productos: [
          {
            nombre: 'Producto Test para Ascenso',
            cantidad: 1,
            precio: 50.00 // Esto debería dar muchos puntos
          }
        ],
        montoTotal: 50.00,
        empleadoNombre: 'Test Automatico'
      }),
    });

    if (consumoResponse.ok) {
      const consumoData = await consumoResponse.json();
      console.log(`✅ Consumo registrado exitosamente`);
      console.log(`   Puntos ganados: ${consumoData.data.puntosGanados}`);
      console.log(`   Puntos acumulados: ${consumoData.data.puntosAcumulados}`);
    } else {
      console.log('❌ Error registrando consumo:', await consumoResponse.text());
      return;
    }

    // 5. Esperar un momento y verificar el cliente
    console.log('\n5️⃣ Esperando 3 segundos para verificar evaluación automática...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    const verificarResponse = await fetch(`${API_BASE}/api/cliente/verificar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cedula: clienteData.cedula }),
    });

    if (verificarResponse.ok) {
      const clienteActualizado = await verificarResponse.json();
      console.log(`✅ Cliente verificado después del consumo:`);
      console.log(`   Nombre: ${clienteActualizado.cliente.nombre}`);
      console.log(`   Puntos: ${clienteActualizado.cliente.puntos}`);
      console.log(`   Nivel: ${clienteActualizado.cliente.tarjetaLealtad?.nivel || 'Sin tarjeta'}`);
      console.log(`   Asignación manual: ${clienteActualizado.cliente.tarjetaLealtad?.asignacionManual || false}`);

      // Comparar con el nivel anterior
      if (clienteActualizado.cliente.tarjetaLealtad?.nivel !== clienteData.tarjetaLealtad?.nivel) {
        console.log(`🎉 ¡ASCENSO DETECTADO! ${clienteData.tarjetaLealtad?.nivel || 'Sin tarjeta'} → ${clienteActualizado.cliente.tarjetaLealtad?.nivel}`);
      } else {
        console.log(`ℹ️ Sin cambio de nivel (mismo nivel: ${clienteActualizado.cliente.tarjetaLealtad?.nivel})`);
      }
    }

    // 6. Probar evaluación manual adicional
    console.log('\n6️⃣ Ejecutando evaluación manual adicional...');
    const evaluacionResponse = await fetch(`${API_BASE}/api/admin/evaluar-nivel-cliente`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cedula: clienteData.cedula }),
    });

    if (evaluacionResponse.ok) {
      const evaluacionData = await evaluacionResponse.json();
      console.log(`✅ Evaluación completada:`);
      console.log(`   Mensaje: ${evaluacionData.message}`);
      console.log(`   Actualizado: ${evaluacionData.actualizado}`);
      if (evaluacionData.actualizado) {
        console.log(`   Cambio: ${evaluacionData.nivelAnterior} → ${evaluacionData.nivelNuevo}`);
        console.log(`   Es ascenso: ${evaluacionData.esSubida}`);
        console.log(`   Mostrar animación: ${evaluacionData.mostrarAnimacion}`);
      }
    } else {
      console.log('❌ Error en evaluación:', await evaluacionResponse.text());
    }

    console.log('\n✅ Prueba completada. Revisa los logs arriba para ver si las notificaciones funcionan.');
    console.log('💡 Para ver la notificación en acción, abre el portal del cliente en el navegador.');

  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

// Ejecutar la prueba
testAutomaticNotification();
