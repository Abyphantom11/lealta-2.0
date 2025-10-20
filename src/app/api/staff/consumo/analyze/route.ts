import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { z } from 'zod';
import { put } from '@vercel/blob';
import { geminiAnalyzer } from '../../../../../lib/ai/gemini-analyzer';
import { getBlobStorageToken } from '@/lib/blob-storage-utils';

// Forzar renderizado dinámico para esta ruta que usa autenticación
export const dynamic = 'force-dynamic';

// Helper function to validate form data
function validateFormData(formData: FormData) {
  try {
    const schema = z.object({
      cedula: z.string().min(1, 'Cédula es requerida'),
      businessId: z.string().optional(),
      empleadoId: z.string().optional(),
    });

    const data = {
      cedula: formData.get('cedula'),
      businessId: formData.get('businessId'),
      empleadoId: formData.get('empleadoId'),
    };

    console.log('🧪 [VALIDATE] Datos para validar:', data);
    
    return schema.parse(data);
  } catch (error) {
    console.error('🧪 [VALIDATE] Error en validación:', error);
    throw error;
  }
}

// Helper function to save image
async function saveImageFile(image: File): Promise<{ filepath: string; publicUrl: string }> {
  // ⚠️ VALIDACIÓN DE MEMORIA CRÍTICA - Prevenir allocation failed
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB máximo
  if (image.size > MAX_FILE_SIZE) {
    throw new Error(`Archivo demasiado grande: ${Math.round(image.size / 1024 / 1024)}MB. Máximo permitido: 10MB`);
  }

  // ⚠️ VALIDACIÓN DE TIPO MIME CRÍTICA - Prevenir corrupción
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedMimeTypes.includes(image.type)) {
    throw new Error(`Tipo de archivo no válido: ${image.type}. Tipos permitidos: ${allowedMimeTypes.join(', ')}`);
  }
  
  console.log(`📁 Procesando imagen: ${Math.round(image.size / 1024)}KB, type: ${image.type}`);
  
  const timestamp = Date.now();
  // Preservar la extensión original del archivo
  const fileExtension = image.name.split('.').pop() || 'png';
  const filename = `analyze/ticket_${timestamp}.${fileExtension}`;

  // 🔥 UPLOAD A VERCEL BLOB STORAGE - CON TOKEN CENTRALIZADO
  const token = getBlobStorageToken();
  
  if (!token) {
    throw new Error('No valid blob storage token available');
  }
  
  const blob = await put(filename, image, {
    access: 'public',
    token: token,
  });

  return { 
    filepath: blob.url, 
    publicUrl: blob.url 
  };
}

// Helper function to process image with Gemini AI
async function processImageWithGemini(imageUrl: string): Promise<{
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
    // Descargar imagen desde Vercel Blob
    console.log('📥 [GEMINI] Descargando imagen desde Vercel Blob:', imageUrl);
    const response = await fetch(imageUrl);
    console.log('📥 [GEMINI] Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      throw new Error(`Error descargando imagen: ${response.status} ${response.statusText}`);
    }
    
    const imageBuffer = Buffer.from(await response.arrayBuffer());
    console.log('📥 [GEMINI] Buffer descargado, size:', imageBuffer.length, 'bytes');
    
    const mimeType = response.headers.get('content-type') || 'image/png';
    console.log('📥 [GEMINI] MIME type detectado:', mimeType);

    console.log('🤖 [GEMINI] Procesando imagen con Gemini AI...');
    
    // Analizar con Gemini
    const analysis = await geminiAnalyzer.analyzeImage(imageBuffer, mimeType);
    
    console.log('✅ [GEMINI] Análisis completado:', {
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
    console.log('🧪 [ANALYZE] Iniciando análisis de ticket...');
    console.log('🧪 [ANALYZE] Environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      BLOB_TOKEN: !!getBlobStorageToken(),
      GEMINI_KEY: !!process.env.GOOGLE_GEMINI_API_KEY
    });
    
    const formData = await request.formData();
    console.log('🧪 [ANALYZE] FormData recibido');
    
    const validatedData = validateFormData(formData);
    console.log('🧪 [ANALYZE] Datos validados:', validatedData);
    
    const image = formData.get('image') as File;
    console.log('🧪 [ANALYZE] Imagen recibida:', {
      name: image?.name,
      size: image?.size,
      type: image?.type,
      hasContent: !!image
    });

    if (!image) {
      console.log('❌ [ANALYZE] No se recibió imagen en FormData');
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

    console.log('🧪 [ANALYZE] Buscando cliente por cédula y businessId...');
    
    // Buscar cliente por cédula - usar findFirst ya que ahora cedula no es única
    const cliente = await prisma.cliente.findFirst({
      where: { 
        cedula: validatedData.cedula,
        businessId: validatedData.businessId || 'cmfr2y0ia0000eyvw7ef3k20u' // Fallback al business por defecto
      },
      include: {
        business: true
      }
    });

    if (!cliente) {
      console.log('🧪 [ANALYZE] Cliente no encontrado para cédula:', validatedData.cedula);
      return NextResponse.json(
        { success: false, error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    console.log('✅ Cliente encontrado:', cliente.nombre);

    // Guardar imagen temporalmente
    console.log('💾 [ANALYZE] Guardando imagen en Vercel Blob...');
    const { filepath, publicUrl } = await saveImageFile(image);
    console.log('✅ [ANALYZE] Imagen guardada:', { filepath, publicUrl });

    // Procesar imagen con Gemini AI
    console.log('🤖 [ANALYZE] Iniciando análisis con IA...');
    console.log('🤖 [ANALYZE] URL de imagen para Gemini:', publicUrl);
    const analysis = await processImageWithGemini(filepath);

    // Responder con datos para confirmación (SIN GUARDAR AÚN)
    return NextResponse.json({
      success: true,
      message: 'Imagen analizada exitosamente - Pendiente de confirmación',
      requiresConfirmation: true,
      data: {
        // Información del cliente
        clienteCliente: {
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

  } catch (error: any) {
    console.error('🧪 [ANALYZE] Error en análisis de imagen:', error);
    console.error('🧪 [ANALYZE] Stack trace:', error.stack);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        details: error.message,
        type: error.constructor.name
      },
      { status: 500 }
    );
  }
}
