// Script para crear el business "arepa" en la base de datos
// SOLUCIÓN: Crear el business con slug "arepa" y el ID correcto

const { PrismaClient } = require('@prisma/client');

async function crearBusinessArepa() {
    const prisma = new PrismaClient();
    
    console.log('🔧 CREANDO BUSINESS "AREPA"');
    console.log('============================');
    
    try {
        // Crear el business "arepa" con el ID correcto
        const business = await prisma.business.create({
            data: {
                id: 'cmfw0fujf0000eyv8eyhgfzja', // El ID que ya tiene el archivo de config
                name: 'TEST SAVE VERIFICATION', // El nombre actual del config
                subdomain: 'arepa',
                slug: 'arepa',
                isActive: true,
                email: 'arepa@gmail.com',
                phone: '+1234567890',
                address: 'Dirección de prueba',
                // Campos obligatorios con valores por defecto
                createdAt: new Date(),
                updatedAt: new Date()
            }
        });
        
        console.log('✅ Business creado exitosamente:');
        console.log(`   ID: ${business.id}`);
        console.log(`   Nombre: ${business.name}`);
        console.log(`   Subdomain: ${business.subdomain}`);
        console.log(`   Slug: ${business.slug}`);
        
        // Verificar que se puede resolver correctamente
        console.log('\n🧪 Verificando resolución:');
        const resolved = await prisma.business.findFirst({
            where: {
                OR: [
                    { id: 'arepa' },
                    { subdomain: 'arepa' },
                    { slug: 'arepa' }
                ]
            }
        });
        
        if (resolved) {
            console.log(`✅ Resolución exitosa: arepa -> ${resolved.id}`);
            console.log('\n🎯 RESULTADO:');
            console.log('   - URL admin: /arepa/admin/');
            console.log(`   - Business ID: ${resolved.id}`);
            console.log(`   - Archivo config: portal-config-${resolved.id}.json`);
            console.log('   - ✅ Los cambios del admin ahora se guardarán correctamente');
        }
        
    } catch (error) {
        if (error.code === 'P2002') {
            console.log('⚠️  Business ya existe, verificando...');
            const existing = await prisma.business.findUnique({
                where: { id: 'cmfw0fujf0000eyv8eyhgfzja' }
            });
            if (existing) {
                console.log(`✅ Business existente encontrado: ${existing.name}`);
                console.log(`   Slug: ${existing.slug}`);
                console.log(`   Subdomain: ${existing.subdomain}`);
            }
        } else {
            console.error('❌ Error creando business:', error);
        }
    } finally {
        await prisma.$disconnect();
    }
}

crearBusinessArepa();
