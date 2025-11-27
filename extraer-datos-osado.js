/**
 * 📊 EXTRAER DATOS DE OSADO - VERSION SIN PRISMA
 */

const XLSX = require('xlsx');
const fs = require('fs');

function extraerDatosOsado() {
    console.log('🚀 EXTRAYENDO DATOS DE OSADO');
    console.log('============================\n');
    
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
        const clientesExtraidos = [];
        
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
            
            const cliente = {
                nombre: nombre,
                telefono: telefono || '',
                email: email || '',
                cedula: cedula || '',
                negocio: 'lovemesky',
                fuente: 'osado'
            };
            
            clientesExtraidos.push(cliente);
            
            if (validos % 50 === 0) {
                console.log(`📈 Progreso: ${validos} clientes procesados`);
            }
        }
        
        console.log('\n✅ EXTRACCIÓN COMPLETADA');
        console.log('=========================');
        console.log(`📊 Filas procesadas: ${procesados}`);
        console.log(`✅ Clientes válidos: ${validos}`);
        console.log(`💾 Total extraído: ${clientesExtraidos.length}`);
        
        // Guardar en archivo JSON
        const nombreArchivo = 'clientes-osado-extraidos.json';
        fs.writeFileSync(nombreArchivo, JSON.stringify(clientesExtraidos, null, 2));
        
        console.log(`\n📁 Datos guardados en: ${nombreArchivo}`);
        
        // Mostrar algunos ejemplos
        console.log('\n📋 EJEMPLOS DE CLIENTES EXTRAÍDOS:');
        clientesExtraidos.slice(0, 10).forEach((cliente, i) => {
            const contacto = cliente.telefono || cliente.email;
            console.log(`${i + 1}. ${cliente.nombre} - ${contacto}`);
        });
        
        // Estadísticas
        const conTelefono = clientesExtraidos.filter(c => c.telefono).length;
        const conEmail = clientesExtraidos.filter(c => c.email).length;
        const conCedula = clientesExtraidos.filter(c => c.cedula).length;
        
        console.log('\n📊 ESTADÍSTICAS:');
        console.log('================');
        console.log(`📱 Con teléfono: ${conTelefono}`);
        console.log(`📧 Con email: ${conEmail}`);
        console.log(`🆔 Con cédula: ${conCedula}`);
        
        // Crear archivo CSV también
        const csvContent = [
            'nombre,telefono,email,cedula,negocio,fuente',
            ...clientesExtraidos.map(c => 
                `"${c.nombre}","${c.telefono}","${c.email}","${c.cedula}","${c.negocio}","${c.fuente}"`
            )
        ].join('\n');
        
        const nombreCSV = 'clientes-osado-extraidos.csv';
        fs.writeFileSync(nombreCSV, csvContent);
        console.log(`📁 CSV guardado en: ${nombreCSV}`);
        
        console.log('\n🎉 ¡DATOS DE OSADO EXTRAÍDOS EXITOSAMENTE!');
        console.log('Archivos generados:');
        console.log(`- ${nombreArchivo} (formato JSON)`);
        console.log(`- ${nombreCSV} (formato CSV)`);
        console.log('\nAhora puedes importar estos datos a Love Me Sky 🚀');
        
        return clientesExtraidos;
        
    } catch (error) {
        console.error('❌ Error en extracción:', error.message);
        return [];
    }
}

// Funciones auxiliares (mismas que antes)
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

console.log('🎯 INICIANDO EXTRACCIÓN DE OSADO');
console.log('=================================');
extraerDatosOsado();
