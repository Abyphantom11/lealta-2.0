import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { withAuth, AuthConfigs } from '../../../../middleware/requireAuth';

// 🔒 POST - Upload de archivos (PROTEGIDO - ADMIN ONLY)
export async function POST(request: NextRequest) {
  return withAuth(request, async (session) => {
    try {
      console.log(`📁 File upload request by: ${session.role} (${session.userId})`);
      
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
        console.log(`❌ Upload denied: Invalid file type ${file.type} by ${session.userId}`);
        return NextResponse.json({ 
          error: 'Tipo de archivo no permitido', 
          message: 'Solo se permiten imágenes (JPG, PNG, GIF, WebP)' 
        }, { status: 400 });
      }
      
      console.log(`📁 Processing image upload: ${Math.round(file.size / 1024)}KB by ${session.role}`);
      
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Crear nombre único para el archivo con metadata de usuario
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const fileName = `${timestamp}-${Math.random().toString(36).substring(7)}.${fileExtension}`;

      // Agregar metadata de auditoría al nombre del archivo
      const auditedFileName = `${session.businessId}_${fileName}`;

      console.log(`📁 File uploaded by: ${session.role} (${session.userId}) - ${auditedFileName}`);

      // Guardar en la carpeta public/uploads
      const uploadDir = join(process.cwd(), 'public', 'uploads');
      const filePath = join(uploadDir, auditedFileName);

      // Crear directorio si no existe
      if (!existsSync(uploadDir)) {
        mkdirSync(uploadDir, { recursive: true });
      }

      await writeFile(filePath, buffer);

      // Retornar la URL pública del archivo
      const fileUrl = `/uploads/${auditedFileName}`;

      console.log(`✅ File upload successful: ${fileUrl}`);
      return NextResponse.json({
        success: true,
        fileUrl: fileUrl,
        fileName: auditedFileName,
        uploadedBy: session.userId,
        businessId: session.businessId
      });
    } catch (error) {
      console.error('❌ Error uploading file:', error);
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      );
    }
  }, AuthConfigs.ADMIN_ONLY);
}
