// AI processing utilities

export const detectSameReceipt = (results: any[]): boolean => {
  if (results.length < 2) return false;
  
  const totals = results.map(r => r.analysis?.total || 0);
  const firstTotal = totals[0];
  
  // Si todos los totales son iguales o muy similares, es la misma cuenta
  const areSimilar = totals.every(total => Math.abs(total - firstTotal) < 0.1);
  
  if (areSimilar && firstTotal > 0) {
    console.log('🔄 Detectada misma cuenta en múltiples imágenes. Total: $', firstTotal);
    return true;
  }
  
  return false;
};

export const correctPartialProductName = (partialName: string): string | null => {
  const knownProducts = [
    'SMIRNOFF SPICY VASO',
    'PALOMA', 
    'VIRGIN MULE',
    'AGUA NORMAL',
    'ROYAL LEMONADE',
    'JOSE CUERVO BLANCO SHOT'
  ];
  
  // Limpiar el nombre de entrada
  const cleanPartial = partialName.toLowerCase().trim();
  
  // NO corregir nombres que son claramente fragmentos incorrectos
  const invalidFragments = ['doval', 'dovai', 'roval'];
  if (invalidFragments.includes(cleanPartial)) {
    console.log(`❌ Fragmento inválido detectado y filtrado: "${cleanPartial}"`);
    return null; // Retornar null para que se filtre
  }
  
  // Solo corregir si hay una coincidencia muy fuerte (75%+ de las letras)
  for (const product of knownProducts) {
    const cleanProduct = product.toLowerCase();
    
    // Verificar coincidencia exacta al inicio con al menos 70% del nombre
    if (cleanProduct.startsWith(cleanPartial) && cleanPartial.length >= cleanProduct.length * 0.7) {
      console.log(`✅ Corrección por prefijo: "${partialName}" → "${product}"`);
      return product;
    }
    
    // Verificar coincidencias por palabras clave completas
    const partialWords = cleanPartial.split(' ').filter(w => w.length > 2);
    const productWords = cleanProduct.split(' ');
    let exactMatches = 0;
    
    partialWords.forEach(word => {
      if (productWords.includes(word)) {
        exactMatches++;
      }
    });
    
    // Solo si todas las palabras del fragmento coinciden exactamente
    if (partialWords.length > 0 && exactMatches === partialWords.length && exactMatches >= 2) {
      console.log(`✅ Corrección por palabras clave: "${partialName}" → "${product}"`);
      return product;
    }
  }
  
  // Correcciones muy específicas y confiables únicamente
  const highConfidenceCorrections: { [key: string]: string } = {
    'jose cuervo blanco': 'JOSE CUERVO BLANCO SHOT',
    'smirnoff spicy': 'SMIRNOFF SPICY VASO',
    'virgin mul': 'VIRGIN MULE',
    'royal lemon': 'ROYAL LEMONADE'
  };
  
  if (highConfidenceCorrections[cleanPartial]) {
    console.log(`✅ Corrección específica: "${partialName}" → "${highConfidenceCorrections[cleanPartial]}"`);
    return highConfidenceCorrections[cleanPartial];
  }
  
  // Si no hay coincidencia confiable, retornar null para filtrar
  return null;
};

export const shouldFilterProduct = (product: any): boolean => {
  const name = product.nombre?.toLowerCase().trim() || '';
  
  // Filtros de productos no válidos
  const invalidPatterns = [
    /^[^a-zA-Z]*$/, // Solo números o símbolos
    /^\d+$/, // Solo números
    /^[^\w\s]*$/, // Solo símbolos especiales
    /^.{1,2}$/, // Muy corto (1-2 caracteres)
    /total|subtotal|tax|impuesto/i, // Palabras de totales
  ];
  
  return invalidPatterns.some(pattern => pattern.test(name));
};

export const consolidateProducts = (productMap: Map<string, any>): any[] => {
  return Array.from(productMap.values());
};

export const normalizeProductName = (name: string, isUpperCase: boolean): string => {
  const correctedName = correctPartialProductName(name.toLowerCase().trim());
  const finalName = correctedName || name;
  return isUpperCase ? finalName.toUpperCase() : finalName;
};
