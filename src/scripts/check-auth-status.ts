// src/scripts/check-auth-status.ts
import fs from 'fs/promises';
import path from 'path';

interface AuthStatus {
  file: string;
  hasAuth: boolean;
  hasTemporaryAuth: boolean;
  authType: 'unified' | 'legacy' | 'hardcoded' | 'none';
  notes: string[];
}

async function findApiFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        const subFiles = await findApiFiles(fullPath);
        files.push(...subFiles);
      } else if (entry.name === 'route.ts') {
        files.push(fullPath);
      }
    }
  } catch {
    // Directorio no existe, ignorar
  }
  
  return files;
}



function analyzeFileContent(content: string): Partial<AuthStatus> {
  const analysis: Partial<AuthStatus> = {
    hasAuth: false,
    hasTemporaryAuth: false,
    authType: 'none',
    notes: []
  };

  // Verificar autenticación temporal
  if (content.includes('TEMPORARILY NO AUTH') || content.includes('hardcoded auth')) {
    analysis.hasTemporaryAuth = true;
    analysis.authType = 'hardcoded';
    analysis.notes!.push('⚠️ Autenticación temporal/hardcoded detectada');
  }

  // Verificar middleware unificado
  if (content.includes('unified-middleware')) {
    analysis.hasAuth = true;
    analysis.authType = 'unified';
    analysis.notes!.push('✅ Usando middleware unificado');
  } else if (content.includes('getCurrentUser') || content.includes('auth/middleware')) {
    analysis.hasAuth = true;
    analysis.authType = 'legacy';
    analysis.notes!.push('🔄 Usando sistema legacy');
  } else if (content.includes('requireAuth') || content.includes('withAuth')) {
    analysis.hasAuth = true;
    analysis.authType = 'unified';
    analysis.notes!.push('✅ Usando autenticación moderna');
  }

  return analysis;
}

async function checkAuthStatus(): Promise<AuthStatus[]> {
  console.log('🔍 Escaneando estado de autenticación en APIs...\n');
  
  const apiDir = path.join(process.cwd(), 'src/app/api');
  const apiFiles = await findApiFiles(apiDir);
  const results: AuthStatus[] = [];

  for (const file of apiFiles) {
    const content = await fs.readFile(file, 'utf-8');
    const relativePath = path.relative(process.cwd(), file);
    
    const analysis = analyzeFileContent(content);
    
    const status: AuthStatus = {
      file: relativePath,
      hasAuth: analysis.hasAuth || false,
      hasTemporaryAuth: analysis.hasTemporaryAuth || false,
      authType: analysis.authType || 'none',
      notes: analysis.notes || []
    };

    // Verificar rutas protegidas
    const protectedPaths = ['/api/admin/', '/api/users/', '/api/staff/', '/api/business/'];
    const isProtected = protectedPaths.some(p => relativePath.includes(p));
    
    if (isProtected && !status.hasAuth && !status.hasTemporaryAuth) {
      status.notes.push('❌ Ruta protegida sin autenticación');
    }

    // Verificar rutas públicas
    const publicPaths = ['/api/auth/', '/api/cliente/', '/api/portal/', '/api/health/'];
    const isPublic = publicPaths.some(p => relativePath.includes(p));
    
    if (isPublic && !status.hasAuth) {
      status.notes.push('🌐 Ruta pública (correcto)');
    }

    results.push(status);
  }

  return results;
}

async function generateReport(results: AuthStatus[]) {
  console.log('📊 REPORTE DE ESTADO DE AUTENTICACIÓN\n');
  console.log('=' .repeat(60));

  const total = results.length;
  const withAuth = results.filter(r => r.hasAuth).length;
  const withTempAuth = results.filter(r => r.hasTemporaryAuth).length;
  const withoutAuth = total - withAuth - withTempAuth;

  console.log(`\n📈 RESUMEN:`);
  console.log(`Total de APIs: ${total}`);
  console.log(`Con autenticación: ${withAuth}`);
  console.log(`Autenticación temporal: ${withTempAuth}`);
  console.log(`Sin autenticación: ${withoutAuth}`);

  // Problemas críticos
  const critical = results.filter(r => 
    r.hasTemporaryAuth || r.notes.some(n => n.includes('❌'))
  );

  if (critical.length > 0) {
    console.log(`\n🚨 PROBLEMAS CRÍTICOS (${critical.length}):`);
    critical.forEach(r => {
      console.log(`\n${r.file}:`);
      r.notes.forEach(note => console.log(`  ${note}`));
    });
  }

  console.log('\n' + '=' .repeat(60));
}

// Ejecutar si es llamado directamente
checkAuthStatus()
  .then(generateReport)
  .catch(error => {
    console.error('Error analizando autenticación:', error);
    process.exit(1);
  });

export { checkAuthStatus, generateReport };
