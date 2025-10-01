"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Upload, X, Image as ImageIcon } from "lucide-react";

interface ComprobanteUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<void>;
  onRemoveComprobante: () => Promise<void>; // Nueva función para quitar comprobante
  reservaId: string;
  clienteNombre: string;
  comprobanteExistente?: string | null;
}

export default function ComprobanteUploadModal({
  isOpen,
  onClose,
  onUpload,
  onRemoveComprobante, // Nueva función
  reservaId,
  clienteNombre,
  comprobanteExistente
}: Readonly<ComprobanteUploadModalProps>) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(comprobanteExistente || null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false); // Estado para remover
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Solo se permiten archivos de imagen');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('El archivo es demasiado grande. Máximo 5MB');
      return;
    }

    setSelectedFile(file);
    
    // Crear preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    try {
      await onUpload(selectedFile);
      onClose();
    } catch (error) {
      console.error('Error uploading:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveComprobante = async () => {
    if (!comprobanteExistente) return;
    
    setIsRemoving(true);
    try {
      await onRemoveComprobante();
      removeImage(); // Limpiar la preview también
      onClose();
    } catch (error) {
      console.error('Error removing comprobante:', error);
    } finally {
      setIsRemoving(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl(comprobanteExistente || null);
    setDragOver(false);
    onClose();
  };

  const removeImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white border border-gray-200 shadow-lg">
        <DialogHeader className="pb-4 border-b border-gray-100">
          <DialogTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Upload className="h-5 w-5 text-blue-600" />
            {comprobanteExistente ? 'Gestionar Comprobante de Pago' : 'Subir Comprobante de Pago'}
          </DialogTitle>
          <div className="space-y-1 mt-1">
            <p className="text-sm text-gray-600">
              Reserva de: <span className="font-medium">{clienteNombre}</span>
            </p>
            {comprobanteExistente && !selectedFile && (
              <p className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-md inline-block">
                ✓ Comprobante de pago registrado
              </p>
            )}
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Área de preview/upload */}
          <div className="space-y-3">
            {previewUrl ? (
              // Preview de imagen
              <div className="relative">
                <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                  <img
                    src={previewUrl}
                    alt="Comprobante de pago"
                    className="w-full h-48 object-contain"
                  />
                </div>
                <button
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  title="Eliminar imagen"
                >
                  <X className="h-4 w-4" />
                </button>
                {selectedFile && (
                  <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
                    <p><strong>Archivo:</strong> {selectedFile.name}</p>
                    <p><strong>Tamaño:</strong> {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                )}
              </div>
            ) : (
              // Área de upload
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                  dragOver 
                    ? 'border-blue-400 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => document.getElementById('file-input')?.click()}
              >
                <div className="space-y-3">
                  <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Subir imagen del comprobante
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Arrastra una imagen aquí o haz clic para seleccionar
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      PNG, JPG, JPEG - Máximo 5MB
                    </p>
                  </div>
                </div>
                
                <input
                  id="file-input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileSelect(file);
                    }
                  }}
                  className="hidden"
                />
              </div>
            )}
          </div>
          
          {/* Botones de acción */}
          <div className="flex justify-between pt-4 border-t border-gray-100">
            {/* Botón para quitar comprobante existente */}
            {comprobanteExistente && !selectedFile && (
              <Button
                variant="outline"
                onClick={handleRemoveComprobante}
                disabled={isRemoving}
                className="px-4 py-2 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
              >
                {isRemoving ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                    Quitando...
                  </div>
                ) : (
                  'Quitar Pago'
                )}
              </Button>
            )}
            
            {/* Botones principales */}
            <div className={`flex space-x-3 ${comprobanteExistente && !selectedFile ? '' : 'ml-auto'}`}>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isUploading || isRemoving}
                className="px-4 py-2"
              >
                Cancelar
              </Button>
              
              {selectedFile && (
                <Button
                  onClick={handleUpload}
                  disabled={isUploading || isRemoving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isUploading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Subiendo...
                    </div>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      {comprobanteExistente ? 'Actualizar Comprobante' : 'Subir Comprobante'}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
