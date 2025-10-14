import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Obtener todos los QR links
export async function GET() {
  try {
    const qrLinks = await prisma.qRLink.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        _count: {
          select: { clicks: true }
        }
      }
    });

    // Transformar datos para el frontend
    const transformedLinks = qrLinks.map(link => ({
      id: link.id,
      shortId: link.shortId,
      name: link.name,
      targetUrl: link.targetUrl,
      backupUrl: link.backupUrl,
      isActive: link.isActive,
      clickCount: link._count.clicks,
      createdAt: link.createdAt.toISOString(),
      expiresAt: link.expiresAt?.toISOString()
    }));

    const response = NextResponse.json({
      success: true,
      links: transformedLinks
    });

    // Headers para mejorar compatibilidad con Safari
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    return response;
  } catch (error) {
    console.error('Error fetching QR links:', error);
    const errorResponse = NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
    
    // Headers para errores también
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
    
    return errorResponse;
  }
}

// POST - Crear nuevo QR link
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, targetUrl, backupUrl, expiresAt } = body;

    // Validaciones
    if (!name || !targetUrl) {
      return NextResponse.json(
        { success: false, message: 'Nombre y URL destino son requeridos' },
        { status: 400 }
      );
    }

    // Validar formato de URL
    try {
      new URL(targetUrl);
      if (backupUrl) new URL(backupUrl);
    } catch {
      return NextResponse.json(
        { success: false, message: 'URL inválida' },
        { status: 400 }
      );
    }

    // Generar shortId único
    const shortId = await generateUniqueShortId();

    // Crear en la base de datos
    const newLink = await prisma.qRLink.create({
      data: {
        shortId,
        name: name.trim(),
        targetUrl: targetUrl.trim(),
        backupUrl: backupUrl?.trim() || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      }
    });

    console.log('✅ QR Link creado:', {
      id: newLink.id,
      shortId: newLink.shortId,
      name: newLink.name,
      targetUrl: newLink.targetUrl
    });

    // Transformar para el frontend
    const transformedLink = {
      id: newLink.id,
      shortId: newLink.shortId,
      name: newLink.name,
      targetUrl: newLink.targetUrl,
      backupUrl: newLink.backupUrl,
      isActive: newLink.isActive,
      clickCount: 0, // Nuevo link, sin clicks
      createdAt: newLink.createdAt.toISOString(),
      expiresAt: newLink.expiresAt?.toISOString()
    };

    const response = NextResponse.json({
      success: true,
      message: 'QR Link creado exitosamente',
      link: transformedLink
    });

    // Headers para mejorar compatibilidad con Safari
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
    
    return response;

  } catch (error) {
    console.error('Error creating QR link:', error);
    const errorResponse = NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
    
    // Headers para errores también
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
    
    return errorResponse;
  }
}

// OPTIONS - Manejar preflight requests (importante para Safari)
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  response.headers.set('Access-Control-Max-Age', '86400'); // 24 horas
  
  return response;
}

// Generar un shortId único verificando en la base de datos
async function generateUniqueShortId(): Promise<string> {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    let result = '';
    
    // Generar ID de 6 caracteres
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Verificar que no exista en la base de datos
    const existing = await prisma.qRLink.findUnique({
      where: { shortId: result }
    });
    
    if (!existing) {
      return result;
    }
    
    attempts++;
  }
  
  // Si no podemos generar un ID único después de 10 intentos, usar timestamp
  return `qr${Date.now().toString(36)}`;
}
