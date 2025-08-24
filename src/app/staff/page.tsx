'use client';

import { useState } from 'react';
import { motion } from '../../components/motion';
import { Search, Camera, Upload, CheckCircle, AlertCircle, User } from 'lucide-react';

export default function StaffPage() {
  const [cedula, setCedula] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file?.type.startsWith('image/')) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile || !cedula) {
      alert('Por favor complete todos los campos');
      return;
    }

    setIsProcessing(true);
    
    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('cedula', cedula);
      formData.append('locationId', 'default-location');
      formData.append('empleadoId', 'current-user-id'); // In real app, get from session

      const response = await fetch('/api/staff/consumo', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(data);
        // Reset form
        setCedula('');
        setSelectedFile(null);
        setPreview('');
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Error de conexión:', error);
      alert('Error de conexión: No se pudo procesar la solicitud');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 pt-8"
        >
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-success-600 to-primary-600 rounded-full flex items-center justify-center">
            <Camera className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Staff <span className="gradient-primary bg-clip-text text-transparent">Portal</span>
          </h1>
          <p className="text-dark-400">
            Captura del consumo pre-pago
          </p>
        </motion.div>

        {/* Main Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="premium-card"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Search */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Cédula del Cliente
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  className="form-input pl-10"
                  placeholder="Ingrese la cédula del cliente"
                  value={cedula}
                  onChange={(e) => setCedula(e.target.value)}
                />
                <Search className="w-5 h-5 text-dark-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                <Camera className="w-4 h-4 inline mr-2" />
                Foto del Ticket
              </label>
              
              {!preview ? (
                <label className="w-full h-48 border-2 border-dashed border-dark-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 transition-colors">
                  <Upload className="w-12 h-12 text-dark-400 mb-4" />
                  <p className="text-dark-400 text-center">
                    Toca para subir una foto del ticket<br />
                    <span className="text-sm">JPG, PNG (máx. 5MB)</span>
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="relative">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPreview('');
                      setSelectedFile(null);
                    }}
                    className="absolute top-2 right-2 bg-dark-800 text-white p-2 rounded-full hover:bg-dark-700"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isProcessing}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Procesando ticket...</span>
                </div>
              ) : (
                'Procesar Consumo'
              )}
            </motion.button>
          </form>
        </motion.div>

        {/* Result Display */}
        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 premium-card"
          >
            <div className="flex items-center space-x-3 mb-4">
              <CheckCircle className="w-6 h-6 text-success-400" />
              <h3 className="text-lg font-semibold text-white">Consumo Registrado</h3>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-dark-400">Cliente:</span>
                <span className="text-white">{result.cliente?.nombre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-400">Total:</span>
                <span className="text-white font-semibold">${result.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-400">Puntos ganados:</span>
                <span className="text-success-400 font-semibold">+{result.puntos}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-400">Estado:</span>
                <span className="text-warning-400">Pendiente de pago</span>
              </div>
            </div>

            {result.productos && result.productos.length > 0 && (
              <div className="mt-4 pt-4 border-t border-dark-700">
                <h4 className="text-sm font-medium text-dark-300 mb-2">Productos detectados:</h4>
                <div className="space-y-1">
                  {result.productos.map((item: any, index: number) => (
                    <div key={`${item.name || 'producto'}-${index}`} className="flex justify-between text-sm">
                      <span className="text-dark-400">{item.name || `Producto ${index + 1}`}</span>
                      <span className="text-white">${item.price || 'N/A'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setResult(null)}
              className="w-full mt-4 btn-secondary"
            >
              Nuevo Registro
            </button>
          </motion.div>
        )}

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 p-4 bg-dark-800/50 rounded-lg border border-dark-700"
        >
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-warning-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-dark-300">
              <p className="font-medium text-white mb-1">Instrucciones:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Verificar la cédula del cliente antes de proceder</li>
                <li>Tomar foto clara del ticket completo</li>
                <li>Procesar ANTES de que el cliente pague</li>
                <li>Confirmar el total detectado con el cliente</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
