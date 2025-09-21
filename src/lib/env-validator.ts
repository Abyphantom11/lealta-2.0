/**
 * 🛡️ VALIDADOR DE VARIABLES DE ENTORNO
 * Garantiza que todas las variables críticas estén configuradas correctamente
 */

interface EnvConfig {
  [key: string]: {
    required: boolean;
    description: string;
    defaultValue?: string;
    validate?: (value: string) => boolean;
  };
}

const ENV_CONFIG: EnvConfig = {
  // 🔑 Base de datos (CRÍTICO)
  DATABASE_URL: {
    required: true,
    description: 'URL de conexión a la base de datos',
    validate: (value) => value.includes('postgresql') || value.includes('file:'),
  },
  
  // 🔑 Autenticación (CRÍTICO)
  NEXTAUTH_SECRET: {
    required: true,
    description: 'Secreto para NextAuth.js',
    validate: (value) => value.length >= 32,
  },
  AUTH_SECRET: {
    required: true,
    description: 'Secreto para autenticación',
    validate: (value) => value.length >= 32,
  },
  NEXTAUTH_URL: {
    required: true,
    description: 'URL base de la aplicación',
    validate: (value) => value.startsWith('http'),
  },
  
  // 🔑 Rate Limiting (OPCIONAL EN DEV)
  UPSTASH_REDIS_REST_URL: {
    required: process.env.NODE_ENV === 'production',
    description: 'URL de Upstash Redis para rate limiting',
    validate: (value) => value.startsWith('https://'),
  },
  UPSTASH_REDIS_REST_TOKEN: {
    required: process.env.NODE_ENV === 'production',
    description: 'Token de Upstash Redis',
  },
  
  // 🔑 APIs externas (OPCIONALES)
  GOOGLE_GEMINI_API_KEY: {
    required: false,
    description: 'API Key de Google Gemini para IA',
  },
  RESEND_API_KEY: {
    required: false,
    description: 'API Key de Resend para emails',
  },
  
  // 🔑 Monitoreo y errores (RECOMENDADO PARA PRODUCCIÓN)
  NEXT_PUBLIC_SENTRY_DSN: {
    required: process.env.NODE_ENV === 'production',
    description: 'DSN de Sentry para monitoreo de errores',
    validate: (value) => value.startsWith('https://') && value.includes('sentry.io'),
  },
  
  // 🔑 Monitoring y Analytics (OPCIONALES)
  SENTRY_DSN: {
    required: false,
    description: 'DSN de Sentry para monitoreo de errores (servidor)',
  },
  NEXT_PUBLIC_SENTRY_DSN: {
    required: false,
    description: 'DSN de Sentry para monitoreo de errores (cliente)',
  },
  
  // 🔑 Configuración de aplicación
  NODE_ENV: {
    required: true,
    description: 'Entorno de ejecución',
    defaultValue: 'development',
    validate: (value) => ['development', 'production', 'test'].includes(value),
  },
  NEXT_PUBLIC_APP_URL: {
    required: true,
    description: 'URL pública de la aplicación',
    validate: (value) => value.startsWith('http'),
  },
  NEXT_PUBLIC_APP_NAME: {
    required: true,
    description: 'Nombre de la aplicación',
    defaultValue: 'Lealta',
  },
};

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missing: string[];
  summary: {
    total: number;
    configured: number;
    missing: number;
    invalid: number;
  };
}

export function validateEnvironmentVariables(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missing: string[] = [];
  
  let configured = 0;
  let invalid = 0;
  
  console.log('🔍 Validando variables de entorno...');
  
  Object.entries(ENV_CONFIG).forEach(([key, config]) => {
    const value = process.env[key];
    
    // Verificar si la variable está definida
    if (!value) {
      if (config.required) {
        missing.push(key);
        errors.push(`❌ ${key}: ${config.description} (REQUERIDA)`);
      } else if (config.defaultValue) {
        warnings.push(`⚠️ ${key}: Usando valor por defecto '${config.defaultValue}'`);
        configured++;
      } else {
        warnings.push(`⚠️ ${key}: ${config.description} (opcional)`);
      }
      return;
    }
    
    configured++;
    
    // Validar formato si se proporciona validador
    if (config.validate && !config.validate(value)) {
      invalid++;
      errors.push(`❌ ${key}: Formato inválido - ${config.description}`);
      return;
    }
    
    console.log(`✅ ${key}: Configurada correctamente`);
  });
  
  const result: ValidationResult = {
    isValid: errors.length === 0,
    errors,
    warnings,
    missing,
    summary: {
      total: Object.keys(ENV_CONFIG).length,
      configured,
      missing: missing.length,
      invalid,
    }
  };
  
  // Log del resultado
  console.log('\n📊 RESUMEN DE VARIABLES DE ENTORNO:');
  console.log(`Total: ${result.summary.total}`);
  console.log(`Configuradas: ${result.summary.configured}`);
  console.log(`Faltantes: ${result.summary.missing}`);
  console.log(`Inválidas: ${result.summary.invalid}`);
  
  if (result.warnings.length > 0) {
    console.log('\n⚠️ ADVERTENCIAS:');
    result.warnings.forEach(warning => console.log(warning));
  }
  
  if (result.errors.length > 0) {
    console.log('\n❌ ERRORES:');
    result.errors.forEach(error => console.log(error));
  }
  
  return result;
}

export function getEnvironmentStatus(): 'development' | 'production' | 'test' {
  return (process.env.NODE_ENV as any) || 'development';
}

export function isProductionReady(): boolean {
  const validation = validateEnvironmentVariables();
  const requiredForProduction = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET', 
    'AUTH_SECRET',
    'NEXTAUTH_URL',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN'
  ];
  
  return requiredForProduction.every(key => process.env[key]);
}

// Validación automática al importar (solo en servidor)
if (typeof window === 'undefined') {
  const validation = validateEnvironmentVariables();
  
  if (!validation.isValid && process.env.NODE_ENV === 'production') {
    console.error('🚨 CRITICAL: Environment variables validation failed in production!');
    console.error('Missing or invalid variables:', validation.errors);
    
    // En producción, terminar la aplicación si falta algo crítico
    if (validation.missing.length > 0) {
      console.error('🛑 Application cannot start with missing required environment variables');
      process.exit(1);
    }
  }
}

const envValidator = {
  validate: validateEnvironmentVariables,
  getStatus: getEnvironmentStatus,
  isProductionReady,
  config: ENV_CONFIG,
};

export default envValidator;
