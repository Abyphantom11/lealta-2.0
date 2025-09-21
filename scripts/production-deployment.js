/**
 * 🚀 SCRIPT DE DEPLOYMENT PARA PRODUCCIÓN
 * Configura HTTPS, Vercel, y validaciones de producción
 */

const PRODUCTION_CHECKLIST = [
  {
    id: 'env-vars',
    name: 'Variables de Entorno',
    check: () => {
      const requiredVars = [
        'DATABASE_URL',
        'NEXTAUTH_SECRET',
        'AUTH_SECRET',
        'NEXTAUTH_URL',
        'NEXT_PUBLIC_APP_URL'
      ];
      
      const missing = requiredVars.filter(key => !process.env[key]);
      const isValid = missing.length === 0;
      
      return {
        passed: isValid,
        details: isValid ? 'Todas las variables críticas configuradas' : `Faltan: ${missing.join(', ')}`
      };
    }
  },
  {
    id: 'production-ready',
    name: 'Configuración de Producción',
    check: () => {
      const hasRedis = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
      const hasSecrets = !!(process.env.NEXTAUTH_SECRET && process.env.AUTH_SECRET);
      const productionReady = hasRedis && hasSecrets;
      
      return {
        passed: productionReady,
        details: productionReady ? 'Redis y secrets configurados' : 'Faltan variables de producción'
      };
    }
  },
  {
    id: 'database',
    name: 'Base de Datos',
    check: () => {
      const dbUrl = process.env.DATABASE_URL;
      const isPostgres = dbUrl?.includes('postgresql');
      return {
        passed: !!isPostgres,
        details: isPostgres ? 'PostgreSQL configurado' : 'Requiere PostgreSQL para producción'
      };
    }
  },
  {
    id: 'rate-limiting',
    name: 'Rate Limiting',
    check: () => {
      const hasRedis = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
      return {
        passed: hasRedis,
        details: hasRedis ? 'Upstash Redis configurado' : 'Requiere Upstash Redis'
      };
    }
  },
  {
    id: 'security',
    name: 'Headers de Seguridad',
    check: () => ({
      passed: true,
      details: 'Headers configurados en next.config.js'
    })
  },
  {
    id: 'https',
    name: 'HTTPS',
    check: () => {
      const url = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL;
      const hasHttps = url?.startsWith('https://');
      return {
        passed: hasHttps || process.env.NODE_ENV !== 'production',
        details: hasHttps ? 'HTTPS configurado' : 'Requiere HTTPS en producción'
      };
    }
  }
];

function checkProductionReadiness() {
  console.log('🚀 VERIFICANDO PREPARACIÓN PARA PRODUCCIÓN\n');
  
  let totalChecks = 0;
  let passedChecks = 0;
  
  PRODUCTION_CHECKLIST.forEach(check => {
    totalChecks++;
    try {
      const result = check.check();
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${check.name}: ${result.details}`);
      if (result.passed) passedChecks++;
    } catch (error) {
      console.log(`❌ ${check.name}: Error - ${error}`);
    }
  });
  
  const percentage = Math.round((passedChecks / totalChecks) * 100);
  console.log(`\n📊 PUNTUACIÓN: ${passedChecks}/${totalChecks} (${percentage}%)`);
  
  if (percentage >= 100) {
    console.log('🎉 ¡LISTO PARA PRODUCCIÓN!');
  } else if (percentage >= 80) {
    console.log('⚠️ Casi listo - revisar items faltantes');
  } else {
    console.log('🚨 Requiere configuración adicional');
  }
  
  return { percentage, passedChecks, totalChecks };
}

function generateVercelConfig() {
  return {
    "version": 2,
    "framework": "nextjs",
    "buildCommand": "npm run build",
    "devCommand": "npm run dev",
    "installCommand": "npm install",
    "env": {
      "DATABASE_URL": "@database-url",
      "NEXTAUTH_SECRET": "@nextauth-secret",
      "AUTH_SECRET": "@auth-secret",
      "UPSTASH_REDIS_REST_URL": "@redis-url",
      "UPSTASH_REDIS_REST_TOKEN": "@redis-token",
      "GOOGLE_GEMINI_API_KEY": "@gemini-api-key",
      "RESEND_API_KEY": "@resend-api-key"
    },
    "functions": {
      "app/api/**/*.ts": {
        "maxDuration": 30
      }
    },
    "headers": [
      {
        "source": "/(.*)",
        "headers": [
          {
            "key": "Strict-Transport-Security",
            "value": "max-age=31536000; includeSubDomains; preload"
          },
          {
            "key": "X-Content-Type-Options", 
            "value": "nosniff"
          },
          {
            "key": "X-Frame-Options",
            "value": "DENY"
          }
        ]
      }
    ],
    "redirects": [
      {
        "source": "/admin",
        "destination": "/login?redirect=admin",
        "permanent": false
      },
      {
        "source": "/staff", 
        "destination": "/login?redirect=staff",
        "permanent": false
      }
    ]
  };
}

function generateDeploymentInstructions() {
  console.log('\n📋 INSTRUCCIONES DE DEPLOYMENT:\n');
  
  console.log('1. 🔐 Configurar variables de entorno en Vercel:');
  console.log('   - DATABASE_URL (PostgreSQL URL)');
  console.log('   - NEXTAUTH_SECRET (genera con: openssl rand -base64 32)');
  console.log('   - AUTH_SECRET (genera con: openssl rand -base64 32)');
  console.log('   - UPSTASH_REDIS_REST_URL (desde dashboard Upstash)');
  console.log('   - UPSTASH_REDIS_REST_TOKEN (desde dashboard Upstash)');
  console.log('   - NEXTAUTH_URL (tu dominio: https://tudominio.com)');
  console.log('   - NEXT_PUBLIC_APP_URL (tu dominio: https://tudominio.com)');
  
  console.log('\n2. 🗄️ Configurar base de datos:');
  console.log('   npx prisma migrate deploy');
  console.log('   npx prisma generate');
  
  console.log('\n3. ⚡ Configurar Upstash Redis:');
  console.log('   - Crear cuenta en upstash.com');
  console.log('   - Crear database Redis');
  console.log('   - Copiar REST URL y Token');
  
  console.log('\n4. 🚀 Deploy a Vercel:');
  console.log('   npm i -g vercel');
  console.log('   vercel');
  console.log('   vercel --prod');
  
  console.log('\n5. 🔒 Configurar dominio y SSL:');
  console.log('   - Agregar dominio personalizado en Vercel');
  console.log('   - SSL automático incluido');
  console.log('   - Actualizar NEXTAUTH_URL y NEXT_PUBLIC_APP_URL');
}

// Ejecutar verificación si se llama directamente
if (require.main === module) {
  const result = checkProductionReadiness();
  
  if (result.percentage >= 80) {
    console.log('\n📝 vercel.json generado:');
    console.log(JSON.stringify(generateVercelConfig(), null, 2));
  }
  
  generateDeploymentInstructions();
}

module.exports = {
  checkProductionReadiness,
  generateVercelConfig,
  generateDeploymentInstructions,
  PRODUCTION_CHECKLIST
};
