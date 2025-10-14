/**
 * 🗄️ Utilidad para subir archivos a Vercel Blob Storage
 * 
 * Esta utilidad proporciona funciones para subir archivos a Vercel Blob Storage
 * en lugar de guardarlos en /public, reduciendo el bandwidth y mejorando performance.
 * 
 * @see https://vercel.com/docs/storage/vercel-blob
 */

import { put, del, list } from '@vercel/blob';

/**
 * Sube un archivo a Vercel Blob Storage
 * 
 * @param file - Archivo a subir (File o Buffer)
 * @param folder - Carpeta destino en blob storage
 * @param options - Opciones adicionales
 * @returns URL pública del archivo subido
 * 
 * @example
 * ```typescript
 * const file = new File([buffer], 'logo.png', { type: 'image/png' });
 * const url = await uploadToBlob(file, 'branding');
 * console.log(url); // https://xxx.public.blob.vercel-storage.com/branding/logo-abc123.png
 * ```
 */
export async function uploadToBlob(
  file: File | Buffer,
  folder: string = 'uploads',
  options: {
    addRandomSuffix?: boolean;
    cacheControlMaxAge?: number;
    contentType?: string;
  } = {}
): Promise<string> {
  try {
    const {
      addRandomSuffix = true,
      cacheControlMaxAge = 31536000, // 1 año por defecto
      contentType,
    } = options;

    // Determinar el pathname
    let pathname: string;
    if (file instanceof File) {
      pathname = `${folder}/${file.name}`;
    } else {
      // Para Buffer, generar nombre único
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7);
      pathname = `${folder}/file_${timestamp}_${randomStr}`;
    }

    // Subir a blob
    const blob = await put(pathname, file, {
      access: 'public',
      addRandomSuffix,
      cacheControlMaxAge,
      contentType,
    });

    console.log(`✅ Archivo subido a blob: ${blob.url}`);
    return blob.url;
  } catch (error) {
    console.error('❌ Error subiendo a blob:', error);
    throw new Error(`Failed to upload to blob: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Sube múltiples archivos a Vercel Blob Storage en paralelo
 * 
 * @param files - Array de archivos a subir
 * @param folder - Carpeta destino en blob storage
 * @returns Array de URLs públicas de los archivos subidos
 * 
 * @example
 * ```typescript
 * const files = [file1, file2, file3];
 * const urls = await uploadMultipleToBlob(files, 'gallery');
 * console.log(urls); // ['https://...', 'https://...', 'https://...']
 * ```
 */
export async function uploadMultipleToBlob(
  files: File[],
  folder: string = 'uploads'
): Promise<string[]> {
  try {
    const uploadPromises = files.map(file => uploadToBlob(file, folder));
    const urls = await Promise.all(uploadPromises);
    
    console.log(`✅ ${urls.length} archivos subidos a blob`);
    return urls;
  } catch (error) {
    console.error('❌ Error subiendo múltiples archivos:', error);
    throw new Error(`Failed to upload multiple files: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Elimina un archivo de Vercel Blob Storage
 * 
 * @param url - URL del archivo a eliminar
 * 
 * @example
 * ```typescript
 * await deleteFromBlob('https://xxx.public.blob.vercel-storage.com/uploads/logo-abc123.png');
 * ```
 */
export async function deleteFromBlob(url: string): Promise<void> {
  try {
    await del(url);
    console.log(`✅ Archivo eliminado de blob: ${url}`);
  } catch (error) {
    console.error('❌ Error eliminando de blob:', error);
    throw new Error(`Failed to delete from blob: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Elimina múltiples archivos de Vercel Blob Storage
 * 
 * @param urls - Array de URLs a eliminar
 * 
 * @example
 * ```typescript
 * await deleteMultipleFromBlob([url1, url2, url3]);
 * ```
 */
export async function deleteMultipleFromBlob(urls: string[]): Promise<void> {
  try {
    await del(urls);
    console.log(`✅ ${urls.length} archivos eliminados de blob`);
  } catch (error) {
    console.error('❌ Error eliminando múltiples archivos:', error);
    throw new Error(`Failed to delete multiple files: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Lista archivos en una carpeta de Vercel Blob Storage
 * 
 * @param prefix - Prefijo/carpeta a listar
 * @param options - Opciones de listado
 * @returns Array de blobs encontrados
 * 
 * @example
 * ```typescript
 * const blobs = await listBlobFiles('uploads/', { limit: 100 });
 * blobs.forEach(blob => console.log(blob.url));
 * ```
 */
export async function listBlobFiles(
  prefix?: string,
  options: {
    limit?: number;
    cursor?: string;
  } = {}
) {
  try {
    const { blobs, cursor, hasMore } = await list({
      prefix,
      limit: options.limit || 1000,
      cursor: options.cursor,
    });

    console.log(`✅ Listados ${blobs.length} archivos de blob`);
    return { blobs, cursor, hasMore };
  } catch (error) {
    console.error('❌ Error listando archivos de blob:', error);
    throw new Error(`Failed to list blob files: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Convierte un Buffer a File para subirlo a blob
 * 
 * @param buffer - Buffer del archivo
 * @param filename - Nombre del archivo
 * @param mimeType - Tipo MIME del archivo
 * @returns Objeto File
 * 
 * @example
 * ```typescript
 * const buffer = Buffer.from(data);
 * const file = bufferToFile(buffer, 'document.pdf', 'application/pdf');
 * const url = await uploadToBlob(file, 'documents');
 * ```
 */
export function bufferToFile(
  buffer: Buffer,
  filename: string,
  mimeType: string
): File {
  return new File([buffer], filename, { type: mimeType });
}

/**
 * Migra un archivo de /public/uploads a Blob Storage
 * 
 * @param localPath - Ruta local del archivo (ej: '/uploads/logo.png')
 * @param folder - Carpeta destino en blob
 * @returns URL del archivo en blob storage
 * 
 * @example
 * ```typescript
 * const newUrl = await migrateToBlob('/uploads/logo.png', 'branding');
 * // Actualizar referencia en DB
 * await prisma.business.update({
 *   where: { id },
 *   data: { logoUrl: newUrl }
 * });
 * ```
 */
export async function migrateToBlob(
  localPath: string,
  folder: string = 'uploads'
): Promise<string> {
  try {
    // En producción, no tenemos acceso al sistema de archivos
    // Esta función debe usarse en scripts de migración, no en runtime
    throw new Error('migrateToBlob debe ejecutarse en un script de migración, no en runtime');
  } catch (error) {
    console.error('❌ Error migrando a blob:', error);
    throw error;
  }
}

/**
 * Utilidad para obtener información de un archivo antes de subirlo
 * 
 * @param file - Archivo a analizar
 * @returns Información del archivo
 */
export function getFileInfo(file: File) {
  return {
    name: file.name,
    size: file.size,
    sizeMB: (file.size / 1024 / 1024).toFixed(2),
    type: file.type,
    lastModified: file.lastModified,
  };
}
