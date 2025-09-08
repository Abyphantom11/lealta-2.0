'use client';

import React, { useState, useEffect } from 'react';
import { Upload, Clock, Eye, EyeOff, Trash2, Save } from 'lucide-react';

interface BannersManagerProps {
  banners: Banner[];
  onAdd: (banner: Banner) => void;
  onUpdate: (id: string, banner: Partial<Banner>) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}

interface Banner {
  id?: string;
  dia?: string;
  titulo?: string;
  descripcion?: string;
  imagenUrl?: string;
  horaPublicacion?: string;
  activo?: boolean;
}

interface FileUploadHook {
  selectedFile: File | null;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  resetFile: () => void;
}

// Hook personalizado para manejo de archivos
const useFileUpload = (setFormData: React.Dispatch<React.SetStateAction<any>>): FileUploadHook => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setFormData((prev: any) => ({ ...prev, imagenUrl: imageUrl }));
      };
      reader.readAsDataURL(file);
    }
  };

  const resetFile = () => {
    setSelectedFile(null);
    setFormData((prev: any) => ({ ...prev, imagenUrl: '' }));
  };

  return { selectedFile, handleFileChange, resetFile };
};

/**
 * Componente para gestionar banners diarios del portal
 * Permite configurar banners específicos para cada día de la semana
 */
const BannersManager: React.FC<BannersManagerProps> = ({
  banners,
  onAdd,
  onUpdate,
  onDelete,
  onToggle,
}) => {
  const [selectedDay, setSelectedDay] = useState('lunes');
  const [publishTime, setPublishTime] = useState('04:00');
  const [formData, setFormData] = useState({
    dia: 'lunes',
    titulo: '',
    descripcion: '',
    imagenUrl: '',
    horaPublicacion: '04:00',
  });
  const [uploading, setUploading] = useState(false);
  const { selectedFile, handleFileChange, resetFile } = useFileUpload(setFormData);

  // Helper functions para evitar ternarios anidados
  const getButtonText = () => {
    if (uploading) return 'Guardando...';
    return bannerPorDia ? 'Actualizar' : 'Crear';
  };

  const getBannerCardStyle = (banner: Banner | undefined) => {
    if (!banner) return 'border-dark-600 bg-dark-700';
    return banner.activo 
      ? 'border-success-500 bg-success-500/10'
      : 'border-yellow-500 bg-yellow-500/10';
  };

  const getBannerStatus = (banner: Banner | undefined) => {
    if (!banner) return '❌ Sin configurar';
    return banner.activo 
      ? '✅ Configurado y activo'
      : '⚠️ Configurado pero inactivo';
  };

  const diasSemana = [
    { value: 'lunes', label: 'L' },
    { value: 'martes', label: 'M' },
    { value: 'miercoles', label: 'X' },
    { value: 'jueves', label: 'J' },
    { value: 'viernes', label: 'V' },
    { value: 'sabado', label: 'S' },
    { value: 'domingo', label: 'D' },
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

  // Encontrar banner para el día seleccionado
  const bannerPorDia = banners.find((b: Banner) => b.dia === selectedDay);

  // Actualizar formulario cuando cambia el día o el banner
  useEffect(() => {
    if (bannerPorDia) {
      setFormData({
        dia: selectedDay,
        titulo: bannerPorDia.titulo || '',
        descripcion: bannerPorDia.descripcion || '',
        imagenUrl: bannerPorDia.imagenUrl || '',
        horaPublicacion: bannerPorDia.horaPublicacion || '04:00',
      });
      setPublishTime(bannerPorDia.horaPublicacion || '04:00');
    } else {
      setFormData({
        dia: selectedDay,
        titulo: '',
        descripcion: '',
        imagenUrl: '',
        horaPublicacion: '04:00',
      });
      setPublishTime('04:00');
    }
  }, [selectedDay, bannerPorDia]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    let imageUrl = formData.imagenUrl;

    // Si hay un archivo seleccionado, intentar subirlo
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
        } else {
          console.warn('Error uploading file, using base64');
          // Mantener la imagen base64 como fallback
        }
      } catch (error) {
        console.error('Error uploading file:', error);
        // Mantener la imagen base64 como fallback
      }
    }

    const dataToSubmit: Banner = {
      id: bannerPorDia?.id || `banner_${selectedDay}_${Date.now()}`,
      dia: selectedDay,
      titulo: formData.titulo,
      descripcion: formData.descripcion,
      imagenUrl: imageUrl,
      horaPublicacion: publishTime,
      activo: true,
    };

    if (bannerPorDia?.id) {
      onUpdate(bannerPorDia.id, dataToSubmit);
    } else {
      onAdd(dataToSubmit);
    }

    resetFile();
    setUploading(false);
  };

  const handleDayChange = (newDay: string) => {
    setSelectedDay(newDay);
    resetFile(); // Limpiar archivo seleccionado al cambiar de día
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-4">
        <h4 className="text-lg font-semibold text-white mb-3">Banner Diario</h4>
        <p className="text-dark-400 text-sm mb-4">
          Configura banners para cada día de la semana. Se publicarán
          automáticamente a la hora especificada.
        </p>
      </div>

      {/* Selector de día */}
      <div className="bg-dark-800 rounded-lg p-4">
        <h5 className="text-white font-medium mb-3">Seleccionar Día</h5>
        <div className="grid grid-cols-7 gap-2">
          {diasSemana.map(dia => {
            const tieneBanner = banners.some((b: Banner) => b.dia === dia.value);
            return (
              <button
                key={dia.value}
                onClick={() => handleDayChange(dia.value)}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors relative ${
                  selectedDay === dia.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-dark-700 text-dark-300 hover:text-white hover:bg-dark-600'
                }`}
              >
                {dia.label}
                {tieneBanner && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-success-500 rounded-full"></div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Formulario para el día seleccionado */}
      <div className="bg-dark-800 rounded-lg p-4">
        <h5 className="text-white font-medium mb-3">
          Banner para {diasCompletos[selectedDay as keyof typeof diasCompletos]}
        </h5>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Título */}
          <div>
            <label
              htmlFor="titulo"
              className="block text-sm font-medium text-dark-300 mb-2"
            >
              Título del Banner
            </label>
            <input
              id="titulo"
              type="text"
              value={formData.titulo}
              onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded text-white focus:ring-2 focus:ring-primary-500"
              placeholder="Ej: Evento especial del día"
            />
          </div>

          {/* Descripción */}
          <div>
            <label
              htmlFor="descripcion"
              className="block text-sm font-medium text-dark-300 mb-2"
            >
              Descripción
            </label>
            <textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded text-white focus:ring-2 focus:ring-primary-500"
              rows={3}
              placeholder="Descripción del evento o promoción"
            />
          </div>

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
              onChange={(e) => setPublishTime(e.target.value)}
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded text-white focus:ring-2 focus:ring-primary-500"
              required
            />
            <p className="text-xs text-dark-400 mt-1">
              Se publicará automáticamente a esta hora (horario de operación: 6pm - 3am)
            </p>
          </div>

          {/* Imagen del banner */}
          <div>
            <label
              htmlFor="bannerImage"
              className="block text-sm font-medium text-dark-300 mb-2"
            >
              <Upload className="w-4 h-4 inline mr-1" />
              Imagen del Banner
            </label>
            <input
              id="bannerImage"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary-600 file:text-white hover:file:bg-primary-700"
              required={!bannerPorDia?.imagenUrl}
            />
            <p className="text-xs text-dark-400 mt-1">
              Formatos: JPG, PNG, WebP. Tamaño recomendado: 400x250px
            </p>
          </div>

          {/* Vista previa de imagen */}
          {(formData.imagenUrl || bannerPorDia?.imagenUrl) && (
            <div>
              <p className="text-sm text-dark-300 mb-2">Vista previa:</p>
              <div className="relative">
                <img
                  src={formData.imagenUrl || bannerPorDia?.imagenUrl}
                  alt="Preview"
                  className="w-full h-32 object-cover rounded-lg border border-dark-600"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-lg"></div>
                {formData.titulo && (
                  <div className="absolute bottom-2 left-3">
                    <h6 className="text-white font-medium text-sm">{formData.titulo}</h6>
                    {formData.descripcion && (
                      <p className="text-white/80 text-xs">{formData.descripcion}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={uploading}
              className="flex items-center space-x-2 px-4 py-2 bg-success-600 hover:bg-success-700 disabled:bg-success-400 text-white rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>
                {getButtonText()}
              </span>
            </button>

            {bannerPorDia?.id && (
              <>
                <button
                  type="button"
                  onClick={() => bannerPorDia.id && onToggle(bannerPorDia.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    bannerPorDia.activo
                      ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                      : 'bg-dark-600 hover:bg-dark-500 text-dark-300'
                  }`}
                >
                  {bannerPorDia.activo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  <span>{bannerPorDia.activo ? 'Desactivar' : 'Activar'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('¿Estás seguro de eliminar este banner? Esta acción no se puede deshacer.')) {
                      onDelete(bannerPorDia.id!);
                    }
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Eliminar</span>
                </button>
              </>
            )}
          </div>
        </form>

        {/* Estado actual del banner */}
        {bannerPorDia && (
          <div className="mt-6 p-4 bg-dark-700 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-white">Estado Actual:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                bannerPorDia.activo
                  ? 'bg-success-500/20 text-success-400'
                  : 'bg-dark-600 text-dark-300'
              }`}>
                {bannerPorDia.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            <div className="space-y-1 text-sm text-dark-300">
              <p>📅 Día: {diasCompletos[selectedDay as keyof typeof diasCompletos]}</p>
              <p>🕒 Hora: {bannerPorDia.horaPublicacion}</p>
              <p>📝 Título: {bannerPorDia.titulo || 'Sin título'}</p>
              <p>🖼️ Imagen: {bannerPorDia.imagenUrl ? 'Configurada' : 'No configurada'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Resumen de todos los banners */}
      <div className="bg-dark-800 rounded-lg p-4">
        <h5 className="text-white font-medium mb-3">Resumen Semanal</h5>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {diasSemana.map(dia => {
            const banner = banners.find((b: Banner) => b.dia === dia.value);
            return (
              <div
                key={dia.value}
                className={`p-3 rounded-lg border ${getBannerCardStyle(banner)}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-white">
                    {diasCompletos[dia.value as keyof typeof diasCompletos]}
                  </span>
                  {banner && (
                    <span className="text-xs text-dark-300">
                      {banner.horaPublicacion}
                    </span>
                  )}
                </div>
                <p className="text-xs text-dark-400">
                  {getBannerStatus(banner)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BannersManager;
