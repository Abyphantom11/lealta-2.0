import fs from 'fs';
import path from 'path';

// 🎯 CONFIGURACIÓN CENTRAL DE TARJETAS - SINGLE SOURCE OF TRUTH
// Esta función es la ÚNICA fuente autorizada para obtener configuración de tarjetas

export interface TarjetaConfigCentral {
  id: string;
  nivel: string;
  nombrePersonalizado: string;
  textoCalidad: string;
  colores: {
    gradiente: string[];
    texto: string;
    nivel: string;
  };
  condiciones: {
    puntosMinimos: number;
    gastosMinimos?: number;
    visitasMinimas: number;
  };
  beneficio: string;
  activo: boolean;
}

export interface ConfiguracionCentralTarjetas {
  tarjetas: TarjetaConfigCentral[];
  nombreEmpresa: string;
  nivelesConfig?: any;
  jerarquiaValida: boolean;
  erroresValidacion: string[];
}

// 🛡️ VALORES POR DEFECTO PROGRESIVOS Y LÓGICOS
const TARJETAS_DEFAULT: TarjetaConfigCentral[] = [
  {
    id: 'tarjeta-bronce',
    nivel: 'Bronce',
    nombrePersonalizado: 'Tarjeta Bronce',
    textoCalidad: 'Cliente Inicial',
    colores: {
      gradiente: ['#CD7F32', '#8B4513'],
      texto: '#FFFFFF',
      nivel: '#CD7F32'
    },
    condiciones: {
      puntosMinimos: 0,
      gastosMinimos: 0,
      visitasMinimas: 0
    },
    beneficio: 'Acceso a promociones exclusivas',
    activo: true
  },
  {
    id: 'tarjeta-plata',
    nivel: 'Plata',
    nombrePersonalizado: 'Tarjeta Plata',
    textoCalidad: 'Cliente Frecuente',
    colores: {
      gradiente: ['#C0C0C0', '#808080'],
      texto: '#FFFFFF',
      nivel: '#C0C0C0'
    },
    condiciones: {
      puntosMinimos: 100,
      gastosMinimos: 500,
      visitasMinimas: 5
    },
    beneficio: '5% de descuento en compras',
    activo: true
  },
  {
    id: 'tarjeta-oro',
    nivel: 'Oro',
    nombrePersonalizado: 'Tarjeta Oro',
    textoCalidad: 'Cliente Premium',
    colores: {
      gradiente: ['#FFD700', '#FFA500'],
      texto: '#000000',
      nivel: '#FFD700'
    },
    condiciones: {
      puntosMinimos: 500,
      gastosMinimos: 1500,
      visitasMinimas: 10
    },
    beneficio: '10% de descuento en compras',
    activo: true
  },
  {
    id: 'tarjeta-diamante',
    nivel: 'Diamante',
    nombrePersonalizado: 'Tarjeta Diamante',
    textoCalidad: 'Cliente VIP',
    colores: {
      gradiente: ['#B9F2FF', '#0891B2'],
      texto: '#FFFFFF',
      nivel: '#B9F2FF'
    },
    condiciones: {
      puntosMinimos: 1500,
      gastosMinimos: 3000,
      visitasMinimas: 20
    },
    beneficio: '15% de descuento en compras',
    activo: true
  },
  {
    id: 'tarjeta-platino',
    nivel: 'Platino',
    nombrePersonalizado: 'Tarjeta Platino',
    textoCalidad: 'Cliente Elite',
    colores: {
      gradiente: ['#E5E7EB', '#9CA3AF'],
      texto: '#FFFFFF',
      nivel: '#E5E7EB'
    },
    condiciones: {
      puntosMinimos: 3000,
      gastosMinimos: 5000,
      visitasMinimas: 30
    },
    beneficio: '20% de descuento en compras',
    activo: true
  }
];

// 🎯 JERARQUÍA OFICIAL INMUTABLE
export const JERARQUIA_NIVELES = ['Bronce', 'Plata', 'Oro', 'Diamante', 'Platino'] as const;
export type NivelTarjeta = typeof JERARQUIA_NIVELES[number];

// 🛡️ VALIDACIÓN JERÁRQUICA ESTRICTA - ACEPTA AMBAS ESTRUCTURAS
function validarJerarquiaTarjetas(tarjetas: any[]): { 
  esValida: boolean; 
  errores: string[] 
} {
  const errores: string[] = [];
  
  if (!tarjetas || tarjetas.length === 0) {
    errores.push('No hay tarjetas configuradas');
    return { esValida: false, errores };
  }

  // 🔧 NORMALIZAR ESTRUCTURA - Aceptar tanto 'nivel' como 'nombre'
  const tarjetasNormalizadas = tarjetas.map(t => ({
    ...t,
    nivel: t.nivel || t.nombre, // ✅ Funciona con ambas estructuras
    puntosMinimos: t.condiciones?.puntosMinimos || t.puntosRequeridos || 0,
    activo: t.activo !== false // Por defecto activo
  }));

  // Ordenar por jerarquía
  const tarjetasOrdenadas = tarjetasNormalizadas
    .filter(t => t.activo)
    .sort((a, b) => JERARQUIA_NIVELES.indexOf(a.nivel as NivelTarjeta) - JERARQUIA_NIVELES.indexOf(b.nivel as NivelTarjeta));

  // Validar progresión de puntos
  for (let i = 1; i < tarjetasOrdenadas.length; i++) {
    const anterior = tarjetasOrdenadas[i - 1];
    const actual = tarjetasOrdenadas[i];
    
    const puntosAnterior = anterior.puntosMinimos;
    const puntosActual = actual.puntosMinimos;
    
    // Regla 1: Cada nivel debe tener más puntos que el anterior
    if (puntosActual <= puntosAnterior) {
      errores.push(`${actual.nivel} (${puntosActual} pts) debe tener más puntos que ${anterior.nivel} (${puntosAnterior} pts)`);
    }
    
    // Regla 2: Diferencia mínima entre niveles (evitar niveles muy cercanos)
    const diferencia = puntosActual - puntosAnterior;
    if (diferencia > 0 && diferencia < 50) {
      errores.push(`Diferencia muy pequeña entre ${anterior.nivel} y ${actual.nivel}: ${diferencia} puntos (mínimo 50)`);
    }
    
    // Regla 3: Diferencia máxima entre niveles (evitar saltos ilógicos)
    if (diferencia > 10000) {
      errores.push(`Salto muy grande entre ${anterior.nivel} y ${actual.nivel}: ${diferencia} puntos (máximo 10,000)`);
    }
  }

  // Validar que existan todos los niveles requeridos
  for (const nivelRequerido of JERARQUIA_NIVELES) {
    if (!tarjetasOrdenadas.find(t => t.nivel === nivelRequerido)) {
      errores.push(`Falta nivel requerido: ${nivelRequerido}`);
    }
  }

  return {
    esValida: errores.length === 0,
    errores
  };
}

// 🎯 FUNCIÓN PRINCIPAL - OBTENER CONFIGURACIÓN CENTRAL
export async function getTarjetasConfigCentral(businessId: string): Promise<ConfiguracionCentralTarjetas> {
  try {
    // Construir ruta del archivo de configuración
    const configPath = path.join(process.cwd(), 'config', 'portal', `portal-config-${businessId}.json`);
    
    let tarjetas: TarjetaConfigCentral[] = [];
    let nombreEmpresa = 'Mi Negocio';
    let nivelesConfig = {};
    
    // Intentar leer configuración específica del business
    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(configData);
      
      // 🔧 LEER TARJETAS DIRECTAMENTE DEL JSON (NUEVA ESTRUCTURA)
      if (config.tarjetas && Array.isArray(config.tarjetas)) {
        tarjetas = config.tarjetas.map((tarjeta: any) => ({
          id: tarjeta.id || `tarjeta-${tarjeta.nivel.toLowerCase()}`,
          nivel: tarjeta.nivel,
          nombrePersonalizado: tarjeta.nombrePersonalizado || `Tarjeta ${tarjeta.nivel}`,
          textoCalidad: tarjeta.textoCalidad || tarjeta.beneficio || `Cliente ${tarjeta.nivel}`,
          colores: {
            gradiente: tarjeta.colores?.gradiente || ['#666666', '#999999'],
            texto: tarjeta.colores?.texto || '#FFFFFF',
            nivel: tarjeta.colores?.nivel || tarjeta.colores?.gradiente?.[0] || '#666666'
          },
          condiciones: {
            puntosMinimos: tarjeta.condiciones?.puntosMinimos || 0,
            gastosMinimos: tarjeta.condiciones?.gastosMinimos || 0,
            visitasMinimas: tarjeta.condiciones?.visitasMinimas || 0
          },
          beneficio: tarjeta.beneficio || `Cliente ${tarjeta.nivel}`,
          activo: tarjeta.activo !== undefined ? tarjeta.activo : true
        }));
      } 
      // 🔧 FALLBACK: ESTRUCTURA ANTIGUA (compatibilidad)
      else if (config.tarjetas && config.tarjetas[0] && config.tarjetas[0].niveles) {
        const nivelesJson = config.tarjetas[0].niveles;
        
        tarjetas = nivelesJson.map((nivel: any) => ({
          id: `tarjeta-${nivel.nombre.toLowerCase()}`,
          nivel: nivel.nombre, // ✅ Mapear 'nombre' a 'nivel'
          nombrePersonalizado: `Tarjeta ${nivel.nombre}`,
          textoCalidad: nivel.beneficio || `Cliente ${nivel.nombre}`,
          colores: {
            gradiente: nivel.colores || ['#000000', '#333333'],
            texto: '#FFFFFF',
            nivel: nivel.colores?.[0] || '#000000'
          },
          condiciones: {
            puntosMinimos: nivel.puntosRequeridos || 0,
            visitasMinimas: nivel.visitasRequeridas || 0
          },
          beneficio: nivel.beneficio || `${nivel.descuento || 0}% de descuento`,
          activo: true
        }));
        
        console.log(`✅ [CENTRAL] Transformados ${tarjetas.length} niveles desde JSON antiguo`);
      } else {
        console.log(`⚠️ [CENTRAL] No se encontraron tarjetas en el JSON, usando por defecto`);
        tarjetas = TARJETAS_DEFAULT;
      }
      
      nombreEmpresa = config.nombreEmpresa || 'Mi Negocio';
      nivelesConfig = config.nivelesConfig || {};
    } else {
      tarjetas = TARJETAS_DEFAULT;
    }
    
    // 🛡️ VALIDAR JERARQUÍA SIEMPRE
    const validacion = validarJerarquiaTarjetas(tarjetas);
    
    if (!validacion.esValida) {
      console.error(`❌ [CENTRAL] Jerarquía inválida para ${businessId}:`, validacion.errores);
      
      // En caso de jerarquía inválida, usar valores por defecto pero reportar el error
      tarjetas = TARJETAS_DEFAULT;
    }
    
    return {
      tarjetas,
      nombreEmpresa,
      nivelesConfig,
      jerarquiaValida: validacion.esValida,
      erroresValidacion: validacion.errores
    };
    
  } catch (error) {
    console.error(`❌ [CENTRAL] Error obteniendo configuración para ${businessId}:`, error);
    
    // Fallback seguro a configuración por defecto
    return {
      tarjetas: TARJETAS_DEFAULT,
      nombreEmpresa: 'Mi Negocio',
      nivelesConfig: {},
      jerarquiaValida: true,
      erroresValidacion: [`Error de lectura: ${error instanceof Error ? error.message : 'Unknown error'}`]
    };
  }
}

// 🎯 FUNCIÓN HELPER - OBTENER SOLO PUNTOS MÍNIMOS POR NIVEL
export async function getPuntosMinimosConfig(businessId: string): Promise<Record<string, number>> {
  const config = await getTarjetasConfigCentral(businessId);
  
  const puntosMinimos: Record<string, number> = {};
  
  config.tarjetas.forEach(tarjeta => {
    if (tarjeta.activo) {
      puntosMinimos[tarjeta.nivel] = tarjeta.condiciones.puntosMinimos;
    }
  });
  
  console.log(`🎯 [CENTRAL] Puntos mínimos para ${businessId}:`, puntosMinimos);
  
  return puntosMinimos;
}

// 🎯 FUNCIÓN HELPER - OBTENER TARJETA POR NIVEL
export async function getTarjetaPorNivel(businessId: string, nivel: string): Promise<TarjetaConfigCentral | null> {
  const config = await getTarjetasConfigCentral(businessId);
  return config.tarjetas.find(t => t.nivel === nivel && t.activo) || null;
}

// 🎯 FUNCIÓN HELPER - EVALUAR NIVEL SEGÚN PUNTOS Y VISITAS
export async function evaluarNivelCorrespondiente(
  businessId: string, 
  puntosProgreso: number, 
  visitas: number
): Promise<string> {
  const config = await getTarjetasConfigCentral(businessId);
  
  // Ordenar niveles de mayor a menor para encontrar el más alto que califica
  const nivelesOrdenados = config.tarjetas
    .filter(t => t.activo)
    .sort((a, b) => JERARQUIA_NIVELES.indexOf(b.nivel as NivelTarjeta) - JERARQUIA_NIVELES.indexOf(a.nivel as NivelTarjeta));
  
  for (const tarjeta of nivelesOrdenados) {
    const cumplePuntos = puntosProgreso >= tarjeta.condiciones.puntosMinimos;
    const cumpleVisitas = visitas >= tarjeta.condiciones.visitasMinimas;
    
    // Lógica OR: cumple puntos O visitas
    if (cumplePuntos || cumpleVisitas) {
      return tarjeta.nivel;
    }
  }
  
  // Fallback a Bronce
  return 'Bronce';
  return 'Bronce';
}

// 🎯 FUNCIÓN HELPER - VALIDAR SI UN BUSINESS TIENE CONFIGURACIÓN VÁLIDA
export async function validarConfiguracionBusiness(businessId: string): Promise<{
  esValida: boolean;
  errores: string[];
  sugerencias: string[];
}> {
  try {
    const config = await getTarjetasConfigCentral(businessId);
    
    const sugerencias: string[] = [];
    
    // Verificar si se están usando valores por defecto
    const esConfigDefault = JSON.stringify(config.tarjetas) === JSON.stringify(TARJETAS_DEFAULT);
    if (esConfigDefault) {
      sugerencias.push('Se está usando configuración por defecto. Considera personalizar las tarjetas desde el panel de administración.');
    }
    
    // Verificar saltos muy grandes entre niveles
    const tarjetasOrdenadas = config.tarjetas
      .filter(t => t.activo)
      .sort((a, b) => JERARQUIA_NIVELES.indexOf(a.nivel as NivelTarjeta) - JERARQUIA_NIVELES.indexOf(b.nivel as NivelTarjeta));
    
    for (let i = 1; i < tarjetasOrdenadas.length; i++) {
      const diferencia = tarjetasOrdenadas[i].condiciones.puntosMinimos - tarjetasOrdenadas[i-1].condiciones.puntosMinimos;
      if (diferencia > 5000) {
        sugerencias.push(`Considera reducir la diferencia entre ${tarjetasOrdenadas[i-1].nivel} y ${tarjetasOrdenadas[i].nivel} (${diferencia} puntos)`);
      }
    }
    
    return {
      esValida: config.jerarquiaValida,
      errores: config.erroresValidacion,
      sugerencias
    };
    
  } catch (error) {
    return {
      esValida: false,
      errores: [`Error de validación: ${error instanceof Error ? error.message : 'Unknown error'}`],
      sugerencias: []
    };
  }
}
