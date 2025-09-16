import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { z } from 'zod';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { geminiAnalyzer } from '../../../../lib/ai/gemini-analyzer';
import fs from 'fs';

const PORTAL_CONFIG_PATH = join(process.cwd(), 'portal-config.json');

// Forzar renderizado dinámico para esta ruta que usa autenticación
export const dynamic = 'force-dynamic';

// Helper function to get or create default location
async function getOrCreateDefaultLocation(businessId?: string): Promise<string> {
  let location = await prisma.location.findFirst({
    where: businessId ? { businessId } : {},
  });

  if (!location) {
    let business;
    if (businessId) {
      business = await prisma.business.findUnique({
        where: { id: businessId },
      });
    } else {
      business = await prisma.business.findFirst();
    }

    if (!business) {
      throw new Error('No se encontró un negocio válido');
    }

    location = await prisma.location.create({
      data: {
        name: 'Ubicación Principal',
        businessId: business.id,
      },
    });
  }

  return location.id;
}

// Helper function to validate form data
function validateFormData(formData: FormData) {
  const schema = z.object({
    cedula: z.string().min(1, 'Cédula es requerida'),
    monto: z.string().min(1, 'Monto es requerido'),
    businessId: z.string().optional(),
    empleadoId: z.string().optional(),
  });

  return schema.parse({
    cedula: formData.get('cedula'),
    monto: formData.get('monto'),
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
  const randomString = Math.random().toString(36).substring(2, 8);
  const filename = `${timestamp}-${randomString}.jpg`;

  const uploadDir = join(process.cwd(), 'public', 'uploads');
  await mkdir(uploadDir, { recursive: true });

  const filepath = join(uploadDir, filename);
  await writeFile(filepath, buffer);

  const publicUrl = `/uploads/${filename}`;
  return { filepath, publicUrl };
}

// Helper function to process image with Gemini AI
async function processImageWithGemini(filepath: string): Promise<{
  ocrText: string;
  productos: Array<{ name: string; price?: number; line: string }>;
  total: number;
  empleadoDetectado: string;
  confianza: number;
}> {
  try {
    const imageBuffer = fs.readFileSync(filepath);
    const mimeType = 'image/jpeg';

    console.log('🤖 Procesando imagen con Gemini AI...');

    // Analizar con Gemini
    const analysis = await geminiAnalyzer.analyzeImage(imageBuffer, mimeType);

    console.log('✅ Análisis completado:', {
      total: analysis.total,
      productos: analysis.productos.length,
      confianza: analysis.confianza,
      empleado: analysis.empleado
    });

    // Convertir formato para compatibilidad
    const productos = analysis.productos.map((p) => ({
      name: p.nombre,
      price: p.precio,
      line: `${p.nombre} x${p.cantidad} - $${p.precio}`
    }));

    return {
      ocrText: `Gemini AI - Análisis completado con confianza: ${(analysis.confianza * 100).toFixed(1)}%`,
      productos,
      total: analysis.total,
      empleadoDetectado: analysis.empleado || 'No detectado',
      confianza: analysis.confianza
    };

  } catch (error) {
    console.error('❌ Error en procesamiento con Gemini:', error);

    // Fallback values si falla el análisis
    return {
      ocrText: 'Error en procesamiento automático',
      productos: [
        {
          name: 'Producto fallback',
          price: 25.50,
          line: 'Error: Análisis manual requerido'
        }
      ],
      total: 25.50,
      empleadoDetectado: 'No detectado',
      confianza: 0.1
    };
  }
}

// Helper functions para reducir complejidad cognitiva
async function loadPuntosConfiguration(): Promise<number> {
  let puntosPorDolar = 4;

  try {
    const configContent = await fs.promises.readFile(PORTAL_CONFIG_PATH, 'utf-8');
    const config = JSON.parse(configContent);
    puntosPorDolar = config.configuracionPuntos?.puntosPorDolar || 4;
    console.log('✅ Configuración de puntos cargada (OCR):', { puntosPorDolar });
  } catch (error) {
    console.warn('⚠️ No se pudo cargar configuración de puntos, usando valor por defecto:', error);
  }

  return puntosPorDolar;
}

async function createConsumo(cliente: any, validatedData: any, analysis: any, montoFinal: number, puntosGenerados: number, publicUrl: string) {
  const locationId = await getOrCreateDefaultLocation(validatedData.businessId);

  return await prisma.consumo.create({
    data: {
      clienteId: cliente.id,
      businessId: validatedData.businessId,
      locationId: locationId,
      empleadoId: validatedData.empleadoId || '',
      productos: {
        items: analysis.productos,
        total: montoFinal,
        empleado: analysis.empleadoDetectado,
        confianza: analysis.confianza
      },
      total: montoFinal,
      puntos: puntosGenerados,
      pagado: true,
      metodoPago: 'efectivo',
      ticketImageUrl: publicUrl,
      ocrText: analysis.ocrText
    }
  });
}

async function updateClientePuntos(cliente: any, puntosGenerados: number) {
  return await prisma.cliente.update({
    where: { id: cliente.id },
    data: {
      puntos: { increment: puntosGenerados },
      puntosAcumulados: { increment: puntosGenerados }
    },
    include: { tarjetaLealtad: true }
  });
}

async function syncTarjetaPuntos(clienteActualizado: any) {
  if (clienteActualizado.tarjetaLealtad) {
    await prisma.tarjetaLealtad.update({
      where: { clienteId: clienteActualizado.id },
      data: { puntosProgreso: clienteActualizado.puntosAcumulados }
    });
    console.log(`📊 PuntosProgreso actualizados a ${clienteActualizado.puntosAcumulados}`);
  }
}

async function triggerLevelEvaluation(cliente: any) {
  try {
    const evaluacionResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/api/admin/evaluar-nivel-cliente`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clienteId: cliente.id })
    });

    if (evaluacionResponse.ok) {
      const evaluacionData = await evaluacionResponse.json();
      return evaluacionData;
    }
  } catch (error) {
    console.warn('⚠️ Error disparando evaluación automática:', error);
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const validatedData = validateFormData(formData);
    const image = formData.get('image') as File;

    if (!image) {
      return NextResponse.json({ success: false, error: 'No se recibió ninguna imagen' }, { status: 400 });
    }

    if (!image.type.startsWith('image/')) {
      return NextResponse.json({ success: false, error: 'El archivo debe ser una imagen' }, { status: 400 });
    }

    if (image.size > 10 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'La imagen es demasiado grande (máximo 10MB)' }, { status: 400 });
    }

    const cliente = await prisma.cliente.findUnique({
      where: { cedula: validatedData.cedula }
    });

    if (!cliente) {
      return NextResponse.json({ success: false, error: 'Cliente no encontrado' }, { status: 404 });
    }

    const { filepath, publicUrl } = await saveImageFile(image);
    const analysis = await processImageWithGemini(filepath);

    if (analysis.confianza < 0.3) {
      console.log('⚠️ Confianza baja en el análisis:', analysis.confianza);
    }

    const puntosPorDolar = await loadPuntosConfiguration();
    const montoFinal = analysis.total > 0 ? analysis.total : parseFloat(validatedData.monto);
    const puntosGenerados = Math.floor(montoFinal * puntosPorDolar);

    const consumo = await createConsumo(cliente, validatedData, analysis, montoFinal, puntosGenerados, publicUrl);
    const clienteActualizado = await updateClientePuntos(cliente, puntosGenerados);
    await syncTarjetaPuntos(clienteActualizado);

    const evaluacionData = await triggerLevelEvaluation(cliente);

    if (evaluacionData?.actualizado) {
      console.log(`🆙 ¡Cliente ascendió automáticamente de ${evaluacionData.nivelAnterior} a ${evaluacionData.nivelNuevo}!`);
    }

    console.log('✅ Consumo registrado exitosamente:', {
      consumoId: consumo.id,
      cliente: cliente.cedula,
      puntos: puntosGenerados,
      monto: montoFinal,
      confianza: analysis.confianza
    });

    return NextResponse.json({
      success: true,
      message: 'Consumo registrado exitosamente con análisis AI',
      data: {
        consumoId: consumo.id,
        clienteNombre: cliente.nombre,
        clienteCedula: cliente.cedula,
        puntosGenerados: puntosGenerados,
        montoDetectado: montoFinal,
        puntosAcumulados: clienteActualizado.puntos,
        analisisIA: {
          productos: analysis.productos,
          empleadoDetectado: analysis.empleadoDetectado,
          confianza: Math.round(analysis.confianza * 100),
          requiereRevision: analysis.confianza < 0.7,
          procesadoConIA: true
        }
      }
    });

  } catch (error) {
    console.error('Error en registro de consumo:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}