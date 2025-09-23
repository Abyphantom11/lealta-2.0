/**
 * Debug específico para el business "arepa@gmail.com"
 * Verificar por qué no se muestran los clientes en la interfaz
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugArepaBusiness() {
    try {
        console.log('🔍 DEBUG: Business "arepa@gmail.com"\n');
        
        // 1. Buscar el business arepa
        const arepaBusiness = await prisma.business.findFirst({
            where: {
                OR: [
                    { name: { contains: 'arepa' } },
                    { slug: { contains: 'arepa' } }
                ]
            }
        });
        
        if (!arepaBusiness) {
            console.log('❌ No se encontró business con "arepa"');
            return;
        }
        
        console.log('📋 BUSINESS ENCONTRADO:');
        console.log(`  ID: ${arepaBusiness.id}`);
        console.log(`  Nombre: ${arepaBusiness.name}`);
        console.log(`  Email: ${arepaBusiness.email || 'N/A'}`);
        console.log(`  Slug: ${arepaBusiness.slug || 'N/A'}`);
        console.log(`  Activo: ${arepaBusiness.isActive}`);
        console.log('');
        
        // 2. Buscar clientes de este business
        const clientes = await prisma.cliente.findMany({
            where: {
                businessId: arepaBusiness.id
            }
        });
        
        console.log(`👥 CLIENTES ENCONTRADOS: ${clientes.length}`);
        
        if (clientes.length > 0) {
            clientes.forEach((cliente, index) => {
                console.log(`\n  Cliente #${index + 1}:`);
                console.log(`    ID: ${cliente.id}`);
                console.log(`    Nombre: ${cliente.nombre}`);
                console.log(`    Cédula: ${cliente.cedula}`);
                console.log(`    Email: ${cliente.correo}`);
                console.log(`    Teléfono: ${cliente.telefono}`);
                console.log(`    Puntos: ${cliente.puntos}`);
                console.log(`    Visitas: ${cliente.totalVisitas}`);
                console.log(`    Total gastado: $${cliente.totalGastado}`);
                console.log(`    Business ID: ${cliente.businessId}`);
                
                // Verificar si el businessId coincide
                if (cliente.businessId !== arepaBusiness.id) {
                    console.log(`    ⚠️ PROBLEMA: Business ID no coincide!`);
                } else {
                    console.log(`    ✅ Business ID correcto`);
                }
            });
        } else {
            console.log('  📭 No hay clientes registrados en este business');
        }
        
        // 3. Verificar usuarios del business
        const usuarios = await prisma.user.findMany({
            where: {
                businessId: arepaBusiness.id
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true
            }
        });
        
        console.log(`\n👤 USUARIOS DEL BUSINESS: ${usuarios.length}`);
        usuarios.forEach(u => {
            console.log(`  - ${u.name} (${u.email}) - ${u.role}`);
        });
        
        // 4. Simular búsqueda API
        console.log('\n🔍 SIMULANDO BÚSQUEDA API...');
        
        // Buscar con término vacío (debería devolver todos)
        const todosClientes = await prisma.cliente.findMany({
            where: {
                businessId: arepaBusiness.id
            },
            orderBy: [
                { nombre: 'asc' }
            ],
            take: 20,
            select: {
                id: true,
                nombre: true,
                correo: true,
                cedula: true,
                telefono: true,
                puntos: true,
                totalGastado: true,
                totalVisitas: true,
            }
        });
        
        console.log(`API Search Result: ${todosClientes.length} clientes`);
        
        if (todosClientes.length > 0) {
            console.log('✅ La API debería devolver estos clientes:');
            todosClientes.forEach(c => {
                console.log(`  - ${c.nombre} (${c.cedula}) - ${c.correo}`);
            });
        } else {
            console.log('❌ La API no devolvería ningún cliente');
        }
        
        // 5. Verificar tarjetas de lealtad
        const tarjetas = await prisma.tarjetaLealtad.findMany({
            where: {
                businessId: arepaBusiness.id
            },
            include: {
                cliente: {
                    select: { nombre: true, cedula: true }
                }
            }
        });
        
        console.log(`\n🏆 TARJETAS DE LEALTAD: ${tarjetas.length}`);
        tarjetas.forEach(t => {
            console.log(`  - ${t.cliente.nombre} (${t.cliente.cedula}) - Nivel: ${t.nivel}`);
        });
        
        console.log('\n📊 DIAGNÓSTICO COMPLETO FINALIZADO');
        
    } catch (error) {
        console.error('❌ Error en debug:', error);
    } finally {
        await prisma.$disconnect();
    }
}

debugArepaBusiness();
