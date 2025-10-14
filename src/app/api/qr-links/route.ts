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

    return NextResponse.json({
      success: true,
      links: transformedLinks
    });
  } catch (error) {
    console.error('Error fetching QR links:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
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

    return NextResponse.json({
      success: true,
      message: 'QR Link creado exitosamente',
      link: transformedLink
    });

  } catch (error) {
    console.error('Error creating QR link:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
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
