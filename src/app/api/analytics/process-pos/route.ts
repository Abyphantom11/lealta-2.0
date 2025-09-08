import { NextRequest, NextResponse } from 'next/server';
import { geminiAnalyzer } from '@/lib/ai/gemini-analyzer';
import { TransaccionAnalizada } from '@/types/analytics';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('imagen') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ninguna imagen' },
        { status: 400 }
      );
    }

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'El archivo debe ser una imagen' },
        { status: 400 }
      );
    }

    // Validar tamaño (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'La imagen es demasiado grande (máximo 10MB)' },
        { status: 400 }
      );
    }

    // Convertir archivo a buffer
    // ⚠️ VALIDACIÓN DE MEMORIA CRÍTICA - Prevenir allocation failed
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB máximo
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`Archivo demasiado grande: ${Math.round(file.size / 1024 / 1024)}MB. Máximo permitido: 10MB`);
    }
    
    console.log(`📁 Procesando imagen analytics: ${Math.round(file.size / 1024)}KB`);
    
    const arrayBuffer = await file.arrayBuffer();
    let imageBuffer: Buffer = Buffer.from(new Uint8Array(arrayBuffer));

    // Optimizar imagen si es necesario
    if (file.size > 2 * 1024 * 1024) {
      // Si es mayor a 2MB
      imageBuffer = await sharp(Buffer.from(new Uint8Array(arrayBuffer)))
        .resize({ width: 1920, height: 1080, fit: 'inside' })
        .jpeg({ quality: 85 })
        .toBuffer();
    }

    // Analizar con Gemini
    const analysis = await geminiAnalyzer.analyzeImage(imageBuffer, file.type);

    // Verificar confianza mínima
    if (analysis.confianza < 0.5) {
      return NextResponse.json(
        {
          success: false,
          error: 'La imagen no se pudo analizar con suficiente confianza',
          confianza: analysis.confianza,
          errores: analysis.errores,
        },
        { status: 422 }
      );
    }

    // Crear registro de transacción
    const transaccion: TransaccionAnalizada = {
      id: generateId(),
      fechaTransaccion: analysis.fecha ? new Date(analysis.fecha) : new Date(),
      productos: analysis.productos,
      totalPesos: analysis.total,
      puntosGenerados: analysis.puntosGenerados,
      estadoAnalisis: 'procesado',
      imagenOriginal: imageBuffer.toString('base64'),
      confianza: analysis.confianza,
    };

    // Guardar en almacenamiento temporal (en producción sería BD)
    await saveTransactionToDatabase(transaccion);

    return NextResponse.json({
      success: true,
      transaccion: {
        id: transaccion.id,
        productos: transaccion.productos,
        total: transaccion.totalPesos,
        puntos: transaccion.puntosGenerados,
        confianza: transaccion.confianza,
        fecha: transaccion.fechaTransaccion,
      },
      message: `Transacción procesada correctamente. ${analysis.productos.length} productos detectados.`,
    });
  } catch (error) {
    console.error('Error procesando imagen POS:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Error desconocido';

    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor al procesar la imagen',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

// Función para generar ID único
function generateId(): string {
  return `txn_${Date.now()}_${Math.random().toString(36).substring(2)}`;
}

// Función para almacenamiento temporal de transacciones
async function saveTransactionToDatabase(
  _: TransaccionAnalizada
): Promise<void> {
  // En un MVP, guardamos en memoria/localStorage simulado
  // En producción: implementar guardado real en PostgreSQL/MongoDB

  // Se ha eliminado console.log por recomendación de SonarQube

  // Simular delay de base de datos
  await new Promise(resolve => setTimeout(resolve, 100));

  // Aquí iría la lógica de guardado real:
  // await prisma.transaccion.create({ data: transaccion });
}
