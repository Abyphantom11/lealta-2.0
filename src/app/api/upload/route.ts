import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { logger } from '@/utils/production-logger';
import { getBlobStorageToken } from '@/lib/blob-storage-utils';

/**
 * 📸 API para subir imágenes de eventos
 * POST /api/upload
 * 
 * Guarda las imágenes en Vercel Blob Storage
 */

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'uploads';
    
    if (!file) {
      return NextResponse.json(
        { error: 'Archivo requerido' },
        { status: 400 }
      );
    }

    // Validar archivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no válido. Use JPG, PNG, WebP o GIF' },
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
    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${cleanName}`;
    
    // 🔥 UPLOAD A VERCEL BLOB STORAGE
    const token = getBlobStorageToken();
    
    if (!token) {
      logger.error('❌ No valid blob storage token available');
      return NextResponse.json(
        { error: 'Storage configuration error' },
        { status: 500 }
      );
    }
    
    const blob = await put(`${folder}/${fileName}`, file, {
      access: 'public',
      token: token,
    });
    
    logger.debug(`📸 Image uploaded to ${folder}:`, {
      fileName,
      size: file.size,
      type: file.type,
      url: blob.url
    });

    return NextResponse.json({
      success: true,
      url: blob.url,
      downloadUrl: blob.downloadUrl,
      fileName,
      size: file.size
    });

  } catch (error) {
    logger.error('❌ Error uploading image:', error);
    return NextResponse.json(
      { error: 'Error al subir la imagen' },
      { status: 500 }
    );
  }
}
