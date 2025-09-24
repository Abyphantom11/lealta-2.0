// Diagnóstico completo del business ID resolution
// PROBLEMA: Admin panel no guarda porque no encuentra el business correcto

const { PrismaClient } = require('@prisma/client');

async function diagnosticoBusinessResolution() {
    const prisma = new PrismaClient();
    
    console.log('🔍 DIAGNÓSTICO BUSINESS ID RESOLUTION');
    console.log('=====================================');
    
    try {
        // 1. Verificar todos los businesses en la base de datos
        console.log('\n1️⃣ Businesses en la base de datos:');
        const businesses = await prisma.business.findMany({
            select: {
                id: true,
                name: true,
                subdomain: true,
                slug: true,
                isActive: true
            }
        });
        
        businesses.forEach((business, index) => {
            console.log(`   ${index + 1}. ID: ${business.id}`);
            console.log(`      Nombre: ${business.name}`);
            console.log(`      Subdomain: ${business.subdomain}`);
            console.log(`      Slug: ${business.slug}`);
            console.log(`      Activo: ${business.isActive}`);
            console.log('');
        });
        
        // 2. Buscar específicamente "arepa"
        console.log('2️⃣ Buscando business "arepa":');
        const arepaBusiness = await prisma.business.findFirst({
            where: {
                OR: [
                    { id: 'arepa' },
                    { subdomain: 'arepa' },
                    { slug: 'arepa' }
                ]
            }
        });
        
        if (arepaBusiness) {
            console.log(`✅ Found business "arepa": ${arepaBusiness.id}`);
        } else {
            console.log('❌ Business "arepa" NO encontrado');
        }
        
        // 3. Buscar el business con ID cmfw0fujf0000eyv8eyhgfzja
        console.log('\n3️⃣ Buscando business cmfw0fujf0000eyv8eyhgfzja:');
        const targetBusiness = await prisma.business.findFirst({
            where: {
                id: 'cmfw0fujf0000eyv8eyhgfzja'
            }
        });
        
        if (targetBusiness) {
            console.log(`✅ Found target business:`);
            console.log(`   ID: ${targetBusiness.id}`);
            console.log(`   Nombre: ${targetBusiness.name}`);
            console.log(`   Subdomain: ${targetBusiness.subdomain}`);
            console.log(`   Slug: ${targetBusiness.slug}`);
        } else {
            console.log('❌ Target business cmfw0fujf0000eyv8eyhgfzja NO encontrado');
        }
        
        // 4. Verificar archivos de configuración
        console.log('\n4️⃣ Archivos de configuración disponibles:');
        const fs = require('fs');
        const path = require('path');
        const configDir = path.join(process.cwd(), 'config', 'portal');
        
        if (fs.existsSync(configDir)) {
            const files = fs.readdirSync(configDir);
            files.forEach(file => {
                if (file.endsWith('.json')) {
                    const businessId = file.replace('portal-config-', '').replace('.json', '');
                    console.log(`   📄 ${file} -> BusinessId: ${businessId}`);
                }
            });
        }
        
        // 5. RECOMENDACIONES
        console.log('\n5️⃣ RECOMENDACIONES:');
        if (!arepaBusiness && targetBusiness) {
            console.log('🔧 SOLUCIÓN RECOMENDADA:');
            console.log('   - El business "arepa" no existe en la BD');
            console.log(`   - Pero existe ${targetBusiness.id} con nombre "${targetBusiness.name}"`);
            console.log('   - Opciones:');
            console.log('     A) Crear business "arepa" que apunte al mismo ID');
            console.log('     B) Actualizar la URL del admin para usar el slug correcto');
            console.log(`     C) Crear alias "arepa" para el business ${targetBusiness.id}`);
        }
        
    } catch (error) {
        console.error('❌ Error en diagnóstico:', error);
    } finally {
        await prisma.$disconnect();
    }
}

diagnosticoBusinessResolution();
