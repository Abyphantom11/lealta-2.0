import { NextResponse } from 'next/server';

// 🧪 Endpoint de diagnóstico para verificar variables de entorno en producción
export async function GET() {
  try {
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    const lealtaToken = process.env.LEALTA_READ_WRITE_TOKEN;
    
    // Solo mostrar los primeros y últimos caracteres por seguridad
    const maskToken = (token: string | undefined) => {
      if (!token) return 'NOT_SET';
      if (token.length < 10) return 'TOO_SHORT';
      return `${token.substring(0, 8)}...${token.substring(token.length - 8)}`;
    };
    
    const diagnostico = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      tokens: {
        BLOB_READ_WRITE_TOKEN: {
          exists: !!blobToken,
          masked: maskToken(blobToken),
          length: blobToken?.length || 0,
          hasStoreId: blobToken?.includes('QSQoErcPWIoMxvo2') || false
        },
        LEALTA_READ_WRITE_TOKEN: {
          exists: !!lealtaToken,
          masked: maskToken(lealtaToken),
          length: lealtaToken?.length || 0,
          hasStoreId: lealtaToken?.includes('QSQoErcPWIoMxvo2') || false
        }
      },
      storeInfo: {
        expectedStoreId: 'QSQoErcPWIoMxvo2',
        expectedTokenStart: 'vercel_blob_rw_QSQoErcPWIoMxvo2_',
        usingFallback: !blobToken || (!blobToken.includes('QSQoErcPWIoMxvo2') && !lealtaToken?.includes('QSQoErcPWIoMxvo2'))
      }
    };
    
    return NextResponse.json({
      success: true,
      diagnostico,
      message: 'Diagnóstico de tokens de Blob Storage'
    });
    
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error en diagnóstico',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
