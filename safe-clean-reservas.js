const fs = require('fs');

function safeCleanReservas() {
  const filePath = 'src/app/api/reservas/route.ts';
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Agregar import de debugLog al inicio
    if (!content.includes("from '@/lib/debug-utils'")) {
      // Buscar el último import
      const importRegex = /import\s+.*from\s+['"].*['"];?\s*\n/g;
      let lastImportMatch;
      let match;
      
      while ((match = importRegex.exec(content)) !== null) {
        lastImportMatch = match;
      }
      
      if (lastImportMatch) {
        const insertPosition = lastImportMatch.index + lastImportMatch[0].length;
        content = content.slice(0, insertPosition) + 
                 "import { debugLog } from '@/lib/debug-utils';\n" + 
                 content.slice(insertPosition);
      }
    }
    
    // Solo reemplazar console.log que estén en líneas independientes
    // Esto es más seguro que eliminar toda la línea
    content = content.replace(/(\s*)console\.log\(/g, '$1debugLog(');
    
    fs.writeFileSync(filePath, content);
    console.log('✅ Reservas API limpiado de forma segura');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

safeCleanReservas();
