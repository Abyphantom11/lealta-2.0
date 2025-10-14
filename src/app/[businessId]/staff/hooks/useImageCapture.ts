// Custom hook for image capture functionality

import { useState, useCallback, useEffect } from 'react';

export const useImageCapture = (
  selectedFiles: File[],
  selectedFile: File | null,
  preview: string,
  setSelectedFiles: (files: File[]) => void,
  setSelectedFile: (file: File | null) => void,
  setPreview: (preview: string) => void,
  showNotification: (type: 'success' | 'error' | 'info', message: string) => void
) => {
  // Estado para capturas automáticas
  const [isWaitingForCapture, setIsWaitingForCapture] = useState(false);
  const [captureStartTime, setCaptureStartTime] = useState<number>(0);
  const [lastClipboardCheck, setLastClipboardCheck] = useState<string | null>(null);

  // Función para mostrar instrucciones de captura optimizadas
  const openSnippingTool = () => {
    showNotification(
      'info',
      '💡 Usa Win + PrtScr para captura automática, o Win + Shift + S para seleccionar área específica'
    );

    // Mostrar instrucciones mejoradas en la consola
    console.log('=== INSTRUCCIONES DE CAPTURA OPTIMIZADAS ===');
    console.log('🏃 MÉTODO RÁPIDO (Recomendado):');
    console.log('1. Ve a tu POS');
    console.log('2. Presiona Win + Print Screen');
    console.log('3. ¡LISTO! Se guarda automáticamente');
    console.log('4. Regresa a Lealta y pega con Ctrl+V');
    console.log('');
    console.log('🎯 MÉTODO PRECISIÓN (área específica):');
    console.log('1. Presiona Win + Shift + S');
    console.log('2. Selecciona el área del ticket en tu POS');
    console.log('3. Regresa a Lealta y pega con Ctrl+V');
  };

  // Función para abrir herramienta de recorte y esperar captura
  const startAutomaticCapture = async () => {
    if (isWaitingForCapture) {
      // Si ya está esperando, cancelar
      setIsWaitingForCapture(false);
      setCaptureStartTime(0);
      setLastClipboardCheck(null);
      showNotification('info', '❌ Captura automática cancelada');
      return;
    }

    // Iniciar proceso de captura
    setIsWaitingForCapture(true);
    setCaptureStartTime(Date.now());
    setLastClipboardCheck(null);

    // Mostrar instrucciones mejoradas
    showNotification(
      'info',
      '🔥 Modo captura activo. Ve a tu POS y usa Win + PrtScr o Win + Shift + S. Luego regresa a Lealta'
    );

    // Instrucciones detalladas en consola
    console.log('=== CAPTURA AUTOMÁTICA INICIADA ===');
    console.log('🏃 OPCIÓN 1 - Win + Print Screen (MÁS RÁPIDO):');
    console.log('1. Ve a tu sistema POS');
    console.log('2. Presiona Win + Print Screen');
    console.log('3. ¡Se guarda automáticamente en portapapeles!');
    console.log('4. Regresa a Lealta (se detecta automáticamente)');
    console.log('');
    console.log('🎯 OPCIÓN 2 - Win + Shift + S (ÁREA ESPECÍFICA):');
    console.log('1. Ve a tu sistema POS');
    console.log('2. Presiona Win + Shift + S');
    console.log('3. Selecciona el área del ticket');
    console.log('4. Regresa a Lealta (se detecta automáticamente)');
    console.log('');
    console.log('⚠️ IMPORTANTE: NO necesitas guardar archivo, solo regresa a Lealta');

    // Timeout de 5 minutos para dar tiempo suficiente
    setTimeout(() => {
      if (isWaitingForCapture) {
        setIsWaitingForCapture(false);
        setCaptureStartTime(0);
        setLastClipboardCheck(null);
        showNotification('info', '⏰ Tiempo de captura expirado. Inténtalo de nuevo.');
      }
    }, 300000); // 5 minutos
  };

  // Función para verificar si debe procesar la imagen
  const shouldProcessImage = useCallback(
    (currentTime: number, currentClipboardId: string): boolean => {
      const timeCondition = currentTime > captureStartTime + 2000; // 2 segundos mínimo
      const newImageCondition = currentClipboardId !== lastClipboardCheck;
      return timeCondition && newImageCondition;
    },
    [captureStartTime, lastClipboardCheck]
  );

  // Función para procesar la imagen capturada
  const processClipboardImage = useCallback(
    async (blob: Blob, currentTime: number) => {
      const file = new File([blob], `captura-pos-${currentTime}.png`, {
        type: blob.type,
      });

      // Verificar si ya tenemos 3 imágenes
      const currentFiles = selectedFiles.length > 0 ? selectedFiles : [];
      const fallbackFiles = selectedFile ? [selectedFile] : [];
      const existingFiles = currentFiles.length > 0 ? currentFiles : fallbackFiles;
      
      if (existingFiles.length >= 3) {
        showNotification('error', 'Ya tienes 3 imágenes seleccionadas. Elimina alguna para agregar más.');
        setIsWaitingForCapture(false);
        setCaptureStartTime(0);
        setLastClipboardCheck(null);
        return;
      }

      // Agregar a la lista de archivos existentes
      const newCombinedFiles = [...existingFiles, file];
      setSelectedFiles(newCombinedFiles);
      setSelectedFile(newCombinedFiles[0]); // Mantener el primero como principal

      // Solo crear preview si no existe uno
      if (!preview) {
        const reader = new FileReader();
        reader.onload = e => setPreview(e.target?.result as string);
        reader.readAsDataURL(file);
      }

      // Finalizar proceso
      setIsWaitingForCapture(false);
      setCaptureStartTime(0);
      setLastClipboardCheck(null);

      showNotification('success', '🎉 ¡Captura del POS detectada y cargada!');
      console.log('✅ Captura procesada exitosamente');
    },
    [showNotification, selectedFiles, selectedFile, preview, setSelectedFiles, setSelectedFile, setPreview]
  );

  // Función para leer imagen del portapapeles
  const checkClipboardForImage = useCallback(async () => {
    if (!isWaitingForCapture) return false;

    try {
      if (!navigator.clipboard?.read) {
        console.log('API del portapapeles no disponible');
        return false;
      }

      const clipboardItems = await navigator.clipboard.read();

      for (const clipboardItem of clipboardItems) {
        for (const type of clipboardItem.types) {
          if (type.startsWith('image/')) {
            const blob = await clipboardItem.getType(type);

            // Crear un hash simple del blob para detectar cambios
            const blobText = await blob.text().catch(() => blob.size.toString());
            const currentClipboardId = `${blob.size}-${blob.type}-${blobText.slice(0, 50)}`;
            const currentTime = Date.now();

            if (shouldProcessImage(currentTime, currentClipboardId)) {
              setLastClipboardCheck(currentClipboardId);
              await processClipboardImage(blob, currentTime);
              return true;
            } else if (currentClipboardId === lastClipboardCheck) {
              console.log('🔄 Misma imagen en portapapeles, esperando nueva captura...');
            } else {
              console.log('⏳ Esperando tiempo mínimo antes de procesar...');
            }
          }
        }
      }
      return false;
    } catch (error) {
      console.error('Error leyendo portapapeles:', error);
      return false;
    }
  }, [isWaitingForCapture, processClipboardImage, shouldProcessImage, lastClipboardCheck]);

  // Función para detectar cuando el usuario regresa a la ventana
  const handleWindowFocus = useCallback(async () => {
    if (!isWaitingForCapture) return;

    console.log('👁️ Ventana enfocada - verificando portapapeles...');

    // Esperar un momento para que el portapapeles se actualice
    setTimeout(async () => {
      await checkClipboardForImage();
    }, 500);
  }, [isWaitingForCapture, checkClipboardForImage]);

  // Agregar listener para cuando la ventana gana foco
  useEffect(() => {
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [handleWindowFocus]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;

    // Filtrar solo archivos de imagen
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      showNotification('error', 'Por favor selecciona archivos de imagen válidos');
      return;
    }

    // Combinar con imágenes existentes
    const currentFiles = selectedFiles.length > 0 ? selectedFiles : [];
    const fallbackFiles = selectedFile ? [selectedFile] : [];
    const existingFiles = currentFiles.length > 0 ? currentFiles : fallbackFiles;
    const newCombinedFiles = [...existingFiles, ...imageFiles];

    if (newCombinedFiles.length > 3) {
      const allowedCount = 3 - existingFiles.length;
      if (allowedCount <= 0) {
        showNotification('error', 'Ya tienes 3 imágenes seleccionadas. Elimina alguna para agregar más.');
        return;
      } else {
        showNotification('error', `Solo puedes agregar ${allowedCount} imagen${allowedCount > 1 ? 'es' : ''} más. Máximo 3 en total.`);
        return;
      }
    }

    // Guardar todas las imágenes combinadas
    setSelectedFiles(newCombinedFiles);
    
    // También mantener la primera imagen en selectedFile para compatibilidad
    const primaryFile = newCombinedFiles[0];
    setSelectedFile(primaryFile);
    
    // Crear preview de la primera imagen si no existe
    if (!preview) {
      const reader = new FileReader();
      reader.onload = e => setPreview(e.target?.result as string);
      reader.readAsDataURL(primaryFile);
    }

    // Limpiar el input para permitir seleccionar los mismos archivos de nuevo
    e.target.value = '';

    const newCount = imageFiles.length;
    showNotification('success', `${newCount} imagen${newCount > 1 ? 'es' : ''} agregada${newCount > 1 ? 's' : ''} exitosamente. Total: ${newCombinedFiles.length}/3`);
  };

  return {
    isWaitingForCapture,
    openSnippingTool,
    startAutomaticCapture,
    handleFileSelect,
  };
};
