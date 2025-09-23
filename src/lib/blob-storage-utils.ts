/**
 * 🔧 Utility para obtener el token correcto de Vercel Blob Storage
 * 
 * Soluciona el problema donde BLOB_READ_WRITE_TOKEN puede estar configurado
 * pero ser inválido (muy corto o sin Store ID correcto)
 */

export function getBlobStorageToken(): string {
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  const lealtaToken = process.env.LEALTA_READ_WRITE_TOKEN;
  
  // Si BLOB_READ_WRITE_TOKEN es válido (más de 10 caracteres y contiene el store ID)
  if (blobToken && blobToken.length > 10 && blobToken.includes('QSQoErcPWIoMxvo2')) {
    return blobToken;
  }
  
  // Si LEALTA_READ_WRITE_TOKEN es válido
  if (lealtaToken && lealtaToken.length > 10 && lealtaToken.includes('QSQoErcPWIoMxvo2')) {
    return lealtaToken;
  }
  
  // Fallback hardcodeado (último recurso)
  return "vercel_blob_rw_QSQoErcPWIoMxvo2_DYdNIDEA6Q1yeI3T0BHuwbTnC0grwT";
}

/**
 * 🧪 Función de diagnóstico para debug
 */
export function getBlobTokenDiagnostic() {
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  const lealtaToken = process.env.LEALTA_READ_WRITE_TOKEN;
  
  return {
    blobTokenExists: !!blobToken,
    blobTokenLength: blobToken?.length || 0,
    blobTokenValid: blobToken && blobToken.length > 10 && blobToken.includes('QSQoErcPWIoMxvo2'),
    lealtaTokenExists: !!lealtaToken,
    lealtaTokenLength: lealtaToken?.length || 0,
    lealtaTokenValid: lealtaToken && lealtaToken.length > 10 && lealtaToken.includes('QSQoErcPWIoMxvo2'),
    usingToken: getBlobStorageToken().substring(0, 20) + '...',
  };
}
