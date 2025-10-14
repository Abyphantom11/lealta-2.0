'use client';

import { motion } from 'framer-motion';
import { Upload, Camera, Trash2, Eye } from 'lucide-react';

interface ImageSelectorProps {
  selectedFiles: File[];
  selectedFile: File | null;
  preview: string;
  isWaitingForCapture: boolean;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onStartAutomaticCapture: () => void;
  onRemoveImage: (index: number) => void;
  onViewImage: (file: File) => void;
}

export const ImageSelector = ({
  selectedFiles,
  selectedFile,
  preview,
  isWaitingForCapture,
  onFileSelect,
  onStartAutomaticCapture,
  onRemoveImage,
  onViewImage,
}: ImageSelectorProps) => {
  const currentFiles = selectedFiles.length > 0 ? selectedFiles : (selectedFile ? [selectedFile] : []);

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-dark-300 mb-2">
        Imagen del Ticket * (máximo 3 imágenes)
      </label>
      
      {/* Botones de captura */}
      <div className="grid grid-cols-2 gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={onStartAutomaticCapture}
          className={`flex items-center justify-center space-x-2 p-4 border-2 border-dashed rounded-lg transition-all ${
            isWaitingForCapture
              ? 'border-yellow-500 bg-yellow-500/10 text-yellow-400'
              : 'border-blue-500 hover:border-blue-400 hover:bg-blue-500/10 text-blue-400'
          }`}
        >
          <Camera className="w-5 h-5" />
          <span className="font-medium">
            {isWaitingForCapture ? 'Esperando captura...' : 'Capturar POS'}
          </span>
        </motion.button>

        <motion.label
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-green-500 hover:border-green-400 hover:bg-green-500/10 text-green-400 rounded-lg cursor-pointer transition-all"
        >
          <Upload className="w-5 h-5" />
          <span className="font-medium">Subir archivo</span>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={onFileSelect}
            className="hidden"
          />
        </motion.label>
      </div>

      {/* Instrucciones */}
      <div className="text-sm text-dark-400">
        <p>💡 <strong>Capturar POS:</strong> Usa Win + PrtScr o Win + Shift + S</p>
        <p>📁 <strong>Subir archivo:</strong> Selecciona desde tu computadora</p>
      </div>

      {/* Vista previa de imágenes */}
      {currentFiles.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-dark-300">
            Imágenes seleccionadas ({currentFiles.length}/3):
          </p>
          <div className="grid grid-cols-1 gap-3">
            {currentFiles.map((file, index) => (
              <motion.div
                key={`${file.name}-${index}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-3 bg-dark-700 border border-dark-600 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-dark-600 rounded-lg overflow-hidden flex items-center justify-center">
                    {index === 0 && preview ? (
                      <img
                        src={preview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Camera className="w-5 h-5 text-dark-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">
                      {file.name.length > 30 ? `${file.name.substring(0, 30)}...` : file.name}
                    </p>
                    <p className="text-dark-400 text-xs">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => onViewImage(file)}
                    className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 rounded-md transition-colors"
                    title="Ver imagen"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveImage(index)}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-md transition-colors"
                    title="Eliminar imagen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
