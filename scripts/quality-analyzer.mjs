#!/usr/bin/env node
/**
 * 📊 EVALUADOR DE CALIDAD COMPLETO - LEALTA 2.0
 * Análisis exhaustivo de métricas de calidad del proyecto
 */

import fs from 'fs';
import path from 'path';

class ProjectQualityAnalyzer {
  constructor() {
    this.metrics = {
      codeQuality: {},
      architecture: {},
      security: {},
      performance: {},
      maintainability: {},
      documentation: {},
      testing: {}
    };
  }

  async analyzeProject() {
    console.log('📊 INICIANDO ANÁLISIS COMPLETO DE CALIDAD...\n');
    
    await this.analyzeCodeStructure();
    await this.analyzeSecurityPatterns();
    await this.analyzePerformancePatterns();
    await this.analyzeArchitecture();
    await this.analyzeTestCoverage();
    await this.analyzeDependencies();
    await this.analyzeDocumentation();
    
    return this.generateQualityReport();
  }

  async analyzeCodeStructure() {
    console.log('🔍 Analizando estructura de código...');
    
    const srcPath = path.join(process.cwd(), 'src');
    const stats = await this.getDirectoryStats(srcPath);
    
    this.metrics.codeQuality = {
      totalFiles: stats.totalFiles,
      linesOfCode: stats.linesOfCode,
      componentsCount: stats.components,
      apiRoutesCount: stats.apiRoutes,
      utilsCount: stats.utils,
      complexity: this.calculateComplexity(stats)
    };

    console.log(`  📁 Total archivos: ${stats.totalFiles}`);
    console.log(`  📄 Líneas de código: ${stats.linesOfCode}`);
    console.log(`  🧩 Componentes: ${stats.components}`);
    console.log(`  🔌 API Routes: ${stats.apiRoutes}`);
  }

  async getDirectoryStats(dirPath) {
    const stats = {
      totalFiles: 0,
      linesOfCode: 0,
      components: 0,
      apiRoutes: 0,
      utils: 0
    };

    try {
      const files = await this.getAllFiles(dirPath);
      
      for (const file of files) {
        if (file.endsWith('.ts') || file.endsWith('.tsx')) {
          stats.totalFiles++;
          
          const content = await fs.promises.readFile(file, 'utf8');
          stats.linesOfCode += content.split('\n').length;
          
          if (file.includes('/components/')) stats.components++;
          if (file.includes('/api/') && file.endsWith('route.ts')) stats.apiRoutes++;
          if (file.includes('/utils/') || file.includes('/lib/')) stats.utils++;
        }
      }
    } catch (error) {
      console.log(`⚠️ Error analizando ${dirPath}`);
    }

    return stats;
  }

  async getAllFiles(dirPath, files = []) {
    try {
      const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          await this.getAllFiles(fullPath, files);
        } else if (entry.isFile()) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Directorio no accesible
    }
    
    return files;
  }

  calculateComplexity(stats) {
    // Algoritmo simple de complejidad basado en ratios
    const componentToFileRatio = stats.components / stats.totalFiles;
    const linesPerFile = stats.linesOfCode / stats.totalFiles;
    
    let complexity = 'Low';
    if (linesPerFile > 200 || componentToFileRatio < 0.3) complexity = 'Medium';
    if (linesPerFile > 400 || componentToFileRatio < 0.2) complexity = 'High';
    
    return complexity;
  }

  async analyzeSecurityPatterns() {
    console.log('\n🔒 Analizando patrones de seguridad...');
    
    const securityFiles = [
      'src/middleware/requireAuth.ts',
      'src/middleware/security.ts',
      'src/lib/auth'
    ];

    let securityScore = 0;
    const maxScore = 10;

    for (const file of securityFiles) {
      try {
        await fs.promises.access(file);
        securityScore += 2;
        console.log(`  ✅ ${file} - Presente`);
      } catch {
        console.log(`  ❌ ${file} - Faltante`);
      }
    }

    // Verificar APIs con autenticación
    const apiDir = path.join(process.cwd(), 'src/app/api');
    const protectedApis = await this.countProtectedApis(apiDir);
    securityScore += Math.min(protectedApis.score, 4);

    this.metrics.security = {
      score: securityScore,
      maxScore,
      percentage: Math.round((securityScore / maxScore) * 100),
      protectedApis: protectedApis.protected,
      totalApis: protectedApis.total
    };

    console.log(`  🛡️ APIs protegidas: ${protectedApis.protected}/${protectedApis.total}`);
    console.log(`  📊 Puntuación de seguridad: ${securityScore}/${maxScore}`);
  }

  async countProtectedApis(apiDir) {
    const result = { protected: 0, total: 0, score: 0 };
    
    try {
      const files = await this.getAllFiles(apiDir);
      const routeFiles = files.filter(f => f.endsWith('route.ts'));
      
      for (const file of routeFiles) {
        result.total++;
        
        const content = await fs.promises.readFile(file, 'utf8');
        const hasAuth = content.includes('requireAuth') || 
                       content.includes('withAuth') ||
                       content.includes('validateUserSession');
        
        if (hasAuth) result.protected++;
      }
      
      result.score = result.total > 0 ? (result.protected / result.total) * 4 : 0;
    } catch (error) {
      console.log('⚠️ Error analizando APIs');
    }
    
    return result;
  }

  async analyzePerformancePatterns() {
    console.log('\n⚡ Analizando patrones de performance...');
    
    let performanceScore = 0;
    const checks = [
      { file: 'next.config.cjs', pattern: 'optimization', points: 2 },
      { file: 'next.config.cjs', pattern: 'experimental', points: 1 },
      { file: 'next.config.cjs', pattern: 'splitChunks', points: 2 },
      { file: 'src', pattern: 'dynamic import', points: 1 },
      { file: 'src', pattern: 'lazy', points: 1 }
    ];

    for (const check of checks) {
      try {
        if (await this.fileContainsPattern(check.file, check.pattern)) {
          performanceScore += check.points;
          console.log(`  ✅ ${check.pattern} - Implementado`);
        } else {
          console.log(`  ⚠️ ${check.pattern} - No encontrado`);
        }
      } catch {
        console.log(`  ❌ ${check.pattern} - Error verificando`);
      }
    }

    this.metrics.performance = {
      score: performanceScore,
      maxScore: 7,
      percentage: Math.round((performanceScore / 7) * 100)
    };

    console.log(`  📊 Puntuación de performance: ${performanceScore}/7`);
  }

  async fileContainsPattern(filePath, pattern) {
    try {
      const fullPath = path.join(process.cwd(), filePath);
      const stat = await fs.promises.stat(fullPath);
      
      if (stat.isDirectory()) {
        const files = await this.getAllFiles(fullPath);
        for (const file of files) {
          const content = await fs.promises.readFile(file, 'utf8');
          if (content.toLowerCase().includes(pattern.toLowerCase())) {
            return true;
          }
        }
        return false;
      } else {
        const content = await fs.promises.readFile(fullPath, 'utf8');
        return content.toLowerCase().includes(pattern.toLowerCase());
      }
    } catch {
      return false;
    }
  }

  async analyzeArchitecture() {
    console.log('\n🏗️ Analizando arquitectura...');
    
    const architectureElements = [
      'src/components',
      'src/lib',
      'src/utils', 
      'src/middleware',
      'src/app/api',
      'src/types',
      'prisma'
    ];

    let architectureScore = 0;
    for (const element of architectureElements) {
      try {
        await fs.promises.access(element);
        architectureScore++;
        console.log(`  ✅ ${element} - Presente`);
      } catch {
        console.log(`  ❌ ${element} - Faltante`);
      }
    }

    this.metrics.architecture = {
      score: architectureScore,
      maxScore: architectureElements.length,
      percentage: Math.round((architectureScore / architectureElements.length) * 100)
    };

    console.log(`  📊 Puntuación de arquitectura: ${architectureScore}/${architectureElements.length}`);
  }

  async analyzeTestCoverage() {
    console.log('\n🧪 Analizando cobertura de tests...');
    
    const testDirs = ['tests', 'src/__tests__'];
    let testFiles = 0;
    
    for (const dir of testDirs) {
      try {
        const files = await this.getAllFiles(dir);
        testFiles += files.filter(f => f.includes('.test.') || f.includes('.spec.')).length;
      } catch {
        // Directorio no existe
      }
    }

    const testConfigs = ['vitest.config.ts', 'playwright.config.ts'];
    let configScore = 0;
    
    for (const config of testConfigs) {
      try {
        await fs.promises.access(config);
        configScore++;
      } catch {
        // Config no existe
      }
    }

    this.metrics.testing = {
      testFiles,
      configScore,
      maxConfigScore: testConfigs.length,
      testingFrameworks: configScore
    };

    console.log(`  📄 Archivos de test: ${testFiles}`);
    console.log(`  ⚙️ Configuraciones de test: ${configScore}/${testConfigs.length}`);
  }

  async analyzeDependencies() {
    console.log('\n📦 Analizando dependencias...');
    
    try {
      const packageJson = JSON.parse(await fs.promises.readFile('package.json', 'utf8'));
      
      const depCount = Object.keys(packageJson.dependencies || {}).length;
      const devDepCount = Object.keys(packageJson.devDependencies || {}).length;
      
      // Verificar dependencias críticas
      const criticalDeps = ['next', '@prisma/client', 'typescript', 'react'];
      const missingCritical = criticalDeps.filter(dep => 
        !packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]
      );

      this.metrics.dependencies = {
        total: depCount + devDepCount,
        production: depCount,
        development: devDepCount,
        missingCritical,
        hasCritical: missingCritical.length === 0
      };

      console.log(`  📦 Total dependencias: ${depCount + devDepCount}`);
      console.log(`  🏭 Producción: ${depCount}`);
      console.log(`  🛠️ Desarrollo: ${devDepCount}`);
      console.log(`  ⚠️ Críticas faltantes: ${missingCritical.length}`);
      
    } catch (error) {
      console.log('  ❌ Error analizando dependencias');
    }
  }

  async analyzeDocumentation() {
    console.log('\n📚 Analizando documentación...');
    
    const docFiles = ['README.md', 'CONTRIBUTING.md', 'DEPLOYMENT.md', 'API.md'];
    let docScore = 0;
    
    for (const doc of docFiles) {
      try {
        await fs.promises.access(doc);
        docScore++;
        console.log(`  ✅ ${doc} - Presente`);
      } catch {
        console.log(`  ❌ ${doc} - Faltante`);
      }
    }

    this.metrics.documentation = {
      score: docScore,
      maxScore: docFiles.length,
      percentage: Math.round((docScore / docFiles.length) * 100)
    };
  }

  generateQualityReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 REPORTE COMPLETO DE CALIDAD DEL PROYECTO');
    console.log('='.repeat(80));

    // Calcular puntuación general
    const weights = {
      security: 0.25,
      architecture: 0.20,
      performance: 0.15,
      testing: 0.15,
      documentation: 0.10,
      dependencies: 0.15
    };

    const scores = {
      security: this.metrics.security.percentage || 0,
      architecture: this.metrics.architecture.percentage || 0,
      performance: this.metrics.performance.percentage || 0,
      testing: Math.min(this.metrics.testing.testFiles * 10, 100),
      documentation: this.metrics.documentation.percentage || 0,
      dependencies: this.metrics.dependencies?.hasCritical ? 100 : 70
    };

    const overallScore = Math.round(
      Object.entries(weights).reduce((total, [category, weight]) => {
        return total + (scores[category] * weight);
      }, 0)
    );

    // Mostrar métricas detalladas
    console.log('\n📊 MÉTRICAS DETALLADAS:');
    console.log(`  🔒 Seguridad: ${scores.security}%`);
    console.log(`  🏗️ Arquitectura: ${scores.architecture}%`);
    console.log(`  ⚡ Performance: ${scores.performance}%`);
    console.log(`  🧪 Testing: ${scores.testing}%`);
    console.log(`  📚 Documentación: ${scores.documentation}%`);
    console.log(`  📦 Dependencias: ${scores.dependencies}%`);

    console.log(`\n🎯 PUNTUACIÓN GENERAL: ${overallScore}%`);

    // Clasificación de calidad
    let qualityLevel, recommendation, icon;
    if (overallScore >= 90) {
      qualityLevel = 'EXCELENTE';
      recommendation = 'Proyecto listo para producción empresarial';
      icon = '🏆';
    } else if (overallScore >= 80) {
      qualityLevel = 'BUENO';
      recommendation = 'Proyecto sólido, algunas mejoras recomendadas';
      icon = '✅';
    } else if (overallScore >= 70) {
      qualityLevel = 'ACEPTABLE';
      recommendation = 'Proyecto funcional, necesita optimizaciones';
      icon = '⚠️';
    } else {
      qualityLevel = 'NECESITA MEJORAS';
      recommendation = 'Requiere trabajo significativo antes de producción';
      icon = '❌';
    }

    console.log(`\n${icon} NIVEL DE CALIDAD: ${qualityLevel}`);
    console.log(`💡 RECOMENDACIÓN: ${recommendation}`);

    // Áreas de mejora
    console.log('\n🔧 ÁREAS DE MEJORA PRIORITARIAS:');
    const improvements = Object.entries(scores)
      .filter(([, score]) => score < 80)
      .sort(([, a], [, b]) => a - b)
      .slice(0, 3);

    if (improvements.length === 0) {
      console.log('  🎉 ¡No se identificaron áreas críticas de mejora!');
    } else {
      improvements.forEach(([area, score], index) => {
        console.log(`  ${index + 1}. ${area}: ${score}% - Necesita atención`);
      });
    }

    // Puntos fuertes
    console.log('\n💪 PUNTOS FUERTES:');
    const strengths = Object.entries(scores)
      .filter(([, score]) => score >= 85)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    if (strengths.length === 0) {
      console.log('  ⚠️ No se identificaron fortalezas destacadas');
    } else {
      strengths.forEach(([area, score], index) => {
        console.log(`  ${index + 1}. ${area}: ${score}% - Excelente implementación`);
      });
    }

    console.log('\n📈 MÉTRICAS DE CÓDIGO:');
    if (this.metrics.codeQuality.totalFiles) {
      console.log(`  📁 Archivos totales: ${this.metrics.codeQuality.totalFiles}`);
      console.log(`  📄 Líneas de código: ${this.metrics.codeQuality.linesOfCode}`);
      console.log(`  🧩 Componentes: ${this.metrics.codeQuality.componentsCount}`);
      console.log(`  🔌 API Routes: ${this.metrics.codeQuality.apiRoutesCount}`);
      console.log(`  📊 Complejidad: ${this.metrics.codeQuality.complexity}`);
    }

    console.log('\n🚀 SIGUIENTE ACCIÓN RECOMENDADA:');
    if (overallScore >= 85) {
      console.log('  ✅ Proceder con deploy a producción');
    } else {
      console.log('  🔧 Abordar las áreas de mejora identificadas');
    }

    return {
      overallScore,
      qualityLevel,
      metrics: this.metrics,
      scores,
      ready: overallScore >= 80
    };
  }
}

// Ejecutar análisis
const analyzer = new ProjectQualityAnalyzer();
analyzer.analyzeProject().catch(console.error);
