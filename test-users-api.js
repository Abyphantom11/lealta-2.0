/**
 * Script de prueba para verificar la API de usuarios
 * Ejecuta: node test-users-api.js
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

// Usuario de prueba (SUPERADMIN)
const TEST_USER_EMAIL = 'christian.valdivieso@gmail.com';
const TEST_USER_PASSWORD = 'changeme123'; // Tendrás que cambiar esto

async function testUsersAPI() {
  console.log('🧪 Probando API de usuarios...\n');

  try {
    // 1. Login
    console.log('1️⃣ Intentando login...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
      }),
    });

    if (!loginResponse.ok) {
      console.log('❌ Login falló:', loginResponse.status);
      const error = await loginResponse.text();
      console.log('Error:', error);
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login exitoso:', loginData);

    // Obtener cookies de sesión
    const cookies = loginResponse.headers.raw()['set-cookie'];
    const cookieHeader = cookies?.join('; ') || '';
    console.log('🍪 Cookies:', cookieHeader.substring(0, 100) + '...\n');

    // 2. GET /api/users
    console.log('2️⃣ Obteniendo usuarios...');
    const usersResponse = await fetch(`${BASE_URL}/api/users`, {
      headers: {
        Cookie: cookieHeader,
      },
    });

    if (!usersResponse.ok) {
      console.log('❌ GET /api/users falló:', usersResponse.status);
      const error = await usersResponse.text();
      console.log('Error:', error);
      return;
    }

    const users = await usersResponse.json();
    console.log('✅ Usuarios obtenidos:', users.length);
    console.table(users.map(u => ({
      email: u.email,
      name: u.name,
      role: u.role,
      isActive: u.isActive ? '✅' : '❌',
    })));

    // 3. POST /api/users (crear usuario de prueba)
    console.log('\n3️⃣ Creando usuario de prueba...');
    const newUserData = {
      email: `test-${Date.now()}@example.com`,
      password: 'test123456',
      name: 'Usuario de Prueba',
      role: 'STAFF',
    };

    const createResponse = await fetch(`${BASE_URL}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify(newUserData),
    });

    if (!createResponse.ok) {
      console.log('❌ POST /api/users falló:', createResponse.status);
      const error = await createResponse.text();
      console.log('Error:', error);
      return;
    }

    const newUser = await createResponse.json();
    console.log('✅ Usuario creado:', newUser);

    console.log('\n✅ Todas las pruebas pasaron exitosamente!');
  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
  }
}

testUsersAPI();
