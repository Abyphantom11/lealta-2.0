#!/usr/bin/env node
/**
 * 🔍 AUDITORÍA COMPLETA DE PRODUCCIÓN - LEALTA 2.0
 * Verifica edge cases, seguridad, performance y preparación para producción
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de auditoría
const AUDIT_CONFIG = {
  // APIs críticas que requieren validación especial
  criticalApis: [
    'src/app/api/tarjetas/asignar/route.ts',
    'src/app/api/staff/consumo/route.ts', 
    'src/app/api/auth/login/route.ts',
    'src/app/api/cliente/registro/route.ts',
    'src/app/api/admin/*/route.ts'
  ],
  
  // Archivos de configuración críticos
  configFiles: [
    'package.json',
    'next.config.cjs',
    'tsconfig.json',
    'playwright.config.ts',
    'vitest.config.ts'
  ],
  
  // Middlewares de seguridad
  securityFiles: [
    'src/middleware/requireAuth.ts',
    'src/middleware/security.ts',
    'src/lib/auth/*.ts'
  ]
};

class ProductionAuditor {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.successes = [];
    this.projectRoot = path.resolve(__dirname, '..');
  }

  log(type, category, message, details = null) {
    const logEntry = {
      type,
      category,
      message,
      details,
      timestamp: new Date().toISOString()
    };

    switch (type) {
      case 'error':
        this.errors.push(logEntry);
        console.log(`❌ [${category}] ${message}`);
        break;
      case 'warning':
        this.warnings.push(logEntry);
        console.log(`⚠️ [${category}] ${message}`);
        break;
      case 'success':
        this.successes.push(logEntry);
        console.log(`✅ [${category}] ${message}`);
        break;
    }

    if (details) {
      console.log(`   📝 ${details}`);
    }
  }

  async auditFileExists(filePath) {
    const fullPath = path.join(this.projectRoot, filePath);
    try {
      await fs.promises.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  async auditPackageJson() {
    console.log('\n🔍 Auditando package.json...');
    
    const packagePath = path.join(this.projectRoot, 'package.json');
    
    try {
      const packageJson = JSON.parse(await fs.promises.readFile(packagePath, 'utf8'));
      
      // Verificar type: module
      if (packageJson.type === 'module') {
        this.log('success', 'CONFIG', 'ES modules configurados correctamente');
      } else {
        this.log('warning', 'CONFIG', 'No se encontró type: "module" en package.json');
      }

      // Verificar scripts críticos
      const criticalScripts = ['build', 'test', 'dev', 'start'];
      for (const script of criticalScripts) {
        if (packageJson.scripts?.[script]) {
          this.log('success', 'SCRIPTS', `Script "${script}" configurado`);
        } else {
          this.log('error', 'SCRIPTS', `Script crítico "${script}" faltante`);
        }
      }

      // Verificar dependencias críticas
      const criticalDeps = ['next', '@prisma/client', 'typescript'];
      for (const dep of criticalDeps) {
        if (packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]) {
          this.log('success', 'DEPS', `Dependencia crítica "${dep}" presente`);
        } else {
          this.log('error', 'DEPS', `Dependencia crítica "${dep}" faltante`);
        }
      }

    } catch (error) {
      this.log('error', 'CONFIG', 'Error leyendo package.json', error.message);
    }
  }

  async auditBuildSystem() {
    console.log('\n🔍 Auditando sistema de build...');

    // Verificar archivos de build
    const buildFiles = [
      'next.config.cjs',
      'tsconfig.json', 
      'scripts/vercel-build.mjs'
    ];

    for (const file of buildFiles) {
      if (await this.auditFileExists(file)) {
        this.log('success', 'BUILD', `Archivo de build "${file}" presente`);
      } else {
        this.log('error', 'BUILD', `Archivo crítico de build "${file}" faltante`);
      }
    }

    // Verificar directorio .next (si existe)
    if (await this.auditFileExists('.next')) {
      this.log('success', 'BUILD', 'Directorio .next encontrado - build previo exitoso');
    } else {
      this.log('warning', 'BUILD', 'Directorio .next no encontrado - ejecutar npm run build');
    }
  }

  async auditApiSecurity() {
    console.log('\n🔍 Auditando seguridad de APIs...');

    const apiDir = path.join(this.projectRoot, 'src/app/api');
    
    try {
      const checkDirectory = async (dir) => {
        const entries = await fs.promises.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory()) {
            await checkDirectory(fullPath);
          } else if (entry.name === 'route.ts') {
            await this.auditApiRoute(fullPath);
          }
        }
      };

      await checkDirectory(apiDir);
      
    } catch (error) {
      this.log('error', 'API_AUDIT', 'Error auditando APIs', error.message);
    }
  }

  async auditApiRoute(routePath) {
    try {
      const content = await fs.promises.readFile(routePath, 'utf8');
      const relativePath = path.relative(this.projectRoot, routePath);
      
      // Verificar autenticación
      const hasAuth = content.includes('requireAuth') || 
                     content.includes('withAuth') || 
                     content.includes('validateUserSession');
      
      // Verificar validación de entrada
      const hasValidation = content.includes('zod') || 
                           content.includes('z.') ||
                           content.includes('schema') ||
                           content.includes('validate');
      
      // Verificar manejo de errores
      const hasErrorHandling = content.includes('try') && 
                              content.includes('catch') &&
                              content.includes('NextResponse.json');
      
      // Determinar si es API crítica
      const isCritical = relativePath.includes('admin') || 
                        relativePath.includes('tarjetas') ||
                        relativePath.includes('staff') ||
                        relativePath.includes('auth');
      
      if (isCritical) {
        if (hasAuth) {
          this.log('success', 'API_SEC', `${relativePath} - Autenticación presente`);
        } else {
          this.log('error', 'API_SEC', `${relativePath} - FALTA autenticación en API crítica`);
        }
        
        if (hasValidation) {
          this.log('success', 'API_SEC', `${relativePath} - Validación de entrada presente`);
        } else {
          this.log('warning', 'API_SEC', `${relativePath} - Validación de entrada recomendada`);
        }
      }
      
      if (hasErrorHandling) {
        this.log('success', 'API_SEC', `${relativePath} - Manejo de errores presente`);
      } else {
        this.log('warning', 'API_SEC', `${relativePath} - Manejo de errores mejorable`);
      }
      
    } catch (error) {
      this.log('error', 'API_AUDIT', `Error auditando ${routePath}`, error.message);
    }
  }

  async auditTestCoverage() {
    console.log('\n🔍 Auditando cobertura de tests...');

    const testDirs = ['tests', 'src/__tests__'];
    let testFilesFound = 0;

    for (const testDir of testDirs) {
      if (await this.auditFileExists(testDir)) {
        this.log('success', 'TESTS', `Directorio de tests "${testDir}" presente`);
        
        // Contar archivos de test
        try {
          const files = await this.countTestFiles(path.join(this.projectRoot, testDir));
          testFilesFound += files;
        } catch (error) {
          this.log('warning', 'TESTS', `Error contando tests en ${testDir}`);
        }
      }
    }

    if (testFilesFound > 0) {
      this.log('success', 'TESTS', `${testFilesFound} archivos de test encontrados`);
    } else {
      this.log('error', 'TESTS', 'No se encontraron archivos de test');
    }

    // Verificar configuración de testing
    const testConfigs = ['vitest.config.ts', 'playwright.config.ts'];
    for (const config of testConfigs) {
      if (await this.auditFileExists(config)) {
        this.log('success', 'TESTS', `Configuración de test "${config}" presente`);
      } else {
        this.log('warning', 'TESTS', `Configuración de test "${config}" faltante`);
      }
    }
  }

  async countTestFiles(dir) {
    let count = 0;
    try {
      const entries = await fs.promises.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          count += await this.countTestFiles(fullPath);
        } else if (entry.name.includes('.test.') || entry.name.includes('.spec.')) {
          count++;
        }
      }
    } catch (error) {
      // Directorio no accesible
    }
    
    return count;
  }

  async auditEnvironmentConfig() {
    console.log('\n🔍 Auditando configuración de entorno...');

    // Verificar archivos de entorno
    const envFiles = ['.env', '.env.local', '.env.example'];
    
    for (const envFile of envFiles) {
      if (await this.auditFileExists(envFile)) {
        this.log('success', 'ENV', `Archivo de entorno "${envFile}" presente`);
      } else if (envFile === '.env.example') {
        this.log('warning', 'ENV', '.env.example faltante - recomendado para documentar variables');
      }
    }

    // Verificar variables críticas en proceso
    const criticalEnvVars = [
      'DATABASE_URL',
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL'
    ];

    for (const envVar of criticalEnvVars) {
      if (process.env[envVar]) {
        this.log('success', 'ENV', `Variable de entorno "${envVar}" configurada`);
      } else {
        this.log('error', 'ENV', `Variable crítica "${envVar}" faltante`);
      }
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 RESUMEN DE AUDITORÍA DE PRODUCCIÓN');
    console.log('='.repeat(80));

    console.log(`\n✅ Éxitos: ${this.successes.length}`);
    console.log(`⚠️ Advertencias: ${this.warnings.length}`);
    console.log(`❌ Errores: ${this.errors.length}`);

    // Calcular puntuación
    const totalChecks = this.successes.length + this.warnings.length + this.errors.length;
    const score = Math.round(((this.successes.length + this.warnings.length * 0.5) / totalChecks) * 100);

    console.log(`\n🎯 Puntuación de Preparación: ${score}%`);

    if (score >= 90) {
      console.log('🚀 ¡Excelente! El proyecto está listo para producción');
    } else if (score >= 75) {
      console.log('👍 Bueno - Algunas mejoras recomendadas antes de producción');
    } else if (score >= 60) {
      console.log('⚠️ Aceptable - Correcciones necesarias antes de producción');
    } else {
      console.log('❌ Crítico - Múltiples problemas deben ser resueltos');
    }

    // Mostrar errores críticos si los hay
    if (this.errors.length > 0) {
      console.log('\n🔥 ERRORES CRÍTICOS A RESOLVER:');
      this.errors.slice(0, 5).forEach((error, index) => {
        console.log(`${index + 1}. [${error.category}] ${error.message}`);
      });
    }

    // Mostrar recomendaciones
    console.log('\n💡 PRÓXIMOS PASOS RECOMENDADOS:');
    if (this.errors.length > 0) {
      console.log('1. Resolver errores críticos mostrados arriba');
    }
    console.log('2. Ejecutar npm run build para verificar compilación');
    console.log('3. Ejecutar npm run test para verificar tests');
    console.log('4. Revisar variables de entorno en producción');
    console.log('5. Hacer deploy de prueba en staging');

    return {
      score,
      errors: this.errors.length,
      warnings: this.warnings.length,
      successes: this.successes.length,
      ready: score >= 75 && this.errors.length === 0
    };
  }

  async runFullAudit() {
    console.log('🔍 INICIANDO AUDITORÍA COMPLETA DE PRODUCCIÓN...\n');

    await this.auditPackageJson();
    await this.auditBuildSystem();
    await this.auditApiSecurity();
    await this.auditTestCoverage();
    await this.auditEnvironmentConfig();

    return this.generateReport();
  }
}

// Ejecutar auditoría si el script se ejecuta directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const auditor = new ProductionAuditor();
  auditor.runFullAudit()
    .then(result => {
      process.exit(result.ready ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Error ejecutando auditoría:', error);
      process.exit(1);
    });
}

export { ProductionAuditor };
