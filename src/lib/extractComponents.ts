/**
 * Script para separar archivos grandes de React en componentes más pequeños
 */

import path from 'path';
import fs from 'fs';
import { extractComponents, updateSourceFile } from './componentExtractor';

// Configuración
const TARGET_FILES = [
  { path: 'src/app/admin/page.tsx', outputDir: 'src/components/admin' },
  { path: 'src/app/cliente/page.tsx', outputDir: 'src/components/cliente' },
  { path: 'src/app/superadmin/SuperAdminDashboard.tsx', outputDir: 'src/components/superadmin' },
  { path: 'src/app/staff/page.tsx', outputDir: 'src/components/staff' }
];

// Componentes específicos a extraer (modo manual)
const COMPONENTS_TO_EXTRACT: Record<string, string[]> = {
  'src/app/admin/page.tsx': [
    'MenuContent', 
    'ClientesContent', 
    'StatsContent', 
    'SettingsContent',
    'CategoryForm',
    'ProductForm',
    'ConfirmationModal'
  ],
  'src/app/cliente/page.tsx': [
    'WelcomeView',
    'ProfileView',
    'HistoryView',
    'RewardsView'
  ],
  'src/app/superadmin/SuperAdminDashboard.tsx': [
    'StatsOverview',
    'UserManagement',
    'BusinessStats',
    'ClienteDetails'
  ],
  'src/app/staff/page.tsx': [
    'ClienteVerification',
    'PuntoForm',
    'TransactionHistory',
    'ClienteProfile'
  ]
};

/**
 * Ejecuta el proceso de extracción de componentes
 */
async function runComponentExtraction() {
  console.log('🔍 Iniciando extracción de componentes...');
  
  for (const target of TARGET_FILES) {
    const absolutePath = path.resolve(process.cwd(), target.path);
    const absoluteOutputDir = path.resolve(process.cwd(), target.outputDir);
    
    console.log(`\n📄 Procesando: ${target.path}`);
    
    if (!fs.existsSync(absolutePath)) {
      console.error(`❌ Error: El archivo ${target.path} no existe.`);
      continue;
    }
    
    try {
      // Extraer componentes
      const componentNames = COMPONENTS_TO_EXTRACT[target.path] || [];
      const extractedComponents = await extractComponents({
        sourcePath: absolutePath,
        outputDir: absoluteOutputDir,
        mode: componentNames.length > 0 ? 'manual' : 'auto',
        componentNames: componentNames,
        minLines: 50
      });
      
      if (extractedComponents.length === 0) {
        console.log('ℹ️ No se encontraron componentes para extraer.');
        continue;
      }
      
      console.log(`✅ Componentes extraídos: ${extractedComponents.join(', ')}`);
      
      // Actualizar archivo original
      const relativeImportPath = path.relative(
        path.dirname(absolutePath),
        absoluteOutputDir
      ).replace(/\\/g, '/');
      
      updateSourceFile(absolutePath, extractedComponents, relativeImportPath);
      console.log(`✅ Archivo original actualizado con importaciones`);
      
    } catch (error) {
      console.error(`❌ Error al procesar ${target.path}:`, error);
    }
  }
  
  console.log('\n🎉 Proceso de extracción de componentes completado!');
}

// Ejecutar el script si es llamado directamente
if (require.main === module) {
  runComponentExtraction();
}

export { runComponentExtraction };
