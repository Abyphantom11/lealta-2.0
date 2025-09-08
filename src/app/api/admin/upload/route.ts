import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // ⚠️ VALIDACIÓN DE MEMORIA CRÍTICA - Prevenir allocation failed
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB máximo
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`Archivo demasiado grande: ${Math.round(file.size / 1024 / 1024)}MB. Máximo permitido: 10MB`);
    }
    
    console.log(`📁 Procesando imagen admin upload: ${Math.round(file.size / 1024)}KB`);
    
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Crear nombre único para el archivo
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${timestamp}-${Math.random().toString(36).substring(7)}.${fileExtension}`;

    // Guardar en la carpeta public/uploads
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    const filePath = join(uploadDir, fileName);

    // Crear directorio si no existe
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }

    await writeFile(filePath, buffer);

    // Retornar la URL pública del archivo
    const fileUrl = `/uploads/${fileName}`;

    return NextResponse.json({
      success: true,
      fileUrl: fileUrl,
      fileName: fileName,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
