// Test de validación para el sistema central de tarjetas
import { getTarjetasConfigCentral, validarConfiguracionBusiness, JERARQUIA_NIVELES } from '@/lib/tarjetas-config-central';

describe('Sistema Central de Tarjetas', () => {
  describe('Validación de Jerarquía', () => {
    test('debe validar jerarquía correcta', async () => {
      const config = await getTarjetasConfigCentral('test');
      
      expect(config.jerarquiaValida).toBe(true);
      expect(config.erroresValidacion).toHaveLength(0);
    });

    test('debe detectar errores de jerarquía', async () => {
      // Este test verificaría configuraciones inválidas
      // En un entorno real, podríamos mockear fs para devolver configuración inválida
    });

    test('debe mantener orden jerárquico', () => {
      const niveles = JERARQUIA_NIVELES;
      
      expect(niveles[0]).toBe('Bronce');
      expect(niveles[1]).toBe('Plata');
      expect(niveles[2]).toBe('Oro');
      expect(niveles[3]).toBe('Diamante');
      expect(niveles[4]).toBe('Platino');
    });
  });

  describe('Progresión de Puntos', () => {
    test('debe tener progresión lógica de puntos por defecto', async () => {
      const config = await getTarjetasConfigCentral('test');
      const tarjetas = config.tarjetas;
      
      // Verificar que cada nivel tiene más puntos que el anterior
      for (let i = 1; i < tarjetas.length; i++) {
        const anterior = tarjetas[i - 1];
        const actual = tarjetas[i];
        
        expect(actual.condiciones.puntosMinimos).toBeGreaterThan(anterior.condiciones.puntosMinimos);
        
        // Verificar diferencias razonables
        const diferencia = actual.condiciones.puntosMinimos - anterior.condiciones.puntosMinimos;
        expect(diferencia).toBeGreaterThanOrEqual(50); // Mínimo 50 puntos de diferencia
        expect(diferencia).toBeLessThanOrEqual(10000); // Máximo 10,000 puntos de diferencia
      }
    });

    test('debe tener niveles específicos correctos', async () => {
      const config = await getTarjetasConfigCentral('test');
      const tarjetasPorNivel = config.tarjetas.reduce((acc, tarjeta) => {
        acc[tarjeta.nivel] = tarjeta;
        return acc;
      }, {} as Record<string, any>);

      expect(tarjetasPorNivel['Bronce'].condiciones.puntosMinimos).toBe(0);
      expect(tarjetasPorNivel['Plata'].condiciones.puntosMinimos).toBe(100);
      expect(tarjetasPorNivel['Oro'].condiciones.puntosMinimos).toBe(500);
      expect(tarjetasPorNivel['Diamante'].condiciones.puntosMinimos).toBe(1500);
      expect(tarjetasPorNivel['Platino'].condiciones.puntosMinimos).toBe(3000);
    });
  });

  describe('Validación de Business', () => {
    test('debe validar configuración de business existente', async () => {
      const validacion = await validarConfiguracionBusiness('test');
      
      expect(validacion.esValida).toBe(true);
      expect(Array.isArray(validacion.errores)).toBe(true);
      expect(Array.isArray(validacion.sugerencias)).toBe(true);
    });

    test('debe manejar business inexistente', async () => {
      const validacion = await validarConfiguracionBusiness('business-inexistente-123');
      
      // Debe manejar gracefully y devolver configuración por defecto válida
      expect(validacion.esValida).toBe(true);
    });
  });

  describe('Consistencia Multi-API', () => {
    test('debe devolver mismos valores en diferentes contextos', async () => {
      const businessId = 'test';
      
      // Simular llamadas desde diferentes APIs
      const configDirect = await getTarjetasConfigCentral(businessId);
      const configValidacion = await validarConfiguracionBusiness(businessId);
      
      expect(configDirect.jerarquiaValida).toBe(configValidacion.esValida);
    });
  });

  describe('Fallbacks y Errores', () => {
    test('debe proporcionar fallback seguro en caso de error', async () => {
      // Test que simula error de lectura de archivos
      const config = await getTarjetasConfigCentral('business-con-archivo-corrupto');
      
      // Debe devolver configuración por defecto válida
      expect(config.tarjetas).toHaveLength(5);
      expect(config.tarjetas[0].nivel).toBe('Bronce');
      expect(config.tarjetas[4].nivel).toBe('Platino');
    });
  });
});

// Test de integración que verifica que todas las APIs devuelven valores consistentes
describe('Integración: Consistencia entre APIs', () => {
  test('evaluate-level.ts debe usar configuración central', async () => {
    // Este test verificaría que evaluate-level ya no tiene hardcoding
    // y usa la configuración central correctamente
  });

  test('tarjetas/asignar debe usar configuración central', async () => {
    // Test para verificar que la API de asignación usa configuración central
  });

  test('loyaltyCalculations debe usar configuración central', async () => {
    // Test para verificar que los cálculos usan configuración central
  });
});

// Helper para tests - función que verifica la progresión lógica
export function verificarProgresionLogica(tarjetas: any[]): { esValida: boolean; errores: string[] } {
  const errores: string[] = [];
  
  // Ordenar por jerarquía
  const tarjetasOrdenadas = tarjetas.sort((a, b) => 
    JERARQUIA_NIVELES.indexOf(a.nivel) - JERARQUIA_NIVELES.indexOf(b.nivel)
  );
  
  for (let i = 1; i < tarjetasOrdenadas.length; i++) {
    const anterior = tarjetasOrdenadas[i - 1];
    const actual = tarjetasOrdenadas[i];
    
    const puntosAnterior = anterior.condiciones.puntosMinimos;
    const puntosActual = actual.condiciones.puntosMinimos;
    
    if (puntosActual <= puntosAnterior) {
      errores.push(`${actual.nivel} (${puntosActual}) debe tener más puntos que ${anterior.nivel} (${puntosAnterior})`);
    }
    
    const diferencia = puntosActual - puntosAnterior;
    if (diferencia > 0 && diferencia < 50) {
      errores.push(`Diferencia muy pequeña entre ${anterior.nivel} y ${actual.nivel}: ${diferencia} puntos`);
    }
    
    if (diferencia > 10000) {
      errores.push(`Salto muy grande entre ${anterior.nivel} y ${actual.nivel}: ${diferencia} puntos`);
    }
  }
  
  return {
    esValida: errores.length === 0,
    errores
  };
}
