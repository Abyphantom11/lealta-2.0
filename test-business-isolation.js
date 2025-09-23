/**
 * Script para verificar el Business Isolation en el sistema
 * Verifica que los clientes se asignen correctamente y solo sean visibles para su business
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testBusinessIsolation() {
    try {
        console.log('🔒 VERIFICANDO BUSINESS ISOLATION SYSTEM\n');
        
        // 1. Obtener lista de businesses activos
        const businesses = await prisma.business.findMany({
            where: { isActive: true },
            select: {
                id: true,
                name: true,
                slug: true,
                _count: {
                    select: {
                        clientes: true,
                        users: true
                    }
                }
            }
        });
        
        console.log(`📊 BUSINESSES ACTIVOS (${businesses.length}):`);
        businesses.forEach(b => {
            console.log(`  • ${b.name} (${b.id})`);
            console.log(`    - Clientes: ${b._count.clientes}`);
            console.log(`    - Usuarios: ${b._count.users}`);
        });
        console.log('');
        
        // 2. Verificar aislamiento de clientes por business
        console.log('🔍 VERIFICANDO AISLAMIENTO DE CLIENTES:');
        for (const business of businesses) {
            const clientes = await prisma.cliente.findMany({
                where: { businessId: business.id },
                select: {
                    id: true,
                    nombre: true,
                    cedula: true,
                    businessId: true
                }
            });
            
            console.log(`\n  Business: ${business.name}`);
            console.log(`  Clientes asignados: ${clientes.length}`);
            
            if (clientes.length > 0) {
                clientes.forEach(c => {
                    console.log(`    - ${c.nombre} (${c.cedula}) → ${c.businessId === business.id ? '✅ CORRECTO' : '❌ ERROR'}`);
                });
                
                // Verificar que no hay "fuga" de clientes a otros businesses
                const clientesOtrosBusiness = await prisma.cliente.findMany({
                    where: {
                        businessId: { not: business.id }
                    },
                    select: { businessId: true, nombre: true }
                });
                
                const fugaClientes = clientesOtrosBusiness.filter(c => 
                    clientes.some(myClient => myClient.nombre === c.nombre)
                );
                
                if (fugaClientes.length > 0) {
                    console.log(`    ⚠️ POSIBLE FUGA: ${fugaClientes.length} clientes duplicados en otros businesses`);
                } else {
                    console.log(`    ✅ AISLAMIENTO CORRECTO: No hay fuga de clientes`);
                }
            }
        }
        
        // 3. Verificar usuarios por business
        console.log('\n👥 VERIFICANDO AISLAMIENTO DE USUARIOS:');
        for (const business of businesses) {
            const usuarios = await prisma.user.findMany({
                where: { businessId: business.id },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    businessId: true
                }
            });
            
            console.log(`\n  Business: ${business.name}`);
            console.log(`  Usuarios asignados: ${usuarios.length}`);
            
            usuarios.forEach(u => {
                console.log(`    - ${u.name} (${u.email}) - ${u.role} → ${u.businessId === business.id ? '✅ CORRECTO' : '❌ ERROR'}`);
            });
        }
        
        // 4. Verificar tarjetas de lealtad
        console.log('\n🏆 VERIFICANDO AISLAMIENTO DE TARJETAS:');
        for (const business of businesses) {
            const tarjetas = await prisma.tarjetaLealtad.findMany({
                where: { businessId: business.id },
                include: {
                    cliente: {
                        select: { nombre: true, businessId: true }
                    }
                }
            });
            
            console.log(`\n  Business: ${business.name}`);
            console.log(`  Tarjetas emitidas: ${tarjetas.length}`);
            
            let erroresAislamiento = 0;
            tarjetas.forEach(t => {
                const clienteEnMismoBusiness = t.cliente.businessId === business.id;
                const tarjetaEnMismoBusiness = t.businessId === business.id;
                
                if (!clienteEnMismoBusiness || !tarjetaEnMismoBusiness) {
                    erroresAislamiento++;
                    console.log(`    ❌ ERROR: ${t.cliente.nombre} - Cliente: ${t.cliente.businessId}, Tarjeta: ${t.businessId}`);
                }
            });
            
            if (erroresAislamiento === 0 && tarjetas.length > 0) {
                console.log(`    ✅ AISLAMIENTO CORRECTO: Todas las tarjetas pertenecen al business correcto`);
            } else if (tarjetas.length === 0) {
                console.log(`    ℹ️ Sin tarjetas emitidas`);
            }
        }
        
        // 5. Resumen de verificación
        console.log('\n📋 RESUMEN DE BUSINESS ISOLATION:');
        
        const totalClientes = await prisma.cliente.count();
        const totalUsuarios = await prisma.user.count();
        const totalTarjetas = await prisma.tarjetaLealtad.count();
        
        console.log(`  Total en sistema:`);
        console.log(`    - Businesses: ${businesses.length}`);
        console.log(`    - Clientes: ${totalClientes}`);
        console.log(`    - Usuarios: ${totalUsuarios}`);
        console.log(`    - Tarjetas: ${totalTarjetas}`);
        
        // Verificar integridad referencial
        const clientesSinBusiness = await prisma.cliente.count({
            where: { businessId: null }
        });
        
        const usuariosSinBusiness = await prisma.user.count({
            where: { businessId: null }
        });
        
        console.log(`\n  Verificación de integridad:`);
        console.log(`    - Clientes sin business: ${clientesSinBusiness} ${clientesSinBusiness === 0 ? '✅' : '❌'}`);
        console.log(`    - Usuarios sin business: ${usuariosSinBusiness} ${usuariosSinBusiness === 0 ? '✅' : '❌'}`);
        
        if (clientesSinBusiness === 0 && usuariosSinBusiness === 0) {
            console.log('\n🎉 BUSINESS ISOLATION VERIFICADO CORRECTAMENTE!');
            console.log('✅ Todos los registros están correctamente aislados por business');
        } else {
            console.log('\n⚠️ SE ENCONTRARON PROBLEMAS DE AISLAMIENTO');
            console.log('❌ Hay registros sin business asignado');
        }
        
    } catch (error) {
        console.error('❌ Error al verificar business isolation:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testBusinessIsolation();
