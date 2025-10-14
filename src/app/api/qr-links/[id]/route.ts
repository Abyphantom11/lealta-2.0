import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// OPTIONS - Manejar preflight requests (importante para Safari)
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  response.headers.set('Access-Control-Max-Age', '86400'); // 24 horas
  
  return response;
}

// GET - Obtener información específica de un QR link
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const qrLink = await prisma.qRLink.findUnique({
      where: { id },
      include: {
        _count: {
          select: { clicks: true }
        }
      }
    });

    if (!qrLink) {
      return NextResponse.json(
        { success: false, message: 'QR Link no encontrado' },
        { status: 404 }
      );
    }

    const transformedLink = {
      id: qrLink.id,
      shortId: qrLink.shortId,
      name: qrLink.name,
      targetUrl: qrLink.targetUrl,
      backupUrl: qrLink.backupUrl,
      isActive: qrLink.isActive,
      clickCount: qrLink._count.clicks,
      createdAt: qrLink.createdAt.toISOString(),
      expiresAt: qrLink.expiresAt?.toISOString()
    };

    const response = NextResponse.json({
      success: true,
      link: transformedLink
    });

    // Headers para mejorar compatibilidad con Safari
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
    
    return response;
  } catch (error) {
    console.error('Error fetching QR link:', error);
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

// PUT - Actualizar QR link
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, targetUrl, backupUrl, isActive, expiresAt } = body;

    // Validaciones
    if (targetUrl) {
      try {
        new URL(targetUrl);
        if (backupUrl) new URL(backupUrl);
      } catch {
        return NextResponse.json(
          { success: false, message: 'URL inválida' },
          { status: 400 }
        );
      }
    }

    // Verificar que el QR link existe
    const existingLink = await prisma.qRLink.findUnique({
      where: { id }
    });

    if (!existingLink) {
      return NextResponse.json(
        { success: false, message: 'QR Link no encontrado' },
        { status: 404 }
      );
    }

    // Actualizar en la base de datos
    const updatedLink = await prisma.qRLink.update({
      where: { id },
      data: {
        name: name?.trim() || existingLink.name,
        targetUrl: targetUrl?.trim() || existingLink.targetUrl,
        backupUrl: backupUrl?.trim() || existingLink.backupUrl,
        isActive: isActive !== undefined ? isActive : existingLink.isActive,
        expiresAt: expiresAt ? new Date(expiresAt) : existingLink.expiresAt
      },
      include: {
        _count: {
          select: { clicks: true }
        }
      }
    });

    console.log('🔄 QR Link actualizado:', id, body);

    const transformedLink = {
      id: updatedLink.id,
      shortId: updatedLink.shortId,
      name: updatedLink.name,
      targetUrl: updatedLink.targetUrl,
      backupUrl: updatedLink.backupUrl,
      isActive: updatedLink.isActive,
      clickCount: updatedLink._count.clicks,
      createdAt: updatedLink.createdAt.toISOString(),
      expiresAt: updatedLink.expiresAt?.toISOString()
    };

    return NextResponse.json({
      success: true,
      message: 'QR Link actualizado exitosamente',
      link: transformedLink
    });

  } catch (error) {
    console.error('Error updating QR link:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar QR link
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Verificar que el QR link existe
    const existingLink = await prisma.qRLink.findUnique({
      where: { id }
    });

    if (!existingLink) {
      return NextResponse.json(
        { success: false, message: 'QR Link no encontrado' },
        { status: 404 }
      );
    }

    // Eliminar de la base de datos (esto también eliminará los clicks relacionados por cascade)
    await prisma.qRLink.delete({
      where: { id }
    });

    console.log('🗑️ QR Link eliminado:', id);

    return NextResponse.json({
      success: true,
      message: 'QR Link eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error deleting QR link:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
