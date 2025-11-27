/**
 * 📊 IMPORTAR DATOS BÁSICOS DE OSADO A LOVE ME SKY
 * Solo: Teléfono, Nombre, Cédula, Correo
 */

const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function importarDatosBasicosOsado() {
    console.log('📊 IMPORTANDO DATOS BÁSICOS DE OSADO');
    console.log('===================================\n');
    
    try {
        // Leer archivo Excel
        console.log('📁 Leyendo archivo: BASE DATOS OSADO.xls');
        const workbook = XLSX.readFile('BASE DATOS OSADO.xls');
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convertir a JSON
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        console.log(`📋 Total de filas encontradas: ${data.length}`);
        
        // La segunda fila contiene los headers
        const headers = data[1] || [];
        console.log('🔍 Columnas encontradas:', headers);
        
        // Buscar índices de las columnas que necesitamos
        const indices = {
            telefono: buscarIndiceColumna(headers, ['telefono', 'tel', 'phone', 'celular', 'movil']),
            nombre: buscarIndiceColumna(headers, ['nombre', 'name', 'cliente', 'apellido']),
            cedula: buscarIndiceColumna(headers, ['cedula', 'ci', 'identificacion', 'id', 'documento']),
            correo: buscarIndiceColumna(headers, ['correo', 'email', 'mail', 'e-mail'])
        };
        
        console.log('\n📍 ÍNDICES DE COLUMNAS ENCONTRADAS:');
        console.log('==================================');
        Object.entries(indices).forEach(([campo, indice]) => {
            if (indice !== -1) {
                console.log(`✅ ${campo.toUpperCase()}: Columna ${indice} - "${headers[indice]}"`);
            } else {
                console.log(`❌ ${campo.toUpperCase()}: No encontrado`);
            }
        });
        
        // Procesar datos (empezar desde fila 2, saltar headers)
        let clientesProcesados = 0;
        let clientesValidos = 0;
        let clientesInsertados = 0;
        
        console.log('\n🔄 PROCESANDO CLIENTES...');
        console.log('=========================');
        
        for (let i = 2; i < data.length; i++) {
            const fila = data[i];
            
            if (!fila || fila.length === 0) continue;
            
            clientesProcesados++;
            
            // Extraer datos básicos
            const cliente = {
                telefono: limpiarTelefono(fila[indices.telefono] || ''),
                nombre: limpiarTexto(fila[indices.nombre] || ''),
                cedula: limpiarTexto(fila[indices.cedula] || ''),
                correo: limpiarEmail(fila[indices.correo] || '')
            };
            
            // Validar que tenga al menos nombre y un método de contacto
            if (cliente.nombre && (cliente.telefono || cliente.correo)) {
                clientesValidos++;
                
                try {
                    // Insertar en base de datos
                    await prisma.client.create({
                        data: {
                            name: cliente.nombre,
                            phone: cliente.telefono || null,
                            email: cliente.correo || null,
                            documentId: cliente.cedula || null,
                            business: {
                                connect: { id: 'lovemesky' } // Conectar a Love Me Sky
                            },
                            points: 0,
                            totalSpent: 0,
                            visits: 0
                        }
                    });
                    
                    clientesInsertados++;
                    
                    // Mostrar progreso cada 10 clientes
                    if (clientesInsertados % 10 === 0) {
                        console.log(`📈 Insertados: ${clientesInsertados} clientes`);
                    }
                    
                } catch (error) {
                    if (error.code === 'P2002') {
                        // Cliente duplicado (por teléfono o email)
                        console.log(`⚠️  Cliente duplicado: ${cliente.nombre} - ${cliente.telefono || cliente.correo}`);
                    } else {
                        console.log(`❌ Error insertando ${cliente.nombre}:`, error.message);
                    }
                }
            }
        }
        
        console.log('\n✅ IMPORTACIÓN COMPLETADA');
        console.log('=========================');
        console.log(`📊 Filas procesadas: ${clientesProcesados}`);
        console.log(`✅ Clientes válidos: ${clientesValidos}`);
        console.log(`💾 Clientes insertados: ${clientesInsertados}`);
        console.log(`⚠️  Clientes omitidos: ${clientesValidos - clientesInsertados}`);
        
        // Mostrar estadísticas finales
        const totalClientes = await prisma.client.count({
            where: { businessId: 'lovemesky' }
        });
        
        console.log(`\n🎯 TOTAL EN LOVE ME SKY: ${totalClientes} clientes`);
        
    } catch (error) {
        console.error('❌ Error en importación:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Funciones auxiliares
function buscarIndiceColumna(headers, posiblesNombres) {
    for (let i = 0; i < headers.length; i++) {
        const header = (headers[i] || '').toString().toLowerCase();
        for (const nombre of posiblesNombres) {
            if (header.includes(nombre.toLowerCase())) {
                return i;
            }
        }
    }
    return -1;
}

function limpiarTelefono(telefono) {
    if (!telefono) return '';
    
    let limpio = telefono.toString().replace(/[^\d+]/g, '');
    
    // Formatear números ecuatorianos
    if (limpio.startsWith('593')) {
        limpio = '+' + limpio;
    } else if (limpio.startsWith('09')) {
        limpio = '+593' + limpio.substring(1);
    } else if (limpio.length === 9 && limpio.startsWith('9')) {
        limpio = '+593' + limpio;
    }
    
    return limpio.length >= 10 ? limpio : '';
}

function limpiarTexto(texto) {
    if (!texto) return '';
    return texto.toString().trim().replace(/\s+/g, ' ');
}

function limpiarEmail(email) {
    if (!email) return '';
    const emailLimpio = email.toString().trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailLimpio) ? emailLimpio : '';
}

// Ejecutar importación
console.log('🚀 INICIANDO IMPORTACIÓN DE OSADO A LOVE ME SKY');
console.log('===============================================');
importarDatosBasicosOsado();
