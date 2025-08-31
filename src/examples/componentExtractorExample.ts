/**
 * Script de ejemplo para extraer componentes de un archivo grande
 * 
 * Este script muestra cómo utilizar la utilidad de extracción de componentes
 * para dividir archivos grandes en componentes más pequeños y reutilizables.
 */

import path from 'path';
import { extractComponents, updateSourceFile } from '../lib/componentExtractor';
import logger from '../lib/logger';

async function runComponentExtraction() {
  try {
    // Ruta al archivo fuente que queremos procesar
    const sourcePath = path.resolve(process.cwd(), 'src/app/admin/page.tsx');
    
    // Directorio donde se guardarán los componentes extraídos
    const outputDir = path.resolve(process.cwd(), 'src/components/admin');
    
    // Extraer componentes automáticamente (componentes con más de 50 líneas)
    const extractedComponents = await extractComponents({
      sourcePath,
      outputDir,
      minLines: 50,
      mode: 'auto'
    });
    
    logger.info(`Se extrajeron ${extractedComponents.length} componentes:`, extractedComponents);
    
    // Actualizar el archivo original para importar los componentes extraídos
    if (extractedComponents.length > 0) {
      updateSourceFile(
        sourcePath, 
        extractedComponents, 
        '../../components/admin'
      );
      
      logger.success('Archivo original actualizado con las importaciones de componentes');
    }
  } catch (error) {
    logger.error('Error al extraer componentes:', error);
  }
}

// Extraer componentes específicos por nombre
async function extractSpecificComponents() {
  try {
    const sourcePath = path.resolve(process.cwd(), 'src/app/admin/page.tsx');
    const outputDir = path.resolve(process.cwd(), 'src/components/admin');
    
    const componentNames = [
      'ProductList',
      'OrderTable',
      'UserManagement'
    ];
    
    const extractedComponents = await extractComponents({
      sourcePath,
      outputDir,
      mode: 'manual',
      componentNames
    });
    
    logger.info(`Se extrajeron ${extractedComponents.length} componentes específicos:`, extractedComponents);
    
    // Actualizar el archivo original
    if (extractedComponents.length > 0) {
      updateSourceFile(
        sourcePath, 
        extractedComponents, 
        '../../components/admin'
      );
      
      logger.success('Archivo original actualizado con las importaciones de componentes específicos');
    }
  } catch (error) {
    logger.error('Error al extraer componentes específicos:', error);
  }
}

// Ejecutar los ejemplos
runComponentExtraction()
  .then(() => extractSpecificComponents())
  .then(() => logger.info('Proceso de extracción de componentes completado'));
