/**
 * 🔍 ANALIZADOR DETALLADO DEL EXCEL DE OSADO
 */

const XLSX = require('xlsx');

function analizarEstructuraExcel() {
    console.log('🔍 ANÁLISIS DETALLADO DEL EXCEL DE OSADO');
    console.log('=======================================\n');
    
    try {
        // Leer archivo Excel
        const workbook = XLSX.readFile('BASE DATOS OSADO.xls');
        const sheetName = workbook.SheetNames[0];
        console.log(`📄 Hoja encontrada: "${sheetName}"`);
        
        const worksheet = workbook.Sheets[sheetName];
        
        // Obtener rango de datos
        const range = worksheet['!ref'];
        console.log(`📊 Rango de datos: ${range}`);
        
        // Convertir a JSON manteniendo celdas vacías
        const data = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,
            defval: '', // Valor por defecto para celdas vacías
            raw: false // Convertir a texto
        });
        
        console.log(`📋 Total de filas: ${data.length}`);
        console.log('');
        
        // Mostrar las primeras 10 filas para entender la estructura
        console.log('🔍 PRIMERAS 10 FILAS:');
        console.log('====================');
        for (let i = 0; i < Math.min(10, data.length); i++) {
            console.log(`Fila ${i}:`, data[i]);
        }
        
        console.log('\n🔍 ANÁLISIS DE COLUMNAS POR FILA:');
        console.log('================================');
        
        // Analizar cada fila para encontrar patrones
        for (let i = 0; i < Math.min(20, data.length); i++) {
            const fila = data[i];
            if (fila && fila.length > 0) {
                console.log(`\nFila ${i} (${fila.length} columnas):`);
                
                // Mostrar contenido de cada celda no vacía
                fila.forEach((celda, indice) => {
                    if (celda && celda.toString().trim() !== '') {
                        console.log(`  Col ${indice}: "${celda}"`);
                    }
                });
            }
        }
        
        // Buscar patrones que podrían ser teléfonos o emails
        console.log('\n🔍 BÚSQUEDA DE PATRONES:');
        console.log('=======================');
        
        let telefonosEncontrados = [];
        let emailsEncontrados = [];
        let cedulasEncontradas = [];
        let nombresEncontrados = [];
        
        for (let i = 0; i < Math.min(100, data.length); i++) {
            const fila = data[i];
            if (fila) {
                fila.forEach((celda, indice) => {
                    if (celda) {
                        const texto = celda.toString().trim();
                        
                        // Buscar teléfonos (números de 7+ dígitos)
                        if (/[\d\s\-\+\(\)]{7,}/.test(texto) && /\d/.test(texto)) {
                            telefonosEncontrados.push({ fila: i, col: indice, valor: texto });
                        }
                        
                        // Buscar emails
                        if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(texto)) {
                            emailsEncontrados.push({ fila: i, col: indice, valor: texto });
                        }
                        
                        // Buscar cédulas (números de 10 dígitos en Ecuador)
                        if (/^\d{10}$/.test(texto.replace(/\D/g, ''))) {
                            cedulasEncontradas.push({ fila: i, col: indice, valor: texto });
                        }
                        
                        // Buscar nombres (texto de 3+ caracteres con espacios)
                        if (/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{3,50}$/.test(texto) && texto.includes(' ')) {
                            nombresEncontrados.push({ fila: i, col: indice, valor: texto });
                        }
                    }
                });
            }
        }
        
        console.log(`📞 Posibles teléfonos encontrados: ${telefonosEncontrados.length}`);
        telefonosEncontrados.slice(0, 5).forEach(tel => {
            console.log(`  Fila ${tel.fila}, Col ${tel.col}: "${tel.valor}"`);
        });
        
        console.log(`📧 Posibles emails encontrados: ${emailsEncontrados.length}`);
        emailsEncontrados.slice(0, 5).forEach(email => {
            console.log(`  Fila ${email.fila}, Col ${email.col}: "${email.valor}"`);
        });
        
        console.log(`🆔 Posibles cédulas encontradas: ${cedulasEncontradas.length}`);
        cedulasEncontradas.slice(0, 5).forEach(cedula => {
            console.log(`  Fila ${cedula.fila}, Col ${cedula.col}: "${cedula.valor}"`);
        });
        
        console.log(`👤 Posibles nombres encontrados: ${nombresEncontrados.length}`);
        nombresEncontrados.slice(0, 5).forEach(nombre => {
            console.log(`  Fila ${nombre.fila}, Col ${nombre.col}: "${nombre.valor}"`);
        });
        
    } catch (error) {
        console.error('❌ Error analizando archivo:', error.message);
    }
}

analizarEstructuraExcel();
