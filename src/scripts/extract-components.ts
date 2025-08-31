#!/usr/bin/env node
/**
 * Herramienta de línea de comandos para extraer componentes
 * 
 * Uso:
 * npx ts-node src/scripts/extract-components.ts --source=src/app/admin/page.tsx --output=src/components/admin --min-lines=50
 * 
 * Opciones:
 * --source: Ruta al archivo fuente (obligatorio)
 * --output: Directorio de salida para los componentes extraídos (obligatorio)
 * --min-lines: Umbral mínimo de líneas para extraer un componente (predeterminado: 50)
 * --mode: Modo de extracción ('auto' o 'manual', predeterminado: 'auto')
 * --components: Lista de nombres de componentes separados por comas (solo para modo manual)
 */

import path from 'path';
import { extractComponents, updateSourceFile } from '../lib/componentExtractor';
import logger from '../lib/logger';

// Parsear argumentos de la línea de comandos
function parseArgs() {
  const args = process.argv.slice(2);
  const options: Record<string, string> = {};
  
  console.log('Argumentos recibidos:', args);
  
  args.forEach(arg => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.substring(2).split('=');
      options[key] = value;
    }
  });
  
  console.log('Opciones procesadas:', options);
  return options;
}

async function main() {
  try {
    const options = parseArgs();
    
    // Validar opciones obligatorias
    if (!options.source || !options.output) {
      logger.error('Error: --source y --output son argumentos obligatorios');
      printUsage();
      process.exit(1);
    }
    
    const sourcePath = path.resolve(process.cwd(), options.source);
    const outputDir = path.resolve(process.cwd(), options.output);
    const minLines = options['min-lines'] ? parseInt(options['min-lines']) : 50;
    const mode = options.mode === 'manual' ? 'manual' : 'auto';
    const componentNames = options.components ? options.components.split(',') : [];
    
    logger.info(`Extrayendo componentes de ${sourcePath}`);
    logger.info(`Directorio de salida: ${outputDir}`);
    logger.info(`Modo: ${mode}, Líneas mínimas: ${minLines}`);
    
    if (mode === 'manual') {
      logger.info(`Componentes a extraer: ${componentNames.join(', ')}`);
    }
    
    // Extraer componentes
    const extractedComponents = await extractComponents({
      sourcePath,
      outputDir,
      minLines,
      mode,
      componentNames
    });
    
    if (extractedComponents.length === 0) {
      logger.warn('No se encontraron componentes para extraer');
      process.exit(0);
    }
    
    logger.success(`Se extrajeron ${extractedComponents.length} componentes:`, extractedComponents);
    
    // Calcular la ruta relativa para las importaciones
    const sourceDir = path.dirname(sourcePath);
    const relativePathToOutput = path.relative(sourceDir, outputDir);
    
    // Actualizar el archivo original
    updateSourceFile(sourcePath, extractedComponents, relativePathToOutput);
    logger.success('Archivo original actualizado con las importaciones de componentes');
    
  } catch (error) {
    logger.error('Error al extraer componentes:', error);
    process.exit(1);
  }
}

function printUsage() {
  console.log(`
Uso:
  npx ts-node src/scripts/extract-components.ts --source=src/app/admin/page.tsx --output=src/components/admin --min-lines=50

Opciones:
  --source       Ruta al archivo fuente (obligatorio)
  --output       Directorio de salida para los componentes extraídos (obligatorio)
  --min-lines    Umbral mínimo de líneas para extraer un componente (predeterminado: 50)
  --mode         Modo de extracción ('auto' o 'manual', predeterminado: 'auto')
  --components   Lista de nombres de componentes separados por comas (solo para modo manual)
  `);
}

main();
