import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { z } from 'zod';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import Tesseract from 'tesseract.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Forzar renderizado dinámico para esta ruta que usa autenticación
export const dynamic = 'force-dynamic';

// Funciones auxiliares para simplificar el código principal

// Initialize Google Gemini AI
const genAI = process.env.GOOGLE_GEMINI_API_KEY 
  ? new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY)
  : null;

// Helper function to get or create default location
async function getOrCreateDefaultLocation(businessId?: string): Promise<string> {
  // Try to find an existing location
  let location = await prisma.location.findFirst({
    where: businessId ? { businessId } : {},
  });

  // If no location exists, create a default one
  if (!location) {
    // If no businessId provided, try to get the first business or create one
    let business;
    businessId ??= (await prisma.business.findFirst())?.id;
    
    if (!businessId) {
      business = await prisma.business.create({
        data: {
          name: 'Negocio Principal',
          slug: 'negocio-principal',
          subdomain: 'principal',
        },
      });
      businessId = business.id;
    }

    location = await prisma.location.create({
      data: {
        businessId: businessId,
        name: 'Ubicación Principal',
      },
    });
  }

  return location.id;
}

// Helper function to validate form data
function validateFormData(formData: FormData) {
  const image = formData.get('image') as File;
  const cedula = formData.get('cedula') as string;
  const locationId = formData.get('locationId') as string;
  const empleadoId = (formData.get('empleadoId') as string) || 'system';

  // Validate required fields
  if (!image || !cedula || !locationId) {
    return {
      error: 'Faltan campos requeridos: image, cedula, locationId',
      status: 400
    };
  }

  // Validate image
  if (!image.type.startsWith('image/')) {
    return {
      error: 'El archivo debe ser una imagen',
      status: 400
    };
  }

  if (image.size > 5 * 1024 * 1024) { // 5MB limit
    return {
      error: 'La imagen no puede superar 5MB',
      status: 400
    };
  }

  return {
    data: { image, cedula, locationId, empleadoId },
    error: null
  };
}

// Helper function to save image
async function saveImageFile(image: File): Promise<{ filepath: string; publicUrl: string }> {
  const bytes = await image.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Create uploads directory if it doesn't exist
  const uploadsDir = join(process.cwd(), 'public', 'uploads');
  try {
    await mkdir(uploadsDir, { recursive: true });
  } catch (error) {
    console.error('Error creating uploads directory:', error);
    // Directory might already exist, continue
  }

  // Generate unique filename
  const timestamp = Date.now();
  const extension = image.name.split('.').pop();
  const filename = `ticket_${timestamp}.${extension}`;
  const filepath = join(uploadsDir, filename);
  const publicUrl = `/uploads/${filename}`;

  await writeFile(filepath, buffer);
  
  return { filepath, publicUrl };
}

// Helper function to process OCR with AI
async function processOCRWithAI(filepath: string): Promise<{
  ocrText: string;
  productos: Array<{ name: string; price?: number; line: string }>;
  total: number;
  empleadoDetectado: string;
}> {
  let ocrText = '';
  let productos: { name: string; price?: number; line: string }[] = [];
  let total = 0;
  let empleadoDetectado = 'No detectado';

  try {
    // Performing OCR on uploaded image
    const {
      data: { text },
    } = await Tesseract.recognize(filepath, 'spa', {
      logger: () => {}, // Silent OCR processing
    });

    ocrText = text;

    // Use Google Gemini AI for enhanced ticket analysis if available
    if (genAI && text.trim().length > 10) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        
        const prompt = `
          Analiza este ticket de venta y extrae la información en formato JSON:
          
          Texto del ticket:
          "${text}"
          
          Devuelve SOLO un JSON válido con esta estructura:
          {
            "empleado": "nombre del empleado/cajero/vendedor (o 'No detectado' si no encuentras)",
            "total": número (monto total de la compra),
            "productos": [
              {
                "name": "nombre del producto",
                "price": número (precio del producto),
                "line": "línea original del ticket"
              }
            ]
          }
          
          Reglas:
          - Busca nombres de empleados, cajeros, vendedores en el ticket
          - Si no encuentras el total, devuelve 0
          - Si no encuentras productos, devuelve array vacío
          - Solo números para precios, sin símbolos de moneda
          - Responde SOLO con el JSON, sin explicaciones adicionales
        `;

        const result = await model.generateContent(prompt);
        const aiResponse = result.response.text();
        
        // Clean up response (remove markdown formatting)
        const cleanedResponse = aiResponse
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .trim();
        
        // Try to parse AI response
        const aiData = JSON.parse(cleanedResponse);
        
        if (aiData.total && typeof aiData.total === 'number') {
          total = aiData.total;
        }
        
        if (aiData.productos && Array.isArray(aiData.productos)) {
          productos = aiData.productos.map((p: any, index: number) => ({
            name: p.name || `Producto ${index + 1}`,
            price: typeof p.price === 'number' ? p.price : 0,
            line: p.line || p.name || `Línea ${index + 1}`
          }));
        }

        // Store detected employee for confirmation
        empleadoDetectado = aiData.empleado || 'No detectado';

        console.log('✅ Gemini AI analysis successful');
      } catch (aiError) {
        console.log('⚠️ Gemini AI failed, using fallback OCR analysis:', aiError);
        // Fall back to basic OCR analysis
        const basicResult = performBasicOCRAnalysis(text);
        total = basicResult.total;
        productos = basicResult.productos;
      }
    } else {
      // Use basic OCR analysis if Gemini is not available
      const basicResult = performBasicOCRAnalysis(text);
      total = basicResult.total;
      productos = basicResult.productos;
    }

    // Fallback if no total found
    if (total === 0) {
      total = 25.5; // Fallback amount for demo
    }

  } catch (ocrError) {
    console.error('OCR Error:', ocrError);
    // Fallback values if OCR fails
    ocrText = 'OCR processing failed';
    total = 25.5; // Fallback amount
    productos = [
      {
        name: 'Producto detectado',
        price: total,
        line: 'Procesamiento automático',
      },
    ];
  }

  return { ocrText, productos, total, empleadoDetectado };
}

// Function for basic OCR analysis
function performBasicOCRAnalysis(text: string): {
  total: number;
  productos: Array<{ name: string; price?: number; line: string }>;
} {
  let total = 0;
  let productos: { name: string; price?: number; line: string }[] = [];

  // Simple heuristic to extract total (look for patterns like $XX.XX or TOTAL: XX.XX)
  const totalRegex = /(?:total|sum|suma|precio)[:\s]*\$?(\d+(?:[.,]\d{2})?)/i;
  const totalMatches = totalRegex.exec(text);
  if (totalMatches) {
    total = parseFloat(totalMatches[1].replace(',', '.'));
  }

  // Try to extract product lines (very basic heuristic)
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  productos = lines
    .filter(line => /\$?\d+(?:[.,]\d{2})?/.test(line))
    .slice(0, 10) // Limit to first 10 potential products
    .map((line, index) => {
      const priceRegex = /\$?(\d+(?:[.,]\d{2})?)/;
      const priceMatch = priceRegex.exec(line);
      const price = priceMatch
        ? parseFloat(priceMatch[1].replace(',', '.'))
        : 0;
      return {
        name:
          line.replace(/\$?\d+(?:[.,]\d{2})?/g, '').trim() ||
          `Producto ${index + 1}`,
        price: price,
        line: line.trim(),
      };
    });

  // If no total was found, sum up product prices
  if (total === 0 && productos.length > 0) {
    total = productos.reduce(
      (sum, p: { price?: number }) => sum + (p.price ?? 0),
      0
    );
  }

  return { total, productos };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Validate and extract form data
    const validation = validateFormData(formData);
    if (validation.error) {
      return NextResponse.json({ error: validation.error }, { status: validation.status });
    }

    const { image, cedula } = validation.data!;

    // Find client
    const cliente = await prisma.cliente.findUnique({
      where: { cedula: cedula },
    });

    if (!cliente) {
      return NextResponse.json(
        { error: 'Cliente no encontrado. Debe estar registrado primero.' },
        { status: 404 }
      );
    }

    // Get or create default location
    const actualLocationId = await getOrCreateDefaultLocation(cliente.businessId ?? undefined);

    // Save image to public/uploads
    const { filepath, publicUrl } = await saveImageFile(image);

    // Perform OCR and process with AI
    const { ocrText, productos, total, empleadoDetectado } = await processOCRWithAI(filepath);

    // Calculate points (basic: 1 point per dollar)
    const puntos = Math.floor(total);

    // Instead of creating the consumo immediately, return data for confirmation
    return NextResponse.json({
      success: true,
      requiresConfirmation: true,
      empleadoDetectado: empleadoDetectado || 'No detectado',
      total: total,
      puntos: puntos,
      productos: productos,
      ocrText: ocrText,
      ticketImageUrl: publicUrl,
      locationId: actualLocationId, // Include for confirmation API
      cliente: {
        nombre: cliente.nombre,
        puntosActuales: cliente.puntos,
        puntosNuevos: cliente.puntos + puntos,
      },
      message: 'Ticket procesado por IA. Confirma los datos antes de registrar.',
    });
  } catch (error) {
    console.error('Consumo registration error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
