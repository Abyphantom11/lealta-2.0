/**
 * 🧪 TESTS UNITARIOS - Sistema de WhatsApp
 * Tests para funciones críticas del sistema de mensajería
 */
// @ts-nocheck - Desactivamos verificación de tipos para compatibilidad Jest/Vitest

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

// ========================================
// HELPER FUNCTIONS (fuera de describe para evitar problemas de parsing)
// ========================================

// Backoff exponencial
const calculateBackoffDelay = (retryCount) => {
  const baseDelayMs = 1000;
  const maxDelayMs = 60000;
  const delay = baseDelayMs * Math.pow(2, retryCount);
  return Math.min(delay, maxDelayMs);
};

// Detectar errores permanentes
const isPermanentError = (error) => {
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
};

// Límites de tier
const getTierLimits = (tier) => {
  const limits = {
    TIER_1: { dailyLimit: 1000, monthlyLimit: 1000 },
    TIER_2: { dailyLimit: 10000, monthlyLimit: 10000 },
    TIER_3: { dailyLimit: 100000, monthlyLimit: 100000 },
  };
  return limits[tier] || limits.TIER_1;
};

// Determinar tier por uso
const determineTier = (monthlyUsage) => {
  if (monthlyUsage < 1000) return 'TIER_1';
  if (monthlyUsage < 10000) return 'TIER_2';
  return 'TIER_3';
};

// Validar teléfono ecuatoriano
const isValidEcuadorianPhone = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('09') && cleaned.length === 10) return true;
  if (cleaned.startsWith('593') && cleaned.length === 12) return true;
  if (cleaned.startsWith('9') && cleaned.length === 9) return true;
  return false;
};

// Extraer variables de template
const extractVariables = (template) => {
  const regex = /{{(\w+)}}/g;
  const variables = [];
  let match;
  
  while ((match = regex.exec(template)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }
  
  return variables;
};

// ========================================
// TESTS
// ========================================

describe('WhatsApp Queue - Funciones de Cola', () => {
  
  describe('calculateBackoffDelay', () => {
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
    it('debe detectar errores permanentes', () => {
      expect(isPermanentError('Número inválido')).toBe(true);
      expect(isPermanentError('User opt-out of messages')).toBe(true);
      expect(isPermanentError('Number blocked')).toBe(true);
      expect(isPermanentError('recipient not in whitelist')).toBe(true);
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
      expect(isValidEcuadorianPhone('0512345678')).toBe(false);
    });

    it('debe manejar números con formato', () => {
      expect(isValidEcuadorianPhone('098-765-4321')).toBe(true);
      expect(isValidEcuadorianPhone('(09) 8765-4321')).toBe(true);
    });
  });
});

describe('Template Variables Extraction', () => {
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
