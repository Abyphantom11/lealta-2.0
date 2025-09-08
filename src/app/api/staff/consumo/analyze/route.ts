import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { z } from 'zod';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { geminiAnalyzer } from '../../../../../lib/ai/gemini-analyzer';
import fs from 'fs';

// Forzar renderizado dinámico para esta ruta que usa autenticación
export const dynamic = 'force-dynamic';

// Helper function to validate form data
function validateFormData(formData: FormData) {
  const schema = z.object({
    cedula: z.string().min(1, 'Cédula es requerida'),
    businessId: z.string().optional(),
    empleadoId: z.string().optional(),
  });

  return schema.parse({
    cedula: formData.get('cedula'),
    businessId: formData.get('businessId'),
    empleadoId: formData.get('empleadoId'),
  });
}

// Helper function to save image
async function saveImageFile(image: File): Promise<{ filepath: string; publicUrl: string }> {
  // ⚠️ VALIDACIÓN DE MEMORIA CRÍTICA - Prevenir allocation failed
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB máximo
  if (image.size > MAX_FILE_SIZE) {
    throw new Error(`Archivo demasiado grande: ${Math.round(image.size / 1024 / 1024)}MB. Máximo permitido: 10MB`);
  }
  
  console.log(`📁 Procesando imagen: ${Math.round(image.size / 1024)}KB`);
  
  const bytes = await image.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const timestamp = Date.now();
  const filename = `ticket_${timestamp}.png`;

  const uploadDir = join(process.cwd(), 'public', 'uploads');
  await mkdir(uploadDir, { recursive: true });

  const filepath = join(uploadDir, filename);
  await writeFile(filepath, buffer);

  const publicUrl = `/uploads/${filename}`;
  return { filepath, publicUrl };
}

// Helper function to process image with Gemini AI
async function processImageWithGemini(filepath: string): Promise<{
  productos: Array<{ nombre: string; cantidad: number; precio: number; categoria?: string }>;
  total: number;
  empleadoDetectado: string | null;
  confianza: number;
  fecha: string | null;
  puntosGenerados: number;
  tipoDocumento?: string;
  negocio?: string | null;
  metodoPago?: string | null;
}> {
  try {
    const imageBuffer = fs.readFileSync(filepath);
    const mimeType = 'image/png';

    console.log('🤖 Procesando imagen con Gemini AI...');
    
    // Analizar con Gemini
    const analysis = await geminiAnalyzer.analyzeImage(imageBuffer, mimeType);
    
    console.log('✅ Análisis completado:', {
      total: analysis.total,
      productos: analysis.productos.length,
      confianza: analysis.confianza,
      empleado: analysis.empleado
    });

    return {
      productos: analysis.productos,
      total: analysis.total,
      empleadoDetectado: analysis.empleado || null,
      confianza: analysis.confianza,
      fecha: analysis.fecha,
      puntosGenerados: analysis.puntosGenerados,
      tipoDocumento: analysis.metadata?.tipoDocumento,
      negocio: analysis.metadata?.negocio,
      metodoPago: analysis.metadata?.metodoPago,
    };

  } catch (error) {
    console.error('❌ Error en procesamiento con Gemini:', error);
    
    // Fallback values si falla el análisis
    return {
      productos: [
        {
          nombre: 'Error: Análisis manual requerido',
          cantidad: 1,
          precio: 0,
          categoria: 'otro'
        }
      ],
      total: 0,
      empleadoDetectado: null,
      confianza: 0.1,
      fecha: null,
      puntosGenerados: 0,
      tipoDocumento: 'error',
      negocio: null,
      metodoPago: null,
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const validatedData = validateFormData(formData);
    const image = formData.get('image') as File;

    if (!image) {
      return NextResponse.json(
        { success: false, error: 'No se recibió ninguna imagen' },
        { status: 400 }
      );
    }

    if (!image.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'El archivo debe ser una imagen' },
        { status: 400 }
      );
    }

    if (image.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'La imagen es demasiado grande (máximo 10MB)' },
        { status: 400 }
      );
    }

    // Buscar cliente por cédula
    const cliente = await prisma.cliente.findUnique({
      where: { cedula: validatedData.cedula },
      include: {
        business: true
      }
    });

    if (!cliente) {
      return NextResponse.json(
        { success: false, error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    console.log('✅ Cliente encontrado:', cliente.nombre);

    // Guardar imagen temporalmente
    const { filepath, publicUrl } = await saveImageFile(image);
    console.log('💾 Imagen guardada temporalmente:', publicUrl);

    // Procesar imagen con Gemini AI
    console.log('🤖 Iniciando análisis con IA...');
    const analysis = await processImageWithGemini(filepath);

    // Responder con datos para confirmación (SIN GUARDAR AÚN)
    return NextResponse.json({
      success: true,
      message: 'Imagen analizada exitosamente - Pendiente de confirmación',
      requiresConfirmation: true,
      data: {
        // Información del cliente
        cliente: {
          id: cliente.id,
          nombre: cliente.nombre,
          cedula: cliente.cedula,
          puntosActuales: cliente.puntos,
        },
        // Información del análisis
        analisis: {
          productos: analysis.productos,
          total: analysis.total,
          empleadoDetectado: analysis.empleadoDetectado,
          confianza: Math.round(analysis.confianza * 100),
          puntosGenerados: analysis.puntosGenerados,
          fecha: analysis.fecha,
          tipoDocumento: analysis.tipoDocumento,
          negocio: analysis.negocio,
          metodoPago: analysis.metodoPago,
        },
        // Metadatos para confirmar
        metadata: {
          imagenUrl: publicUrl,
          filepath: filepath,
          businessId: validatedData.businessId,
          empleadoId: validatedData.empleadoId,
          requiereRevision: analysis.confianza < 0.7,
          timestamp: new Date().toISOString(),
        }
      }
    });

  } catch (error) {
    console.error('Error en análisis de imagen:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
