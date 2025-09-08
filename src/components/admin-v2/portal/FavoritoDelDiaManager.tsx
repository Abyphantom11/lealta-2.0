'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Upload, Star, Calendar } from 'lucide-react';

interface FavoritoDelDiaManagerProps {
  favoritos: FavoritoDelDia[];
  onUpdate: (favorito: FavoritoDelDia) => void;
  onDelete: (favoritoId: string) => void;
  onToggle: (favoritoId: string) => void;
}

interface FavoritoDelDia {
  id?: string;
  dia?: string;
  imagenUrl?: string;
  horaPublicacion?: string;
  activo?: boolean;
}

/**
 * Hook personalizado para manejo de archivos
 */
const useFileUpload = (setFormData: (data: any) => void) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Crear URL temporal para preview
      const url = URL.createObjectURL(file);
      setFormData((prev: any) => ({ ...prev, imagenUrl: url }));
    }
  };

  return { selectedFile, handleFileChange };
};

/**
 * Componente para gestionar el favorito del día
 * Permite configurar favoritos destacados para cada día de la semana
 */
const FavoritoDelDiaManager: React.FC<FavoritoDelDiaManagerProps> = ({
  favoritos,
  onUpdate,
  onDelete,
  onToggle,
}) => {
  const [selectedDay, setSelectedDay] = useState('lunes');
  const [publishTime, setPublishTime] = useState('09:00');
  const [formData, setFormData] = useState({
    imagenUrl: '',
  });
  const [uploading, setUploading] = useState(false);
  const { selectedFile, handleFileChange } = useFileUpload(setFormData);

  // Días de la semana
  const diasSemana = [
    { value: 'lunes', label: 'Lun' },
    { value: 'martes', label: 'Mar' },
    { value: 'miercoles', label: 'Mié' },
    { value: 'jueves', label: 'Jue' },
    { value: 'viernes', label: 'Vie' },
    { value: 'sabado', label: 'Sáb' },
    { value: 'domingo', label: 'Dom' },
  ];

  const diasCompletos = {
    lunes: 'Lunes',
    martes: 'Martes',
    miercoles: 'Miércoles',
    jueves: 'Jueves',
    viernes: 'Viernes',
    sabado: 'Sábado',
    domingo: 'Domingo',
  };

  // Helper functions para evitar ternarios anidados
  const getSubmitButtonText = () => {
    if (uploading) return 'Subiendo...';
    return favoritoPorDia ? 'Actualizar Favorito' : 'Crear Favorito';
  };

  const getFavoritoCardStyle = (tieneImagen: boolean, estaActivo: boolean) => {
    if (tieneImagen && estaActivo) {
      return 'bg-success-600/20 text-success-400 border-success-600/50';
    }
    if (tieneImagen && !estaActivo) {
      return 'bg-yellow-600/20 text-yellow-400 border-yellow-600/50';
    }
    return 'bg-dark-700 text-dark-400 border-dark-600';
  };

  // Encontrar favorito para el día seleccionado
  const favoritoPorDia = Array.isArray(favoritos) 
    ? favoritos.find(f => f.dia === selectedDay)
    : null;

  // Actualizar formulario cuando cambia el día seleccionado
  useEffect(() => {
    if (favoritoPorDia) {
      setFormData({
        imagenUrl: favoritoPorDia.imagenUrl || '',
      });
      setPublishTime(favoritoPorDia.horaPublicacion || '09:00');
    } else {
      setFormData({
        imagenUrl: '',
      });
      setPublishTime('09:00');
    }
  }, [selectedDay, favoritoPorDia]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    let imageUrl = formData.imagenUrl;

    // Si hay un archivo seleccionado, subirlo primero
    if (selectedFile) {
      try {
        const formDataUpload = new FormData();
        formDataUpload.append('file', selectedFile);

        const uploadResponse = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formDataUpload,
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          imageUrl = uploadData.fileUrl;
        }
      } catch (error) {
        console.error('Error uploading file:', error);
      }
    }

    const dataToSubmit = {
      id: favoritoPorDia?.id,
      dia: selectedDay,
      imagenUrl: imageUrl,
      horaPublicacion: publishTime,
      activo: true,
    };

    onUpdate(dataToSubmit);
    setUploading(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-4">
        <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
          <Star className="w-5 h-5 mr-2" />
          Favorito del Día
        </h4>
        <p className="text-dark-400 text-sm mb-4">
          Configura favoritos destacados para cada día de la semana. Se publicarán
          automáticamente a la hora especificada.
        </p>
      </div>

      {/* Selector de día */}
      <div className="bg-dark-800 rounded-lg p-4">
        <h5 className="text-white font-medium mb-3 flex items-center">
          <Calendar className="w-4 h-4 mr-2" />
          Seleccionar Día
        </h5>
        <div className="grid grid-cols-7 gap-2">
          {diasSemana.map(dia => {
            const tieneConfig = favoritos.some(f => f.dia === dia.value && f.imagenUrl);
            
            return (
              <button
                key={dia.value}
                onClick={() => setSelectedDay(dia.value)}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors relative ${
                  selectedDay === dia.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-dark-700 text-dark-300 hover:text-white hover:bg-dark-600'
                }`}
              >
                {dia.label}
                {tieneConfig && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-success-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Formulario para el día seleccionado */}
      <div className="bg-dark-800 rounded-lg p-4">
        <h5 className="text-white font-medium mb-3">
          Favorito para {diasCompletos[selectedDay as keyof typeof diasCompletos]}
        </h5>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Hora de publicación */}
          <div>
            <label
              htmlFor="publishTime"
              className="block text-sm font-medium text-dark-300 mb-2"
            >
              <Clock className="w-4 h-4 inline mr-1" />
              Hora de Publicación
            </label>
            <input
              id="publishTime"
              type="time"
              value={publishTime}
              onChange={e => setPublishTime(e.target.value)}
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded text-white focus:ring-2 focus:ring-primary-500"
              required
            />
            <p className="text-xs text-dark-400 mt-1">
              Hora en la que se destacará el favorito del día
            </p>
          </div>

          {/* Upload de imagen */}
          <div>
            <label
              htmlFor="favoritoImage"
              className="block text-sm font-medium text-dark-300 mb-2"
            >
              <Upload className="w-4 h-4 inline mr-1" />
              Imagen del Favorito
            </label>
            <input
              id="favoritoImage"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary-600 file:text-white hover:file:bg-primary-700"
              required={!favoritoPorDia?.imagenUrl}
            />
            <p className="text-xs text-dark-400 mt-1">
              Formatos soportados: JPG, PNG, WebP. Tamaño máximo: 2MB
            </p>
          </div>

          {/* Vista previa de imagen */}
          {(formData.imagenUrl || favoritoPorDia?.imagenUrl) && (
            <div className="bg-dark-700 rounded-lg p-3">
              <p className="text-sm text-dark-300 mb-2 font-medium">Vista previa:</p>
              <div className="relative">
                <img
                  src={formData.imagenUrl || favoritoPorDia?.imagenUrl}
                  alt="Preview del favorito"
                  className="w-full h-48 object-cover rounded-lg border border-dark-600"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-lg" />
                <div className="absolute bottom-3 left-3">
                  <span className="bg-primary-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                    Favorito del {diasCompletos[selectedDay as keyof typeof diasCompletos]}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={uploading}
              className="flex items-center space-x-2 px-4 py-2 bg-success-600 hover:bg-success-700 disabled:bg-success-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
            >
              <Star className="w-4 h-4" />
              <span>
                {getSubmitButtonText()}
              </span>
            </button>
            
            {favoritoPorDia?.id && (
              <button
                type="button"
                onClick={() => onDelete(favoritoPorDia.id!)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Eliminar
              </button>
            )}
          </div>
        </form>

        {/* Estado actual del favorito */}
        {favoritoPorDia && (
          <div className="mt-6 p-4 bg-dark-700 rounded-lg border border-dark-600">
            <h6 className="text-white font-medium mb-3">Estado Actual</h6>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-dark-300">
                  📅 Configurado para: <span className="text-white font-medium">{favoritoPorDia.horaPublicacion}</span>
                </p>
                <p className="text-sm text-dark-300">
                  🖼️ Imagen: <span className="text-success-400">✓ Configurada</span>
                </p>
              </div>
              <button
                onClick={() => favoritoPorDia.id && onToggle(favoritoPorDia.id)}
                disabled={!favoritoPorDia.id}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  favoritoPorDia.activo
                    ? 'bg-success-600 text-white hover:bg-success-700'
                    : 'bg-dark-600 text-dark-300 hover:bg-dark-500'
                }`}
              >
                {favoritoPorDia.activo ? '✓ Activo' : '✗ Inactivo'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Resumen semanal */}
      <div className="bg-dark-800 rounded-lg p-4">
        <h6 className="text-white font-medium mb-3 flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          Resumen Semanal
        </h6>
        <div className="grid grid-cols-7 gap-2">
          {diasSemana.map(dia => {
            const favoritoDelDia = favoritos.find(f => f.dia === dia.value);
            const tieneImagen = favoritoDelDia?.imagenUrl;
            const estaActivo = favoritoDelDia?.activo;
            
            return (
              <div key={dia.value} className="text-center">
                <div className="text-xs text-dark-400 mb-2 font-medium">
                  {dia.label}
                </div>
                <div
                  className={`text-xs p-3 rounded-lg border transition-colors ${getFavoritoCardStyle(!!tieneImagen, !!estaActivo)}`}
                >
                  {tieneImagen ? (
                    <div>
                      <div className="font-bold">✓</div>
                      <div className="text-xs mt-1">
                        {favoritoDelDia?.horaPublicacion}
                      </div>
                      <div className="text-xs">
                        {estaActivo ? 'Activo' : 'Inactivo'}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div>–</div>
                      <div className="text-xs">sin config</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FavoritoDelDiaManager;
