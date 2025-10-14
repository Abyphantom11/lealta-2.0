'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Camera, X, CheckCircle, FileText, Zap } from 'lucide-react';

interface OCRUploadFormProps {
  selectedFiles: File[];
  onFilesSelect: (files: FileList | null) => void;
  onRemoveFile: (index: number) => void;
  onProcess: () => void;
  isProcessing: boolean;
  disabled?: boolean;
}

interface FilePreviewProps {
  file: File;
  index: number;
  onRemove: (index: number) => void;
}

const FilePreview = ({ file, index, onRemove }: FilePreviewProps) => {
  const imageUrl = URL.createObjectURL(file);
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="relative"
    >
      <img
        src={imageUrl}
        alt={`Preview ${index + 1}`}
        className="w-full h-24 object-cover rounded-lg border border-dark-600"
      />
      <div className="absolute top-1 right-1 bg-black/70 text-white text-xs px-2 py-1 rounded">
        {index + 1}
      </div>
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="absolute top-1 left-1 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
    </motion.div>
  );
};

export default function OCRUploadForm({
  selectedFiles,
  onFilesSelect,
  onRemoveFile,
  onProcess,
  isProcessing,
  disabled = false
}: OCRUploadFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const getFileText = useCallback((count: number) => {
    if (count === 0) return 'Subir imágenes del ticket';
    const fileWord = count === 1 ? 'archivo' : 'archivos';
    const selectedWord = count === 1 ? 'seleccionado' : 'seleccionados';
    return `${count} ${fileWord} ${selectedWord}`;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onFilesSelect(files);
    }
  }, [disabled, onFilesSelect]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelect(e.target.files);
    }
  }, [onFilesSelect]);

  const triggerFileInput = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  const openSnippingTool = useCallback(() => {
    console.log('=== INSTRUCCIONES DE CAPTURA OPTIMIZADAS ===');
    console.log('🏃 MÉTODO RÁPIDO (Recomendado):');
    console.log('1. Ve a tu POS');
    console.log('2. Presiona Win + Print Screen');
    console.log('3. ¡LISTO! Se guarda automáticamente');
    console.log('4. Regresa a Lealta y pega con Ctrl+V');
  }, []);

  const clearAllFiles = useCallback(() => {
    onFilesSelect(null);
  }, [onFilesSelect]);

  return (
    <div className="space-y-6">
      {/* Instrucciones y botones de captura */}
      <div className="space-y-4">
        <div className="text-center text-gray-400 text-sm space-y-2">
          <p className="flex items-center justify-center space-x-2">
            <Camera className="w-4 h-4" />
            <span>Captura directa desde tu POS o sube archivos</span>
          </p>
          <p className="text-xs">📱 Máximo 3 imágenes por procesamiento</p>
        </div>

        {/* Botones de captura */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={openSnippingTool}
            className="flex-1 flex items-center justify-center space-x-2 p-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={disabled}
          >
            <Zap className="w-4 h-4" />
            <span>Win + PrtScr</span>
          </button>

          <button
            type="button"
            onClick={openSnippingTool}
            className="flex-1 flex items-center justify-center space-x-2 p-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={disabled}
          >
            <Camera className="w-4 h-4" />
            <span>Win + Shift + S</span>
          </button>

          <button
            type="button"
            onClick={triggerFileInput}
            className="flex-1 flex items-center justify-center space-x-2 p-3 bg-dark-700 hover:bg-dark-600 text-white rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={disabled}
          >
            <Upload className="w-5 h-5" />
            <span>Subir Captura(s)</span>
          </button>
        </div>
      </div>

      {/* Zona de drag and drop */}
      <button
        type="button"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 w-full ${
          dragOver
            ? 'border-primary-400 bg-primary-400/10'
            : 'border-gray-600 hover:border-gray-500'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onClick={!disabled ? triggerFileInput : undefined}
        disabled={disabled}
        aria-label="Subir archivos"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />

        <div className="space-y-4">
          <div className="flex justify-center">
            {selectedFiles.length > 0 ? (
              <CheckCircle className="w-12 h-12 text-green-400" />
            ) : (
              <div className="relative">
                <Upload className="w-12 h-12 text-gray-400" />
                {dragOver && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute inset-0 bg-primary-400 rounded-full opacity-20"
                  />
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-medium text-white">
              {getFileText(selectedFiles.length)}
            </h3>
            <p className="text-gray-400 text-sm">
              {selectedFiles.length === 0 ? (
                <>
                  Arrastra y suelta aquí, o{' '}
                  <span className="text-primary-400 underline">haz clic para seleccionar</span>
                </>
              ) : (
                `${selectedFiles.length}/3 archivos seleccionados`
              )}
            </p>
          </div>
        </div>
      </button>

      {/* Preview de archivos seleccionados */}
      <AnimatePresence>
        {selectedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-dark-700/50 rounded-lg p-4 space-y-4"
          >
            {/* Header con contador y botón limpiar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-white font-medium">
                  Imágenes seleccionadas ({selectedFiles.length})
                </span>
              </div>
              <button
                type="button"
                onClick={clearAllFiles}
                className="text-red-400 hover:text-red-300 transition-colors text-sm"
                disabled={disabled}
              >
                Limpiar todo
              </button>
            </div>

            {/* Grid de previews */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <AnimatePresence>
                {selectedFiles.map((file, index) => (
                  <FilePreview
                    key={`${file.name}-${index}`}
                    file={file}
                    index={index}
                    onRemove={onRemoveFile}
                  />
                ))}
              </AnimatePresence>

              {/* Botón para agregar más imágenes */}
              {selectedFiles.length < 3 && (
                <button
                  type="button"
                  onClick={triggerFileInput}
                  className="h-24 border-2 border-dashed border-gray-500 hover:border-gray-400 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={disabled}
                >
                  <Upload className="w-5 h-5 mb-1" />
                  <span className="text-xs">Agregar</span>
                </button>
              )}
            </div>

            {/* Info de progreso */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">
                {selectedFiles.length === 3 
                  ? '✅ Máximo alcanzado' 
                  : `Puedes agregar ${3 - selectedFiles.length} más`
                }
              </span>
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  {[1, 2, 3].map((num) => (
                    <div
                      key={num}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        num <= selectedFiles.length ? 'bg-green-400' : 'bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Botón de procesamiento */}
            <div className="pt-2">
              <button
                type="button"
                onClick={onProcess}
                disabled={disabled || isProcessing}
                className="w-full bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Procesando imágenes...</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5" />
                    <span>Procesar con OCR</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
