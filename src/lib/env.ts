/**
 * Validación centralizada de variables de entorno
 * Garantiza que todas las env vars críticas estén disponibles en producción
 */

interface EnvConfig {
  // Base
  NODE_ENV: string;
  NEXT_PUBLIC_BASE_URL?: string;
  
  // Database
  DATABASE_URL?: string;
  
  // Auth
  NEXTAUTH_SECRET?: string;
  NEXTAUTH_URL?: string;
  
  // AI Services
  GOOGLE_GEMINI_API_KEY?: string;
  GOOGLE_AI_API_KEY?: string;
  
  // Rate Limiting
  RATE_LIMIT_MAX_REQUESTS?: string;
  RATE_LIMIT_WINDOW_MS?: string;
}

class EnvValidator {
  private static instance: EnvValidator;
  private validated = false;
  
  static getInstance(): EnvValidator {
    if (!EnvValidator.instance) {
      EnvValidator.instance = new EnvValidator();
    }
    return EnvValidator.instance;
  }
  
  /**
   * Valida variables de entorno críticas
   * @throws Error si faltan variables críticas en producción
   */
  validate(): EnvConfig {
    if (this.validated) {
      return process.env as EnvConfig;
    }
    
    const env = process.env as EnvConfig;
    const isProduction = env.NODE_ENV === 'production';
    const missing: string[] = [];
    
    // Variables críticas en producción
    if (isProduction) {
      if (!env.NEXTAUTH_SECRET) missing.push('NEXTAUTH_SECRET');
      if (!env.NEXTAUTH_URL) missing.push('NEXTAUTH_URL');
      if (!env.DATABASE_URL) missing.push('DATABASE_URL');
    }
    
    if (missing.length > 0) {
      throw new Error(
        `🚨 Variables de entorno críticas faltantes en producción: ${missing.join(', ')}`
      );
    }
    
    this.validated = true;
    return env;
  }
  
  /**
   * Obtiene una variable de entorno con fallback seguro
   */
  get<K extends keyof EnvConfig>(key: K, fallback?: string): string {
    const env = this.validate();
    return env[key] || fallback || '';
  }
  
  /**
   * Obtiene API key de Gemini con validación
   */
  getGeminiApiKey(): string | null {
    const env = this.validate();
    const apiKey = env.GOOGLE_GEMINI_API_KEY || env.GOOGLE_AI_API_KEY;
    
    if (!apiKey && env.NODE_ENV === 'production') {
      console.warn('⚠️ Google Gemini API key no configurada en producción');
    }
    
    return apiKey || null;
  }
  
  /**
   * Obtiene configuración de rate limiting con defaults seguros
   */
  getRateLimitConfig() {
    const env = this.validate();
    return {
      maxRequests: parseInt(env.RATE_LIMIT_MAX_REQUESTS || '100'),
      windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutos
    };
  }
  
  /**
   * Obtiene base URL con fallback inteligente
   */
  getBaseUrl(): string {
    const env = this.validate();
    return env.NEXT_PUBLIC_BASE_URL || 
           (env.NODE_ENV === 'production' ? 'https://your-domain.com' : 'http://localhost:3001');
  }
}

// Instancia singleton
const envValidator = EnvValidator.getInstance();

// Exportar funciones de utilidad
export const validateEnv = () => envValidator.validate();
export const getEnv = <K extends keyof EnvConfig>(key: K, fallback?: string) => 
  envValidator.get(key, fallback);
export const getGeminiApiKey = () => envValidator.getGeminiApiKey();
export const getRateLimitConfig = () => envValidator.getRateLimitConfig();
export const getBaseUrl = () => envValidator.getBaseUrl();

export default envValidator;
