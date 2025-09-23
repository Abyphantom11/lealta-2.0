/**
 * Script para verificar la conexión con la base de datos de producción
 * y confirmar que los datos están disponibles para el dashboard
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyProductionData() {
    try {
        console.log('🔍 Verificando conexión con base de datos de producción...\n');
        
        // Verificar businesses
        const businesses = await prisma.business.findMany({
            select: {
                id: true,
                name: true,
                createdAt: true
            }
        });
        console.log(`📊 Businesses encontrados: ${businesses.length}`);
        businesses.forEach(b => console.log(`  - ${b.name} (ID: ${b.id})`));
        console.log('');
        
        // Verificar usuarios
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                businessId: true
            }
        });
        console.log(`👥 Usuarios encontrados: ${users.length}`);
        users.forEach(u => console.log(`  - ${u.name} (${u.email}) - Business: ${u.businessId}`));
        console.log('');
        
        // Verificar clientes
        const clients = await prisma.client.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                businessId: true
            }
        });
        console.log(`🎯 Clientes encontrados: ${clients.length}`);
        clients.forEach(c => console.log(`  - ${c.name} (${c.email}) - Business: ${c.businessId}`));
        console.log('');
        
        // Verificar consumos
        const consumos = await prisma.consumo.findMany({
            select: {
                id: true,
                amount: true,
                businessId: true,
                clientId: true,
                createdAt: true
            }
        });
        console.log(`💰 Consumos encontrados: ${consumos.length}`);
        consumos.forEach(c => console.log(`  - $${c.amount} - Client: ${c.clientId} - Business: ${c.businessId}`));
        console.log('');
        
        // Estadísticas por business
        console.log('📈 Estadísticas por Business:');
        for (const business of businesses) {
            const businessClients = clients.filter(c => c.businessId === business.id);
            const businessConsumos = consumos.filter(c => c.businessId === business.id);
            const totalRevenue = businessConsumos.reduce((sum, c) => sum + c.amount, 0);
            
            console.log(`  ${business.name}:`);
            console.log(`    - Clientes: ${businessClients.length}`);
            console.log(`    - Consumos: ${businessConsumos.length}`);
            console.log(`    - Ingresos totales: $${totalRevenue}`);
        }
        
        console.log('\n✅ Base de datos de producción conectada correctamente!');
        console.log('🎉 El dashboard ahora debería mostrar datos reales.');
        
    } catch (error) {
        console.error('❌ Error al verificar base de datos de producción:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyProductionData();
