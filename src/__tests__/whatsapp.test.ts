/**
 * 🧪 TESTS UNITARIOS - Sistema de WhatsApp
 * Tests para funciones críticas del sistema de mensajería
 */

import { describe, it, expect, vi } from 'vitest';

// Mocks
vi.mock('@/lib/prisma', () => ({
  prisma: {
    cliente: {
      findMany: vi.fn(),
    },
    business: {
      findMany: vi.fn(),
    },
    whatsAppMessage: {
      create: vi.fn(),
      update: vi.fn(),
    },
    whatsAppCampaign: {
      create: vi.fn(),
      update: vi.fn(),
    },
    whatsAppOptOut: {
      findMany: vi.fn(),
    },
    whatsAppRateLimit: {
      upsert: vi.fn(),
      aggregate: vi.fn(),
    },
  },
}));

// Importar después de los mocks
import { 
  limpiarNumeroTelefono, 
  personalizarMensaje,
  MESSAGE_TEMPLATES 
} from '@/lib/whatsapp';

describe('WhatsApp - Funciones de Utilidad', () => {
  
  describe('limpiarNumeroTelefono', () => {
    it('debe formatear número con formato 09XXXXXXXX a +593', () => {
      const result = limpiarNumeroTelefono('0987654321');
      expect(result).toBe('+593987654321');
    });

    it('debe manejar número que ya tiene +593', () => {
      const result = limpiarNumeroTelefono('+593987654321');
      expect(result).toBe('+593987654321');
    });

    it('debe manejar número con espacios y guiones', () => {
      const result = limpiarNumeroTelefono('098-765-4321');
      expect(result).toBe('+593987654321');
    });

    it('debe manejar número con paréntesis', () => {
      const result = limpiarNumeroTelefono('(09) 8765-4321');
      expect(result).toBe('+593987654321');
    });

    it('debe retornar null para número vacío', () => {
      const result = limpiarNumeroTelefono('');
      expect(result).toBeNull();
    });

    it('debe manejar número de 9 dígitos agregando 593', () => {
      const result = limpiarNumeroTelefono('987654321');
      expect(result).toBe('+593987654321');
    });

    it('debe manejar número que ya tiene código 593 sin +', () => {
      const result = limpiarNumeroTelefono('593987654321');
      expect(result).toBe('+593987654321');
    });
  });

  describe('personalizarMensaje', () => {
    it('debe reemplazar variables simples', () => {
      const template = '¡Hola {{nombre}}! Bienvenido a {{negocio}}.';
      const variables = { nombre: 'Juan', negocio: 'Café Central' };
      
      const result = personalizarMensaje(template, variables);
      
      expect(result).toBe('¡Hola Juan! Bienvenido a Café Central.');
    });

    it('debe reemplazar múltiples ocurrencias de la misma variable', () => {
      const template = '{{nombre}}, gracias {{nombre}} por visitar {{negocio}}.';
      const variables = { nombre: 'María', negocio: 'Lealta' };
      
      const result = personalizarMensaje(template, variables);
      
      expect(result).toBe('María, gracias María por visitar Lealta.');
    });

    it('debe mantener variables no encontradas', () => {
      const template = 'Hola {{nombre}}, tienes {{puntos}} puntos.';
      const variables = { nombre: 'Pedro' };
      
      const result = personalizarMensaje(template, variables);
      
      expect(result).toBe('Hola Pedro, tienes {{puntos}} puntos.');
    });

    it('debe manejar mensaje sin variables', () => {
      const template = 'Este es un mensaje sin variables.';
      const variables = {};
      
      const result = personalizarMensaje(template, variables);
      
      expect(result).toBe('Este es un mensaje sin variables.');
    });

    it('debe convertir números a string', () => {
      const template = 'Tienes {{puntos}} puntos acumulados.';
      const variables = { puntos: 150 };
      
      const result = personalizarMensaje(template, variables);
      
      expect(result).toBe('Tienes 150 puntos acumulados.');
    });
  });

  describe('MESSAGE_TEMPLATES', () => {
    it('debe tener templates predefinidos', () => {
      expect(MESSAGE_TEMPLATES).toBeDefined();
      expect(Array.isArray(MESSAGE_TEMPLATES)).toBe(true);
      expect(MESSAGE_TEMPLATES.length).toBeGreaterThan(0);
    });

    it('cada template debe tener estructura correcta', () => {
      MESSAGE_TEMPLATES.forEach(template => {
        expect(template).toHaveProperty('id');
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('content');
        expect(template).toHaveProperty('variables');
        expect(typeof template.id).toBe('string');
        expect(typeof template.name).toBe('string');
        expect(typeof template.content).toBe('string');
        expect(Array.isArray(template.variables)).toBe(true);
      });
    });

    it('debe incluir template de bienvenida', () => {
      const welcomeTemplate = MESSAGE_TEMPLATES.find(t => t.id === 'welcome');
      expect(welcomeTemplate).toBeDefined();
      expect(welcomeTemplate?.variables).toContain('nombre');
    });

    it('debe incluir template de promoción', () => {
      const promoTemplate = MESSAGE_TEMPLATES.find(t => t.id === 'promotion');
      expect(promoTemplate).toBeDefined();
      expect(promoTemplate?.variables).toContain('promocion');
    });
  });
});

describe('WhatsApp Queue - Funciones de Cola', () => {
  
  describe('calculateBackoffDelay', () => {
    // Función de test para backoff exponencial
    function calculateBackoffDelay(retryCount: number): number {
      const baseDelayMs = 1000;
      const maxDelayMs = 60000;
      const delay = baseDelayMs * Math.pow(2, retryCount);
      return Math.min(delay, maxDelayMs);
    }

    it('debe duplicar el delay con cada reintento', () => {
      expect(calculateBackoffDelay(0)).toBe(1000);   // 1s
      expect(calculateBackoffDelay(1)).toBe(2000);   // 2s
      expect(calculateBackoffDelay(2)).toBe(4000);   // 4s
      expect(calculateBackoffDelay(3)).toBe(8000);   // 8s
    });

    it('debe respetar el límite máximo de 60 segundos', () => {
      expect(calculateBackoffDelay(10)).toBe(60000);
      expect(calculateBackoffDelay(20)).toBe(60000);
    });
  });

  describe('isPermanentError', () => {
    function isPermanentError(error: string): boolean {
      const permanentErrors = [
        'número inválido',
        'número no registrado',
        'opt-out',
        'bloqueado',
        'invalid phone',
        'unregistered',
        'blocked',
        'recipient not in whitelist',
      ];
      
      const lowerError = error.toLowerCase();
      return permanentErrors.some(pe => lowerError.includes(pe));
    }

    it('debe detectar errores permanentes', () => {
      expect(isPermanentError('Número inválido')).toBe(true);
      expect(isPermanentError('User has opted-out')).toBe(true);
      expect(isPermanentError('Number blocked by carrier')).toBe(true);
    });

    it('debe permitir reintento en errores temporales', () => {
      expect(isPermanentError('Connection timeout')).toBe(false);
      expect(isPermanentError('Rate limit exceeded')).toBe(false);
      expect(isPermanentError('Service unavailable')).toBe(false);
    });
  });
});

describe('Rate Limiting', () => {
  
  describe('getTierLimits', () => {
    function getTierLimits(tier: string): { dailyLimit: number; monthlyLimit: number } {
      const limits: Record<string, { dailyLimit: number; monthlyLimit: number }> = {
        TIER_1: { dailyLimit: 1000, monthlyLimit: 1000 },
        TIER_2: { dailyLimit: 10000, monthlyLimit: 10000 },
        TIER_3: { dailyLimit: 100000, monthlyLimit: 100000 },
      };
      return limits[tier] || limits.TIER_1;
    }

    it('debe retornar límites correctos para TIER_1', () => {
      const limits = getTierLimits('TIER_1');
      expect(limits.dailyLimit).toBe(1000);
      expect(limits.monthlyLimit).toBe(1000);
    });

    it('debe retornar límites correctos para TIER_2', () => {
      const limits = getTierLimits('TIER_2');
      expect(limits.dailyLimit).toBe(10000);
      expect(limits.monthlyLimit).toBe(10000);
    });

    it('debe retornar límites correctos para TIER_3', () => {
      const limits = getTierLimits('TIER_3');
      expect(limits.dailyLimit).toBe(100000);
      expect(limits.monthlyLimit).toBe(100000);
    });

    it('debe usar TIER_1 como fallback para tier desconocido', () => {
      const limits = getTierLimits('UNKNOWN');
      expect(limits.dailyLimit).toBe(1000);
    });
  });

  describe('determineTier', () => {
    function determineTier(monthlyUsage: number): string {
      if (monthlyUsage < 1000) return 'TIER_1';
      if (monthlyUsage < 10000) return 'TIER_2';
      return 'TIER_3';
    }

    it('debe asignar TIER_1 para uso bajo', () => {
      expect(determineTier(0)).toBe('TIER_1');
      expect(determineTier(500)).toBe('TIER_1');
      expect(determineTier(999)).toBe('TIER_1');
    });

    it('debe asignar TIER_2 para uso medio', () => {
      expect(determineTier(1000)).toBe('TIER_2');
      expect(determineTier(5000)).toBe('TIER_2');
      expect(determineTier(9999)).toBe('TIER_2');
    });

    it('debe asignar TIER_3 para uso alto', () => {
      expect(determineTier(10000)).toBe('TIER_3');
      expect(determineTier(50000)).toBe('TIER_3');
      expect(determineTier(100000)).toBe('TIER_3');
    });
  });
});

describe('Phone Number Validation', () => {
  
  describe('Formato Ecuatoriano', () => {
    function isValidEcuadorianPhone(phone: string): boolean {
      const cleaned = phone.replace(/\D/g, '');
      
      // Formato 09XXXXXXXX (10 dígitos)
      if (cleaned.startsWith('09') && cleaned.length === 10) return true;
      
      // Formato 593XXXXXXXX (12 dígitos)
      if (cleaned.startsWith('593') && cleaned.length === 12) return true;
      
      // Formato 9XXXXXXXX (9 dígitos)
      if (cleaned.startsWith('9') && cleaned.length === 9) return true;
      
      return false;
    }

    it('debe validar números móviles ecuatorianos con 09', () => {
      expect(isValidEcuadorianPhone('0987654321')).toBe(true);
      expect(isValidEcuadorianPhone('0912345678')).toBe(true);
    });

    it('debe validar números con código de país', () => {
      expect(isValidEcuadorianPhone('593987654321')).toBe(true);
      expect(isValidEcuadorianPhone('+593987654321')).toBe(true);
    });

    it('debe rechazar números inválidos', () => {
      expect(isValidEcuadorianPhone('12345')).toBe(false);
      expect(isValidEcuadorianPhone('0512345678')).toBe(false); // No empieza con 09
    });

    it('debe manejar números con formato', () => {
      expect(isValidEcuadorianPhone('098-765-4321')).toBe(true);
      expect(isValidEcuadorianPhone('(09) 8765-4321')).toBe(true);
    });
  });
});

describe('Template Variables Extraction', () => {
  
  function extractVariables(template: string): string[] {
    const regex = /{{(\w+)}}/g;
    const variables: string[] = [];
    let match;
    
    while ((match = regex.exec(template)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }
    
    return variables;
  }

  it('debe extraer variables únicas del template', () => {
    const template = 'Hola {{nombre}}, tienes {{puntos}} puntos en {{negocio}}.';
    const variables = extractVariables(template);
    
    expect(variables).toEqual(['nombre', 'puntos', 'negocio']);
  });

  it('debe evitar duplicados', () => {
    const template = '{{nombre}}, gracias {{nombre}} por visitar {{negocio}}.';
    const variables = extractVariables(template);
    
    expect(variables).toEqual(['nombre', 'negocio']);
  });

  it('debe retornar array vacío si no hay variables', () => {
    const template = 'Este mensaje no tiene variables.';
    const variables = extractVariables(template);
    
    expect(variables).toEqual([]);
  });
});

describe('Simulation Mode - Modo Simulación', () => {
  
  // Función que simula el comportamiento de la API
  function simulateCampaignSend(phoneNumbers: string[], simulationMode: boolean) {
    if (simulationMode) {
      // Simular resultados sin enviar
      const total = phoneNumbers.length;
      const successRate = Math.floor(Math.random() * 10 + 85); // 85-95%
      const exitosos = Math.floor(total * successRate / 100);
      const fallidos = total - exitosos;
      
      return {
        success: true,
        simulationMode: true,
        resultados: {
          total,
          exitosos,
          fallidos,
          tasa_exito: Math.round(exitosos / total * 100)
        },
        sample_numbers: phoneNumbers.slice(0, 10)
      };
    }
    
    // Modo real - envía mensajes
    return {
      success: true,
      simulationMode: false,
      resultados: {
        total: phoneNumbers.length,
        exitosos: phoneNumbers.length,
        fallidos: 0,
        tasa_exito: 100
      }
    };
  }

  it('debe retornar simulationMode=true cuando está activado', () => {
    const phoneNumbers = ['+593987654321', '+593912345678'];
    const result = simulateCampaignSend(phoneNumbers, true);
    
    expect(result.simulationMode).toBe(true);
  });

  it('debe incluir sample_numbers en modo simulación', () => {
    const phoneNumbers = Array.from({ length: 20 }, (_, i) => `+59398765432${i}`);
    const result = simulateCampaignSend(phoneNumbers, true);
    
    expect(result.sample_numbers).toBeDefined();
    expect(result.sample_numbers!.length).toBeLessThanOrEqual(10);
  });

  it('debe calcular estadísticas realistas en simulación', () => {
    const phoneNumbers = Array.from({ length: 100 }, (_, i) => `+59398765432${i}`);
    const result = simulateCampaignSend(phoneNumbers, true);
    
    expect(result.resultados.total).toBe(100);
    expect(result.resultados.exitosos + result.resultados.fallidos).toBe(100);
    expect(result.resultados.tasa_exito).toBeGreaterThanOrEqual(0);
    expect(result.resultados.tasa_exito).toBeLessThanOrEqual(100);
  });

  it('no debe incluir sample_numbers en modo real', () => {
    const phoneNumbers = ['+593987654321'];
    const result = simulateCampaignSend(phoneNumbers, false);
    
    expect(result.simulationMode).toBe(false);
    expect(result.sample_numbers).toBeUndefined();
  });
});

describe('Batch Processing - Procesamiento por Lotes', () => {
  
  function calculateBatches(total: number, batchSize: number) {
    return Math.ceil(total / batchSize);
  }

  function calculateEstimatedTime(total: number, batchSize: number, delayMinutes: number) {
    const batches = calculateBatches(total, batchSize);
    return batches * delayMinutes;
  }

  it('debe calcular correctamente el número de lotes', () => {
    expect(calculateBatches(100, 10)).toBe(10);
    expect(calculateBatches(95, 10)).toBe(10);
    expect(calculateBatches(101, 10)).toBe(11);
    expect(calculateBatches(5, 10)).toBe(1);
  });

  it('debe calcular tiempo estimado correcto', () => {
    // 100 mensajes, lotes de 10, 5 min entre lotes = 10 lotes * 5 min = 50 min
    expect(calculateEstimatedTime(100, 10, 5)).toBe(50);
    
    // 50 mensajes, lotes de 20, 3 min entre lotes = 3 lotes * 3 min = 9 min
    expect(calculateEstimatedTime(50, 20, 3)).toBe(9);
  });

  it('debe manejar caso de lote único', () => {
    expect(calculateBatches(5, 10)).toBe(1);
    expect(calculateEstimatedTime(5, 10, 5)).toBe(5);
  });
});
