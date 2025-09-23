import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { withAuth, AuthConfigs } from '../../../../middleware/requireAuth';
import { logger } from '../../../../utils/production-logger';

// 🔒 POST - Upload de archivos (PROTEGIDO - ADMIN ONLY)
export async function POST(request: NextRequest) {
  return withAuth(request, async (session) => {
    try {
      logger.debug(`📁 File upload request by: ${session.role} (${session.userId})`);
      
      const data = await request.formData();
      const file: File | null = data.get('file') as unknown as File;

      if (!file) {
        return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
      }

      // 🔒 VALIDACIÓN DE MEMORIA CRÍTICA - Prevenir allocation failed
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB máximo
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(`Archivo demasiado grande: ${Math.round(file.size / 1024 / 1024)}MB. Máximo permitido: 10MB`);
      }
      
      // 🔒 VALIDACIÓN DE TIPO DE ARCHIVO
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        logger.warn(`Upload denied: Invalid file type ${file.type} by ${session.userId}`);
        return NextResponse.json({ 
          error: 'Tipo de archivo no permitido', 
          message: 'Solo se permiten imágenes (JPG, PNG, GIF, WebP)' 
        }, { status: 400 });
      }
      
      logger.debug(`📁 Processing image upload: ${Math.round(file.size / 1024)}KB by ${session.role}`);
      
      // Crear nombre único para el archivo con metadata de usuario
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const fileName = `${timestamp}-${Math.random().toString(36).substring(7)}.${fileExtension}`;

      // Agregar metadata de auditoría al nombre del archivo
      const auditedFileName = `${session.businessId}_${fileName}`;

      logger.debug(`📁 File uploaded by: ${session.role} (${session.userId}) - ${auditedFileName}`);

      // 🔥 UPLOAD A VERCEL BLOB STORAGE - CON TOKEN CORRECTO
      const blob = await put(auditedFileName, file, {
        access: 'public',
        token: process.env.BLOB_READ_WRITE_TOKEN || process.env.LEALTA_READ_WRITE_TOKEN || "vercel_blob_rw_QSQoErcPWIoMxvo2_DYdNIDEA6Q1yeI3T0BHuwbTnC0grwT",
      });

      logger.info(`✅ File upload successful to Vercel Blob: ${blob.url}`);
      return NextResponse.json({
        success: true,
        fileUrl: blob.url, // URL completa de Vercel Blob
        downloadUrl: blob.downloadUrl,
        fileName: auditedFileName,
        uploadedBy: session.userId,
        businessId: session.businessId
      });
    } catch (error) {
      logger.error('❌ Error uploading file:', error);
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      );
    }
  }, AuthConfigs.ADMIN_ONLY);
}
