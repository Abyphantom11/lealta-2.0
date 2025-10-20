import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { z } from 'zod';
import { put } from '@vercel/blob';
import { geminiAnalyzer } from '../../../../lib/ai/gemini-analyzer';
import { logger } from '@/utils/production-logger';
import { getBlobStorageToken } from '@/lib/blob-storage-utils';
import { withAuth } from '@/middleware/requireAuth';
import { nanoid } from 'nanoid';

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
        id: nanoid(),
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

// Helper function to save image to Vercel Blob
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

  logger.debug(`📁 Processing consumption image: ${Math.round(image.size / 1024)}KB, type: ${image.type}`);

  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  // Preservar la extensión original del archivo
  const fileExtension = image.name.split('.').pop() || 'jpg';
  const filename = `consumos/${timestamp}-${randomString}.${fileExtension}`;

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
    filepath: blob.url, // URL de Vercel Blob
    publicUrl: blob.url 
  };
}

// Helper function to process image with Gemini AI
async function processImageWithGemini(imageUrl: string): Promise<{
  ocrText: string;
  productos: Array<{ name: string; price?: number; line: string }>;
  total: number;
  empleadoDetectado: string;
  confianza: number;
}> {
  try {
    // Descargar imagen desde Vercel Blob
    logger.debug('📥 Downloading image from Vercel Blob:', imageUrl);
    const response = await fetch(imageUrl);
    const imageBuffer = Buffer.from(await response.arrayBuffer());
    const mimeType = 'image/jpeg';

    logger.debug('🤖 Processing image with Gemini AI...');

    // Analizar con Gemini
    const analysis = await geminiAnalyzer.analyzeImage(imageBuffer, mimeType);

    logger.info('✅ Gemini analysis completed:', {
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
    logger.error('❌ Error in Gemini AI processing:', error);

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
async function loadPuntosConfiguration(businessId?: string): Promise<number> {
  try {
    if (!businessId) {
      logger.warn('⚠️ No businessId provided, using default points configuration');
      return 4; // Fallback por defecto
    }

    // 🔄 MIGRADO: Leer configuración desde PostgreSQL Database
    const puntosConfig = await prisma.puntosConfig.findUnique({
      where: { businessId }
    });
    
    if (puntosConfig) {
      logger.debug('✅ Points configuration loaded from DATABASE for business:', { 
        businessId, 
        puntosPorDolar: puntosConfig.puntosPorDolar 
      });
      return puntosConfig.puntosPorDolar;
    }

    // Fallback: Crear configuración por defecto en la DB
    logger.info('⚙️ Creating default points config in DATABASE for business:', businessId);
    const newConfig = await prisma.puntosConfig.create({
      data: {
        id: nanoid(),
        businessId,
        puntosPorDolar: 4,
        bonusPorRegistro: 100,
        maxPuntosPorDolar: 10,
        maxBonusRegistro: 1000,
        updatedAt: new Date(),
      }
    });
    
    return newConfig.puntosPorDolar;
  } catch (error) {
    logger.warn('⚠️ Error loading points configuration from DATABASE, using default:', error);
    return 4; // Fallback por defecto
  }
}

async function createConsumo(cliente: any, validatedData: any, analysis: any, montoFinal: number, puntosGenerados: number, publicUrl: string) {
  const locationId = await getOrCreateDefaultLocation(validatedData.businessId);

  return await prisma.consumo.create({
    data: {
      id: nanoid(),
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
    include: { TarjetaLealtad: true }
  });
}

async function syncTarjetaPuntos(clienteActualizado: any) {
  if (clienteActualizado.TarjetaLealtad) {
    // 🎯 LÓGICA CORREGIDA: Para tarjetas manuales, mantener progreso correcto
    const esAsignacionManual = clienteActualizado.TarjetaLealtad.asignacionManual;
    const puntosProgresoActual = clienteActualizado.TarjetaLealtad.puntosProgreso || 0;
    const puntosAcumulados = clienteActualizado.puntosAcumulados || 0;
    
    let nuevoPuntosProgreso;
    
    if (esAsignacionManual) {
      // Para tarjetas manuales: si los puntos acumulados superan el progreso actual, usar acumulados
      // Esto permite que el progreso crezca con nuevos consumos
      nuevoPuntosProgreso = Math.max(puntosProgresoActual, puntosAcumulados);
    } else {
      // Para tarjetas automáticas: usar siempre puntos acumulados
      nuevoPuntosProgreso = puntosAcumulados;
    }
    
    await prisma.tarjetaLealtad.update({
      where: { clienteId: clienteActualizado.id },
      data: { puntosProgreso: nuevoPuntosProgreso }
    });
    
    logger.debug(`📊 Points progress updated: ${puntosProgresoActual} → ${nuevoPuntosProgreso} (manual: ${esAsignacionManual}, accumulated: ${puntosAcumulados})`);
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
    logger.warn('⚠️ Error triggering automatic level evaluation:', error);
  }
  return null;
}

/**
 * 🔒 POST /api/staff/consumo - Registrar consumo con análisis de imagen AI
 * Requiere autenticación: ADMIN, STAFF o SUPERADMIN
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async (session) => {
    try {
      const formData = await request.formData();
      const validatedData = validateFormData(formData);
      const image = formData.get('image') as File;

      // 🔐 SECURITY: Validar business ownership
      const businessId = validatedData.businessId || 'cmfr2y0ia0000eyvw7ef3k20u';
      if (session.businessId !== businessId && session.role !== 'superadmin') {
        logger.warn(`❌ AUTH DENIED: User ${session.userId} (${session.role}) tried to register consumption for different business`);
        return NextResponse.json(
          { success: false, error: 'No tiene permiso para registrar consumos en este negocio' },
          { status: 403 }
        );
      }

      if (!image) {
        return NextResponse.json({ success: false, error: 'No se recibió ninguna imagen' }, { status: 400 });
      }

      if (!image.type.startsWith('image/')) {
        return NextResponse.json({ success: false, error: 'El archivo debe ser una imagen' }, { status: 400 });
    }

    if (image.size > 10 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'La imagen es demasiado grande (máximo 10MB)' }, { status: 400 });
    }

    // Buscar cliente usando la clave compuesta businessId + cedula
    const cliente = await prisma.cliente.findUnique({
      where: { 
        businessId_cedula: {
          businessId: validatedData.businessId || 'cmfr2y0ia0000eyvw7ef3k20u', // fallback business
          cedula: validatedData.cedula
        }
      }
    });

    if (!cliente) {
      return NextResponse.json({ success: false, error: 'Cliente no encontrado' }, { status: 404 });
    }

    const { filepath, publicUrl } = await saveImageFile(image);
    const analysis = await processImageWithGemini(filepath);

    if (analysis.confianza < 0.3) {
      logger.warn('⚠️ Low confidence in analysis:', analysis.confianza);
    }

    const puntosPorDolar = await loadPuntosConfiguration(validatedData.businessId || 'cmfr2y0ia0000eyvw7ef3k20u');
    const montoFinal = analysis.total > 0 ? analysis.total : parseFloat(validatedData.monto);
    const puntosGenerados = Math.floor(montoFinal * puntosPorDolar);

    const consumo = await createConsumo(cliente, validatedData, analysis, montoFinal, puntosGenerados, publicUrl);
    const clienteActualizado = await updateClientePuntos(cliente, puntosGenerados);
    await syncTarjetaPuntos(clienteActualizado);

    const evaluacionData = await triggerLevelEvaluation(cliente);

    if (evaluacionData?.actualizado) {
      logger.info(`🆙 Client automatically promoted from ${evaluacionData.nivelAnterior} to ${evaluacionData.nivelNuevo}!`);
    }

    logger.info('✅ Consumption registered successfully:', {
      consumoId: consumo.id,
      cliente: cliente.cedula,
      puntos: puntosGenerados,
      monto: montoFinal,
      confianza: analysis.confianza
    });

    // 📊 LOG DE AUDITORÍA
    logger.info(`💰 Consumo registrado por: ${session.role} (${session.userId}) - Cliente: ${cliente.cedula} - Monto: $${montoFinal} - Puntos: ${puntosGenerados}`);

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

  } catch (error: unknown) {
    logger.error('❌ Error in consumption registration:', error);

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
  }, {
    allowedRoles: ['admin', 'staff', 'superadmin'], // Staff puede registrar consumos
    requireBusinessOwnership: true,
    logAccess: true
  });
}