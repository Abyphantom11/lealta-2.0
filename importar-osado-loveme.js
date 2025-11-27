/**
 * 📊 IMPORTADOR DE BASE DE DATOS OSADO → LOVE ME SKY
 * =================================================
 */

const xlsx = require('xlsx');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function importarOsadoToLoveMe() {
    console.log('📊 IMPORTANDO BASE DE DATOS OSADO → LOVE ME SKY');
    console.log('===============================================\n');

    try {
        // Leer archivo Excel
        console.log('📖 Leyendo archivo: BASE DATOS OSADO.xls...');
        const workbook = xlsx.readFile('BASE DATOS OSADO.xls');
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convertir a JSON
        const data = xlsx.utils.sheet_to_json(worksheet);
        
        console.log(`📋 Registros encontrados: ${data.length}`);
        console.log('📊 Primeros 3 registros:');
        console.log(data.slice(0, 3));
        
        console.log('\n🔄 Procesando registros...');
        
        let procesados = 0;
        let errores = 0;
        let duplicados = 0;
        
        for (const registro of data) {
            try {
                // Identificar campos del Excel (adaptaremos según la estructura)
                const cliente = {
                    nombre: registro['NOMBRE'] || registro['Nombre'] || registro['nombre'] || '',
                    apellido: registro['APELLIDO'] || registro['Apellido'] || registro['apellido'] || '',
                    telefono: registro['TELEFONO'] || registro['Teléfono'] || registro['telefono'] || registro['CELULAR'] || '',
                    email: registro['EMAIL'] || registro['Email'] || registro['email'] || registro['CORREO'] || '',
                    cedula: registro['CEDULA'] || registro['Cédula'] || registro['cedula'] || registro['CI'] || '',
                    fechaNacimiento: registro['FECHA_NACIMIENTO'] || registro['Fecha_Nacimiento'] || null,
                    direccion: registro['DIRECCION'] || registro['Dirección'] || registro['direccion'] || '',
                    // Campos específicos para Love Me Sky
                    businessId: 'lovemesky',
                    puntos: 0,
                    estado: 'activo',
                    fechaRegistro: new Date(),
                    origen: 'IMPORTACION_OSADO'
                };
                
                // Limpiar teléfono
                if (cliente.telefono) {
                    cliente.telefono = cliente.telefono.toString().replace(/[^\d+]/g, '');
                    if (!cliente.telefono.startsWith('+')) {
                        if (cliente.telefono.startsWith('09')) {
                            cliente.telefono = '+593' + cliente.telefono.substring(1);
                        } else if (cliente.telefono.startsWith('593')) {
                            cliente.telefono = '+' + cliente.telefono;
                        }
                    }
                }
                
                // Verificar si ya existe
                const existeCliente = await prisma.client.findFirst({
                    where: {
                        OR: [
                            { telefono: cliente.telefono },
                            { email: cliente.email },
                            { cedula: cliente.cedula }
                        ]
                    }
                });
                
                if (existeCliente) {
                    console.log(`⚠️  Cliente ya existe: ${cliente.nombre} ${cliente.apellido}`);
                    duplicados++;
                    continue;
                }
                
                // Crear nuevo cliente
                await prisma.client.create({
                    data: {
                        nombre: cliente.nombre,
                        apellido: cliente.apellido,
                        telefono: cliente.telefono,
                        email: cliente.email,
                        cedula: cliente.cedula,
                        fechaNacimiento: cliente.fechaNacimiento,
                        direccion: cliente.direccion,
                        businessId: cliente.businessId,
                        puntos: cliente.puntos,
                        estado: cliente.estado,
                        fechaRegistro: cliente.fechaRegistro
                    }
                });
                
                procesados++;
                console.log(`✅ ${procesados}. ${cliente.nombre} ${cliente.apellido} - ${cliente.telefono}`);
                
            } catch (error) {
                errores++;
                console.log(`❌ Error procesando registro:`, error.message);
            }
        }
        
        console.log('\n📊 RESUMEN DE IMPORTACIÓN:');
        console.log('==========================');
        console.log(`✅ Procesados correctamente: ${procesados}`);
        console.log(`⚠️  Duplicados omitidos: ${duplicados}`);
        console.log(`❌ Errores: ${errores}`);
        console.log(`📋 Total en archivo: ${data.length}`);
        
        // Actualizar conteo total de Love Me Sky
        const totalClientes = await prisma.client.count({
            where: { businessId: 'lovemesky' }
        });
        
        console.log('\n🎯 ESTADO FINAL LOVE ME SKY:');
        console.log('============================');
        console.log(`📊 Total clientes: ${totalClientes}`);
        console.log(`📱 Listos para WhatsApp: ${procesados} nuevos + anteriores`);
        
        return {
            procesados,
            errores,
            duplicados,
            total: totalClientes
        };
        
    } catch (error) {
        console.log('❌ Error general:', error.message);
        throw error;
    }
}

// Función para ver estructura del Excel primero
async function analizarEstructuraExcel() {
    console.log('🔍 ANALIZANDO ESTRUCTURA DEL EXCEL...');
    console.log('====================================\n');
    
    try {
        const workbook = xlsx.readFile('BASE DATOS OSADO.xls');
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        console.log(`📄 Nombre de la hoja: ${sheetName}`);
        
        // Obtener headers
        const data = xlsx.utils.sheet_to_json(worksheet);
        if (data.length > 0) {
            console.log('\n📋 COLUMNAS ENCONTRADAS:');
            console.log('========================');
            Object.keys(data[0]).forEach((key, index) => {
                console.log(`${index + 1}. ${key}`);
            });
            
            console.log('\n📊 MUESTRA DE DATOS (PRIMEROS 2 REGISTROS):');
            console.log('==========================================');
            console.log(JSON.stringify(data.slice(0, 2), null, 2));
        }
        
        return data;
        
    } catch (error) {
        console.log('❌ Error analizando Excel:', error.message);
        
        if (error.message.includes('Cannot read')) {
            console.log('\n💡 SOLUCIONES:');
            console.log('1. Verifica que el archivo existe');
            console.log('2. Instala la dependencia: npm install xlsx');
            console.log('3. Asegúrate que el archivo no esté abierto en Excel');
        }
    }
}

// Ejecutar análisis primero
console.log('🚀 PREPARANDO IMPORTACIÓN OSADO → LOVE ME SKY');
console.log('=============================================\n');

analizarEstructuraExcel()
    .then(() => {
        console.log('\n🎯 LISTO PARA IMPORTAR');
        console.log('Para proceder con la importación, ejecuta: importarOsadoToLoveMe()');
    })
    .catch(console.error);

module.exports = {
    analizarEstructuraExcel,
    importarOsadoToLoveMe
};
