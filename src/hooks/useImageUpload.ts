'use client';

import { useState, useCallback } from 'react';

export interface ImageUploadConfig {
  maxSizeMB?: number;
  allowedTypes?: string[];
  onSuccess?: (url: string) => void;
  onError?: (error: string) => void;
  showNotification?: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export interface ImageUploadState {
  selectedFile: File | null;
  previewUrl: string;
  isUploading: boolean;
  error: string | null;
}

export interface ImageUploadActions {
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadImage: () => Promise<string | null>;
  resetUpload: () => void;
  clearPreview: () => void;
}

/**
 * Hook unificado para upload de imágenes
 * Basado en el patrón exitoso de BrandingManager
 * 
 * Características:
 * - ✅ Usa endpoint /api/admin/upload
 * - ✅ Validación robusta de archivos
 * - ✅ Preview temporal con URL.createObjectURL
 * - ✅ Manejo de errores consistente
 * - ✅ URLs físicas como resultado
 */
export const useImageUpload = (config: ImageUploadConfig = {}): [ImageUploadState, ImageUploadActions] => {
  const {
    maxSizeMB = 5,
    allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
    onSuccess,
    onError,
    showNotification
  } = config;

  const [state, setState] = useState<ImageUploadState>({
    selectedFile: null,
    previewUrl: '',
    isUploading: false,
    error: null
  });

  /**
   * Validar archivo seleccionado
   */
  const validateFile = useCallback((file: File): string | null => {
    // Validar tipo
    if (!allowedTypes.includes(file.type)) {
      return `Tipo de archivo no permitido. Permitidos: ${allowedTypes.join(', ')}`;
    }

    // Validar tamaño
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `Archivo demasiado grande: ${Math.round(file.size / 1024 / 1024)}MB. Máximo permitido: ${maxSizeMB}MB`;
    }

    return null;
  }, [allowedTypes, maxSizeMB]);

  /**
   * Manejar selección de archivo
   */
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file) {
      setState(prev => ({
        ...prev,
        selectedFile: null,
        previewUrl: '',
        error: null
      }));
      return;
    }

    // Validar archivo
    const validationError = validateFile(file);
    if (validationError) {
      setState(prev => ({
        ...prev,
        selectedFile: null,
        previewUrl: '',
        error: validationError
      }));
      
      if (onError) onError(validationError);
      if (showNotification) showNotification(validationError, 'error');
      return;
    }

    // ✅ Crear preview usando FileReader (más estable que blob URLs)
    const reader = new FileReader();
    reader.onload = (event) => {
      const previewUrl = event.target?.result as string;
      
      console.log('🔍 FileReader Preview Created:', {
        fileName: file.name,
        fileSize: file.size,
        previewUrlType: previewUrl.startsWith('data:') ? 'base64' : 'unknown',
        previewUrlLength: previewUrl.length
      });
      
      setState(prev => {
        // Limpiar URL anterior si existe y es blob
        if (prev.previewUrl?.startsWith('blob:')) {
          URL.revokeObjectURL(prev.previewUrl);
        }
        
        return {
          ...prev,
          selectedFile: file,
          previewUrl,
          error: null
        };
      });
    };
    
    reader.onerror = () => {
      const error = 'Error al leer el archivo para vista previa';
      setState(prev => ({
        ...prev,
        selectedFile: null,
        previewUrl: '',
        error
      }));
      if (onError) onError(error);
      if (showNotification) showNotification(error, 'error');
    };
    
    // Leer archivo como base64
    reader.readAsDataURL(file);
  }, [validateFile, onError, showNotification]);

  /**
   * Subir imagen al servidor
   */
  const uploadImage = useCallback(async (): Promise<string | null> => {
    if (!state.selectedFile) {
      const error = 'No hay archivo seleccionado para subir';
      setState(prev => ({ ...prev, error }));
      if (onError) onError(error);
      return null;
    }

    setState(prev => ({ ...prev, isUploading: true, error: null }));

    try {
      if (showNotification) showNotification('Subiendo imagen...', 'info');

      // ✅ Usar endpoint estándar /api/admin/upload
      const formData = new FormData();
      formData.append('file', state.selectedFile);

      const uploadResponse = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || `Error HTTP: ${uploadResponse.status}`);
      }

      const uploadResult = await uploadResponse.json();
      const imageUrl = uploadResult.fileUrl; // ✅ URL física del archivo

      setState(prev => {
        // 🔧 Limpiar previewUrl después de upload exitoso para evitar preview corrupto
        if (prev.previewUrl?.startsWith('data:') || prev.previewUrl?.startsWith('blob:')) {
          if (prev.previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(prev.previewUrl);
          }
        }
        
        return {
          ...prev,
          isUploading: false,
          error: null,
          previewUrl: '', // 🔧 LIMPIAR preview para que use la URL real
          selectedFile: null // 🔧 También limpiar archivo seleccionado
        };
      });

      if (onSuccess) onSuccess(imageUrl);
      if (showNotification) showNotification('✅ Imagen subida exitosamente', 'success');

      return imageUrl;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al subir imagen';
      
      setState(prev => ({
        ...prev,
        isUploading: false,
        error: errorMessage
      }));

      if (onError) onError(errorMessage);
      if (showNotification) showNotification(`❌ Error al subir imagen: ${errorMessage}`, 'error');

      return null;
    }
  }, [state.selectedFile, onSuccess, onError, showNotification]);

  /**
   * Limpiar upload completo
   */
  const resetUpload = useCallback(() => {
    setState(prev => {
      // Limpiar URL temporal si existe
      if (prev.previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(prev.previewUrl);
      }
      
      return {
        selectedFile: null,
        previewUrl: '',
        isUploading: false,
        error: null
      };
    });
  }, []);

  /**
   * Solo limpiar preview (mantener archivo seleccionado)
   */
  const clearPreview = useCallback(() => {
    setState(prev => {
      // Limpiar URL temporal si existe
      if (prev.previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(prev.previewUrl);
      }
      
      return {
        ...prev,
        previewUrl: ''
      };
    });
  }, []);

  return [
    state,
    {
      handleFileSelect,
      uploadImage,
      resetUpload,
      clearPreview
    }
  ];
};

export default useImageUpload;
