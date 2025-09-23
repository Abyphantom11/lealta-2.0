/**
 * Test de autenticación en browser context
 * Para verificar si las cookies de NextAuth están disponibles
 */

// Este script debe ejecutarse en el browser console mientras estás logueado
console.log('🔐 TESTING AUTHENTICATION IN BROWSER...\n');

// Test 1: Verificar cookies disponibles
console.log('📋 COOKIES DISPONIBLES:');
console.log(document.cookie);

// Test 2: Hacer petición a /api/auth/me
fetch('/api/auth/me', {
    method: 'GET',
    credentials: 'include',
    headers: {
        'Content-Type': 'application/json'
    }
})
.then(response => {
    console.log('\n🔐 AUTH ME Response Status:', response.status);
    return response.json();
})
.then(data => {
    console.log('🔐 AUTH ME Data:', data);
    
    if (data.user) {
        console.log('✅ USER AUTHENTICATED:');
        console.log('  - ID:', data.user.id);
        console.log('  - Email:', data.user.email);
        console.log('  - Role:', data.user.role);
        console.log('  - BusinessId:', data.user.businessId);
        
        // Test 3: Ahora probar la API de clientes con esta autenticación
        return fetch(`/api/cliente/lista?businessId=${data.user.businessId}`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'x-business-id': data.user.businessId
            }
        });
    } else {
        console.error('❌ USER NOT AUTHENTICATED');
    }
})
.then(response => {
    if (response) {
        console.log('\n📋 CLIENTES API Response Status:', response.status);
        return response.json();
    }
})
.then(data => {
    if (data) {
        console.log('📋 CLIENTES API Data:', data);
        if (data.success && data.clientes) {
            console.log(`✅ FOUND ${data.clientes.length} CLIENTES:`, data.clientes);
        } else {
            console.error('❌ NO CLIENTES FOUND OR ERROR:', data.error);
        }
    }
})
.catch(error => {
    console.error('❌ ERROR IN AUTHENTICATION TEST:', error);
});

console.log('\n📝 Instructions:');
console.log('1. Copy this entire script');  
console.log('2. Open browser DevTools (F12)');
console.log('3. Go to Console tab');
console.log('4. Paste and press Enter');
console.log('5. Check the results');
