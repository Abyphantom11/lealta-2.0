import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { getBlobStorageToken } from '@/lib/blob-storage-utils';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 [TEST-UPLOAD] Iniciando test de upload...');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log('🧪 [TEST-UPLOAD] Archivo recibido:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    });

    // Validación de tipo MIME
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: `Tipo de archivo no válido: ${file.type}. Tipos permitidos: ${allowedMimeTypes.join(', ')}` 
      }, { status: 400 });
    }

    // Validación de tamaño
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: `Archivo demasiado grande: ${Math.round(file.size / 1024 / 1024)}MB. Máximo: 10MB` 
      }, { status: 400 });
    }

    // Obtener token
    const token = getBlobStorageToken();
    if (!token) {
      return NextResponse.json({ error: 'No valid blob storage token' }, { status: 500 });
    }

    console.log('🧪 [TEST-UPLOAD] Token válido obtenido, subiendo archivo...');

    // Preservar extensión original
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const filename = `test-uploads/test_${timestamp}.${fileExtension}`;

    // Upload a Vercel Blob
    const blob = await put(filename, file, {
      access: 'public',
      token: token,
    });

    console.log('🧪 [TEST-UPLOAD] Upload exitoso:', blob.url);

    return NextResponse.json({
      success: true,
      message: 'Upload test successful',
      details: {
        originalName: file.name,
        size: file.size,
        type: file.type,
        uploadedUrl: blob.url,
        downloadUrl: blob.downloadUrl,
        filename: filename
      }
    });

  } catch (error) {
    console.error('🧪 [TEST-UPLOAD] Error:', error);
    return NextResponse.json({
      error: 'Upload test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
