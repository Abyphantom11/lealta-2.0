import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { getBusinessIdFromRequest } from '@/lib/business-utils';

/**
 * API para subir imágenes del carrusel de branding
 * Guarda las imágenes en /public/uploads/branding/ y retorna URLs
 */

export async function POST(request: NextRequest) {
  try {
    const businessId = getBusinessIdFromRequest(request);
    
    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID requerido' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'Archivo de imagen requerido' },
        { status: 400 }
      );
    }

    // Validar archivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no válido. Use JPG, PNG o WebP' },
        { status: 400 }
      );
    }
    
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Archivo demasiado grande. Máximo 5MB' },
        { status: 400 }
      );
    }

    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const fileName = `${businessId}_${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    
    // 🔥 UPLOAD A VERCEL BLOB STORAGE
    const blob = await put(`branding/${fileName}`, file, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    
    console.log(`✅ Imagen subida exitosamente para business ${businessId}:`, {
      fileName,
      size: file.size,
      type: file.type,
      url: blob.url
    });

    return NextResponse.json({
      success: true,
      imageUrl: blob.url, // URL completa de Vercel Blob
      downloadUrl: blob.downloadUrl,
      fileName,
      size: file.size
    });

  } catch (error) {
    console.error('Error subiendo imagen:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
