/**
 * 📊 IMPORTAR DATOS DE OSADO A LOVE ME SKY - VERSIÓN FINAL
 */

const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function importarOsadoFinal() {
    console.log('🚀 IMPORTACIÓN FINAL: OSADO → LOVE ME SKY');
    console.log('========================================\n');
    
    try {
        // Leer archivo Excel
        const workbook = XLSX.readFile('BASE DATOS OSADO.xls');
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        console.log('📋 Estructura identificada:');
        console.log('- Columna 2: Cédula');
        console.log('- Columna 3: Nombre'); 
        console.log('- Columna 8: Teléfonos');
        console.log('- Columna 10: Email');
        console.log('- Datos empiezan en fila 4\n');
        
        let procesados = 0;
        let validos = 0;
        let insertados = 0;
        let duplicados = 0;
        let errores = 0;
        
        // Procesar desde fila 4 (índice 4)
        for (let i = 4; i < data.length; i++) {
            const fila = data[i];
            if (!fila || fila.length < 10) continue;
            
            procesados++;
            
            // Extraer datos
            const cedula = limpiarTexto(fila[2]);
            const nombre = limpiarTexto(fila[3] || fila[4]); // Razón Social o Nombre Comercial
            const telefono = limpiarTelefono(fila[8]);
            const email = limpiarEmail(fila[10]);
            
            // Filtrar datos válidos
            if (!nombre || nombre.length < 3) continue;
            if (!telefono && !email) continue;
            if (telefono === '+5939999999999') continue; // Filtrar teléfonos ficticios
            if (email && (email.includes('sincorreo') || email.includes('SINCORREO'))) continue;
            
            validos++;
            
            const clienteData = {
                name: nombre,
                phone: telefono || null,
                email: email || null,
                documentId: cedula || null,
                business: {
                    connect: { id: 'lovemesky' }
                },
                points: 0,
                totalSpent: 0,
                visits: 0
            };
            
            try {
                await prisma.client.create({ data: clienteData });
                insertados++;
                
                if (insertados % 25 === 0) {
                    console.log(`📈 Progreso: ${insertados} clientes insertados`);
                }
                
            } catch (error) {
                if (error.code === 'P2002') {
                    duplicados++;
                } else {
                    errores++;
                    console.log(`❌ Error con ${nombre}: ${error.message}`);
                }
            }
        }
        
        console.log('\n✅ IMPORTACIÓN COMPLETADA');
        console.log('=========================');
        console.log(`📊 Filas procesadas: ${procesados}`);
        console.log(`✅ Clientes válidos: ${validos}`);
        console.log(`💾 Clientes insertados: ${insertados}`);
        console.log(`🔄 Duplicados omitidos: ${duplicados}`);
        console.log(`❌ Errores: ${errores}`);
        
        // Verificar total en Love Me Sky
        const totalLoveMeSky = await prisma.client.count({
            where: { businessId: 'lovemesky' }
        });
        
        console.log(`\n🎯 TOTAL EN LOVE ME SKY: ${totalLoveMeSky} clientes`);
        
        // Mostrar algunos ejemplos
        const ejemplos = await prisma.client.findMany({
            where: { businessId: 'lovemesky' },
            take: 5,
            orderBy: { createdAt: 'desc' }
        });
        
        console.log('\n📋 ÚLTIMOS CLIENTES AGREGADOS:');
        ejemplos.forEach((cliente, i) => {
            console.log(`${i + 1}. ${cliente.name} - ${cliente.phone || cliente.email}`);
        });
        
        console.log('\n🎉 ¡DATOS DE OSADO IMPORTADOS EXITOSAMENTE!');
        console.log('Ahora Love Me Sky tiene acceso a todos los clientes de Osado');
        console.log('para el sistema de fidelización y WhatsApp. 🚀');
        
    } catch (error) {
        console.error('❌ Error en importación:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Funciones auxiliares
function limpiarTexto(texto) {
    if (!texto) return '';
    return texto.toString().trim().replace(/\s+/g, ' ');
}

function limpiarTelefono(telefono) {
    if (!telefono) return '';
    
    let limpio = telefono.toString().replace(/[^\d]/g, '');
    
    // Filtrar teléfonos ficticios
    if (limpio === '9999999999' || limpio.length < 9) return '';
    
    // Formatear números ecuatorianos
    if (limpio.startsWith('593')) {
        return '+' + limpio;
    } else if (limpio.startsWith('09')) {
        return '+593' + limpio.substring(1);
    } else if (limpio.length === 10 && limpio.startsWith('0')) {
        return '+593' + limpio.substring(1);
    } else if (limpio.length === 9) {
        return '+593' + limpio;
    }
    
    return limpio.length >= 9 ? '+593' + limpio : '';
}

function limpiarEmail(email) {
    if (!email) return '';
    const emailLimpio = email.toString().trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailLimpio) ? emailLimpio : '';
}

console.log('🎯 INICIANDO IMPORTACIÓN DE OSADO');
console.log('=================================');
importarOsadoFinal();
