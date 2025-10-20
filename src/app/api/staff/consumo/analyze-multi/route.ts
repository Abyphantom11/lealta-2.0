import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { z } from 'zod';
import { put } from '@vercel/blob';
import { geminiAnalyzer } from '../../../../../lib/ai/gemini-analyzer';
import { getBlobStorageToken } from '@/lib/blob-storage-utils';

// Forzar renderizado dinámico para esta ruta que usa autenticación
export const dynamic = 'force-dynamic';

// Types for multi-image processing
interface ProcessedImage {
  id: string;
  filename: string;
  filepath: string;
  publicUrl: string;
  status: 'processing' | 'completed' | 'error';
  error?: string;
  analysis?: {
    productos: Array<{ nombre: string; cantidad: number; precio: number; categoria?: string }>;
    total: number;
    empleadoDetectado: string | null;
    confianza: number;
    fecha: string | null;
    puntosGenerados: number;
    tipoDocumento?: string;
    negocio?: string | null;
    metodoPago?: string | null;
  };
}

interface BatchAnalysisResult {
  batchId: string;
  totalImages: number;
  processedImages: number;
  successfulImages: number;
  failedImages: number;
  results: ProcessedImage[];
  summary: {
    totalAmount: number;
    totalPoints: number;
    uniqueEmployees: string[];
    averageConfidence: number;
  };
}

// Helper function to validate multi-image form data
function validateMultiFormData(formData: FormData) {
  const schema = z.object({
    cedula: z.string().min(1, 'Cédula es requerida'),
    businessId: z.string().min(1, 'BusinessId es requerido'),
    empleadoId: z.string().optional(),
    maxImages: z.number().min(1).max(10).optional().default(5),
  });

  return schema.parse({
    cedula: formData.get('cedula'),
    businessId: formData.get('businessId'),
    empleadoId: formData.get('empleadoId'),
    maxImages: formData.get('maxImages') ? parseInt(formData.get('maxImages') as string) : 5,
  });
}

// Helper function to save multiple images to Vercel Blob
async function saveMultipleImages(images: File[]): Promise<ProcessedImage[]> {
  const results: ProcessedImage[] = [];

  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    try {
      // ⚠️ VALIDACIÓN DE MEMORIA CRÍTICA - Prevenir allocation failed
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB máximo
      if (image.size > MAX_FILE_SIZE) {
        throw new Error(`Archivo demasiado grande: ${Math.round(image.size / 1024 / 1024)}MB. Máximo permitido: 10MB`);
      }
      
      console.log(`📁 Procesando imagen: ${Math.round(image.size / 1024)}KB`);
      
      const timestamp = Date.now();
      const imageId = `multi_${timestamp}_${i}`;
      // Preservar la extensión original del archivo
      const fileExtension = image.name.split('.').pop() || 'png';
      const filename = `multi/${imageId}.${fileExtension}`;
      
      // 🔥 UPLOAD A VERCEL BLOB STORAGE - CON TOKEN CENTRALIZADO
      const token = getBlobStorageToken();
      
      if (!token) {
        throw new Error('No valid blob storage token available');
      }
      
      const blob = await put(filename, image, {
        access: 'public',
        token: token,
      });
      
      results.push({
        id: imageId,
        filename: blob.url,
        filepath: blob.url,
        publicUrl: blob.url,
        status: 'processing',
      });
    } catch (error) {
      console.error(`Error saving image ${i}:`, error);
      const errorTimestamp = Date.now();
      results.push({
        id: `error_${errorTimestamp}_${i}`,
        filename: image.name,
        filepath: '',
        publicUrl: '',
        status: 'error',
        error: 'Failed to save image',
      });
    }
  }

  return results;
}

// Helper function to process image with Gemini AI (using Vercel Blob URL)
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
    console.log('📥 Descargando imagen desde Vercel Blob:', imageUrl);
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    
    const imageBuffer = Buffer.from(await response.arrayBuffer());
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

// Process multiple images concurrently with controlled concurrency
async function processImagesInBatches(
  images: ProcessedImage[], 
  batchSize: number = 3
): Promise<ProcessedImage[]> {
  const results: ProcessedImage[] = [...images];
  
  // Process in batches to avoid overwhelming the AI service
  for (let i = 0; i < results.length; i += batchSize) {
    const batch = results.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (image, index) => {
      if (image.status === 'error') return image;
      
      try {
        console.log(`🔄 Procesando imagen ${i + index + 1}/${results.length}: ${image.filename}`);
        const analysis = await processImageWithGemini(image.filepath);
        
        return {
          ...image,
          status: 'completed' as const,
          analysis,
        };
      } catch (error) {
        console.error(`❌ Error procesando imagen ${image.filename}:`, error);
        return {
          ...image,
          status: 'error' as const,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    
    // Update results array with batch results
    for (let j = 0; j < batchResults.length; j++) {
      results[i + j] = batchResults[j];
    }
    
    // Add a small delay between batches to be respectful to the AI service
    if (i + batchSize < results.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}

// Generate batch analysis summary
function generateBatchSummary(results: ProcessedImage[]): BatchAnalysisResult['summary'] {
  const completedResults = results.filter(r => r.status === 'completed' && r.analysis);
  
  const totalAmount = completedResults.reduce((sum, r) => sum + (r.analysis?.total || 0), 0);
  const totalPoints = completedResults.reduce((sum, r) => sum + (r.analysis?.puntosGenerados || 0), 0);
  const employeeNames = completedResults
    .map(r => r.analysis?.empleadoDetectado)
    .filter(Boolean) as string[];
  const uniqueEmployees = [...new Set(employeeNames)];
  const averageConfidence = completedResults.length > 0 
    ? completedResults.reduce((sum, r) => sum + (r.analysis?.confianza || 0), 0) / completedResults.length
    : 0;

  return {
    totalAmount,
    totalPoints,
    uniqueEmployees,
    averageConfidence: Math.round(averageConfidence * 100) / 100,
  };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const validatedData = validateMultiFormData(formData);
    
    // Get all uploaded images
    const imageFiles: File[] = [];
    const entries = Array.from(formData.entries());
    
    for (const [key, value] of entries) {
      if ((key === 'images' || key.startsWith('image')) && value instanceof File) {
        imageFiles.push(value);
      }
    }

    if (imageFiles.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No se recibieron imágenes' },
        { status: 400 }
      );
    }

    if (imageFiles.length > validatedData.maxImages) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Máximo ${validatedData.maxImages} imágenes permitidas. Recibidas: ${imageFiles.length}` 
        },
        { status: 400 }
      );
    }

    // Validate all files are images and within size limits
    for (const image of imageFiles) {
      if (!image.type.startsWith('image/')) {
        return NextResponse.json(
          { success: false, error: `El archivo ${image.name} debe ser una imagen` },
          { status: 400 }
        );
      }

      if (image.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, error: `La imagen ${image.name} es demasiado grande (máximo 10MB)` },
          { status: 400 }
        );
      }
    }

    // Buscar cliente por cédula usando clave compuesta
    const cliente = await prisma.cliente.findUnique({
      where: { 
        businessId_cedula: {
          businessId: validatedData.businessId,
          cedula: validatedData.cedula
        }
      },
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

    console.log(`✅ Cliente encontrado: ${cliente.nombre} - Procesando ${imageFiles.length} imágenes`);

    // Save all images first
    console.log('💾 Guardando imágenes...');
    const savedImages = await saveMultipleImages(imageFiles);
    
    // Process all images
    console.log('🤖 Iniciando análisis masivo con IA...');
    const processedImages = await processImagesInBatches(savedImages, 2); // Process 2 at a time
    
    // Generate batch summary
    const summary = generateBatchSummary(processedImages);
    
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    
    const result: BatchAnalysisResult = {
      batchId,
      totalImages: imageFiles.length,
      processedImages: processedImages.length,
      successfulImages: processedImages.filter(r => r.status === 'completed').length,
      failedImages: processedImages.filter(r => r.status === 'error').length,
      results: processedImages,
      summary,
    };

    console.log(`✅ Procesamiento masivo completado: ${result.successfulImages}/${result.totalImages} exitosas`);

    // Responder con datos para confirmación masiva (SIN GUARDAR AÚN)
    return NextResponse.json({
      success: true,
      message: `${result.successfulImages} imágenes analizadas exitosamente - Pendiente de confirmación masiva`,
      requiresConfirmation: true,
      isBatchProcess: true,
      data: {
        // Información del cliente
        clienteCliente: {
          id: cliente.id,
          nombre: cliente.nombre,
          cedula: cliente.cedula,
          puntosActuales: cliente.puntos,
        },
        // Información del procesamiento masivo
        batch: result,
        // Metadatos para confirmar
        metadata: {
          businessId: validatedData.businessId,
          empleadoId: validatedData.empleadoId,
          timestamp: new Date().toISOString(),
          requiereRevision: summary.averageConfidence < 0.7,
        }
      }
    });

  } catch (error) {
    console.error('Error en análisis masivo de imágenes:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Error interno del servidor en procesamiento masivo' },
      { status: 500 }
    );
  }
}
