// Script para debuggear la sesión del admin y el businessId
console.log(`
🔍 DEBUG ADMIN SESSION
======================

Para debuggear el problema, abre las herramientas de desarrollador (F12) y ejecuta estos comandos en la consola:

1. Verificar la sesión actual:
   fetch('/api/auth/me').then(r => r.json()).then(console.log)

2. Verificar la petición de clientes (con logs):
   fetch('/api/cliente/lista?businessId=yoyo', {
     headers: { 'x-business-id': 'yoyo' }
   }).then(r => r.json()).then(console.log)

3. Verificar qué businessId se está extrayendo de la URL:
   console.log('URL segments:', window.location.pathname.split('/'))

4. Verificar si hay errores en la consola del navegador

PASOS A SEGUIR:
==============

1. Ve a /yoyo/admin/ 
2. Abre F12 > Console
3. Ejecuta los comandos de arriba
4. Copia y pega los resultados

POSIBLES PROBLEMAS:
==================

A) El usuario admin no tiene businessId correcto en su sesión
B) El businessId "yoyo" no existe en la base de datos  
C) El usuario admin no tiene permisos para ver ese business
D) Hay un error en la extracción del businessId de la URL

`);

// También podemos verificar directamente en la base de datos
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugAdminSession() {
  try {
    console.log('🔍 Verificando en base de datos...\n');

    // 1. Verificar business "yoyo"
    const business = await prisma.business.findFirst({
      where: {
        OR: [
          { slug: 'yoyo' },
          { subdomain: 'yoyo' },
          { name: 'yoyo' }
        ]
      }
    });

    if (!business) {
      console.log('❌ Business "yoyo" no encontrado en BD');
      return;
    }

    console.log('✅ Business "yoyo" encontrado:');
    console.log(`   ID: ${business.id}`);
    console.log(`   Slug: ${business.slug}`);
    console.log(`   Activo: ${business.isActive}`);

    // 2. Verificar usuarios del business
    const users = await prisma.user.findMany({
      where: {
        businessId: business.id
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        businessId: true
      }
    });

    console.log(`\n👥 Usuarios del business "yoyo": ${users.length}`);
    users.forEach(user => {
      console.log(`   - ${user.email} (${user.role}) - BusinessId: ${user.businessId}`);
    });

    // 3. Verificar clientes del business
    const clientes = await prisma.cliente.findMany({
      where: {
        businessId: business.id
      },
      select: {
        id: true,
        cedula: true,
        nombre: true,
        businessId: true,
        registeredAt: true
      }
    });

    console.log(`\n📊 Clientes del business "yoyo": ${clientes.length}`);
    clientes.forEach(cliente => {
      console.log(`   - ${cliente.nombre} (${cliente.cedula}) - BusinessId: ${cliente.businessId}`);
    });

    // 4. Verificar si hay usuarios admin con businessId diferente
    const otherAdmins = await prisma.user.findMany({
      where: {
        role: 'ADMIN',
        businessId: {
          not: business.id
        }
      },
      select: {
        email: true,
        businessId: true,
        business: {
          select: {
            name: true,
            slug: true
          }
        }
      }
    });

    if (otherAdmins.length > 0) {
      console.log(`\n⚠️  Otros admins con businessId diferente: ${otherAdmins.length}`);
      otherAdmins.forEach(admin => {
        console.log(`   - ${admin.email} -> Business: ${admin.business?.name} (${admin.business?.slug})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  debugAdminSession();
}